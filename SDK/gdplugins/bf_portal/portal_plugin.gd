@tool
class_name PortalPlugin
extends EditorPlugin

const PLUGIN_NAME = "bf_portal"


func _enable_plugin():
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/portal_tools", true)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/memory_plugin", true)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/level_validator", true)


func _disable_plugin():
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/portal_tools", false)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/memory_plugin", false)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/level_validator", false)


static func read_config() -> Dictionary:
	var config_path: String = "res://addons/bf_portal/bf_portal.config.json"
	var file = FileAccess.open(config_path, FileAccess.READ)
	var contents = file.get_as_text()
	var result = JSON.parse_string(contents)
	if not result:
		printerr("Unable to read json of %s" % config_path)
		return {}
	var config: Dictionary = result
	return config
