# contains all functionality for memory plugin dock
@tool
class_name MemoryTable
extends Control

# --------------------------------------------------------------------------------------------------

signal resize_table

var column_options: ColumnOptions
var table_columns = []
var collapse_state = true

var style_empty = StyleBoxEmpty.new()
var style_light = StyleBoxFlat.new()
var style_dark = StyleBoxFlat.new()
var row_styles = [style_light, style_dark]

var toggle_icon_right = load("res://addons/bf_portal/memory_plugin/icons/toggle_icon_right.png")
var toggle_icon_down = load("res://addons/bf_portal/memory_plugin/icons/toggle_icon_down.png")

var level_data: CheckMemory.TableData = null

@onready var table: TableContainer = $Table
@onready var toggle_col = $Table/Toggles
@onready var type_col = $Table/ObjectType
@onready var names_col = $Table/InstNames
@onready var count_col = $Table/InstCount
@onready var memory_col = $Table/Memory


func _ready():
	column_options = self.owner.get_node("VBoxContainer/ScrollContainer/MarginContainer/VBoxContainer/ColumnToggles")

	table_columns = [
		type_col,
		names_col,
		count_col,
		memory_col,
	]

	style_light.bg_color = Color(0.133, 0.149, 0.18, 0.9)
	style_dark.bg_color = Color(0.133, 0.149, 0.18, 0.5)
	style_light.set_content_margin_all(4)
	style_dark.set_content_margin_all(4)


func clear_table():
	var cols = table.get_children()
	for col in cols:
		var entries = col.get_children()
		entries.pop_front()
		for entry in entries:
			for label in entry.get_children():
				entry.remove_child(label)
				label.queue.free()
			col.remove_child(entry)
			entry.queue_free()


func draw_table2(table_data: CheckMemory.TableData):
	clear_table()

	level_data = table_data

	# retain state of being collapsed/expanded
	toggle_col.get_child(0).icon = toggle_icon_right if collapse_state else toggle_icon_down

	_sort_data(level_data)

	var entries: Array[CheckMemory.TableEntry] = level_data.entries
	var entry_index = -1
	for entry in entries:
		entry_index += 1
		var toggle_button = null
		if column_options.is_column_visible(ColumnOptions.VisibleColumns.OBJECTS):
			if entry.objects.size() > 1:
				toggle_button = Button.new()
				set_toggle_button_settings(toggle_button)
				toggle_button.add_theme_stylebox_override("normal", row_styles[entry_index % 2])
				toggle_col.add_child(toggle_button)
			else:
				var new_entry = RichTextLabel.new()
				new_entry.add_theme_stylebox_override("normal", row_styles[entry_index % 2])
				toggle_col.add_child(new_entry)

		# add type
		var new_entry = RichTextLabel.new()
		new_entry.fit_content = true
		new_entry.text = entry.object_type
		new_entry.add_theme_stylebox_override("normal", row_styles[entry_index % 2])
		new_entry.item_rect_changed.connect(_resize_table)
		table_columns[0].add_child(new_entry)

		# add objects
		if column_options.is_column_visible(ColumnOptions.VisibleColumns.OBJECTS):
			if entry.objects.size() > 1:
				new_entry = RichTextLabel.new()
				new_entry.fit_content = not collapse_state
				new_entry.add_theme_constant_override("line_separation", 3)
				new_entry.scroll_active = false
				new_entry.text = "\n".join(entry.objects)
				# set collapse/expand button signal
				var callable = Callable(self, "_on_expand_collapse_pressed").bind(toggle_button, new_entry)
				toggle_button.pressed.connect(callable)
			else:
				new_entry = RichTextLabel.new()
				new_entry.fit_content = true
				new_entry.text = entry.objects[0]
			new_entry.bbcode_enabled = true
			new_entry.add_theme_stylebox_override("normal", row_styles[entry_index % 2])
			table_columns[1].add_child(new_entry)

		if column_options.is_column_visible(ColumnOptions.VisibleColumns.COUNT):
			new_entry = RichTextLabel.new()
			new_entry.fit_content = true
			new_entry.text = str(entry.objects.size())
			new_entry.add_theme_stylebox_override("normal", row_styles[entry_index % 2])
			table_columns[2].add_child(new_entry)

		if column_options.is_column_visible(ColumnOptions.VisibleColumns.PHYSICS):
			new_entry = RichTextLabel.new()
			new_entry.fit_content = true
			new_entry.text = str(entry.physics_cost)
			new_entry.add_theme_stylebox_override("normal", row_styles[entry_index % 2])
			table_columns[3].add_child(new_entry)


func _resize_table():
	table.refresh()


func set_toggle_button_settings(button: Button):
	button.icon = toggle_icon_right if collapse_state else toggle_icon_down
	button.expand_icon = true
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.vertical_icon_alignment = VERTICAL_ALIGNMENT_TOP
	button.custom_minimum_size.x = 50
	button.size.x = 50
	button.add_theme_stylebox_override("focus", style_empty)


func _on_type_pressed():
	_change_sort_type(ColumnOptions.SortType.TYPE_NAME)


func _on_memory_pressed():
	_change_sort_type(ColumnOptions.SortType.PHYSICS_COST)


func _on_count_pressed():
	_change_sort_type(ColumnOptions.SortType.OBJECT_COUNT)


func _on_names_pressed():
	for name in names_col.get_children():
		var lines = name.text.split("\n")
		lines.reverse()
		var reversed_text = "\n".join(lines)
		name.text = reversed_text
	_change_sort_type(ColumnOptions.SortType.OBJECT_NAME, false)


func _change_sort_type(sort_type: ColumnOptions.SortType, redraw_table: bool = true):
	if column_options.sort_type == sort_type:
		# user clicked the same header again which means to switch direction
		column_options.sort_reverse = not column_options.sort_reverse
	else:
		column_options.sort_type = sort_type
		column_options.sort_reverse = false
	if redraw_table:
		draw_table2(level_data)
	table.refresh()


func _on_expand_collapse_pressed(toggle_button, container):
	# collapse/expand text label
	container.fit_content = not container.fit_content
	# change toggle icon
	toggle_button.icon = toggle_icon_right if toggle_button.icon == toggle_icon_down else toggle_icon_down
	# handle resizing
	table.refresh()


func _on_all_collapse_expand_pressed():
	# toggle overall collapse state
	collapse_state = not collapse_state

	var main_toggle_button = toggle_col.get_child(0)
	main_toggle_button.icon = toggle_icon_right if collapse_state else toggle_icon_down

	# collapse/expand all rows
	for index in toggle_col.get_children().size() - 1:
		var toggle_button = toggle_col.get_child(index + 1)
		var names: RichTextLabel = names_col.get_child(index + 1)
		names.fit_content = not collapse_state
		if toggle_button is Button:
			toggle_button.icon = toggle_icon_right if collapse_state else toggle_icon_down

	table.refresh()


func _sort_data(table_data: CheckMemory.TableData) -> void:
	var sorting_function: Callable
	match column_options.sort_type:
		ColumnOptions.SortType.TYPE_NAME:
			sorting_function = func(a: CheckMemory.TableEntry, b: CheckMemory.TableEntry):
				var reverse = -1 if column_options.sort_reverse else 1
				var cmp = a.object_type.naturalnocasecmp_to(b.object_type) * reverse
				return cmp < 0

		ColumnOptions.SortType.OBJECT_NAME:
			for entry in table_data.entries:
				entry.objects.sort()
				if column_options.sort_reverse:
					entry.objects.reverse()
			return  # actual table refresh happens elsewhere

		ColumnOptions.SortType.OBJECT_COUNT:
			sorting_function = func(a: CheckMemory.TableEntry, b: CheckMemory.TableEntry):
				return a.objects.size() < b.objects.size() if column_options.sort_reverse else a.objects.size() > b.objects.size()

		ColumnOptions.SortType.PHYSICS_COST:
			sorting_function = func(a: CheckMemory.TableEntry, b: CheckMemory.TableEntry):
				return a.physics_cost < b.physics_cost if column_options.sort_reverse else a.physics_cost > b.physics_cost
		_:
			printerr("Unimplemented sorting type: %s" % ColumnOptions.SortType.keys()[column_options.sort_type])

	if sorting_function.is_valid():
		table_data.sort(sorting_function)
