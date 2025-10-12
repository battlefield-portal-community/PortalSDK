@tool
extends Control

## Portal Tools dock for managing Python setup and level exports.

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
	_levels = _get_all_levels(_config)
	_setup_ui_state()
	_connect_signals()


func _process(_delta: float) -> void:
	if not _thread.is_alive() and _thread.is_started():
		_thread.wait_to_finish()


## Checks if the given scene node is a valid level.
func is_scene_a_level(scene: Node) -> bool:
	if scene is not Node3D:
		return false
	return scene.name in _levels


## Updates the UI when the scene changes to a level.
func change_scene(scene: Node) -> void:
	if not is_scene_a_level(scene):
		return
	var path = scene.scene_file_path
	_current_export_level_path = path
	var level_name = path.get_file().rstrip(".tscn")
	export_level_label.text = level_name
	export_level.disabled = false


## Configures the initial UI state based on config.
func _setup_ui_state() -> void:
	if not _config["setupEnabled"]:
		setup.disabled = true
		setup.tooltip_text = "Setup has been disabled. Check the config for any misconfiguration"
	else:
		setup.disabled = false
		setup.tooltip_text = "Setup python and virtual environment"


## Connects all button signals.
func _connect_signals() -> void:
	if not setup.pressed.is_connected(_setup):
		setup.pressed.connect(_setup)
	if not export_level.pressed.is_connected(_export_levels):
		export_level.pressed.connect(_export_levels)
	if not open_exports.pressed.is_connected(_on_open_exports):
		open_exports.pressed.connect(_on_open_exports)


## Initiates the setup process for Python and virtual environment.
func _setup() -> void:
	if not _config["setupEnabled"]:
		return

	portal_tools_plugin.show_log_panel()

	# Generate object library on main thread
	print("Generating object library")
	var library_path = GenerateLibraryScript.generate_library()
	var scene_library: SceneLibrary = portal_tools_plugin.get_scene_library_instance()
	if scene_library != null:
		scene_library.load_library(library_path)

	var platform = OS.get_name()
	var setup_callable: Callable
	
	match platform:
		"Windows":
			setup_callable = _setup_work_windows
		"macOS", "Linux":
			setup_callable = _setup_work_unix
		_:
			_show_error_dialog("Setup has not been implemented for your platform: %s" % platform)
			return
	
	_thread.start(setup_callable)
	_show_setup_dialog()


## Shows a setup in-progress dialog.
func _show_setup_dialog() -> void:
	_setup_dialog = AcceptDialog.new()
	_setup_dialog.title = "Setup"
	_setup_dialog.dialog_text = "Please wait while setup finishes..."
	_setup_dialog.get_ok_button().visible = false
	_setup_dialog.dialog_close_on_escape = false
	EditorInterface.popup_dialog_centered(_setup_dialog)


## Shows a one-off error dialog with the given message.
func _show_error_dialog(msg: String) -> void:
	var dialog = AcceptDialog.new()
	dialog.dialog_text = msg
	EditorInterface.popup_dialog_centered(dialog)
	printerr(msg)


## Windows-specific setup work performed in a background thread.
func _setup_work_windows() -> void:
	var venv_path: String = _config["venv"]
	var python_path: String = "%s/python.exe" % _config["python"]
	var python_venv: String = "%s/Scripts/python.exe" % venv_path
	
	# Check Python version first
	if not _check_python_version(python_path):
		return
	
	# Clean up previous environment
	if not _cleanup_venv_windows(venv_path):
		return
	
	# Create virtual environment
	if not _create_venv(python_path, venv_path):
		return
	
	# Upgrade pip
	if not _upgrade_pip(python_venv):
		return
	
	# Install requirements
	var venv_path_split = venv_path.rsplit("venv", true, 1)
	var base_path = venv_path_split[0] if venv_path_split.size() > 1 else "."
	var args = "cd %s ; venv/Scripts/python.exe -m pip install -r ./requirements.txt" % base_path
	var output = []
	var exit_code = OS.execute("powershell.exe", ["-Command", args], output, true)
	if exit_code != 0:
		_print_output(output)
		printerr("Installing requirements failed")
		call_deferred("_setup_error", "Installing requirements failed")
		return
	
	print("Completed setup")
	call_deferred("_setup_success", "Completed setup")


## Unix-specific (macOS/Linux) setup work performed in a background thread.
func _setup_work_unix() -> void:
	var venv_path = _normalize_unix_path(_config["venv"])
	var python_path = _resolve_python_executable(_config["python"])
	var python_venv = "%s/bin/python" % venv_path
	
	print("Using venv path: %s" % venv_path)
	print("Using python: %s" % python_path)
	
	# Check Python version first
	if not _check_python_version(python_path):
		return
	
	# Clean up previous environment
	if not _cleanup_venv_unix(venv_path):
		return
	
	# Create virtual environment
	if not _create_venv(python_path, venv_path):
		return
	
	# Upgrade pip
	if not _upgrade_pip(python_venv):
		return
	
	# Install requirements
	var venv_path_split = venv_path.rsplit("venv", true, 1)
	var base_path = venv_path_split[0] if venv_path_split.size() > 1 else "."
	if base_path.ends_with("/"):
		base_path = base_path.substr(0, base_path.length() - 1)
	
	var cmd = "cd '%s' && '%s' -m pip install -r ./requirements.txt" % [base_path, python_venv]
	var output = []
	var exit_code = OS.execute("sh", ["-c", cmd], output, true)
	if exit_code != 0:
		_print_output(output)
		printerr("Installing requirements failed")
		call_deferred("_setup_error", "Installing requirements failed")
		return
	
	print("Completed setup")
	call_deferred("_setup_success", "Completed setup")


## Normalizes Unix paths to absolute paths.
func _normalize_unix_path(path: String) -> String:
	if path.begins_with("../") or path.begins_with("./") or not path.begins_with("/"):
		var project_dir = ProjectSettings.globalize_path("res://")
		return project_dir.path_join(path).simplify_path()
	return path


## Resolves the Python executable path for Unix systems.
func _resolve_python_executable(python_config: String) -> String:
	# Check if config path is a file
	if FileAccess.file_exists(python_config):
		return python_config
	# Check if config path + /bin/python3 exists (for venv/conda)
	if FileAccess.file_exists(python_config + "/bin/python3"):
		return python_config + "/bin/python3"
	# Check if config path + /python3 exists
	if FileAccess.file_exists(python_config + "/python3"):
		return python_config + "/python3"
	# Check if config path + /python exists
	if FileAccess.file_exists(python_config + "/python"):
		return python_config + "/python"
	# Fall back to system python3
	print("Python not found at configured path, trying system python3")
	return "python3"


## Checks if the Python version meets the minimum requirement (3.11+).
func _check_python_version(python_path: String) -> bool:
	const MIN_MAJOR = 3
	const MIN_MINOR = 11
	
	print("Checking Python version...")
	var output = []
	var exit_code = OS.execute(python_path, ["--version"], output, true)
	
	if exit_code != 0:
		printerr("Failed to check Python version")
		_print_output(output)
		call_deferred("_setup_error", "Failed to check Python version")
		return false
	
	# Parse version from output (format: "Python 3.11.5" or similar)
	if output.size() > 0:
		var version_string: String = output[0]
		print("Found: %s" % version_string.strip_edges())
		
		# Extract version numbers using regex
		var regex = RegEx.new()
		regex.compile("Python (\\d+)\\.(\\d+)")
		var result = regex.search(version_string)
		
		if result:
			var major = result.get_string(1).to_int()
			var minor = result.get_string(2).to_int()
			
			if major < MIN_MAJOR or (major == MIN_MAJOR and minor < MIN_MINOR):
				var error_msg = "Python %d.%d or higher is required, but found Python %d.%d" % [MIN_MAJOR, MIN_MINOR, major, minor]
				printerr(error_msg)
				call_deferred("_setup_error", error_msg)
				return false
			
			print("Python version check passed: %d.%d" % [major, minor])
			return true
	
	printerr("Failed to parse Python version")
	call_deferred("_setup_error", "Failed to parse Python version")
	return false


## Cleans up the virtual environment on Windows.
func _cleanup_venv_windows(venv_path: String) -> bool:
	if not DirAccess.dir_exists_absolute(venv_path):
		return true
	
	print("Cleaning previous virtual environment")
	var output = []
	OS.execute("powershell.exe", ["-Command", "Remove-Item -Recurse -Force %s -ErrorAction SilentlyContinue" % venv_path], output, true)
	if DirAccess.dir_exists_absolute(venv_path):
		_print_output(output)
		printerr("Failed to cleanup previous setup")
		call_deferred("_setup_error", "Failed to cleanup previous setup")
		return false
	return true


## Cleans up the virtual environment on Unix systems.
func _cleanup_venv_unix(venv_path: String) -> bool:
	if not DirAccess.dir_exists_absolute(venv_path):
		return true
	
	print("Cleaning previous virtual environment")
	var output = []
	OS.execute("rm", ["-rf", venv_path], output, true)
	if DirAccess.dir_exists_absolute(venv_path):
		_print_output(output)
		printerr("Failed to cleanup previous setup")
		call_deferred("_setup_error", "Failed to cleanup previous setup")
		return false
	return true


## Creates a Python virtual environment.
func _create_venv(python_path: String, venv_path: String) -> bool:
	print("Creating virtual environment...")
	var output = []
	var exit_code = OS.execute(python_path, ["-m", "venv", venv_path], output, true)
	if exit_code != 0:
		_print_output(output)
		printerr("Failed to create virtual environment")
		call_deferred("_setup_error", "Failed to create virtual environment")
		return false
	return true


## Upgrades pip in the virtual environment.
func _upgrade_pip(python_venv: String) -> bool:
	print("Installing packages to virtual environment...")
	var output = []
	var exit_code = OS.execute(python_venv, ["-m", "pip", "install", "--upgrade", "pip"], output, true)
	if exit_code != 0:
		_print_output(output)
		printerr("Upgrading pip failed")
		call_deferred("_setup_error", "Upgrading pip failed")
		return false
	return true


## Safely prints output array contents.
func _print_output(output: Array) -> void:
	if output.size() > 0:
		print(output)


## Updates the setup dialog to show an error message.
func _setup_error(msg: String = "") -> void:
	var error_msg = "An error occurred when setting up:"
	if msg:
		error_msg += "\n%s\n" % msg
	error_msg += "\nSee Output window for more details"
	_setup_dialog.dialog_text = error_msg
	_setup_dialog.get_ok_button().visible = true


## Updates the setup dialog to show a success message.
func _setup_success(msg: String = "") -> void:
	_setup_dialog.dialog_text = msg
	_setup_dialog.get_ok_button().visible = true


## Exports the current level to JSON format.
func _export_levels() -> void:
	var platform = OS.get_name()
	if platform not in ["Windows", "macOS", "Linux"]:
		return

	var python_venv = _get_venv_python_path(platform)
	if not _validate_venv_exists(python_venv):
		return
	
	var export_tscn = "%s/src/gdconverter/export_tscn.py" % _config["gdconverter"]
	var scene_path = ProjectSettings.globalize_path(_current_export_level_path)
	var level_name = scene_path.get_file().get_basename()
	var fb_export_dir = _config["fbExportData"]
	
	EditorInterface.save_scene()
	
	var output = []
	var exit_code = OS.execute(python_venv, [export_tscn, scene_path, fb_export_dir, _output_dir], output, true)
	
	_show_export_result_dialog(exit_code, level_name, output)


## Gets the path to the Python executable in the virtual environment.
func _get_venv_python_path(platform: String) -> String:
	if platform == "Windows":
		return "%s/Scripts/python.exe" % _config["venv"]
	else:  # macOS or Linux
		var venv_path = _normalize_unix_path(_config["venv"])
		return "%s/bin/python" % venv_path


## Validates that the virtual environment exists.
func _validate_venv_exists(python_venv: String) -> bool:
	if FileAccess.file_exists(python_venv):
		return true
	
	portal_tools_plugin.show_log_panel()
	var msg = "Cannot export level when python is not in a virtual environment. Has setup been ran yet?"
	printerr(msg)
	
	var dialog = AcceptDialog.new()
	dialog.dialog_text = msg
	EditorInterface.popup_dialog_centered(dialog)
	return false


## Shows the export result in a dialog.
func _show_export_result_dialog(exit_code: int, level_name: String, output: Array) -> void:
	var dialog = AcceptDialog.new()

	if exit_code == 0:
		dialog.title = "Success"
		dialog.dialog_text = "Successfully exported %s" % level_name
		EditorInterface.popup_dialog_centered(dialog)
		return

	dialog.title = "Error"
	var dialog_text = "Failed to export %s\n" % level_name

	if output.size() == 0:
		dialog.dialog_text = dialog_text
		EditorInterface.popup_dialog_centered(dialog)
		return

	var err: String = (output.back() as String).replace("\r\n", "\n").strip_edges()
	if not err:
		dialog.dialog_text = dialog_text
		EditorInterface.popup_dialog_centered(dialog)
		return

	var err_lines = err.split("\n", true)
	const MAX_ERROR_LINES = 15

	if err_lines.size() > MAX_ERROR_LINES:
		var err_truncated = err_lines.slice(0, MAX_ERROR_LINES)
		dialog_text += "\n".join(err_truncated)
		dialog_text += "\n...\n(see Output window for more details)"
	else:
		dialog_text += err

	portal_tools_plugin.show_log_panel()
	printerr(err)

	dialog.dialog_text = dialog_text
	EditorInterface.popup_dialog_centered(dialog)


## Opens the exports folder in the file manager.
func _on_open_exports() -> void:
	# Ensure we have an absolute path for the shell command
	var absolute_output_dir = _output_dir
	
	# Convert relative paths to absolute
	if not _output_dir.is_absolute_path():
		# Handle paths starting with ../ by resolving from project directory
		if _output_dir.begins_with("../") or _output_dir.begins_with("./"):
			var project_dir = ProjectSettings.globalize_path("res://")
			absolute_output_dir = project_dir.path_join(_output_dir).simplify_path()
		else:
			# Use globalize_path for res:// paths
			absolute_output_dir = ProjectSettings.globalize_path(_output_dir)
	
	print("Opening exports directory: %s" % absolute_output_dir)
	
	# Create directory if it doesn't exist
	if not DirAccess.dir_exists_absolute(absolute_output_dir):
		var err = DirAccess.make_dir_recursive_absolute(absolute_output_dir)
		if err != OK:
			printerr("Failed to create directory: %s (Error: %d)" % [absolute_output_dir, err])
			return

	# Try to open the specific exported level file if it exists
	if _current_export_level_path:
		var json_filename = _current_export_level_path.get_file().replace(".tscn", ".json")
		var exported_file_path = absolute_output_dir.path_join(json_filename)
		if FileAccess.file_exists(exported_file_path):
			print("Opening exported file: %s" % exported_file_path)
			OS.shell_show_in_file_manager(exported_file_path)
			return
	
	# Otherwise, open the exports directory
	print("Opening directory: %s" % absolute_output_dir)
	OS.shell_show_in_file_manager(absolute_output_dir)


## Retrieves all available level names from the config.
func _get_all_levels(config: Dictionary) -> Array[String]:
	if not "fbExportData" in config:
		return []

	var fb_data = config["fbExportData"]
	var level_info_path = fb_data.path_join("level_info.json")
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
