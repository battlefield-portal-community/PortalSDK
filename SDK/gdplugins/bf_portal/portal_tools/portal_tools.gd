@tool
class_name PortalToolsPlugin
extends EditorPlugin

const PolygonVolumeGizmo = preload("types/PolygonVolume/PolygonVolumeGizmo.gd")
const OBBVolumeGizmo = preload("types/OBBVolume/OBBVolumeGizmo.gd")
const PortalToolsDock = preload("portal_tools_dock.gd")
var _dock: PortalToolsDock
var _current_scene: Node3D

var _polygon_volume_gizmo = PolygonVolumeGizmo.new()
var _obb_volume_gizmo = OBBVolumeGizmo.new()


func _enter_tree():
	# add tool dock to specified area in the editor
	_dock = preload("portal_tools_dock.tscn").instantiate()
	_dock.portal_tools_plugin = self
	add_control_to_dock(DOCK_SLOT_RIGHT_BL, _dock)
	_polygon_volume_gizmo.editor_plugin = self
	add_node_3d_gizmo_plugin(_polygon_volume_gizmo)
	_obb_volume_gizmo.editor_plugin = self
	add_node_3d_gizmo_plugin(_obb_volume_gizmo)

	# can't connect in gizmo's _init so do it here instead
	if not main_screen_changed.is_connected(_polygon_volume_gizmo._on_main_screen_changed):
		main_screen_changed.connect(_polygon_volume_gizmo._on_main_screen_changed)


func _process(delta: float) -> void:
	# can't rely on scene_changed signal
	# resort to using process to constantly check current scene
	change_scene()

	if _polygon_volume_gizmo != null:
		_polygon_volume_gizmo.handle_process(delta)


func _input(event: InputEvent) -> void:
	if _polygon_volume_gizmo != null:
		_polygon_volume_gizmo.handle_input(event)


func change_scene() -> void:
	var new_scene = EditorInterface.get_edited_scene_root()
	if new_scene == _current_scene:
		return
	if not _dock.is_scene_a_level(new_scene):
		return
	_current_scene = new_scene
	_dock.change_scene(_current_scene)


func show_log_panel() -> void:
	var temp_control = Control.new()
	add_control_to_bottom_panel(temp_control, "temp")
	var log_panel = temp_control.get_parent().find_child("*EditorLog*", false, false)
	if log_panel:
		make_bottom_panel_item_visible(log_panel)
	remove_control_from_bottom_panel(temp_control)
	temp_control.queue_free()


func get_scene_library_instance() -> SceneLibrary:
	var temp_control = Control.new()
	add_control_to_bottom_panel(temp_control, "temp")
	var children = temp_control.get_parent().get_children()
	var scene_library = temp_control.get_parent().find_child("ObjectLibrary", false, false)
	var output: SceneLibrary = null
	if scene_library and scene_library is SceneLibrary:
		output = scene_library
	remove_control_from_bottom_panel(temp_control)
	temp_control.queue_free()
	return output


func _exit_tree():
	# remove dock and erase the control from memory
	remove_control_from_docks(_dock)
	if _dock:
		_dock.queue_free()
	remove_node_3d_gizmo_plugin(_polygon_volume_gizmo)
	remove_node_3d_gizmo_plugin(_obb_volume_gizmo)

	if main_screen_changed.is_connected(_polygon_volume_gizmo._on_main_screen_changed):
		main_screen_changed.disconnect(_polygon_volume_gizmo._on_main_screen_changed)
