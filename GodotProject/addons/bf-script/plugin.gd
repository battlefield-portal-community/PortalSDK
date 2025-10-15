@tool
extends EditorPlugin

func _enter_tree():
	add_autoload_singleton("TypeScriptManager", "res://addons/bf-script/scripts/TypeScriptManager.gd")
	add_autoload_singleton("BFEvents", "res://addons/bf-script/scripts/BFEvents.gd")

func _exit_tree():
	remove_autoload_singleton("TypeScriptManager")
	remove_autoload_singleton("BFEvents")
