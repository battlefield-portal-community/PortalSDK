extends RefCounted
class_name ModLib

# Utility library for BF Portal mod development
# Converted from TypeScript modlib/index.ts

# String concatenation
static func Concat(s1: String, s2: String) -> String:
	return s1 + s2

# Logical AND for multiple boolean conditions
static func And(conditions: Array) -> bool:
	for cond in conditions:
		if not cond:
			return false
	return true

# Logical AND for multiple condition functions
static func AndFn(condition_functions: Array[Callable]) -> bool:
	for cond_fn in condition_functions:
		if not cond_fn.call():
			return false
	return true

# Get player ID
static func get_player_id(player) -> int:
	return Mod.GetObjId(player)

# Get team ID
static func get_team_id(team) -> int:
	return Mod.GetObjId(team)

# Convert mod.Array to GDScript Array
static func convert_array(mod_array) -> Array:
	var result = []
	var n = Mod.CountOf(mod_array)
	for i in range(n):
		var current_element = Mod.ValueInArray(mod_array, i)
		result.append(current_element)
	return result

# Filter array based on condition
static func filtered_array(mod_array, condition: Callable):
	var arr = convert_array(mod_array)
	var result = Mod.EmptyArray()
	for element in arr:
		if condition.call(element):
			Mod.AppendToArray(result, element)
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
	return Mod.Equals(a, b)

# Wait until condition is met or timeout
static func wait_until(delay: float, condition: Callable):
	var delta_count = 10
	var delta_wait = delay / delta_count
	for t in range(delta_count):
		if not condition.call():
			break
		await Mod.Wait(delta_wait)

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
	var id = Mod.GetObjId(obj)
	return _get_object_condition(id, capture_point_conditions, n)

# Get MCOM condition state
static func get_mcom_condition(obj, n: int) -> ConditionState:
	var id = Mod.GetObjId(obj)
	return _get_object_condition(id, mcom_conditions, n)

# Get vehicle condition state
static func get_vehicle_condition(obj, n: int) -> ConditionState:
	var id = Mod.GetObjId(obj)
	return _get_object_condition(id, vehicle_conditions, n)

# Get global condition state
static func get_global_condition(n: int) -> ConditionState:
	return global_conditions.get_condition_state(n)

# Get all players in a team
static func getPlayersInTeam(team) -> Array:
	var allPlayers = Mod.AllPlayers()
	var n = Mod.CountOf(allPlayers)
	var teamMembers = []

	for i in range(n):
		var player = Mod.ValueInArray(allPlayers, i)
		if Mod.GetTeam(player) == team:
			teamMembers.append(player)

	return teamMembers

#-----------------------------------------------------------------------------------------------
# UI Helper Functions
#-----------------------------------------------------------------------------------------------

const __cUniqueName = "----uniquename----"

# Convert array or Vector3 to mod Vector
static func __asModVector(param):
	if param is Array:
		var z = 0 if param.size() == 2 else param[2]
		return Mod.CreateVector(param[0], param[1], z)
	else:
		return param

# Convert string or mod.Message to mod.Message
static func __asModMessage(param):
	if param is String:
		return Mod.Message(param)
	return param

# Fill in default UI arguments
static func __fillInDefaultArgs(params: Dictionary):
	if not params.has("name"):
		params["name"] = ""
	if not params.has("position"):
		params["position"] = Mod.CreateVector(0, 0, 0)
	if not params.has("size"):
		params["size"] = Mod.CreateVector(100, 100, 0)
	if not params.has("anchor"):
		params["anchor"] = Mod.UIAnchor.TopLeft
	if not params.has("parent"):
		params["parent"] = Mod.GetUIRoot()
	if not params.has("visible"):
		params["visible"] = true
	if not params.has("padding"):
		params["padding"] = 0 if params.get("type") == "Container" else 8
	if not params.has("bg_color"):
		params["bg_color"] = Mod.CreateVector(0.25, 0.25, 0.25)
	if not params.has("bg_alpha"):
		params["bg_alpha"] = 0.5
	if not params.has("bg_fill"):
		params["bg_fill"] = Mod.UIBgFill.Solid

# Set widget name and get widget reference
static func __setNameAndGetWidget(unique_name: String, params: Dictionary):
	var widget = Mod.FindUIWidgetWithName(unique_name)
	Mod.SetUIWidgetName(widget, params["name"])
	return widget

# Add UI Container
static func __addUIContainer(params: Dictionary):
	__fillInDefaultArgs(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.AddUIContainer(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			restrict
		)
	else:
		Mod.AddUIContainer(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"]
		)

	var widget = __setNameAndGetWidget(__cUniqueName, params)

	if params.has("children"):
		for child_params in params["children"]:
			child_params["parent"] = widget
			__addUIWidget(child_params)

	return widget

# Fill in default text arguments
static func __fillInDefaultTextArgs(params: Dictionary):
	if not params.has("text_label"):
		params["text_label"] = ""
	if not params.has("text_size"):
		params["text_size"] = 0
	if not params.has("text_color"):
		params["text_color"] = Mod.CreateVector(1, 1, 1)
	if not params.has("text_alpha"):
		params["text_alpha"] = 1
	if not params.has("text_anchor"):
		params["text_anchor"] = Mod.UIAnchor.CenterLeft

# Add UI Text
static func __addUIText(params: Dictionary):
	__fillInDefaultArgs(params)
	__fillInDefaultTextArgs(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.AddUIText(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			__asModMessage(params["text_label"]),
			params["text_size"],
			__asModVector(params["text_color"]),
			params["text_alpha"],
			params["text_anchor"],
			restrict
		)
	else:
		Mod.AddUIText(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			__asModMessage(params["text_label"]),
			params["text_size"],
			__asModVector(params["text_color"]),
			params["text_alpha"],
			params["text_anchor"]
		)

	return __setNameAndGetWidget(__cUniqueName, params)

# Fill in default image arguments
static func __fillInDefaultImageArgs(params: Dictionary):
	if not params.has("image_type"):
		params["image_type"] = Mod.UIImageType.None
	if not params.has("image_color"):
		params["image_color"] = Mod.CreateVector(1, 1, 1)
	if not params.has("image_alpha"):
		params["image_alpha"] = 1

# Add UI Image
static func __addUIImage(params: Dictionary):
	__fillInDefaultArgs(params)
	__fillInDefaultImageArgs(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.AddUIImage(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["image_type"],
			__asModVector(params["image_color"]),
			params["image_alpha"],
			restrict
		)
	else:
		Mod.AddUIImage(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["image_type"],
			__asModVector(params["image_color"]),
			params["image_alpha"]
		)

	return __setNameAndGetWidget(__cUniqueName, params)

# Fill in default button arguments
static func __fillInDefaultButtonArgs(params: Dictionary):
	if not params.has("button_enabled"):
		params["button_enabled"] = true
	if not params.has("button_color_base"):
		params["button_color_base"] = Mod.CreateVector(0.7, 0.7, 0.7)
	if not params.has("button_alpha_base"):
		params["button_alpha_base"] = 1
	if not params.has("button_color_disabled"):
		params["button_color_disabled"] = Mod.CreateVector(0.2, 0.2, 0.2)
	if not params.has("button_alpha_disabled"):
		params["button_alpha_disabled"] = 0.5
	if not params.has("button_color_pressed"):
		params["button_color_pressed"] = Mod.CreateVector(0.25, 0.25, 0.25)
	if not params.has("button_alpha_pressed"):
		params["button_alpha_pressed"] = 1
	if not params.has("button_color_hover"):
		params["button_color_hover"] = Mod.CreateVector(1, 1, 1)
	if not params.has("button_alpha_hover"):
		params["button_alpha_hover"] = 1
	if not params.has("button_color_focused"):
		params["button_color_focused"] = Mod.CreateVector(1, 1, 1)
	if not params.has("button_alpha_focused"):
		params["button_alpha_focused"] = 1

# Add UI Button
static func __addUIButton(params: Dictionary):
	__fillInDefaultArgs(params)
	__fillInDefaultButtonArgs(params)
	var restrict = params.get("team_id", params.get("player_id", null))

	if restrict:
		Mod.AddUIButton(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["button_enabled"],
			__asModVector(params["button_color_base"]),
			params["button_alpha_base"],
			__asModVector(params["button_color_disabled"]),
			params["button_alpha_disabled"],
			__asModVector(params["button_color_pressed"]),
			params["button_alpha_pressed"],
			__asModVector(params["button_color_hover"]),
			params["button_alpha_hover"],
			__asModVector(params["button_color_focused"]),
			params["button_alpha_focused"],
			restrict
		)
	else:
		Mod.AddUIButton(
			__cUniqueName,
			__asModVector(params["position"]),
			__asModVector(params["size"]),
			params["anchor"],
			params["parent"],
			params["visible"],
			params["padding"],
			__asModVector(params["bg_color"]),
			params["bg_alpha"],
			params["bg_fill"],
			params["button_enabled"],
			__asModVector(params["button_color_base"]),
			params["button_alpha_base"],
			__asModVector(params["button_color_disabled"]),
			params["button_alpha_disabled"],
			__asModVector(params["button_color_pressed"]),
			params["button_alpha_pressed"],
			__asModVector(params["button_color_hover"]),
			params["button_alpha_hover"],
			__asModVector(params["button_color_focused"]),
			params["button_alpha_focused"]
		)

	return __setNameAndGetWidget(__cUniqueName, params)

# Add UI Widget based on type
static func __addUIWidget(params):
	if params == null:
		return null

	match params.get("type"):
		"Container":
			return __addUIContainer(params)
		"Text":
			return __addUIText(params)
		"Image":
			return __addUIImage(params)
		"Button":
			return __addUIButton(params)

	return null

# Parse UI from parameter dictionaries
static func ParseUI(params_array: Array):
	var widget = null
	for params in params_array:
		widget = __addUIWidget(params)
	return widget

# Display custom notification message
static func DisplayCustomNotificationMessage(msg, custom, duration: float, target = null):
	var CreateHeader = func(widget_id: String, message, target_player, slot: int):
		Mod.AddUIText(
			widget_id,
			Mod.CreateVector(50, 250 + slot * 45, 0),
			Mod.CreateVector(250, 60, 0),
			Mod.UIAnchor.TopRight,
			Mod.GetUIRoot(),
			true,
			8,
			Mod.CreateVector(1, 1, 1),
			1,
			Mod.UIBgFill.Blur,
			message,
			30,
			Mod.CreateVector(1, 1, 1),
			1,
			Mod.UIAnchor.Center,
			target_player
		)
		if duration > 0:
			await Mod.Wait(duration)
			Mod.DeleteUIWidget(Mod.FindUIWidgetWithName(widget_id))

	var CreateSubText = func(widget_id: String, message, target_player, slot: int):
		Mod.AddUIText(
			widget_id,
			Mod.CreateVector(85, 270 + slot * 43, 0),
			Mod.CreateVector(125, 40, 0),
			Mod.UIAnchor.TopRight,
			Mod.GetUIRoot(),
			true,
			8,
			Mod.CreateVector(1, 1, 1),
			1,
			Mod.UIBgFill.Blur,
			message,
			20,
			Mod.CreateVector(1, 1, 1),
			1,
			Mod.UIAnchor.Center,
			target_player
		)
		if duration > 0:
			await Mod.Wait(duration)
			Mod.DeleteUIWidget(Mod.FindUIWidgetWithName(widget_id))

	var createNotificationFunction = CreateHeader if custom < 1 else CreateSubText

	if target:
		if Mod.IsType(target, Mod.Types.Player):
			var widget_id = str(custom) + str(target)
			createNotificationFunction.call(widget_id, msg, target, custom)
		elif Mod.IsType(target, Mod.Types.Team):
			var teamMates = getPlayersInTeam(target)
			for player in teamMates:
				var widget_id = str(custom) + str(player)
				createNotificationFunction.call(widget_id, msg, player, custom)
	else:
		var allPlayers = Mod.AllPlayers()
		var n = Mod.CountOf(allPlayers)
		for i in range(n):
			var player = Mod.ValueInArray(allPlayers, i)
			var widget_id = str(custom) + str(player)
			createNotificationFunction.call(widget_id, msg, player, custom)

# Show event game mode message
static func ShowEventGameModeMessage(event, target = null):
	var MakeShiftDisplayGameModeMessage = func(message, display_target = null):
		var widget_id = "GameModeMessage"
		if display_target:
			Mod.AddUIText(
				widget_id,
				Mod.CreateVector(0, 0, 0),
				Mod.CreateVector(2500, 80, 0),
				Mod.UIAnchor.TopCenter,
				Mod.GetUIRoot(),
				true,
				8,
				Mod.CreateVector(1, 1, 1),
				1,
				Mod.UIBgFill.Blur,
				message,
				30,
				Mod.CreateVector(1, 1, 1),
				1,
				Mod.UIAnchor.Center,
				display_target
			)
		else:
			Mod.AddUIText(
				widget_id,
				Mod.CreateVector(0, 0, 0),
				Mod.CreateVector(2500, 80, 0),
				Mod.UIAnchor.TopCenter,
				Mod.GetUIRoot(),
				true,
				8,
				Mod.CreateVector(1, 1, 1),
				1,
				Mod.UIBgFill.Blur,
				message,
				30,
				Mod.CreateVector(1, 1, 1),
				1,
				Mod.UIAnchor.Center
			)

		await Mod.Wait(6)
		Mod.DeleteUIWidget(Mod.FindUIWidgetWithName(widget_id))

	if target:
		MakeShiftDisplayGameModeMessage.call(event, target)
	else:
		MakeShiftDisplayGameModeMessage.call(event)

# Show highlighted game mode message
static func ShowHighlightedGameModeMessage(event, target = null):
	if target:
		Mod.DisplayHighlightedWorldLogMessage(event, target)
	else:
		Mod.DisplayHighlightedWorldLogMessage(event)

# Show notification message
static func ShowNotificationMessage(msg, target = null):
	if target:
		Mod.DisplayNotificationMessage(msg, target)
	else:
		Mod.DisplayNotificationMessage(msg)

# Clear all custom notification messages for a player
static func ClearAllCustomNotificationMessages(target_player):
	ClearCustomNotificationMessage(Mod.CustomNotificationSlots.HeaderText, target_player)
	ClearCustomNotificationMessage(Mod.CustomNotificationSlots.MessageText1, target_player)
	ClearCustomNotificationMessage(Mod.CustomNotificationSlots.MessageText2, target_player)
	ClearCustomNotificationMessage(Mod.CustomNotificationSlots.MessageText3, target_player)
	ClearCustomNotificationMessage(Mod.CustomNotificationSlots.MessageText4, target_player)

# Clear custom notification message
static func ClearCustomNotificationMessage(custom, target = null):
	if target:
		if Mod.IsType(target, Mod.Types.Player):
			Mod.DeleteUIWidget(Mod.FindUIWidgetWithName(str(custom) + str(target)))
		elif Mod.IsType(target, Mod.Types.Team):
			var teamMembers = getPlayersInTeam(target)
			for player in teamMembers:
				Mod.DeleteUIWidget(Mod.FindUIWidgetWithName(str(custom) + str(player)))
	else:
		var allPlayers = Mod.AllPlayers()
		var n = Mod.CountOf(allPlayers)
		for i in range(n):
			var player = Mod.ValueInArray(allPlayers, i)
			Mod.DeleteUIWidget(Mod.FindUIWidgetWithName(str(custom) + str(player)))
