@tool
@icon("OBBVolumeIcon.svg")
class_name OBBVolume
extends Node3D

## Size of bounding box
@export var size = Vector3():
	set(value):
		size = value.max(Vector3.ZERO)
		update_gizmos()
		update_configuration_warnings()

## (Editor only) Color to differentiate volumes from each other
@export var color: Color = Color(ProjectSettings.get_setting_with_override("debug/shapes/collision/shape_color")):
	set(value):
		color = value
		update_gizmos()


func _get_configuration_warnings() -> PackedStringArray:
	if size.x <= 0 or size.y <= 0 or size.z <= 0:
		return ["One or more components of the size is less than or equal to zero.\nThe OBB will not function correctly if it has no volume"]
	return []
