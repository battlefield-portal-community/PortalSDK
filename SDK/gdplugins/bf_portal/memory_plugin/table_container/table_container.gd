# refactored version of custom TableContainer node
@tool
@icon("res://addons/bf_portal/memory_plugin/table_container/icons/TableContainer.svg")
class_name TableContainer extends HBoxContainer
## A basic extension of [HBoxContainer] that treats [VBoxContainer] children like columns.
##
## The purpose of this class is to keep all nodes within a row the same height.

#  new information added to work with memory plugin ------------------------------------------------
var placeholder: Node
var is_dragging: bool = false
var drag_preview: Node
var table

var global_mouse

@onready var dock = self.owner
@onready var type_col = $ObjectType
@onready var names_col = $InstNames
@onready var count_col = $InstCount
@onready var memory_col = $Memory

var type_pos_range
var names_pos_range
var count_pos_range
var memory_pos_range

# --------------------------------------------------------------------------------------------------


func _process(float):
	if is_dragging:
		drag_preview.position.y = table.toggle_col.global_position.y
		var dock_left_bound = table.global_position.x
		var dock_right_bound = table.global_position.x + table.size.x
		drag_preview.position.x = clamp(drag_preview.position.x, dock_left_bound, dock_right_bound)


func _input(event):
	# mouse in viewport coordinates
	if event is InputEventMouseMotion:
		global_mouse = event.global_position


# Property Helpers ---------------------------------------------------------------------------------

# Dictionary of checkable property names. Values are the defaults.
const _checkable_properties: Dictionary = {
	&"update_interval_editor": 60,
	&"update_interval_game": 60,
	&"separation_horizontal": null,
	&"separation_vertical": null,
}


# Update flags of our checkable properties to appropriately set the checkable flags.
func _validate_property(property: Dictionary) -> void:
	if property.name in _checkable_properties:
		property.type = TYPE_INT
		property.usage |= PROPERTY_USAGE_CHECKABLE | PROPERTY_USAGE_DEFAULT
		if get(property.name) != null:
			property.usage |= PROPERTY_USAGE_CHECKED


# Overridden function that indicates which properties get handled by [method _property_get_revert].
func _property_can_revert(property_name: StringName) -> bool:
	return property_name in _checkable_properties


# Overridden function that handles default values for the methods specified in [method _property_can_revert].
func _property_get_revert(property_name: StringName) -> Variant:
	return _checkable_properties.get(property_name)


# Exported Properties ------------------------------------------------------------------------------

## Update interval for the editor, in frames, if [member auto_update_in_editor] is true
@export_range(1, 60) var update_interval_editor = _checkable_properties[&"update_interval_editor"]

## Update interval, in frames, if [member auto_update_in_game] is true
@export_range(1, 60) var update_interval_game = _checkable_properties[&"update_interval_game"]

## Override for horizontal padding between elements, in pixels.
var separation_horizontal = null:
	set(value):
		separation_horizontal = value
		_apply_horizontal_override()

## Override for vertical padding between elements, in pixels.
var separation_vertical = null:
	set(value):
		separation_vertical = value
		_apply_vertical_override()


## Apply separation override to all child [VBoxContainer] columns.
func _apply_vertical_override() -> void:
	var cols: Array[VBoxContainer] = _get_table_children()
	for col: VBoxContainer in cols:
		if separation_horizontal != null:
			col.add_theme_constant_override("separation", separation_vertical)
		else:
			col.remove_theme_constant_override("separation")


## Apply separation override to this node.
func _apply_horizontal_override() -> void:
	if separation_horizontal != null:
		add_theme_constant_override("separation", separation_horizontal)
	else:
		remove_theme_constant_override("separation")


# End Exported Properties --------------------------------------------------------------------------

# Update counter used in [member _process] for the editor
var _update_counter_editor: int = 0

# Update counter used in [member _process] for the game
var _update_counter_game: int = 0


func _ready() -> void:
	table = dock.get_node("VBoxContainer/ScrollContainer/MarginContainer/VBoxContainer/DataTable")
	type_pos_range = Vector2(type_col.global_position.x, type_col.global_position.x + type_col.size.x)
	names_pos_range = Vector2(names_col.global_position.x, names_col.global_position.x + names_col.size.x)
	count_pos_range = Vector2(count_col.global_position.x, count_col.global_position.x + count_col.size.x)
	memory_pos_range = Vector2(memory_col.global_position.x, memory_col.global_position.x + memory_col.size.x)

	if Engine.is_editor_hint():
		_update_counter_editor = 0
	else:
		_update_counter_game = 0

	refresh()


## Update the table sizes manually.
## This is required in-game if [member auto_update_in_game] is false.
func refresh() -> void:
	var cols: Array[VBoxContainer] = _get_table_children()
	_clear_custom_column_heights(cols)
	_set_row_heights(cols)
	_apply_vertical_override()


func _clear_custom_column_heights_for_col(col: VBoxContainer) -> void:
	var cells: Array[Control] = _get_col_children(col)
	for cell: Control in cells:
		cell.custom_minimum_size = Vector2.ZERO


func _clear_custom_column_heights(cols: Array[VBoxContainer]) -> void:
	for col: VBoxContainer in cols:
		_clear_custom_column_heights_for_col(col)


# TODO handle if there's different columns, probably with a warning
func _set_row_heights(cols: Array[VBoxContainer]) -> void:
	var row_heights: Array[float] = []
	var first_col: bool = true
	for col: VBoxContainer in cols:
		var cells: Array[Control] = _get_col_children(col)
		if first_col:
			first_col = false
			for index: int in cells.size():
				var cell: Control = cells[index]
				row_heights.append(cell.get_combined_minimum_size().y)
		else:
			for index: int in cells.size():
				var cell: Control = cells[index]
				var cell_minimum_height
				var row_minimum_height
				cell_minimum_height = cell.get_combined_minimum_size().y
				row_minimum_height = row_heights[index]

				if cell_minimum_height > row_minimum_height:
					row_heights[index] = cell_minimum_height

	# resize all cells
	for col: VBoxContainer in cols:
		var cells: Array[Control] = _get_col_children(col)
		for index: int in cells.size():
			var cell: Control = cells[index]
			cell.custom_minimum_size.y = row_heights[index]


## Get the table's children as [VBoxContainer] elements. Useful for static typing.
## Note that this filters out non-VBoxContainer nodes.
func _get_table_children() -> Array[VBoxContainer]:
	var children: Array[Node] = get_children().filter(
		func(node: Node) -> bool: return node is VBoxContainer
	)
	var cols: Array[VBoxContainer] = []
	cols.assign(children)
	return cols


## Get a row's children as [Control] elements. Useful for static typing.
## Note that this filters out non-Container nodes.
func _get_col_children(col: VBoxContainer) -> Array[Control]:
	var children: Array[Node] = col.get_children().filter(
		func(node: Node) -> bool: return node is Control
	)
	var cells: Array[Control] = []
	cells.assign(children)
	return cells


## Get a row's children as [Control] elements. Useful for static typing.
## Note that this filters out non-Container nodes.
func _get_row_children(row_index: int) -> Array[Control]:
	var table_cols = _get_table_children()
	var children: Array[Node]
	for col in table_cols:
		var child = col.get_child(row_index).filter(
			func(node: Node) -> bool: return node is Control
		)
		children.append(col.get_child(row_index))
	var cells: Array[Control] = []
	cells.assign(children)
	return cells


# Warnings and Helpers -----------------------------------------------------------------------------


func _have_uneven_cols() -> bool:
	var cols: Array[VBoxContainer] = _get_table_children()
	if cols.size() < 2:
		return false

	var col_heights: Array = cols.map(func(node: Node) -> int: return node.get_child_count())
	return not col_heights.all(func(height: int) -> bool: return height == col_heights.front())


func _get_configuration_warnings() -> PackedStringArray:
	var warnings: Array[String] = []

	var have_bad_children: bool = get_children().any(
		func(node: Node) -> bool: return not node is VBoxContainer
	)

	var have_uneven_cols: bool = _have_uneven_cols()

	if have_bad_children:
		warnings.append("Children of TableContainer should all be VBoxContainer")

	if have_uneven_cols:
		warnings.append("All cols should be the same height")

	return warnings
