class_name GenerateLibraryScript
extends MainLoop

const _LIBRARY_PATH = "res://addons/scene-library/scene_library.json"


func _process(_delta: float):
	var library_path = generate_library()
	if library_path == "":
		printerr("Failed to generate library")
	else:
		print("Successfully generated library to %s" % library_path)
	return true

## Generate a library from asset types
## Returns path if successful, otherwise empty string
static func generate_library() -> String:
	var new_library: Dictionary[String, Dictionary] = {}

	var all_levels = _get_all_levels()
	if all_levels.size() == 0:
		printerr("Expected levels to exist in level_info. Cannot generate library without them.")
		return ""
	for level in all_levels:
		var collection: Dictionary[StringName, Variant] = {}
		collection["name"] = level
		collection["assets"] = []
		new_library[level] = collection

	var asset_types = _get_asset_types()
	var objects: Array[String] = _get_all_file_paths("res://objects")
	for object in objects:
		if object.get_extension() != "tscn":
			continue
		var object_name = object.get_file().get_basename()
		if object_name in asset_types:
			var asset_type = asset_types[object_name]
			var id: int = SceneLibrary.get_or_create_valid_uid(object)
			var new_asset: Dictionary[StringName, Variant] = SceneLibrary.create_asset_no_thumbnail(id, ResourceUID.id_to_text(id), object)
			var add_to_every_level = true
			if "levelRestrictions" in asset_type:
				var levels = asset_type["levelRestrictions"]
				if levels.size() > 0:
					add_to_every_level = false
					for level in levels:
						var collection = new_library.get(level, null)
						if collection != null:
							collection.get("assets").append(new_asset)
							
			if add_to_every_level:
				# no restrictions aka add to every collection
				for collection in new_library:
					var assets = new_library[collection].get("assets")
					assets.append(new_asset)
	
	var addon_types: Array[String] = _get_all_file_paths("res://addons/bf_portal/portal_tools/types")
	for addon_type in addon_types:
		if addon_type.get_extension() != "tscn":
			continue
		var id: int = SceneLibrary.get_or_create_valid_uid(addon_type)
		var new_asset: Dictionary[StringName, Variant] = SceneLibrary.create_asset_no_thumbnail(id, ResourceUID.id_to_text(id), addon_type)
		for collection in new_library:
			var assets = new_library[collection].get("assets")
			assets.append(new_asset)

	var new_library_as_array: Array[Dictionary] = []
	for collection in new_library:
		var moved_collection: Dictionary[StringName, Variant] = new_library[collection]
		new_library_as_array.append(moved_collection)

	var serial = JSON.stringify(new_library_as_array, "\t")
	var json = FileAccess.open(_LIBRARY_PATH, FileAccess.WRITE)
	json.store_string(serial)
	json.close()
	return _LIBRARY_PATH


static func _get_all_levels() -> Array[String]:
	var config = PortalPlugin.read_config()
	if not "fbExportData" in config:
		return []

	var fb_data = config["fbExportData"]
	var level_info_path = fb_data + "/level_info.json"
	var file = FileAccess.open(level_info_path, FileAccess.READ)
	if file == null:
		return []
	var contents = file.get_as_text()
	file.close()

	var level_info: Dictionary = JSON.parse_string(contents)
	var levels: Array[String] = []
	for level_name in level_info:
		levels.append(level_name)
	return levels


static func _get_asset_types() -> Dictionary[String, Variant]:
	var config = PortalPlugin.read_config()
	if not "fbExportData" in config:
		return {}

	var fb_data = config["fbExportData"]
	var asset_types_path = fb_data + "/asset_types.json"
	var file = FileAccess.open(asset_types_path, FileAccess.READ)
	if file == null:
		return {}
	var contents = file.get_as_text()
	file.close()
	var asset_types_object = JSON.parse_string(contents)
	if "AssetTypes" not in asset_types_object:
		return {}

	var out: Dictionary[String, Variant] = {}
	var asset_types: Array[Variant] = asset_types_object["AssetTypes"]
	for asset_type in asset_types:
		if "type" in asset_type:
			out[asset_type["type"]] = asset_type
	return out


static func _get_all_file_paths(path: String) -> Array[String]:
	var file_paths: Array[String] = []
	var dir = DirAccess.open(path)
	if dir == null:
		return []
	dir.list_dir_begin()
	var file_name = dir.get_next()
	while file_name != "":
		var file_path = path + "/" + file_name
		if dir.current_is_dir():
			file_paths += _get_all_file_paths(file_path)
		else:
			file_paths.append(file_path)
		file_name = dir.get_next()
	return file_paths
