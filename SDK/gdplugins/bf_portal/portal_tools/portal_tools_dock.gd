@tool
extends Control

var portal_tools_plugin  # cannot type hint because cyclic

var _output_dir: String = ""
var _current_export_level_path: String = ""

var _config: Dictionary = {}
var _thread = Thread.new()
var _setup_dialog: AcceptDialog
var _levels: Array[String] = []

@onready var setup: Button = %Setup_Button
@onready var export_level: Button = %ExportLevel_Button
@onready var open_exports: Button = %OpenExports_Button
@onready var export_level_label: Label = %ExportLevel_Label


func _ready() -> void:
	_config = PortalPlugin.read_config()
	if _config.size() == 0:
		return

	_output_dir = _config["export"]

	if not _config["setupEnabled"]:
		setup.disabled = true
		setup.tooltip_text = "Setup has been disabled. Check the config for any misconfiguration"
	else:
		setup.disabled = false
		setup.tooltip_text = "Setup python and virtual environment"

	_levels = _get_all_levels(_config)

	if not setup.pressed.is_connected(_setup):
		setup.pressed.connect(_setup)
	if not export_level.pressed.is_connected(_export_levels):
		export_level.pressed.connect(_export_levels)
	if not open_exports.pressed.is_connected(_on_open_exports):
		open_exports.pressed.connect(_on_open_exports)


func _process(_delta: float) -> void:
	if not _thread.is_alive() and _thread.is_started():
		_thread.wait_to_finish()


func is_scene_a_level(scene: Node) -> bool:
	if scene is not Node3D:
		return false
	return scene.name in _levels


func change_scene(scene: Node) -> void:
	if not is_scene_a_level(scene):
		return
	var path = scene.scene_file_path
	_current_export_level_path = path
	var level_name = path.get_file().rstrip(".tscn")
	export_level_label.text = level_name
	export_level.disabled = false


func _setup() -> void:
	if not _config["setupEnabled"]:
		return

	portal_tools_plugin.show_log_panel()

	# forced to be on main thread
	print("Generating object library")
	var library_path = GenerateLibraryScript.generate_library()
	var scene_library: SceneLibrary = portal_tools_plugin.get_scene_library_instance()
	if scene_library != null:
		scene_library.load_library(library_path)

	var platform = OS.get_name()
	if platform == "Windows":
		_thread.start(_setup_work_windows)
		_setup_dialog = AcceptDialog.new()
		_setup_dialog.title = "Setup"
		_setup_dialog.dialog_text = "Please wait while setup finishes..."
		_setup_dialog.get_ok_button().visible = false
		_setup_dialog.dialog_close_on_escape = false
		EditorInterface.popup_dialog_centered(_setup_dialog)
	else:
		var dialog = AcceptDialog.new()  # not member variable because simply one-off
		var msg = "Setup has not been implemented for your platform: %s" % platform
		dialog.dialog_text = msg
		EditorInterface.popup_dialog_centered(dialog)
		printerr(msg)


func _setup_work_windows() -> void:
	var output = []
	var exit_code = 0
	var venv_path: String = _config["venv"]

	if DirAccess.dir_exists_absolute(venv_path):
		print("Cleaning previous virtual environment")
		OS.execute("powershell.exe", ["-Command", "Remove-Item -Recurse -Force %s -ErrorAction SilentlyContinue" % venv_path], output, true)
		if DirAccess.dir_exists_absolute(venv_path):
			printerr(output)
			printerr("Failed to cleanup previous setup")
			call_deferred("_setup_error", "Failed to cleanup previous setup")
			return
		output.pop_back()

	print("Creating virtual environment...")
	var python = "%s/python.exe" % _config["python"]
	exit_code = OS.execute(python, ["-m", "venv", venv_path], output, true)
	if exit_code != 0:
		printerr(output)
		printerr("Failed to create virtual environment")
		call_deferred("_setup_error", "Failed to create virtual environment")
		return
	output.pop_back()

	print("Installing packages to virtual environment...")
	var python_venv = "%s/Scripts/python.exe" % venv_path
	exit_code = OS.execute(python_venv, ["-m", "pip", "install", "--upgrade", "pip"], output, true)
	if exit_code != 0:
		printerr(output)
		printerr("Upgrading pip failed")
		call_deferred("_setup_error", "Upgrading pip failed")
		return
	output.pop_back()

	# requirements.txt uses relative paths and cannot change cwd with OS.execute yet so need pwsh here
	var venv_path_split = venv_path.rsplit("venv", true, 1)
	var base_path = venv_path_split[0] if venv_path_split.size() > 1 else "."
	var args = "cd %s ; venv/Scripts/python.exe -m pip install -r ./requirements.txt" % base_path
	exit_code = OS.execute("powershell.exe", ["-Command", args], output, true)
	if exit_code != 0:
		print(output)
		printerr("Installing requirements failed")
		call_deferred("_setup_error", "Installing requirements failed")
		return
	print("Completed setup")
	call_deferred("_setup_success", "Completed setup")


func _setup_error(msg: String = "") -> void:
	_setup_dialog.dialog_text = "An error occurred when setting up:%s\nSee Output window for more details" % ("\n%s\n" % msg if msg else "")
	_setup_dialog.get_ok_button().visible = true


func _setup_success(msg: String = "") -> void:
	_setup_dialog.dialog_text = msg
	_setup_dialog.get_ok_button().visible = true


func _export_levels() -> void:
	if OS.get_name() != "Windows":
		return

	var dialog = AcceptDialog.new()
	var output = []
	var python_venv = "%s/Scripts/python.exe" % _config["venv"]
	if not FileAccess.file_exists(python_venv):
		portal_tools_plugin.show_log_panel()
		var msg = "Cannot export level when python is not in a virtual environment. Has setup been ran yet?"
		printerr(msg)
		dialog.dialog_text = msg
		EditorInterface.popup_dialog_centered(dialog)
		return
	var export_tscn = "%s/src/gdconverter/export_tscn.py" % _config["gdconverter"]
	var scene_path = ProjectSettings.globalize_path(_current_export_level_path)
	var level_name = scene_path.get_file().get_basename()
	EditorInterface.save_scene()
	var fb_export_dir = _config["fbExportData"]

	var dialog_text = ""
	var exit_code = OS.execute(python_venv, [export_tscn, scene_path, fb_export_dir, _output_dir], output, true)
	if exit_code != 0:
		dialog.title = "Error"
		dialog_text = "Failed to export %s\n" % level_name
		var err: String = (output.pop_back() as String).replace("\r\n", "\n").strip_edges()
		if err:
			var err_lines = err.split("\n", true)
			var line_count_limit = 15
			if err_lines.size() > line_count_limit:
				var err_truncated = err_lines.slice(0, line_count_limit)
				dialog_text += "\n".join(err_truncated)
				dialog_text += "\n...\n(see Output window for more details)"
			else:
				dialog_text += err
			portal_tools_plugin.show_log_panel()
			printerr(err)
	else:
		dialog.title = "Success"
		dialog_text = "Successfully exported %s" % level_name
	dialog.dialog_text = dialog_text
	EditorInterface.popup_dialog_centered(dialog)


func _on_open_exports() -> void:
	if not DirAccess.dir_exists_absolute(_output_dir):
		DirAccess.make_dir_recursive_absolute(_output_dir)

	if _current_export_level_path:
		var file = _current_export_level_path.get_file()
		var json_file = file.replace(".tscn", ".json")
		var supposed_path = _output_dir + "/" + json_file
		if FileAccess.file_exists(supposed_path):
			OS.shell_show_in_file_manager(supposed_path)
			return
	OS.shell_show_in_file_manager(_output_dir)


func _get_all_levels(config: Dictionary) -> Array[String]:
	if not "fbExportData" in config:
		return []

	var fb_data = config["fbExportData"]
	var level_info_path = fb_data + "/level_info.json"
	var file = FileAccess.open(level_info_path, FileAccess.READ)
	if file == null:
		printerr("Unable to read path: %s" % level_info_path)
		return []
	var contents = file.get_as_text()

	var level_info: Dictionary = JSON.parse_string(contents)
	var levels: Array[String] = []
	for level_name in level_info:
		levels.append(level_name)
	return levels
