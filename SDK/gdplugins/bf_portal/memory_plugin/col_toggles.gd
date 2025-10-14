# handles data output & sorting options toggled by the user
@tool
class_name ColumnOptions
extends Control

enum SortType {
	TYPE_NAME,
	OBJECT_NAME,
	OBJECT_COUNT,
	PHYSICS_COST,
}

enum VisibleColumns {
	OBJECTS = 1,
	COUNT = 1 << 1,
	PHYSICS = 1 << 2,
	TOTAL = 1 << 3,
}

var table: MemoryTable

var flags = {
	"--all-data": true,
	"--memory": true,
	"--count": true,
	"--instances": true,
}

var columns: VisibleColumns = ~0

var sort_type: SortType = SortType.TYPE_NAME
var sort_reverse: bool = true

@onready var checkbox_all = $HBoxContainer/AllData
@onready var checkbox_mem = $HBoxContainer/Memory
@onready var checkbox_count = $HBoxContainer/InstanceCount
@onready var checkbox_names = $HBoxContainer/InstanceNames


func is_column_visible(col: VisibleColumns) -> bool:
	return columns & col


func _ready():
	table = get_parent().get_node("DataTable")
	# set checkboxes as checked upon start without firing signals
	checkbox_all.set_pressed_no_signal(true)
	checkbox_mem.set_pressed_no_signal(true)
	checkbox_count.set_pressed_no_signal(true)
	checkbox_names.set_pressed_no_signal(true)


func _on_all_data_toggled(toggled_on):
	checkbox_mem.button_pressed = toggled_on
	checkbox_count.button_pressed = toggled_on
	checkbox_names.button_pressed = toggled_on


func _on_memory_toggled(toggled_on):
	if toggled_on:
		columns |= VisibleColumns.PHYSICS
	else:
		columns &= ~VisibleColumns.PHYSICS
	_toggle_all_data(toggled_on)
	table.memory_col.visible = toggled_on


func _on_instance_count_toggled(toggled_on):
	if toggled_on:
		columns |= VisibleColumns.COUNT
	else:
		columns &= ~VisibleColumns.COUNT
	_toggle_all_data(toggled_on)
	table.count_col.visible = toggled_on


func _on_object_names_toggled(toggled_on):
	if toggled_on:
		columns |= VisibleColumns.OBJECTS
	else:
		columns &= ~VisibleColumns.OBJECTS
	_toggle_all_data(toggled_on)
	table.names_col.visible = toggled_on
	table.toggle_col.visible = toggled_on


func _toggle_all_data(_toggled_on):
	checkbox_all.set_pressed_no_signal(_all_columns_visible())


func _all_columns_visible():
	var all_columns = VisibleColumns.TOTAL - 1
	return columns & all_columns == all_columns
