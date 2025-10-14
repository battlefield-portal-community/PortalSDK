@tool
class_name PolygonVolumeGizmo
extends EditorNode3DGizmoPlugin

const TRANSPARENCY = 0.6
const DEFAULT_HEIGHT = 5
const ICON_PATH = "res://addons/bf_portal/portal_tools/types/PolygonVolume/PolygonVolumeIcon.svg"

var editor_plugin: EditorPlugin = null
var show_new_point = false
var currently_adding_point = false
var main_screen_name = ""
var button_release = false
var closest_segment: ClosestSegmentResult = null


class ClosestSegmentResult:
	var segment := Vector2i(-1, -1)
	var point_world := Vector3.ZERO


func _get_gizmo_name():
	return "PolygonVolumeGizmo"


func _has_gizmo(for_node_3d: Node3D) -> bool:
	return for_node_3d is PolygonVolume


func handle_input(event: InputEvent) -> void:
	var selected_nodes = EditorInterface.get_selection().get_selected_nodes()
	if len(selected_nodes) != 1:
		return
	if selected_nodes[0] is not PolygonVolume:
		return

	if event is InputEventKey and event.keycode == KEY_CTRL:
		if len(EditorInterface.get_selection().get_selected_nodes()) == 1:
			show_new_point = event.is_pressed()
		else:
			show_new_point = false
	elif event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.is_released():
			_add_point()
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.is_released():
			_delete_point()


func handle_process(_delta: float) -> void:
	var control = EditorInterface.get_editor_viewport_3d().get_parent() as SubViewportContainer
	var has_point = false
	var children = control.get_children()
	for child in children:
		if child.name == "AddPointSprite":
			has_point = true
	if not has_point:
		var sprite = Sprite2D.new()
		sprite.name = "AddPointSprite"
		sprite.texture = control.get_theme_icon("Editor3DHandle", "EditorIcons")
		control.add_child(sprite)

	var point: Sprite2D = null
	for child in children:
		if child.name == "AddPointSprite":
			point = child

	if point == null:
		return
	point.visible = false

	var selected_nodes: Array[Node] = EditorInterface.get_selection().get_selected_nodes()
	if len(selected_nodes) != 1:
		return
	if selected_nodes[0] is not PolygonVolume:
		return

	var volume = selected_nodes[0] as PolygonVolume
	var camera = EditorInterface.get_editor_viewport_3d().get_camera_3d()
	var result = _get_closest_segment(control.get_local_mouse_position(), volume, camera)

	closest_segment = null
	if result != null:
		point.position = camera.unproject_position(result.point_world)
		point.visible = show_new_point
		if point.visible and main_screen_name == "3D":
			closest_segment = result


func _init() -> void:
	create_material("lines", Color.WHITE)
	create_handle_material("handles")
	create_material("fill", Color.WHITE, false, false, true)

	var contents = FileAccess.get_file_as_string(ICON_PATH)
	var new_image = Image.new()
	new_image.load_svg_from_string(contents, 3)
	var image_texture = ImageTexture.create_from_image(new_image)

	var mat_icon = StandardMaterial3D.new()
	mat_icon.albedo_color = Color.WHITE
	mat_icon.albedo_texture = image_texture
	mat_icon.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR
	mat_icon.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat_icon.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat_icon.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat_icon.fixed_size = true
	add_material("icon", mat_icon)


func _redraw(gizmo: EditorNode3DGizmo) -> void:
	gizmo.clear()
	gizmo.add_unscaled_billboard(get_material("icon", gizmo), 0.04)
	var volume = gizmo.get_node_3d() as PolygonVolume
	if volume.points == null:
		return
	var points: PackedVector2Array = volume.points
	var height_offset = _get_height_offset(volume)

	if points.size() < 2:
		return

	var vertex_color_arr = PackedColorArray()
	vertex_color_arr.resize(6)
	vertex_color_arr.fill(volume.color)

	var lines = PackedVector3Array()
	for i in range(points.size()):
		var curr_point = points[i]
		var next_point = points[(i + 1) % points.size()]
		var bottom_left = _get_planar_point(curr_point)
		var top_left = bottom_left + height_offset
		var bottom_right = _get_planar_point(next_point)
		var top_right = bottom_right + height_offset

		# construct three edges of a quad
		lines.append_array(PackedVector3Array([
			bottom_left, bottom_right,  # bottom edge
			bottom_left, top_left,  # left edge
			top_left, top_right,  # top edge
		]))

		# construct a quad to fill the shape
		var arr_mesh = ArrayMesh.new()
		var arrays = []
		arrays.resize(Mesh.ARRAY_MAX)
		arrays[Mesh.ARRAY_VERTEX] = PackedVector3Array([
			bottom_left, top_left, top_right,  # tri left
			bottom_left, top_right, bottom_right  # tri right
		])
		arrays[Mesh.ARRAY_COLOR] = vertex_color_arr
		arr_mesh.add_surface_from_arrays(
			Mesh.PRIMITIVE_TRIANGLES,
			arrays,
			[],
			{},
			Mesh.ARRAY_FORMAT_VERTEX | Mesh.ARRAY_FORMAT_COLOR
		)
		gizmo.add_mesh(arr_mesh, get_material("fill", gizmo))

	var handles = PackedVector3Array()
	for point in points:
		handles.push_back(_get_planar_point(point))
		handles.push_back(_get_planar_point(point) + height_offset)
	gizmo.add_lines(lines, get_material("lines", gizmo), false)
	gizmo.add_handles(handles, get_material("handles", gizmo), [])


func _get_planar_point(point: Vector2) -> Vector3:
	return Vector3(point.x, 0, point.y)


## Given a point in world space, project onto volume's plane to get the 2D point relative to volume's origin
func _get_point_from_world(world_position: Vector3, volume: PolygonVolume) -> Vector2:
	var plane = Plane(volume.global_basis.y, volume.global_position)
	var point_on_plane = plane.project(world_position)
	var point_local = volume.to_local(point_on_plane)
	return Vector2(point_local.x, point_local.z)


func _get_handle_name(_gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool) -> String:
	return str(handle_id)


func _get_handle_value(gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool) -> Variant:
	var volume = gizmo.get_node_3d() as PolygonVolume
	var point_id = floor(handle_id / 2)
	return volume.points[point_id]


func _set_handle(gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool, camera: Camera3D, screen_pos: Vector2) -> void:
	var volume = gizmo.get_node_3d() as PolygonVolume
	var point_id = floor(handle_id / 2)

	var height_offset = _get_height_offset(volume)
	var is_top_handle = handle_id % 2 == 1
	if not is_top_handle:
		height_offset *= 0

	var plane = Plane(volume.global_basis.y, volume.global_position + height_offset)
	var from = camera.project_ray_origin(screen_pos)
	var dir = camera.project_ray_normal(screen_pos)
	var pos_on_plane = plane.intersects_ray(from, dir)
	if pos_on_plane != null:
		var new_point = volume.to_local(pos_on_plane)
		volume.points[point_id] = Vector2(new_point.x, new_point.z)


func _commit_handle(gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool, restore: Variant, cancel: bool) -> void:
	var volume = gizmo.get_node_3d() as PolygonVolume
	var point_id = floor(handle_id / 2)

	if editor_plugin == null:
		printerr("Require editor plugin to function")
		return
	var undo_redo = editor_plugin.get_undo_redo()

	undo_redo.create_action("Edit PolygonVolume")
	undo_redo.add_do_property(volume, "points", volume.points.duplicate())

	var restore_points = volume.points.duplicate()
	restore_points[point_id] = restore
	undo_redo.add_undo_property(volume, "points", restore_points)
	if cancel:
		volume.points = restore_points
	undo_redo.commit_action()


## Given a cursor in screen space, and points of the volume in world space, find the closest line segment to the cursor, or null if no segment exists
func _get_closest_segment(screen_position: Vector2, volume: PolygonVolume, camera: Camera3D) -> ClosestSegmentResult:
	var from = camera.project_ray_origin(screen_position)
	var dir = camera.project_ray_normal(screen_position)
	var to = from + dir * 1000
	var points = volume.points
	var height_offset = _get_height_offset(volume)

	var acceptable_distance: float = 2
	var min_distance: float = 1e10
	var min_segment = Vector2i(-1, -1)
	var target_point = Vector3.ZERO

	for i in range(len(points)):
		var j = (i + 1) % len(points)
		var curr_point = points[i]
		var next_point = points[j]
		var curr_point_world = volume.to_global(_get_planar_point(curr_point))
		var curr_point_world_above = curr_point_world + height_offset
		var next_point_world = volume.to_global(_get_planar_point(next_point))
		var next_point_world_above = next_point_world + height_offset

		var result_below = Geometry3D.get_closest_points_between_segments(from, to, curr_point_world, next_point_world)
		var result_above = Geometry3D.get_closest_points_between_segments(from, to, curr_point_world_above, next_point_world_above)

		for result in [result_below, result_above]:
			var distance_from_cursor_to_segment: float = (result[0] - result[1]).length_squared()
			var distance_from_cursor_to_segment_above: float = (result_above[0] - result_above[1]).length_squared()

			if distance_from_cursor_to_segment < min_distance and distance_from_cursor_to_segment <= acceptable_distance:
				min_distance = distance_from_cursor_to_segment
				min_segment.x = i
				min_segment.y = j
				target_point = result[1]

	if min_segment != Vector2i(-1, -1):
		var result = ClosestSegmentResult.new()
		result.segment = min_segment
		result.point_world = target_point
		return result
	return null


## Due to being unable to get screen name via EditorInterface, need to subscribe to EditorPlugin's signal instead
func _on_main_screen_changed(screen_name: String) -> void:
	main_screen_name = screen_name


func _add_point() -> void:
	if closest_segment == null:
		return

	var selected_nodes: Array[Node] = EditorInterface.get_selection().get_selected_nodes()
	if len(selected_nodes) != 1:
		return

	if selected_nodes[0] is not PolygonVolume:
		return

	var volume = selected_nodes[0] as PolygonVolume
	var restore_points = volume.points.duplicate()

	var new_points = volume.points.duplicate()
	var new_point = _get_point_from_world(closest_segment.point_world, volume)
	new_points.insert(closest_segment.segment.y, new_point)

	var undo_redo = editor_plugin.get_undo_redo()
	undo_redo.create_action("Add Point To PolygonVolume")
	undo_redo.add_do_property(volume, "points", new_points)

	undo_redo.add_undo_property(volume, "points", restore_points)
	undo_redo.commit_action()


func _get_height_offset(volume: PolygonVolume) -> Vector3:
	return Vector3.UP * (volume.height if volume.height != 0 else DEFAULT_HEIGHT)


func _delete_point() -> void:
	var selected_nodes: Array[Node] = EditorInterface.get_selection().get_selected_nodes()
	if len(selected_nodes) != 1:
		return
	if selected_nodes[0] is not PolygonVolume:
		return

	if not show_new_point:
		return

	var control = EditorInterface.get_editor_viewport_3d().get_parent() as SubViewportContainer
	var camera = EditorInterface.get_editor_viewport_3d().get_camera_3d()
	var volume = selected_nodes[0] as PolygonVolume

	var mouse_screen_pos = control.get_local_mouse_position()
	var height_offset = _get_height_offset(volume)

	var point_index_closest = -1
	var point_closest_distance = 1e10
	var accepted_distance = 25

	for i in range(len(volume.points)):
		var point = volume.points[i]
		var point_world = volume.to_global(_get_planar_point(point))
		var point_world_above = point_world + height_offset
		var point_screen = camera.unproject_position(point_world)
		var point_screen_above = camera.unproject_position(point_world_above)

		for test in [point_screen, point_screen_above]:
			var dist_point = test.distance_to(mouse_screen_pos)
			if dist_point < point_closest_distance and dist_point < accepted_distance:
				point_index_closest = i
				point_closest_distance = dist_point

	if point_index_closest == -1:
		return

	var undo_redo = editor_plugin.get_undo_redo()

	var new_points = volume.points.duplicate()
	var restore_points = volume.points.duplicate()

	new_points.remove_at(point_index_closest)
	if len(new_points) == 1:
		new_points.remove_at(0)

	undo_redo.create_action("Delete Point From PolygonVolume")
	undo_redo.add_do_property(volume, "points", new_points)

	undo_redo.add_undo_property(volume, "points", restore_points)
	undo_redo.commit_action()
