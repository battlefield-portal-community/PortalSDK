@tool
extends EditorPlugin

var singleton_name := "TypeScriptManager"
var singleton_script := preload("res://addons/bf-script/scripts/TypeScriptManager.gd")

func _enter_tree():
    add_autoload_singleton(singleton_name, singleton_script.resource_path)

func _exit_tree():
    remove_autoload_singleton(singleton_name)