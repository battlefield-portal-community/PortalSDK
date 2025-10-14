# contains all functionality for memory plugin dock
@tool
extends Control

# --------------------------------------------------------------------------------------------------
var table
var table_container
var table_columns = []
var toggle_icon_right
var toggle_icon_down
# --------------------------------------------------------------------------------------------------


func _ready():
	table_container = get_parent().get_node("DataTable")
	table = table_container.get_node("Table")
	toggle_icon_right = load("res://addons/bf_portal/memory_plugin/icons/toggle_icon_right.png")
	toggle_icon_down = load("res://addons/bf_portal/memory_plugin/icons/toggle_icon_down.png")


# triggers with every edit to the search box
func _on_search_bar_text_changed(new_text):
	_filter_table(new_text)


# filter the table according to the user's search entry
func _filter_table(search_text: String):
	var queries = search_text.to_lower().split(" ", false)

	for index in table_container.type_col.get_children().size():
		# skip button/column
		if index == 0:
			continue

		var type: RichTextLabel = table_container.type_col.get_child(index)
		var names: RichTextLabel = table_container.names_col.get_child(index)
		var type_name: String = type.text
		var instance_name: String = names.text

		var filter_out: bool = false
		for query in queries:
			query = query.to_lower()
			if query not in type_name.to_lower() and query not in instance_name.to_lower():
				filter_out = true
		for table_column in table.get_children():
			table_column.get_child(index).visible = !filter_out

		# expand row to show all names that may be being searched for
		var toggle_button = table_container.toggle_col.get_child(index)
		if "icon" in toggle_button:
			if search_text in instance_name:
				if toggle_button.icon == toggle_icon_right:
					table_container._on_expand_collapse_pressed(toggle_button, names)
			else:
				if toggle_button.icon == toggle_icon_down:
					table_container._on_expand_collapse_pressed(toggle_button, names)
