@tool
@icon("PolygonVolumeIcon.svg")
class_name PolygonVolume
extends Node3D

var DEFAULT_POINTS = PackedVector2Array([Vector2(-5, -5), Vector2(-5, 5), Vector2(5, 5), Vector2(5, -5)])

## Points that compose the polygon. Winding order starts from first to last
@export var points: PackedVector2Array = DEFAULT_POINTS.duplicate():
	set(value):
		points = value
		update_gizmos()

## Height of the volume. A value of 0 means infinite height
@export var height: float = 0:
	set(value):
		height = max(value, 0)
		update_gizmos()

## (Editor only) Color to differentiate volumes from each other
@export var color: Color = Color(ProjectSettings.get_setting_with_override("debug/shapes/collision/shape_color")):
	set(value):
		color = value
		update_gizmos()

@export_tool_button("Reset Center")
var reset_center_action = _reset_center


func _ready() -> void:
	if points == null:
		points = DEFAULT_POINTS.duplicate()


func _notification(what: int) -> void:
	if what == NOTIFICATION_TRANSFORM_CHANGED:
		self.rotation = Vector3(0, rotation.y, 0)


func _reset_center() -> void:
	if len(points) < 2:
		printerr("Require 2 or more points to properly reset center")
		return

	var points_average = Vector2.ZERO
	for point in points:
		points_average += point
	points_average /= len(points)
	
	if points_average.is_equal_approx(Vector2.ZERO):
		return

	var points_offset: PackedVector2Array = points.duplicate()
	for i in range(len(points_offset)):
		var point = points_offset[i] - points_average
		points_offset.set(i, point)
	var new_center = to_global(Vector3(points_average.x, 0, points_average.y))

	var undo_redo = EditorInterface.get_editor_undo_redo()
	undo_redo.create_action("Reset Center Of PolygonVolume")
	undo_redo.add_do_property(self, "points", points_offset)
	undo_redo.add_do_property(self, "global_position", new_center)
	undo_redo.add_undo_property(self, "points", points)
	undo_redo.add_undo_property(self, "global_position", global_position)
	undo_redo.commit_action()
