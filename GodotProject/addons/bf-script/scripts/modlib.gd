extends RefCounted
class_name ModLib

# Utility library for BF Portal mod development
# Converted from TypeScript modlib/index.ts

# String concatenation
static func concat(s1: String, s2: String) -> String:
	return s1 + s2

# Logical AND for multiple boolean conditions
static func and_all(conditions: Array) -> bool:
	for cond in conditions:
		if not cond:
			return false
	return true

# Logical AND for multiple condition functions
static func and_fn(condition_functions: Array[Callable]) -> bool:
	for cond_fn in condition_functions:
		if not cond_fn.call():
			return false
	return true

# Get player ID
static func get_player_id(player) -> int:
	return Mod.get_obj_id(player)

# Get team ID
static func get_team_id(team) -> int:
	return Mod.get_obj_id(team)

# Convert mod.Array to GDScript Array
static func convert_array(mod_array) -> Array:
	var result = []
	var n = Mod.count_of(mod_array)
	for i in range(n):
		var current_element = Mod.value_in_array(mod_array, i)
		result.append(current_element)
	return result

# Filter array based on condition
static func filtered_array(mod_array, condition: Callable):
	var arr = convert_array(mod_array)
	var result = Mod.empty_array()
	for element in arr:
		if condition.call(element):
			Mod.append_to_array(result, element)
	return result

# Find index of first element that satisfies condition
static func index_of_first_true(mod_array, condition: Callable, arg = null) -> int:
	var arr = convert_array(mod_array)
	var n = arr.size()
	for i in range(n):
		var current_element = arr[i]
		if condition.call(current_element, arg):
			return i
	return -1

# Conditional execution
static func if_then_else(condition: bool, if_true: Callable, if_false: Callable):
	if condition:
		return if_true.call()
	else:
		return if_false.call()

# Check if condition is true for all elements
static func is_true_for_all(mod_array, condition: Callable, arg = null) -> bool:
	var arr = convert_array(mod_array)
	for element in arr:
		if not condition.call(element, arg):
			return false
	return true

# Check if condition is true for any element
static func is_true_for_any(mod_array, condition: Callable, arg = null) -> bool:
	var arr = convert_array(mod_array)
	for element in arr:
		if condition.call(element, arg):
			return true
	return false

# Sort array with custom comparison
static func sorted_array(array: Array, compare: Callable) -> Array:
	var result = array.duplicate()
	result.sort_custom(compare)
	return result

# Check equality
static func equals(a, b) -> bool:
	if a == null or b == null:
		push_error("Equals called with null values")
	return Mod.equals(a, b)

# Wait until condition is met or timeout
static func wait_until(delay: float, condition: Callable):
	var delta_count = 10
	var delta_wait = delay / delta_count
	for t in range(delta_count):
		if not condition.call():
			break
		await Mod.wait(delta_wait)

# ConditionState class - tracks state transitions
class ConditionState:
	var last_state: bool = false

	func _init():
		last_state = false

	func update(new_state: bool) -> bool:
		# If new state is false, reset and don't trigger
		if not new_state:
			last_state = false
			return false
		# If already true, don't trigger
		if last_state:
			return false
		# State just transitioned to true, trigger
		last_state = true
		return true

# Conditions container class
class Conditions:
	var condition_states: Array[ConditionState] = []

	func _init():
		condition_states = []

	func get_condition_state(n: int) -> ConditionState:
		while n >= condition_states.size():
			condition_states.append(ConditionState.new())
		return condition_states[n]

# Global condition tracking
static var player_conditions: Array = []
static var team_conditions: Array = []
static var capture_point_conditions: Array = []
static var mcom_conditions: Array = []
static var vehicle_conditions: Array = []
static var global_conditions: Conditions = Conditions.new()

# Helper to get object condition
static func _get_object_condition(id: int, object_conditions: Array, n: int) -> ConditionState:
	while id >= object_conditions.size():
		object_conditions.append(Conditions.new())
	var conditions = object_conditions[id]
	return conditions.get_condition_state(n)

# Get player condition state
static func get_player_condition(player, n: int) -> ConditionState:
	var id = get_player_id(player)
	while id >= player_conditions.size():
		player_conditions.append(Conditions.new())
	var conditions = player_conditions[id]
	return conditions.get_condition_state(n)

# Get team condition state
static func get_team_condition(team, n: int) -> ConditionState:
	var id = get_team_id(team)
	while id >= team_conditions.size():
		team_conditions.append(Conditions.new())
	var conditions = team_conditions[id]
	return conditions.get_condition_state(n)

# Get capture point condition state
static func get_capture_point_condition(obj, n: int) -> ConditionState:
	var id = Mod.get_obj_id(obj)
	return _get_object_condition(id, capture_point_conditions, n)

# Get MCOM condition state
static func get_mcom_condition(obj, n: int) -> ConditionState:
	var id = Mod.get_obj_id(obj)
	return _get_object_condition(id, mcom_conditions, n)

# Get vehicle condition state
static func get_vehicle_condition(obj, n: int) -> ConditionState:
	var id = Mod.get_obj_id(obj)
	return _get_object_condition(id, vehicle_conditions, n)

# Get global condition state
static func get_global_condition(n: int) -> ConditionState:
	return global_conditions.get_condition_state(n)

# Get all players in a team
static func get_players_in_team(team) -> Array:
	var all_players = Mod.all_players()
	var n = Mod.count_of(all_players)
	var team_members = []

	for i in range(n):
		var player = Mod.value_in_array(all_players, i)
		if Mod.get_team(player) == team:
			team_members.append(player)

	return team_members

#-----------------------------------------------------------------------------------------------
# UI Helper Functions
#-----------------------------------------------------------------------------------------------

const UNIQUE_NAME = "----uniquename----"

# Convert array or Vector3 to mod Vector
static func _as_mod_vector(param):
	if param is Array:
		var z = 0 if param.size() == 2 else param[2]
		return Mod.create_vector(param[0], param[1], z)
	else:
		return param

# Convert string or mod.Message to mod.Message
static func _as_mod_message(param):
	if param is String:
		return Mod.message(param)
	return param

# Fill in default UI arguments
static func _fill_in_default_args(params: Dictionary):
	if not params.has("name"):
		params["name"] = ""
	if not params.has("position"):
		params["position"] = Mod.create_vector(0, 0, 0)
	if not params.has("size"):
		params["size"] = Mod.create_vector(100, 100, 0)
	if not params.has("anchor"):
		params["anchor"] = Mod.UIAnchor.TopLeft
	if not params.has("parent"):
		params["parent"] = Mod.get_ui_root()
	if not params.has("visible"):
		params["visible"] = true
	if not params.has("padding"):
		params["padding"] = 0 if params.get("type") == "Container" else 8
	if not params.has("bg_color"):
		params["bg_color"] = Mod.create_vector(0.25, 0.25, 0.25)
	if not params.has("bg_alpha"):
		params["bg_alpha"] = 0.5
	if not params.has("bg_fill"):
		params["bg_fill"] = Mod.UIBgFill.Solid

# Set widget name and get widget reference
static func _set_name_and_get_widget(unique_name: String, params: Dictionary):
	var widget = Mod.find_ui_widget_with_name(unique_name)
	Mod.set_ui_widget_name(widget, params["name"])
	return widget

# Add UI Container
static func _add_ui_container(params: Dictionary):
	_fill_in_default_args(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.add_ui_container(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			restrict
		)
	else:
		Mod.add_ui_container(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"]
		)

	var widget = _set_name_and_get_widget(UNIQUE_NAME, params)

	if params.has("children"):
		for child_params in params["children"]:
			child_params["parent"] = widget
			_add_ui_widget(child_params)

	return widget

# Fill in default text arguments
static func _fill_in_default_text_args(params: Dictionary):
	if not params.has("text_label"):
		params["text_label"] = ""
	if not params.has("text_size"):
		params["text_size"] = 0
	if not params.has("text_color"):
		params["text_color"] = Mod.create_vector(1, 1, 1)
	if not params.has("text_alpha"):
		params["text_alpha"] = 1
	if not params.has("text_anchor"):
		params["text_anchor"] = Mod.UIAnchor.CenterLeft

# Add UI Text
static func _add_ui_text(params: Dictionary):
	_fill_in_default_args(params)
	_fill_in_default_text_args(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.add_ui_text(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			_as_mod_message(params["text_label"]),
			params["text_size"],
			_as_mod_vector(params["text_color"]),
			params["text_alpha"],
			params["text_anchor"],
			restrict
		)
	else:
		Mod.add_ui_text(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			_as_mod_message(params["text_label"]),
			params["text_size"],
			_as_mod_vector(params["text_color"]),
			params["text_alpha"],
			params["text_anchor"]
		)

	return _set_name_and_get_widget(UNIQUE_NAME, params)

# Fill in default image arguments
static func _fill_in_default_image_args(params: Dictionary):
	if not params.has("image_type"):
		params["image_type"] = Mod.UIImageType.None
	if not params.has("image_color"):
		params["image_color"] = Mod.create_vector(1, 1, 1)
	if not params.has("image_alpha"):
		params["image_alpha"] = 1

# Add UI Image
static func _add_ui_image(params: Dictionary):
	_fill_in_default_args(params)
	_fill_in_default_image_args(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.add_ui_image(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["image_type"],
			_as_mod_vector(params["image_color"]),
			params["image_alpha"],
			restrict
		)
	else:
		Mod.add_ui_image(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["image_type"],
			_as_mod_vector(params["image_color"]),
			params["image_alpha"]
		)

	return _set_name_and_get_widget(UNIQUE_NAME, params)

# Fill in default button arguments
static func _fill_in_default_button_args(params: Dictionary):
	if not params.has("button_enabled"):
		params["button_enabled"] = true
	if not params.has("button_color_base"):
		params["button_color_base"] = Mod.create_vector(0.7, 0.7, 0.7)
	if not params.has("button_alpha_base"):
		params["button_alpha_base"] = 1
	if not params.has("button_color_disabled"):
		params["button_color_disabled"] = Mod.create_vector(0.2, 0.2, 0.2)
	if not params.has("button_alpha_disabled"):
		params["button_alpha_disabled"] = 0.5
	if not params.has("button_color_pressed"):
		params["button_color_pressed"] = Mod.create_vector(0.25, 0.25, 0.25)
	if not params.has("button_alpha_pressed"):
		params["button_alpha_pressed"] = 1
	if not params.has("button_color_hover"):
		params["button_color_hover"] = Mod.create_vector(1, 1, 1)
	if not params.has("button_alpha_hover"):
		params["button_alpha_hover"] = 1
	if not params.has("button_color_focused"):
		params["button_color_focused"] = Mod.create_vector(1, 1, 1)
	if not params.has("button_alpha_focused"):
		params["button_alpha_focused"] = 1

# Add UI Button
static func _add_ui_button(params: Dictionary):
	_fill_in_default_args(params)
	_fill_in_default_button_args(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.add_ui_button(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["button_enabled"],
			_as_mod_vector(params["button_color_base"]),
			params["button_alpha_base"],
			_as_mod_vector(params["button_color_disabled"]),
			params["button_alpha_disabled"],
			_as_mod_vector(params["button_color_pressed"]),
			params["button_alpha_pressed"],
			_as_mod_vector(params["button_color_hover"]),
			params["button_alpha_hover"],
			_as_mod_vector(params["button_color_focused"]),
			params["button_alpha_focused"],
			restrict
		)
	else:
		Mod.add_ui_button(
			UNIQUE_NAME,
			_as_mod_vector(params["position"]),
			_as_mod_vector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			_as_mod_vector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["button_enabled"],
			_as_mod_vector(params["button_color_base"]),
			params["button_alpha_base"],
			_as_mod_vector(params["button_color_disabled"]),
			params["button_alpha_disabled"],
			_as_mod_vector(params["button_color_pressed"]),
			params["button_alpha_pressed"],
			_as_mod_vector(params["button_color_hover"]),
			params["button_alpha_hover"],
			_as_mod_vector(params["button_color_focused"]),
			params["button_alpha_focused"]
		)

	return _set_name_and_get_widget(UNIQUE_NAME, params)

# Add UI Widget based on type
static func _add_ui_widget(params):
	if params == null:
		return null

	match params.get("type"):
		"Container":
			return _add_ui_container(params)
		"Text":
			return _add_ui_text(params)
		"Image":
			return _add_ui_image(params)
		"Button":
			return _add_ui_button(params)

	return null

# Parse UI from parameter dictionaries
static func parse_ui(params_array: Array):
	var widget = null
	for params in params_array:
		widget = _add_ui_widget(params)
	return widget

# Display custom notification message
static func display_custom_notification_message(msg, custom, duration: float, target = null):
	var create_header = func(widget_id: String, message, target_player, slot: int):
		Mod.add_ui_text(
			widget_id,
			Mod.create_vector(50, 250 + slot * 45, 0),
			Mod.create_vector(250, 60, 0),
			Mod.UIAnchor.TopRight,
			Mod.get_ui_root(),
			true,
			8,
			Mod.create_vector(1, 1, 1),
			1,
			Mod.UIBgFill.Blur,
			message,
			30,
			Mod.create_vector(1, 1, 1),
			1,
			Mod.UIAnchor.Center,
			target_player
		)
		if duration > 0:
			await Mod.wait(duration)
			Mod.delete_ui_widget(Mod.find_ui_widget_with_name(widget_id))

	var create_sub_text = func(widget_id: String, message, target_player, slot: int):
		Mod.add_ui_text(
			widget_id,
			Mod.create_vector(85, 270 + slot * 43, 0),
			Mod.create_vector(125, 40, 0),
			Mod.UIAnchor.TopRight,
			Mod.get_ui_root(),
			true,
			8,
			Mod.create_vector(1, 1, 1),
			1,
			Mod.UIBgFill.Blur,
			message,
			20,
			Mod.create_vector(1, 1, 1),
			1,
			Mod.UIAnchor.Center,
			target_player
		)
		if duration > 0:
			await Mod.wait(duration)
			Mod.delete_ui_widget(Mod.find_ui_widget_with_name(widget_id))

	var create_notification_function = create_header if custom < 1 else create_sub_text

	if target:
		if Mod.is_type(target, Mod.Types.Player):
			var widget_id = str(custom) + str(target)
			create_notification_function.call(widget_id, msg, target, custom)
		elif Mod.is_type(target, Mod.Types.Team):
			var team_mates = get_players_in_team(target)
			for player in team_mates:
				var widget_id = str(custom) + str(player)
				create_notification_function.call(widget_id, msg, player, custom)
	else:
		var all_players = Mod.all_players()
		var n = Mod.count_of(all_players)
		for i in range(n):
			var player = Mod.value_in_array(all_players, i)
			var widget_id = str(custom) + str(player)
			create_notification_function.call(widget_id, msg, player, custom)

# Show event game mode message
static func show_event_game_mode_message(event, target = null):
	var makeshift_display = func(message, display_target = null):
		var widget_id = "GameModeMessage"
		if display_target:
			Mod.add_ui_text(
				widget_id,
				Mod.create_vector(0, 0, 0),
				Mod.create_vector(2500, 80, 0),
				Mod.UIAnchor.TopCenter,
				Mod.get_ui_root(),
				true,
				8,
				Mod.create_vector(1, 1, 1),
				1,
				Mod.UIBgFill.Blur,
				message,
				30,
				Mod.create_vector(1, 1, 1),
				1,
				Mod.UIAnchor.Center,
				display_target
			)
		else:
			Mod.add_ui_text(
				widget_id,
				Mod.create_vector(0, 0, 0),
				Mod.create_vector(2500, 80, 0),
				Mod.UIAnchor.TopCenter,
				Mod.get_ui_root(),
				true,
				8,
				Mod.create_vector(1, 1, 1),
				1,
				Mod.UIBgFill.Blur,
				message,
				30,
				Mod.create_vector(1, 1, 1),
				1,
				Mod.UIAnchor.Center
			)

		await Mod.wait(6)
		Mod.delete_ui_widget(Mod.find_ui_widget_with_name(widget_id))

	if target:
		makeshift_display.call(event, target)
	else:
		makeshift_display.call(event)

# Show highlighted game mode message
static func show_highlighted_game_mode_message(event, target = null):
	if target:
		Mod.display_highlighted_world_log_message(event, target)
	else:
		Mod.display_highlighted_world_log_message(event)

# Show notification message
static func show_notification_message(msg, target = null):
	if target:
		Mod.display_notification_message(msg, target)
	else:
		Mod.display_notification_message(msg)

# Clear all custom notification messages for a player
static func clear_all_custom_notification_messages(target_player):
	clear_custom_notification_message(Mod.CustomNotificationSlots.HeaderText, target_player)
	clear_custom_notification_message(Mod.CustomNotificationSlots.MessageText1, target_player)
	clear_custom_notification_message(Mod.CustomNotificationSlots.MessageText2, target_player)
	clear_custom_notification_message(Mod.CustomNotificationSlots.MessageText3, target_player)
	clear_custom_notification_message(Mod.CustomNotificationSlots.MessageText4, target_player)

# Clear custom notification message
static func clear_custom_notification_message(custom, target = null):
	if target:
		if Mod.is_type(target, Mod.Types.Player):
			Mod.delete_ui_widget(Mod.find_ui_widget_with_name(str(custom) + str(target)))
		elif Mod.is_type(target, Mod.Types.Team):
			var team_members = get_players_in_team(target)
			for player in team_members:
				Mod.delete_ui_widget(Mod.find_ui_widget_with_name(str(custom) + str(player)))
	else:
		var all_players = Mod.all_players()
		var n = Mod.count_of(all_players)
		for i in range(n):
			var player = Mod.value_in_array(all_players, i)
			Mod.delete_ui_widget(Mod.find_ui_widget_with_name(str(custom) + str(player)))
