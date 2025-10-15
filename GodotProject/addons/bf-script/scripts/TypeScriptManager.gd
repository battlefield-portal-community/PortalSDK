@tool
extends Node

var typescript_nodes: Dictionary = {}
var ts_files = [
	"BFScript.ts",
	"BFEvents.ts"
]

func _read_ts_file(path: String):
	var file = FileAccess.open("res://addons/bf-script/scripts/%s" % path, FileAccess.READ)
	var text := file.get_as_text()
	file.close()
	return text
	
func register(node: Node):
	var path = node.get_script().resource_path
	if typescript_nodes.has(path): return
	typescript_nodes.set(path, node)
	
func unregister(node: Node):
	var path = node.get_script().resource_path
	typescript_nodes.erase(path)

func action():
	var converter = GD2TSConverter.new()
	var type_strings: Dictionary = {}
	var source_code := "import * as modlib from 'modlib';\n\n"
	var class_names: PackedStringArray = []
	
	for ts_file in ts_files:
		source_code += "// %s\n\n" % ts_file
		source_code += _read_ts_file(ts_file)
		source_code += "\n\n"
		
	for typescript_path in typescript_nodes.keys():
		var typescript_node = typescript_nodes.get(typescript_path)
		type_strings.merge(typescript_node.type_strings())
		var script = typescript_node.get_script()
		if script:
			source_code += "// %s\n\n" % typescript_path
			var new_source_code = converter.transpile_string(script.source_code)
			var ts_class_name := "%s_%s" % [typescript_node.name, typescript_node.get_instance_id()]
			class_names.append("new %s()" % ts_class_name)
			new_source_code = new_source_code.replace("import {", "// import {")
			new_source_code = new_source_code.replace("Mod.", "mod.")
			new_source_code = new_source_code.replace("ModLib.", "modlib.")
			if new_source_code.contains("class extends BFScript"):
				new_source_code = new_source_code.replace("class extends BFScript", "class %s extends BFScript" % ts_class_name)
			# TODO: support named classes
			source_code += new_source_code
			source_code += "\n\n"
	
	source_code += "var custom_classes = [" + ", ".join(class_names) + "];"
	
	var _config = PortalPlugin.read_config()
	var _output_dir = _config["export"]
	var file = FileAccess.open("%s/Script.ts" % _output_dir, FileAccess.WRITE)
	file.store_string(source_code)
	file.close()
	
	
	var string_file = FileAccess.open("%s/Strings.json" % _output_dir, FileAccess.WRITE)
	string_file.store_string(JSON.stringify(type_strings, "	", true))
	string_file.close()
	
	print("Script Compiled!")
	print("Script.ts and Strings.json saved to %s" % _output_dir)
