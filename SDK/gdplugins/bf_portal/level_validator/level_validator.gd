@tool
class_name LevelValidator
extends EditorPlugin

static var _types_to_levels: Dictionary[String, Array] = {}
static var type_error_dialog: AcceptDialog = null
static var glb_error_dialog: AcceptDialog = null


## Check if the given type is allowed in the level
static func is_type_in_level(type: String, scene_root: Node) -> bool:
	type = type.to_lower()
	if type not in _types_to_levels:
		return true  # can only query known types
	var level_name = scene_root.name.to_lower()
	var restrictions = _types_to_levels[type]
	return level_name in restrictions or restrictions.is_empty()


## If the given node is a portal type, return that type, else empty string
static func is_type_valid(node: Node) -> String:
	var script: GDScript = node.get_script()
	if script != null:
		var global_name: String = script.get_global_name()
		if not global_name.is_empty():
			return global_name if global_name.to_lower() in _types_to_levels else ""
	return ""


static func get_level_restrictions(type: String) -> PackedStringArray:
	type = type.to_lower()
	if type not in _types_to_levels:
		return []
	var levels = _types_to_levels[type]
	return levels


func _enter_tree() -> void:
	var tree = get_tree()
	if not tree.node_added.is_connected(_on_node_added):
		tree.node_added.connect(_on_node_added)
	_populate_levels()


func _exit_tree() -> void:
	var tree = get_tree()
	if tree.node_added.is_connected(_on_node_added):
		tree.node_added.disconnect(_on_node_added)


func _populate_levels() -> void:
	var config = PortalPlugin.read_config()
	var asset_types_file = config["fbExportData"] + "/asset_types.json"
	var file = FileAccess.open(asset_types_file, FileAccess.READ)
	var contents = file.get_as_text()
	var result = JSON.parse_string(contents)
	if not result:
		printerr("Unable to read json of %s" % asset_types_file)
	var asset_types = result

	var all_types = asset_types["AssetTypes"]
	for t in all_types:
		var type = t["type"]
		if "levelRestrictions" in t:
			var levels: Array = t["levelRestrictions"]
			_types_to_levels[type.to_lower()] = levels.map(func(level: String): return level.to_lower())
		else:
			_types_to_levels[type.to_lower()] = []


func _on_node_added(node: Node) -> void:
	var scene_root := EditorInterface.get_edited_scene_root()
	if scene_root == null:
		return
	if scene_root.is_ancestor_of(node):
		var script: GDScript = node.get_script()
		if script != null:
			var global_name: String = script.get_global_name()
			if not global_name.is_empty():
				if not is_type_in_level(global_name, scene_root):
					_popup_type_error(global_name, scene_root)
		else:
			var filepath = node.scene_file_path
			if filepath != "":
				var matches_type_name = filepath.get_file().get_basename().to_lower() in _types_to_levels
				var is_portal_glb = filepath.get_extension() == "glb" and matches_type_name and node.name != "Mesh"
				if is_portal_glb:
					_popup_glb_error(node, scene_root)


func _popup_glb_error(name: Node, scene_root: Node) -> void:
	var filename = name.scene_file_path.get_file()
	var error_msg = "%s is a mesh file and should not be directly added to scene" % filename
	printerr(error_msg)
	if glb_error_dialog == null:
		glb_error_dialog = AcceptDialog.new()
		glb_error_dialog.dialog_text = error_msg
		glb_error_dialog.confirmed.connect(_disconnect_glb_error_dialog)
		glb_error_dialog.canceled.connect(_disconnect_glb_error_dialog)
		EditorInterface.popup_dialog_centered(glb_error_dialog)
	else:
		var filepath = scene_root.scene_file_path.get_file().get_basename()
		glb_error_dialog.dialog_text = "Found multiple .glb files in %s\nThese should be removed or replaced with their corresponding tscns as they will be ignored" % filepath
		glb_error_dialog.reset_size()


func _popup_type_error(type: String, scene_root: Node) -> void:
	var error_msg = "Type %s is not allowed in %s" % [type, scene_root.name]
	printerr(error_msg)
	if type_error_dialog == null:
		type_error_dialog = AcceptDialog.new()
		type_error_dialog.dialog_text = error_msg
		type_error_dialog.confirmed.connect(_disconnect_type_error_dialog)
		type_error_dialog.canceled.connect(_disconnect_type_error_dialog)
		EditorInterface.popup_dialog_centered(type_error_dialog)
	else:
		var filepath = scene_root.scene_file_path.get_file().get_basename()
		type_error_dialog.dialog_text = "Found multiple types not allowed in %s.\nCheck configuration warnings on nodes and remove invalid ones" % filepath
		type_error_dialog.reset_size()


func _disconnect_type_error_dialog() -> void:
	type_error_dialog = null


func _disconnect_glb_error_dialog() -> void:
	glb_error_dialog = null
