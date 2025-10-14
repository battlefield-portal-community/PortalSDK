@tool
extends EditorPlugin

var dock


func _enter_tree():
	# add tool dock to specified area in the editor
	dock = preload("res://addons/bf_portal/memory_plugin/memory_dock.tscn").instantiate()
	add_control_to_dock(DOCK_SLOT_RIGHT_BL, dock)
	scene_changed.connect(_update_scene)


func _exit_tree():
	# remove dock and erase the control from memory
	scene_changed.disconnect(_update_scene)
	remove_control_from_docks(dock)
	dock.free()


func _save_external_data() -> void:
	var scene = EditorInterface.get_edited_scene_root()
	_update_scene(scene)


func _update_scene(scene_node):
	dock.set_current_scene(scene_node)
