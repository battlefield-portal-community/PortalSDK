@tool
extends Button

# --------------------------------------------------------------------------------------------------

var dock
var table
var table_container
var parent_col
var hidden_col
var style_empty

# --------------------------------------------------------------------------------------------------


func _ready():
	parent_col = get_parent()
	table = parent_col.get_parent()
	table_container = table.get_parent()
	style_empty = StyleBoxFlat.new()
	style_empty.bg_color = Color(1, 1, 1, 1)


# triggers when you click and drag
func _get_drag_data(_at_position):
	table.is_dragging = true
	hidden_col = parent_col

	# make the drag preview
	var column_copy = parent_col.duplicate()
	column_copy.set_script(null)
	column_copy.get_child(0).set_script(null)
	set_drag_preview(column_copy)
	table.drag_preview = column_copy

	# create empty placeholder block in the dragged column's original place
	# (prevents the other columns from expanding and taking up the remaining width)
	var placeholder = VBoxContainer.new()
	placeholder.custom_minimum_size = parent_col.size
	placeholder.add_theme_stylebox_override("normal", style_empty)
	placeholder.mouse_filter = Control.MOUSE_FILTER_STOP
	placeholder.mouse_force_pass_scroll_events = true
	table.add_child(placeholder)
	table.placeholder = placeholder

	# get the x position range of this column
	table.type_pos_range = Vector2(table.type_col.global_position.x, table.type_col.global_position.x + table.type_col.size.x)
	table.names_pos_range = Vector2(table.names_col.global_position.x, table.names_col.global_position.x + table.names_col.size.x)
	table.count_pos_range = Vector2(table.count_col.global_position.x, table.count_col.global_position.x + table.count_col.size.x)
	table.memory_pos_range = Vector2(table.memory_col.global_position.x, table.memory_col.global_position.x + table.memory_col.size.x)

	# hide original column
	call_deferred("_deferred_hide", parent_col)
	var control = Control.new()
	return control


func _deferred_hide(node):
	node.visible = false


# triggers when you hover with dragged item
# returns true if over an area that can be dropped into
func _can_drop_data(_at_position, data):
	# swap empty placeholder column with column currently being hovered over
	var placeholder_index = table.placeholder.get_index()
	var target_node_index = get_parent().get_index()
	table.move_child(table.placeholder, target_node_index)
	table.move_child(get_parent(), placeholder_index)

	return data is Control


# handles dropping
func _notification(notification_type):
	match notification_type:
		NOTIFICATION_DRAG_END:
			table.is_dragging = false

			if hidden_col:
				var placeholder_index = table.placeholder.get_index()
				hidden_col.visible = true
				table.move_child(hidden_col, placeholder_index)
				hidden_col = null

			if table.placeholder:
				table.placeholder.queue_free()


func _debug_print():
	if table.global_mouse.x > table.type_pos_range.x and table.global_mouse.x < table.type_pos_range.y:
		print("in types column")
	elif table.global_mouse.x > table.names_pos_range.x and table.global_mouse.x < table.names_pos_range.y:
		print("in instances column")
	elif table.global_mouse.x > table.count_pos_range.x and table.global_mouse.x < table.count_pos_range.y:
		print("in count column")
	elif table.global_mouse.x > table.memory_pos_range.x and table.global_mouse.x < table.memory_pos_range.y:
		print("in memory column")

# --------------------------------------------------------------------------------------------------
