@tool
class_name BFScript extends Node

@export_tool_button("Compile")
var compile = _compile

func _enter_tree():
	TypeScriptManager.register(self)

func _exit_tree() -> void:
	TypeScriptManager.unregister(self)

func _compile():
	TypeScriptManager.action()
