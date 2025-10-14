import json
from collections import deque
from decimal import Decimal
from pathlib import Path
from typing import Any

from gdconverter import _constants as const
from gdconverter import _json_scene_types as jstype
from gdconverter import _json_types as jtype
from gdconverter import _logging
from gdconverter import _property_utils as putils
from gdconverter import _tscn_parser as tparser
from gdconverter import _tscn_to_json_callbacks as t2jcallback
from gdconverter import _tscn_types as ttype


class CustomEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> str | Any:
        if isinstance(obj, Decimal):
            as_str = str(obj)
            as_str_from_float = str(float(obj))
            if as_str[-2:] == ".0" or "." not in as_str:
                return int(obj)
            elif as_str_from_float[-2:] == ".0" or "." not in as_str_from_float:
                return round(obj)
            else:
                return float(as_str)
        return super().default(obj)


def process_scene_file(src_file: Path, dst_file: Path, assets: jstype.Assets) -> bool:
    """Given a tscn, create a json from it"""
    _logging.log_debug(f"process_scene_file {src_file} -> {dst_file}")
    tscn_instances = tparser.parse_scene(src_file)
    if not tscn_instances:
        _logging.log_error("Failed to parse scene")
        return False

    scene = _create_scene(tscn_instances, assets, src_file)
    if scene is None:
        return False
    with open(dst_file, "w", encoding="utf-8") as json_data:
        json.dump(scene.layer_list, json_data, indent=4, cls=CustomEncoder)
    return True


def _create_scene(tscn_instances: dict[str, list[ttype.Instance]], assets: jstype.Assets, filepath: Path) -> ttype.Scene | None:
    scene = ttype.Scene()
    scene.filepath = filepath
    # convert instances to appropriate types
    _create_ext_resources(scene, tscn_instances.setdefault(const.TYPE_EXTRES, []))
    _create_sub_resources(scene, tscn_instances.setdefault(const.TYPE_SUBRES, []))
    _create_nodes(scene, tscn_instances.setdefault(const.TYPE_NODE, []))
    # convert each type to generic object that can be dumped by json
    _add_flattened_nodes(scene, assets)
    _add_flattened_sub_resource(scene)
    _flatten_node_names(scene)
    _resolve_node_refs(scene, assets)
    _resolve_node_transforms(scene)
    _logging.log_debug("Flattened Node Instances:\n\t" + str(scene.flattened_list))
    _clean_up_flattened(scene, assets)

    level_name = scene.flattened_list[0]["name"]

    nonusable = _check_restrictions(scene, assets, level_name)
    if len(nonusable) > 0:
        _log_restrictions(nonusable, level_name)

    _create_layers(scene, assets)
    return scene


def _check_restrictions(scene: ttype.Scene, assets: jstype.Assets, level_name: str) -> dict[str, list[str]]:
    errors: dict[str, list[str]] = {}
    if "autotest" in level_name.lower():
        return errors

    for node in scene.flattened_list:
        assert "type" in node
        type: str = node["type"]
        assert "name" in node
        name: str = node["name"]
        assert "id" in node
        id: str = node["id"]

        if type.lower() in assets:
            restrictions = assets[type.lower()].restrictions
            if level_name.lower() not in restrictions and len(restrictions) > 0:
                error_str = f"{name} ({id})"
                entries = errors.get(type, [])
                entries.append(error_str)
                errors[type] = entries
    return errors


def _log_restrictions(nonusable: dict[str, list[str]], level_name: str) -> None:
    type_count = len(nonusable)
    object_count = sum([len(objects) for objects in nonusable.values()])
    _logging.log_warning(f"Encountered {type_count} type{'s' if type_count > 1 else ''} from {object_count} object{'s' if object_count > 1 else ''} not usable in the current level {level_name}:\n")
    for type, instances in nonusable.items():
        instances_str = "\n".join([f"\t{instance}" for instance in instances])
        _logging.log_warning(f"Type: {type}\n{instances_str}\n")


def _create_layers(scene: ttype.Scene, assets: jstype.Assets) -> None:
    """Create layers based on flattened list"""
    layers: dict[str, list[Any]] = {
        "Portal_Dynamic": [],
        "Static": [],
    }

    for node in scene.flattened_list:
        if "name" not in node:
            _logging.log_error('Node is missing "name" attribute: ' + str(node))
            continue

        if "parent" not in node:
            continue  # level root

        root_parent = str(node["parent"]).split("/")[0]
        if root_parent == "Static":
            layers["Static"].append(node)
            continue

        if str(node["type"]).lower() not in assets:
            continue  # empty node

        layers["Portal_Dynamic"].append(node)

    for node in scene.flattened_list:
        if "parent" in node:
            del node["parent"]

    scene.layer_list = layers


def _clean_up_flattened(scene: ttype.Scene, assets: jstype.Assets) -> None:
    _logging.log_debug("Cleanup Nodes")
    for node in scene.flattened_list:
        asset_category = putils.get_asset_category(node["type"], assets)
        if asset_category and asset_category in t2jcallback.TSCN_TO_JSON_PRE_CLEANUP_CALLBACKS:
            result = t2jcallback.TSCN_TO_JSON_PRE_CLEANUP_CALLBACKS[asset_category](node, scene)
            assert result
        node["id"] = node.get("id", "")
    for node in scene.flattened_list:
        for attr in const.ATTR_KEY_IGNORE:
            if attr in node:
                del node[attr]
    _logging.log_debug("Cleaned Up Nodes:\n\t" + str(scene.flattened_list))


def _create_ext_resources(scene: ttype.Scene, ext_rsrc_inst_list: list[ttype.Instance]) -> None:
    scene.ext_resources = {}
    for rsrc in ext_rsrc_inst_list:
        new_rsrc = ttype.ExtResource(rsrc.type)
        new_rsrc.id = rsrc.attrs.get("id", "")
        new_rsrc.path = rsrc.attrs.get("path", "")
        new_rsrc.path = new_rsrc.path.replace(const.PROP_PATH_PREFIX, "")
        scene.ext_resources[new_rsrc.id] = new_rsrc


def _create_sub_resources(scene: ttype.Scene, sub_rsrc_inst_list: list[ttype.Instance]) -> None:
    scene.sub_resources = {}
    for rsrc in sub_rsrc_inst_list:
        new_rsrc = ttype.SubResource(rsrc.type)
        new_rsrc.name = rsrc.attrs.get("id", "")
        new_rsrc.data = dict(rsrc.attrs)
        # get resource data from the data attribute
        if const.PROP_DATA_KEY in new_rsrc.data:
            del new_rsrc.data[const.PROP_DATA_KEY]
            new_rsrc.data = dict(new_rsrc.data, **rsrc.attrs[const.PROP_DATA_KEY].data)
        scene.sub_resources[new_rsrc.name] = new_rsrc


def _create_nodes(scene: ttype.Scene, node_inst_list: list[ttype.Instance]) -> None:
    scene.node_list = {}
    for node in node_inst_list:
        new_node = ttype.Node(node.type)
        new_node.attrs = node.attrs
        if "name" not in new_node.attrs:
            _logging.log_error('Node is missing "name" attribute: ' + str(node))
            continue
        if "id" in new_node.attrs:
            del new_node.attrs["id"]
        name = new_node.attrs["name"]
        if "hidden" in name.lower():
            _logging.log_info(f"Ignoring node because it is hidden: {name}")
            continue
        parent = new_node.attrs.get("parent", ".")
        if "hidden" in parent.lower():
            _logging.log_info(f"Ignoring node because a parent is hidden: {parent}")
            continue
        new_node.name = parent + "/" + name
        new_node.parent = parent
        scene.node_list[new_node.name] = new_node


def _get_flattened_array(array: ttype.Array, scene: ttype.Scene) -> Any:
    flattened_array = []
    for elem in array.elems:
        flattened_array.append(_get_flattened_value(elem, scene))
    return flattened_array


def _get_flattened_complex(attr_value: ttype.Complex, scene: ttype.Scene) -> Any:
    # if the attribute is a sub resource, we want to flatten to the SubResource reference
    # then the reference will be resolved in the next step
    if attr_value.type == const.CMPX_SUBRSRC or attr_value.type == const.CMPX_NODEPATH:
        return attr_value.params[0]  # sub resource or node path id
    if attr_value.type == const.CMPX_EXTRSRC and len(attr_value.params) == 1:
        inst_id = attr_value.params[0]
        ext_rsrc = scene.ext_resources.get(inst_id, None)
        if ext_rsrc is None:
            error_value = f"value {inst_id}" if inst_id != "" else "empty value"
            _logging.log_error(f"Parsing {const.CMPX_EXTRSRC} with {error_value} yielded no results")
        return ext_rsrc.path if ext_rsrc else ""
    return attr_value.params


# int value can be enum or int/float. Verify the attribute type from asset info
def _get_flattened_enum(attr_name: str, attr_value: ttype.Enum, json_type: jstype.Asset | None) -> Any:
    prop = json_type.props.get(attr_name, None) if json_type else None
    if isinstance(prop, jtype.PropertySelection):
        selections = prop.get_selections()
        if attr_value.selected >= 0 and attr_value.selected < len(selections):
            return selections[attr_value.selected]
        elif len(selections) > 0:
            return selections[0]
        else:
            return None
    return attr_value.selected


# values are simple values without names, typically appearing as array elements.
def _get_flattened_value(attr_value: object, scene: ttype.Scene) -> Any:
    if isinstance(attr_value, ttype.Array):
        return _get_flattened_array(attr_value, scene)
    if isinstance(attr_value, ttype.Complex):
        return _get_flattened_complex(attr_value, scene)
    return attr_value


# attributes are named values, including simple values, arrays, or complex values
def _get_flattened_attr(attr_name: str, attr_value: object, scene: ttype.Scene, json_type: jstype.Asset | None) -> Any:
    if isinstance(attr_value, ttype.Enum):
        return _get_flattened_enum(attr_name, attr_value, json_type)
    if isinstance(attr_value, ttype.Array):
        return _get_flattened_array(attr_value, scene)
    if isinstance(attr_value, ttype.Complex):
        return _get_flattened_complex(attr_value, scene)
    return attr_value


def _add_flattened_nodes(scene: ttype.Scene, assets: jstype.Assets) -> None:
    flattened_nodes = []
    for node in scene.node_list.values():
        # Flatten attributes in two iterations.
        # First, resolve external/sub resource complexes to get json type of node
        # Second, use attributes in json type to resolve other attributes
        complexes = {}
        for attr_name, attr_value in node.attrs.items():
            if isinstance(attr_value, ttype.Complex):
                complexes[attr_name] = _get_flattened_complex(attr_value, scene)
        complexes.update(putils.tscn_to_json_type(complexes))
        json_type = None
        if "type" in complexes:
            json_type = assets.get(complexes["type"].lower(), None)

        attributes = {}
        for attr_name, attr_value in node.attrs.items():
            if not isinstance(attr_value, ttype.Complex):
                attributes[attr_name] = _get_flattened_attr(attr_name, attr_value, scene, json_type)
        attributes.update(putils.tscn_to_json_type(attributes))

        flattened_node = {}
        flattened_node.update(attributes)
        flattened_node.update(complexes)

        if "type" not in flattened_node:
            # no type was able to be deduced, set a default to handle it
            _logging.log_warning(f"Unable to get type from node {flattened_node['name']}. Defaulting to {const.PROP_TYPE_NODE3D}")
            flattened_node["type"] = const.PROP_TYPE_NODE3D

        gd_transform = flattened_node.pop("transform", putils.TSCN_TRANSFORM_IDENTITY)
        fb_transform = putils.transpose_flat_transform(gd_transform)
        name = str(flattened_node.get("name"))
        flattened_node.update(putils.transform_flat_to_json(fb_transform, name))

        flattened_nodes.append(flattened_node)
    scene.flattened_list = flattened_nodes


def _flatten_node_names(scene: ttype.Scene) -> None:
    # resolve all nodes' names to absolute path
    # if a node has id, store their id for other node to reference
    root = ""
    for node in scene.flattened_list:
        if "name" not in node:
            _logging.log_error("Node is missing 'name' attribute: " + str(node))
            continue
        if "parent" not in node:
            if root != "":
                _logging.log_error("Multiple root nodes found: " + root + ", " + node["name"])
            root = node["name"]
            continue
        parent = node["parent"]
        node_name = node["name"] if parent == "." else parent + "/" + node["name"]
        # node["name"] = node_name
        scene.flattened_name_to_node[node_name] = node
        if "id" not in node or node["id"] == "":
            node["id"] = node_name
        elif node["id"] in scene.flattened_id_to_name:
            _logging.log_warning("Duplicate id found: " + node["id"] + " in node " + node_name + " and " + scene.flattened_id_to_name[node["id"]])
            _logging.log_warning("It will receive a new id using its absolute path. Any previous reference can be broken")
            node["id"] = node_name
        scene.flattened_id_to_name[node["id"]] = node_name
        scene.flattened_name_to_id[node_name] = str(node["id"])


def _resolve_node_rel_path(scene: ttype.Scene, rel_path: str, node: Any) -> str | None:
    curr = node
    resolved = rel_path
    scene_name = scene.filepath.stem
    while resolved.startswith(".."):
        if "parent" not in curr:
            _logging.log_error(f"Node {curr.name} has node_paths reference {rel_path} but no parent attribute")
            return None
        resolved = resolved[3:]
        parent = curr["parent"]
        if parent == ".":
            curr = None
            break
        if parent not in scene.flattened_name_to_node:
            _logging.log_error(f"Node {curr.name} has parent attribute {parent} which is not found in scene {scene_name}")
            return None
        curr = scene.flattened_name_to_node[parent]
    abs_path = str(curr["id"]) + "/" + resolved if curr else resolved
    if abs_path not in scene.flattened_name_to_node:
        _logging.log_error(f"Node {node['name']} has node_paths reference {rel_path} which is not found in scene {scene_name}")
        return None
    return scene.flattened_name_to_id.get(abs_path, abs_path)


def _resolve_node_refs(scene: ttype.Scene, assets: jstype.Assets) -> None:
    def _add_node_ref(scene: ttype.Scene, node: dict[str, Any], prop: str, ref: str) -> None:
        if ref not in scene.referencing_node_props:
            scene.referencing_node_props[ref] = []
        scene.referencing_node_props[ref].append((node["id"], prop))

    for node in scene.flattened_list:
        references: list[str] = []
        if const.PROP_ID_CURVE in node:
            # hardcoded property name switch
            node[const.PROP_ID_WAYPOINTS] = node.pop(const.PROP_ID_CURVE)
            references.append(const.PROP_ID_WAYPOINTS)
            _add_node_ref(scene, node, const.PROP_ID_WAYPOINTS, node[const.PROP_ID_WAYPOINTS])
        if const.PROP_NODE_PATHS in node:
            node_paths = node[const.PROP_NODE_PATHS]
            for path_prop in node_paths:
                if path_prop not in node:
                    _logging.log_warning(f"Node has node_paths attribute {path_prop} but no corresponding attribute")
                    continue
                rel_path = node[path_prop]
                if isinstance(rel_path, list):
                    node[path_prop] = []
                    for path in rel_path:
                        resolved_path = _resolve_node_rel_path(scene, path, node)
                        if resolved_path is None:
                            continue
                        referenced_node = scene.flattened_name_to_node[resolved_path]
                        referenced_node_name = referenced_node["name"]
                        node_type = node["type"].lower()
                        node_name = node["name"]
                        if node_type not in assets:
                            _logging.log_error(f"Attempting to resolve node {node_name} whose type does not exist: {node_type}")
                            continue
                        node_prop = assets[node_type].props.get(path_prop, None)
                        if node_prop is not None and isinstance(node_prop, jtype.PropertyArray):
                            expected_type = node_prop.elem_type
                            actual_type = referenced_node.get("type", "")
                            if expected_type != actual_type:
                                msg = (
                                    f"Encountered reference from node {node_name} with property {path_prop} "
                                    + f"to node {referenced_node_name} with wrong type "
                                    + f"(expected {expected_type} but found {actual_type}). "
                                    + "Dropping from referenced nodes"
                                )
                                _logging.log_warning(msg)
                                continue
                        node[path_prop].append(resolved_path)
                    references.append(path_prop)
                    for path in node[path_prop]:
                        _add_node_ref(scene, node, path_prop, path)
                elif isinstance(rel_path, str):
                    node[path_prop] = _resolve_node_rel_path(scene, rel_path, node)
                    references.append(path_prop)
                    _add_node_ref(scene, node, path_prop, node[path_prop])
                else:
                    _logging.log_error(f"Node has node_paths attribute {path_prop} with invalid type {type(rel_path)}")
            del node[const.PROP_NODE_PATHS]
        if len(references) != 0:
            node["linked"] = references


def _add_flattened_sub_resource(scene: ttype.Scene) -> None:
    for node in scene.node_list.values():
        for attr_value in node.attrs.values():
            if not isinstance(attr_value, ttype.Complex) or attr_value.type != const.CMPX_SUBRSRC:
                continue

            name = attr_value.params[0]
            if name not in scene.sub_resources:
                _logging.log_error(f"Node {node.name} references an unidentified sub resource: {name}")
                continue

            sub_rsrc = scene.sub_resources[name]
            flattened_sub_rsrc = {
                "name": name,
                "parent": node.name.lstrip("./"),  # match to flattened list name
                "type": sub_rsrc.data.get("type", ""),
            }
            for key, val in sub_rsrc.data.items():
                flattened_sub_rsrc[key] = _get_flattened_attr(key, val, scene, None)
            scene.flattened_list.append(flattened_sub_rsrc)


def _resolve_node_transforms(scene: ttype.Scene) -> None:
    children_map: dict[str, list[dict[str, Any]]] = {}

    # pre load everything in case of non-determinant ordering
    for id in scene.flattened_name_to_node:
        if id not in children_map:
            children_map[id] = []
            continue

    for id, node in scene.flattened_name_to_node.items():
        parent_path = id.rsplit("/", 1)
        if len(parent_path) == 1:
            continue  # node is parented to root
        if parent_path[0] in children_map:
            children_map[parent_path[0]].append(node)

    is_world: set[str] = set()

    # dfs to convert all local transforms to world
    node_stack: deque[dict[str, Any]] = deque()
    root_nodes = [node for node in scene.flattened_name_to_node.values() if node["parent"] == "."]
    for node in root_nodes:
        node_stack.appendleft(node)
        fullname = _get_fullname(node)
        is_world.add(fullname)

    while len(node_stack) != 0:
        current = node_stack.pop()
        fullname = _get_fullname(current)

        if current["name"] in scene.sub_resources:
            assert "position" not in current
            is_world.add(fullname)
            continue  # sub resources do not have transforms

        children = children_map[fullname]
        for child in children:
            node_stack.append(child)
        if fullname not in is_world:
            parent_node = scene.flattened_name_to_node[current["parent"]]
            new_transform = putils.object_to_parent_space(current, parent_node)
            for k, v in new_transform.items():
                current[k] = v
            is_world.add(fullname)


def _get_fullname(node: dict[str, Any]) -> str:
    assert "name" in node
    name: str = node["name"]
    if "parent" not in node:
        return name
    parent: str = node["parent"]
    if parent == ".":
        return name
    return f"{parent}/{name}"
