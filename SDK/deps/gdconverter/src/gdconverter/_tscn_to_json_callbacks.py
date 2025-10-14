from decimal import Decimal
from typing import Any

from gdconverter import _constants as const
from gdconverter import _logging
from gdconverter import _property_utils as putils
from gdconverter import _tscn_types as ttype


def _process_node_spatial(node: dict[str, Any], scene: ttype.Scene) -> bool:
    _logging.log_debug("processNodeSpatial:" + str(node))
    return True


def _process_node_polygon_volume(node: dict[str, Any], scene: ttype.Scene) -> bool:
    transform_flat = putils.json_to_tscn_transform(node)
    if not transform_flat:
        transform_flat = putils.TSCN_TRANSFORM_IDENTITY
    translation = transform_flat[-3:]
    points = node.pop("points", [-5, -5, -5, 5, 5, 5, 5, -5])
    if len(points) < 6:
        _logging.log_error("processNodeVolume:" + str(node) + "\nVolume with less than 3 points is unsupported")
        return False
    point_raw = [(points[i], points[i + 1]) for i in range(0, len(points), 2)]
    height = Decimal(node.pop("height", 0.0))

    fb_points = []
    for point in point_raw:
        fb_point = [point[0] + translation[0], translation[1], point[1] + translation[2]]
        fb_points.append(putils.vector3_to_json(fb_point))

    node["height"] = height
    node["points"] = fb_points
    return True


def _process_node_obb_volume(node: dict[str, Any], scene: ttype.Scene) -> bool:
    size = node.pop("size", [1, 1, 1])
    node["size"] = size
    return True


def _process_node_volume(node: dict[str, Any], scene: ttype.Scene) -> bool:
    _logging.log_debug("processNodeVolume:" + str(node))

    if node["tscn_type"] == "CollisionShape3D":
        transform_flat = putils.json_to_tscn_transform(node)
        if not transform_flat:
            transform_flat = putils.TSCN_TRANSFORM_IDENTITY
        translation = transform_flat[-3:]
        if node["type"] == "":
            _logging.log_error("CollisionShape3D node does not inherit from Volume type. Please add the Volume script in Godot.")
            _logging.log_error(f"Node: {node['name']}")
            return False
        if "shape" not in node:
            _logging.log_error("Found CollisionShape3D node but with no corresponding shape. Unable to convert to json.")
            _logging.log_error(f"Node: {node['name']}")
            return False
        shape_data = next((data for data in scene.flattened_list if data["id"] == node["shape"]), None)
        if not shape_data:
            _logging.log_error("Found CollisionShape3D node but with no corresponding shape. Unable to convert to json.")
            _logging.log_error(f"Node: {node['name']}")
            return False
        node["shape"] = shape_data

        fb_points = [
            putils.vector3_to_json(transform_flat[0:3]),
            putils.vector3_to_json(transform_flat[3:6]),
            putils.vector3_to_json(transform_flat[6:9]),
            putils.vector3_to_json(translation),
            putils.vector3_to_json(node["shape"].get("size", [1, 1, 1])),
        ]
        node["height"] = None
        node["points"] = fb_points
    elif node["tscn_type"] == "CollisionPolygon3D":
        transform_flat = putils.json_to_tscn_transform(node)
        if not transform_flat:
            transform_flat = putils.TSCN_TRANSFORM_IDENTITY
        translation = transform_flat[-3:]
        polygon = node.pop("polygon", [])
        if len(polygon) < 3:
            _logging.log_error("processNodeVolume:" + str(node) + "\nVolume with less than 3 points is unsupported")
            return False
        point_raw = [(polygon[i], polygon[i + 1]) for i in range(0, len(polygon), 2)]

        # because godot depth default is 1.0, prop will not be present if unchanged
        # therefore assign default value of 1.0 to compensate
        height = Decimal(node.pop("depth", 1.0))

        fb_points = []
        for point in point_raw:
            fb_point = [point[0] + translation[0], translation[1] - Decimal(0.5) * height, point[1] + translation[2]]
            fb_points.append(putils.vector3_to_json(fb_point))

        node.pop("margin", Decimal(0.0))

        node["height"] = height
        node["points"] = fb_points
    return True


def _process_waypointpath(node: dict[str, Any], scene: ttype.Scene) -> bool:
    _logging.log_debug("processCurve3D:" + str(node))
    node.pop("tilts", None)
    point_count = node.pop("point_count", 0)
    points = node.pop("points", [])
    if point_count < 1:
        _logging.log_warning("processCurve3D:" + str(node) + "\nCurve3D with less than 1 point is unsupported")
        return False
    if len(points) != point_count * 9:
        _logging.log_warning("processCurve3D:" + str(node) + "\nCurve3D points count does not match point_count")
        return False
    fb_points = []
    for i in range(6, len(points), 9):
        fb_points.append(putils.vector3_to_json(points[i : i + 3]))
    node["points"] = fb_points
    node["type"] = "WaypointPath"
    # transform points into parent space
    parents = scene.referencing_node_props.get(node["name"], None)
    if not parents or len(parents) == 0:
        return False
    if len(parents) > 1:
        _logging.log_warning(f"processCurve3D: Curve3D has multiple parents\n{str(node)}")
    parent = parents[0][0]
    parent_node = scene.flattened_name_to_node.get(parent, None)
    if not parent_node:
        _logging.log_error(f"processCurve3D: Curve3D parent {parent} not found\n{str(node)}")
        return False
    if "position" not in parent_node or "up" not in parent_node or "right" not in parent_node or "front" not in parent_node:
        _logging.log_error(f"processCurve3D: Curve3D parent {parent} has no transform\n{str(node)}")
        return False
    prop = parents[0][1]
    if prop != const.PROP_ID_WAYPOINTS:
        _logging.log_warning(f"processCurve3D: Curve3D parent {parent} has unexpected property name {prop}\n{str(node)}")
    parent_transform = {"right": parent_node["right"], "up": parent_node["up"], "front": parent_node["front"], "position": parent_node["position"]}
    node["points"] = [putils.pos_to_parent_space(point, parent_transform) for point in node["points"]]
    return True


TSCN_TO_JSON_PRE_CLEANUP_CALLBACKS = {
    const.CONST_CATEGORY_SPATIAL: _process_node_spatial,
    const.CONST_CATEGORY_VOLUME: _process_node_volume,
    const.CONST_CATEGORY_WAYPOINTPATH: _process_waypointpath,
    const.CONST_CATEGORY_POLYGON_VOLUME: _process_node_polygon_volume,
    const.CONST_CATEGORY_OBB_VOLUME: _process_node_obb_volume,
}
