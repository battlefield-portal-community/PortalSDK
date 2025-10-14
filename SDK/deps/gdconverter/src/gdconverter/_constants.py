from typing import Any

ASSET_KEY_ID = "type"
ASSET_KEY_INST_ID = "id"
ASSET_KEY_CONSTS = "constants"
ASSET_KEY_PROPS = "properties"
ASSET_KEY_DIRECTORY = "directory"
ASSET_KEY_RESTRICTIONS = "levelRestrictions"

CONST_KEY_CATEGORY = "category"
CONST_CATEGORY_SPATIAL = "spatial"
CONST_CATEGORY_WAYPOINTPATH = "waypointpath"
CONST_CATEGORY_VOLUME = "volume"
CONST_CATEGORY_POLYGON_VOLUME = "polygonvolume"
CONST_CATEGORY_OBB_VOLUME = "obbvolume"
CONST_KEY_MESH = "mesh"

PROP_KEY_ID = "name"
PROP_KEY_TYPE = "type"
PROP_KEY_REF = "ref"
PROP_KEY_VAL = "value"
PROP_KEY_DEF = "default"
PROP_KEY_MIN = "min"
PROP_KEY_MAX = "max"
PROP_KEY_SEL = "selections"
PROP_KEYS = [
    PROP_KEY_VAL,
    PROP_KEY_DEF,
    PROP_KEY_MIN,
    PROP_KEY_MAX,
    PROP_KEY_SEL,
]

PROP_INJECTED_KEYS: dict[str, Any] = {
    "name": "string",
    "transform": "transform",
    "right": "vector",
    "up": "vector",
    "front": "vector",
    "position": "vector",
    "x": "float",
    "y": "float",
    "z": "float",
    "w": "float",
}

INST_KEY_ID = "id"
INST_KEY_NAME = "name"
INST_KEY_ASSET_TYPE = "type"
INST_KEY_IGNORE = [INST_KEY_ID, INST_KEY_ASSET_TYPE, INST_KEY_NAME]
INST_KEY_TRANSFORM = ["right", "up", "front", "position"]
INST_KEY_VECTOR = ["x", "y", "z"]

TYPES_KEY_ID = "AssetTypes"
TYPES_CUSTOM_TYPES = ["CollisionPolygon3D"]

FORMAT = 3

EXT_RSRC_TYPE = {
    ".gd": "Script",
    ".fbx": "PackedScene",
    ".glb": "PackedScene",
    ".tscn": "PackedScene",
}

ASSET_CATEGORY_EXT_RSRC = {
    CONST_CATEGORY_VOLUME: ".gd",
    CONST_CATEGORY_POLYGON_VOLUME: ".tscn",
    CONST_CATEGORY_OBB_VOLUME: ".tscn",
    CONST_CATEGORY_SPATIAL: ".tscn",
}

PROJECT_FILE_NAME = "project.godot"

PROJECT_FILE_CONTENT = """; Engine configuration file.
; It's best edited using the editor UI and not directly,
; since the parameters that go here are not all obvious.
;
; Format:
;   [section] ; section goes between []
;   param=value ; assign values to parameters

config_version=5

[application]

config/name="Battlefield™ Portal Project"

[gui]

common/drop_mouse_on_gui_input_disabled=true

[physics]

common/enable_pause_aware_picking=true

[importer_defaults]

; Disabled the following for faster startup time
scene={
"animation/import": false,
"gltf/embedded_image_handling": 2,
"meshes/create_shadow_meshes": false,
"meshes/ensure_tangents": false,
"meshes/generate_lods": false
}
"""

CONFIG_WARNING_FUNC = R"""
var global_name = self.get_script().get_global_name()

func _get_configuration_warnings() -> PackedStringArray:
	var scene_root = get_tree().edited_scene_root
	if get_node(".") == scene_root:
		return []
	if not LevelValidator.is_type_in_level(global_name, scene_root):
		var levels = LevelValidator.get_level_restrictions(global_name)
		var levels_str = "\n  - ".join(levels) if levels.size() > 0 else "Any"
		var msg = "%s is not usable in %s\nValid levels include:\n  - %s" % [global_name, scene_root.name, levels_str]
		return [msg]
	return []
"""

VALIDATE_PROPERTY_FUNC = """
func _validate_property(property: Dictionary):
	if property.name == "id":
		property.usage = PROPERTY_USAGE_NO_EDITOR
"""

ATTR_KEY_IGNORE = [
    "tscn_type",
    "instance",
    "script",
    "transform",
    "shape",
]

TYPE_EXTRES = "ext_resource"
TYPE_NODE = "node"
TYPE_SCENE = "gd_scene"
TYPE_SUBRES = "sub_resource"

PROP_DATA_KEY = "_data"
PROP_PATH_PREFIX = "res://"
PROP_NODE_PATHS = "node_paths"
PROP_TYPE_NODE3D = "Node3D"
PROP_TYPE_NODE = "Node"
PROP_TYPE_PATH = "Path3D"
PROP_TYPE_CURVE = "Curve3D"
PROP_ID_WAYPOINTS = "Waypoints"
PROP_ID_CURVE = "curve"
PROP_ID_RES_LOCAL = "resource_local_to_scene"

CMPX_EXTRSRC = "ExtResource"
CMPX_SUBRSRC = "SubResource"
CMPX_NODEPATH = "NodePath"
