@tool
@icon("res://addons/bf_portal/godot_portal_logo.svg")
class_name BFScript extends Node

@export_tool_button("Compile")
var compile = _compile

func _ready():
	pass

func _process(delta: float) -> void:
	pass
	
func _enter_tree():
	TypeScriptManager.register(self)

func _exit_tree() -> void:
	TypeScriptManager.unregister(self)

func _compile():
	TypeScriptManager.action()

func get_time() -> int:
	return 0
	
func type_strings() -> Dictionary:
	return {}
