# contains all functionality for memory plugin dock
@tool
class_name CheckMemory
extends Control

signal resize_table

var _summary_text = ""
var _error_message = "Error: Current open scene is not a valid level/map. Open a valid level in the editor to run the tool."

var _level_budgets: Dictionary[String, LevelBudget] = {}
var _type_budgets: Dictionary[String, TypeBudget] = {}

@onready var table: MemoryTable = $VBoxContainer/ScrollContainer/MarginContainer/VBoxContainer/DataTable
@onready var toggles = $VBoxContainer/ScrollContainer/MarginContainer/VBoxContainer/ColumnToggles
@onready var _summary_box = $VBoxContainer/ScrollContainer/MarginContainer/VBoxContainer/LevelSummary/Summary
@onready var _refresh_button = $VBoxContainer/ScrollContainer/MarginContainer/VBoxContainer/Button


func resize():
	emit_signal("resize_table")


func _ready():
	self.custom_minimum_size.x = 400

	var config = PortalPlugin.read_config()
	if config.size() == 0:
		return

	_level_budgets = _get_level_budgets(config["fbExportData"] + "/level_info.json")
	_type_budgets = _get_type_budgets(config["fbExportData"] + "/asset_types.json")

	if not _refresh_button.pressed.is_connected(_on_refresh_pressed):
		_refresh_button.pressed.connect(_on_refresh_pressed)


func set_current_scene(scene: Node):
	if scene is not Node3D:
		return

	if not scene.name in _level_budgets:
		return

	var types_and_names: Dictionary[String, Array] = {}
	var nodes = _get_all_children(scene)
	for node in nodes:
		var type = LevelValidator.is_type_valid(node)
		if type != "":
			if type in types_and_names:
				types_and_names[type].append(node.name)
			else:
				types_and_names[type] = [node.name]

	var total_instances = 0
	var total_memory = 0
	var level_memory_max = _level_budgets[scene.name].physics_cost_max

	var table_data: TableData = TableData.new()
	for type in types_and_names:
		var entry = TableEntry.new()
		entry.object_type = type
		entry.objects.assign(types_and_names[type])
		entry.physics_cost = _type_budgets[type].physics_cost
		total_instances += entry.objects.size()
		total_memory += entry.objects.size() * entry.physics_cost
		table_data.entries.append(entry)

	var is_within_memory = true
	if level_memory_max != -1:
		is_within_memory = total_memory <= level_memory_max

	_summary_box.text = (
		"""Total Objects: %d
Total memory used: %d out of %d available.
Level is within memory limit: %s"""
		% [total_instances, total_memory, level_memory_max, is_within_memory]
	)
	table.draw_table2(table_data)


static func _get_level_budgets(level_info_path: String) -> Dictionary[String, LevelBudget]:
	var data: Dictionary[String, LevelBudget] = {}
	if not FileAccess.file_exists(level_info_path):
		printerr("File does not exist %s" % level_info_path)
		return data
	var file = FileAccess.open(level_info_path, FileAccess.READ)
	var contents = file.get_as_text()
	var result = JSON.parse_string(contents)
	if not result:
		printerr("Unable to read json of %s" % level_info_path)
		return data

	var level_info: Dictionary = result
	for level in level_info:
		var level_object = level_info[level]
		var level_budget = LevelBudget.new()
		if "budget" in level_object:
			var budget = level_object["budget"]
			var physics_cost_max = budget["physicsCostMax"] if "physicsCostMax" in budget else -1
			level_budget.physics_cost_max = physics_cost_max
		data[level] = level_budget
	return data


static func _get_type_budgets(asset_types_path: String) -> Dictionary[String, TypeBudget]:
	var data: Dictionary[String, TypeBudget] = {}
	if not FileAccess.file_exists(asset_types_path):
		printerr("File does not exist %s" % asset_types_path)
		return data
	var file = FileAccess.open(asset_types_path, FileAccess.READ)
	var contents = file.get_as_text()
	var result = JSON.parse_string(contents)
	if not result:
		printerr("Unable to read json of %s" % asset_types_path)
		return data

	var asset_types: Dictionary = result
	for entry in asset_types["AssetTypes"]:
		var type: String = entry["type"] if "type" in entry else null
		if type == null:
			printerr("Encountered entry in asset types with no type. This should never be the case")
			printerr(entry)
			continue
		var type_budget = TypeBudget.new()
		var constants: Array = entry["constants"] if "constants" in entry else null
		if constants != null:
			for constant in constants:
				var name = constant["name"] if "name" in constant else ""
				if name == "physicsCost":
					var cost = constant["value"] if "value" in constant else 0
					type_budget.physics_cost = cost
					break
		if type in data:
			printerr("Encountered duplicate type in asset types: %s" % type)
		data[type] = type_budget
	return data


static func _get_all_children(root: Node, array: Array[Node] = []) -> Array[Node]:
	array.push_back(root)
	for child in root.get_children():
		array = _get_all_children(child, array)
	return array


func _on_refresh_pressed():
	var scene = EditorInterface.get_edited_scene_root()
	set_current_scene(scene)


class LevelBudget:
	var physics_cost_max: int = -1

	func _to_string():
		return "LevelBudget(physics_cost_max=%d)" % physics_cost_max


class TypeBudget:
	var physics_cost: int = 0

	func _to_string():
		return "TypeBudget(physics_cost=%d)" % physics_cost


class TableEntry:
	var object_type: String = ""
	var objects: Array[String] = []
	var physics_cost: int = 0


class TableData:
	var entries: Array[TableEntry] = []

	func sort(_func: Callable):
		var sorted_entries = _custom_stable_sort(entries, _func)
		entries.assign(sorted_entries)

	func _custom_stable_sort(array: Array, is_less_than: Callable) -> Array:
		var indices = range(array.size())
		indices.sort_custom(
			func(a_i, b_i):
				var a = array[a_i]
				var b = array[b_i]
				if is_less_than.call(a, b):
					return true
				if is_less_than.call(b, a):
					return false
				return a_i < b_i
		)
		return indices.map(func(i): return array[i])
