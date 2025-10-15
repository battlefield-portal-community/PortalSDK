extends Node

var _config: Dictionary = {}
var _output_dir := ""
var typescript_nodes: Array[Node] = []

func _ready():
  _config = PortalPlugin.read_config()
  _output_dir = _config["export"]

func register(node: Node):
  if typescript_nodes.has(node): return
  typescript_nodes.append(node)

func action():
  var source_code := ""

  for typescript_node in typescript_nodes:
    var script = typescript_node.get_script()
    if script:
      var header = "// %s\n\n" % typescript_node.get_path()
      source_code += header + script.source_code

  var converter = GD2TSConverter.new()
  var typescript_code = converter.transpile_string(source_code)

  var file = FileAccess.open(_output_dir, FileAccess.WRITE)
  file.store_string(typescript_code)
  file.close()