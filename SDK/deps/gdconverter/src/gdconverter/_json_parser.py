import copy
import json
from collections.abc import Callable
from typing import Any

from gdconverter import _constants as const
from gdconverter import _json_scene_types as jstype
from gdconverter import _json_types as jtype
from gdconverter import _logging

# Instances in levels might have properties that are not defined in Asset files (i.e. Transform)
# They will be injected into property keys when resolving property types
# Convert types in Injected Keys from string to JsonTypes Property
for g_prop, g_val in const.PROP_INJECTED_KEYS.items():
    g_jprop = jtype.create_property(g_val)
    g_jprop.id = g_prop
    const.PROP_INJECTED_KEYS[g_prop] = g_jprop


def parse_asset_data(asset_data: dict[str, Any], custom_types: set[str], error_callback: Callable[[str], None] | None = None) -> jstype.Asset | None:
    if const.ASSET_KEY_ID not in asset_data:
        if error_callback:
            error_callback("ERROR: Asset type is missing")
        return None
    asset_id = asset_data[const.ASSET_KEY_ID]
    new_asset = jstype.Asset()
    new_asset.id = asset_id
    # Add constants and properties of asset
    if const.ASSET_KEY_CONSTS in asset_data:
        consts_data = asset_data[const.ASSET_KEY_CONSTS]
        new_asset.consts = _parse_asset_props(consts_data, custom_types, error_callback)
    if const.ASSET_KEY_PROPS in asset_data:
        props_data = asset_data[const.ASSET_KEY_PROPS]
        new_asset.props = _parse_asset_props(props_data, custom_types, error_callback)
    if const.ASSET_KEY_RESTRICTIONS in asset_data:
        new_asset.restrictions = [item.lower() for item in asset_data[const.ASSET_KEY_RESTRICTIONS]]

    # Add 'id' property which is not an asset property
    # but is needed to identify asset instances in levels
    inst_id_prop = jtype.create_property("string")
    inst_id_prop.id = const.ASSET_KEY_INST_ID
    new_asset.props[inst_id_prop.id] = inst_id_prop
    return new_asset


def parse_level(level_filepath: str) -> jstype.Level:
    def parse_obj(inst: dict[str, Any]) -> Any:
        if const.INST_KEY_ASSET_TYPE not in inst:
            return inst

        new_inst = jstype.Instance()
        new_inst.inst_type = inst[const.INST_KEY_ASSET_TYPE]
        new_inst.id = inst.get(const.INST_KEY_ID, "")
        new_inst.name = inst.get(const.INST_KEY_NAME, "")
        new_inst.props.update(inst)
        for k in const.INST_KEY_IGNORE:
            if k in new_inst.props:
                del new_inst.props[k]
        return new_inst

    level_data = json.loads(level_filepath, object_hook=parse_obj)
    return jstype.Level(level_data)


def resolve_property_types_levels(levels: dict[str, jstype.Level], assets: dict[str, jstype.Asset]) -> None:
    for level in levels.values():
        _resolve_property_types_level(level, assets)


def _parse_asset_props(props_data: list[dict[str, Any]], custom_types: set[str], error_callback: Callable[[str], None] | None = None) -> dict[str, Any]:
    props = {}
    for prop_data in props_data:
        if const.PROP_KEY_ID not in prop_data:
            if error_callback:
                error_callback("ERROR: Property type is missing")
            continue
        if const.PROP_KEY_TYPE not in prop_data:
            if error_callback:
                error_callback("ERROR: Property type is missing")
            continue
        prop_id = prop_data[const.PROP_KEY_ID]
        prop_type = prop_data[const.PROP_KEY_TYPE]
        new_prop = jtype.create_property(prop_type, custom_types=custom_types)
        new_prop.id = prop_id
        for key in const.PROP_KEYS:
            if key not in prop_data:
                continue
            if not hasattr(new_prop, key):
                _logging.log_warning("WARNING: Property type " + new_prop.type + " does not contain field " + key)
            setattr(new_prop, key, prop_data[key])
        props[prop_id] = new_prop
    return props


def _resolve_property(value: Any, prop_type: jtype.Property) -> jtype.Property:
    jprop = copy.deepcopy(prop_type)
    jprop.set_val(value)
    if _logging.VERBOSE:
        _logging.log_debug("\t\tresolve_property")
        _logging.log_debug(f"\t\t\tvalue = {str(value)}\ttype = {str(vars(prop_type))}")
        _logging.log_debug(f"\t\t\tresolved: {type(jprop)} {str(vars(jprop))}")
    return jprop


def _resolve_property_types_instance(inst: jstype.Instance, assets: dict[str, jstype.Asset]) -> None:
    if _logging.VERBOSE:
        _logging.log_debug("")
        _logging.log_debug("\t\tresolve_property_types instance =")
        _logging.log_debug_object(inst, indent=2)
    inst_type = inst.inst_type.lower()
    if inst_type not in assets:
        _logging.log_warning("ERROR: Instance " + inst.id + " does not have a type")
        return
    # Create a copy of property dict and add properties from PROP_INJECTED_KEYS
    # Do not change original dict so that asset gd/tscn files are not affected
    asset_props = assets[inst_type].props.copy()
    asset_props.update(const.PROP_INJECTED_KEYS)
    jprops = {}
    for prop, val in inst.props.items():
        if prop not in asset_props:
            _logging.log_error("WARNING: Property " + prop + " is not found in asset data")
            continue
        jprops[prop] = _resolve_property(val, asset_props[prop])
    inst.props = jprops
    if _logging.VERBOSE:
        _logging.log_debug("\t\t\tresolved instance: " + str(inst.props))


def _resolve_property_types_layer(layer: jstype.Layer, assets: dict[str, jstype.Asset]) -> None:
    if _logging.VERBOSE:
        _logging.log_debug("\tresolve_property_types layer =")
        _logging.log_debug_object(layer, indent=1)
        _logging.log_debug("#" * 80)
    for inst in layer.insts:
        _resolve_property_types_instance(inst, assets)
    if _logging.VERBOSE:
        _logging.log_debug("#" * 80)


def _resolve_property_types_level(level: jstype.Level, assets: dict[str, jstype.Asset]) -> None:
    if _logging.VERBOSE:
        _logging.log_debug("#" * 80)
        _logging.log_debug("#" * 80)
        _logging.log_debug("resolve_property_types level =")
        _logging.log_debug_object(level, indent=0)
        _logging.log_debug("#" * 80)
    for layer in level.layers:
        _resolve_property_types_layer(layer, assets)
    if _logging.VERBOSE:
        _logging.log_debug("#" * 80)
