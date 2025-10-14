@tool
class_name OBBVolumeGizmo
extends EditorNode3DGizmoPlugin

const OBBVolume = preload("OBBVolume.gd")

const TRANSPARENCY = 0.6
const DEFAULT_HEIGHT = 5
const ICON_PATH = "res://addons/bf_portal/portal_tools/types/OBBVolume/OBBVolumeIcon.svg"

var editor_plugin: EditorPlugin = null

enum Face {
	RIGHT,
	TOP,
	FRONT,
	LEFT,
	BOTTOM,
	BACK,
}

class HandleData:
	var size: Vector3
	var pos: Vector3
	func _to_string() -> String:
		return "Size: %s Position: %s" % [str(size), str(pos)]

func _get_gizmo_name():
	return "OBBVolumeGizmo"


func _has_gizmo(for_node_3d: Node3D) -> bool:
	return for_node_3d is OBBVolume


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
	var volume = gizmo.get_node_3d() as OBBVolume
	
	#     B---------D
	#   / |       / |
	# H---------F   |
	# |   |     |   |
	# |   A-----|---C    +y  +z
	# | /       | /        | /
	# G---------E     +x <--
	
	var half_extents = volume.size / 2.0
	var pointA = half_extents * Vector3(-1, -1, 1)
	var pointB = half_extents * Vector3(-1, 1, 1)
	var pointC = half_extents * Vector3(1, -1, 1)
	var pointD = half_extents * Vector3(1, 1, 1)
	var pointE = half_extents * Vector3(1, -1, -1)
	var pointF = half_extents * Vector3(1, 1, -1)
	var pointG = half_extents * Vector3(-1, -1, -1)
	var pointH = half_extents * Vector3(-1, 1, -1)
	
	var faces = [
		[pointD, pointF, pointE, pointC], # right
		[pointB, pointD, pointF, pointH], # top
		[pointB, pointD, pointC, pointA], # front
		[pointH, pointB, pointA, pointG], # left
		[pointA, pointC, pointE, pointG], # bottom
		[pointF, pointH, pointG, pointE], # back
	]
	
	var handles = []
	for face in faces:
		_add_face(face[0], face[1], face[2], face[3], gizmo, volume.color)
		var midpoint = (face[0] + face[1] + face[2] + face[3]) / 4
		handles.push_back(midpoint)
	gizmo.add_handles(handles, get_material("handles", gizmo), [])
	

func _add_face(top_left, top_right, bottom_right, bottom_left, gizmo, color) -> void:
	var vertex_color_arr = PackedColorArray()
	vertex_color_arr.resize(6)
	vertex_color_arr.fill(color)
	var lines = PackedVector3Array()
		
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

	gizmo.add_lines(lines, get_material("lines", gizmo), false)


func _get_handle_name(_gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool) -> String:
	return str(Face.keys()[handle_id])


func _get_handle_value(gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool) -> Variant:
	var volume = gizmo.get_node_3d() as OBBVolume
	var handle_data = HandleData.new()
	handle_data.size = volume.size
	handle_data.pos = volume.global_position
	return handle_data


func _set_handle(gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool, camera: Camera3D, screen_pos: Vector2) -> void:
	var volume = gizmo.get_node_3d() as OBBVolume

	var axis = handle_id % 3
	var sign = 1 if handle_id < 3 else -1

	var camera_pos = camera.project_ray_origin(screen_pos)
	var from_camera_to_handle_dir = camera.project_ray_normal(screen_pos)
	var handle_pos = camera_pos + from_camera_to_handle_dir * 1e5
	
	
	if Input.is_key_pressed(KEY_ALT):
		# translate both faces on an axis
		var volume_pos = volume.global_position
		var volume_axis = volume_pos + volume.global_basis[axis] * 1e5 * sign
		var point_on_axis = Geometry3D.get_closest_points_between_segments(volume_pos, volume_axis, camera_pos, handle_pos)[0]	
		var from_vol_to_point = point_on_axis - volume_pos
		volume.size[axis] = from_vol_to_point.length() * 2
		if volume.scale[axis] != 0:
			volume.size[axis] /= volume.scale[axis]
	else:
		# translate a single face on an axis
		var start_face = volume.global_position - volume.global_basis[axis] * volume.size[axis] / 2 * sign
		var end = volume.global_position + volume.global_basis[axis] * 1e5 * sign
		var point_on_axis = Geometry3D.get_closest_points_between_segments(start_face, end, camera_pos, handle_pos)[0]
		var from_start_to_point = point_on_axis - start_face
		var end_face = start_face + volume.global_basis[axis].normalized() * from_start_to_point.length() * sign
		volume.size[axis] = from_start_to_point.length()
		if volume.scale[axis] != 0:
			volume.size[axis] /= volume.scale[axis]
		volume.global_position = (start_face + end_face) / 2.0


func _commit_handle(gizmo: EditorNode3DGizmo, handle_id: int, _secondary: bool, restore: Variant, cancel: bool) -> void:
	var volume = gizmo.get_node_3d() as OBBVolume
	var handle_data = restore as HandleData

	if editor_plugin == null:
		printerr("Require editor plugin to function")
		return
	var undo_redo = editor_plugin.get_undo_redo()

	undo_redo.create_action("Edit OBBVolume")
	undo_redo.add_do_property(volume, "size", volume.size)
	undo_redo.add_do_property(volume, "global_position", volume.global_position)

	undo_redo.add_undo_property(volume, "size", handle_data.size)
	undo_redo.add_undo_property(volume, "global_position", handle_data.pos)
	if cancel:
		volume.size = handle_data.size
		volume.global_position = handle_data.pos
	undo_redo.commit_action()
