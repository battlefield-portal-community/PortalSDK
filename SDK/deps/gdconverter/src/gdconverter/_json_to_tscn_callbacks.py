from decimal import Decimal

from gdconverter import _constants as const
from gdconverter import _json_scene_types as jstype
from gdconverter import _json_types as jtypes
from gdconverter import _property_utils as putils


def _create_prop_transform(arr_val: jtypes.TransformFlat) -> jtypes.PropertyRaw:
    # Add transform as raw property whose value is written to file as is
    arr_str = ", ".join([str(v) for v in arr_val])
    transform_str = f"Transform3D({arr_str})"
    prop = jtypes.create_property("raw", "transform")
    assert isinstance(prop, jtypes.PropertyRaw)
    prop.set_val(transform_str)
    return prop


def _create_instance_node_spatial(instance: jstype.Instance) -> None:
    arr_val = putils.json_to_tscn_transform(instance.props)
    if arr_val is None:
        return
    instance.props["transform"] = _create_prop_transform(arr_val)
    instance.tscn_type = const.PROP_TYPE_NODE3D


def _create_instance_node_polygon_volume(instance: jstype.Instance) -> None:
    # main goal here is to convert world space points to local space since
    # that is how godot will store the points

    fb_points = instance.props["points"].to_tscn()
    height = instance.props["height"].to_tscn() if "height" in instance.props else 0.0

    average = [
        sum(x[0] for x in fb_points) / len(fb_points),
        fb_points[0][1],  # assume all Y components are equal
        sum(x[2] for x in fb_points) / len(fb_points),
    ]

    gd_points: list[list[Decimal]] = []

    for point in fb_points:
        # transform world space points to local space with origin being the average
        # also remap components such that X -> X and Z -> Y
        gd_point = [point[0] - average[0], point[2] - average[2]]
        gd_points.append(gd_point)

    gd_points_flattened = [num for point in gd_points for num in point]
    gd_points_str = ", ".join([str(v) for v in gd_points_flattened])
    polygon_str = f"PackedVector2Array( {gd_points_str} )"

    # height could be a Decimal so convert to float
    height = float(height)
    translation = [average[0], average[1] + 0.5 * height, average[2]]
    transform = putils.TSCN_TRANSFORM_IDENTITY[:-3] + translation
    instance.props["points"] = jtypes.create_property("raw", "points").set_val(polygon_str)
    instance.props["transform"] = _create_prop_transform(transform)


def _create_instance_node_volume(instance: jstype.Instance) -> None:
    instance.tscn_type = "CollisionPolygon3D"
    fb_points = instance.props["points"].to_tscn()
    height = instance.props["height"].to_tscn() if "height" in instance.props else 0.0

    average = [
        sum(x[0] for x in fb_points) / len(fb_points),
        fb_points[0][1],  # assume all Y components are equal
        sum(x[2] for x in fb_points) / len(fb_points),
    ]

    gd_points: list[list[Decimal]] = []

    for point in fb_points:
        # transform world space points to local space with origin being the average
        # also remap components such that X -> X and Z -> Y
        gd_point = [point[0] - average[0], point[2] - average[2]]
        gd_points.append(gd_point)

    gd_points_flattened = [num for point in gd_points for num in point]
    gd_points_str = ", ".join([str(v) for v in gd_points_flattened])
    polygon_str = f"PackedVector2Array( {gd_points_str} )"

    # height could be a Decimal so convert to float
    height = float(height)
    translation = [average[0], average[1] + 0.5 * height, average[2]]

    # give a positive 90 degree rotation on x axis so that points are at bottom
    transform = putils.TSCN_VECTOR_X + [0, 0, -1] + putils.TSCN_VECTOR_Y + translation

    polygon_prop = jtypes.create_property("raw", "polygon").set_val(polygon_str)
    if polygon_prop:
        instance.props["polygon"] = polygon_prop

    instance.props["transform"] = _create_prop_transform(transform)
    depth_prop = jtypes.create_property("float", "depth").set_val(height)
    if depth_prop:
        instance.props["depth"] = depth_prop

    margin_prop = jtypes.create_property("float", "margin").set_val(0.001)
    if margin_prop:
        instance.props["margin"] = margin_prop

    del instance.props["points"]

    if "height" in instance.props:
        del instance.props["height"]


def _get_instance_ext_rsrc(instance: jstype.Instance, rsrcs: jstype.Resources, assets: jstype.Assets) -> jstype.Resource | None:
    """Filter resources to only include ext_resource used by level scenes
    Returns dst path of the ext_resource file
    """
    inst_type = instance.inst_type.lower()
    if inst_type not in rsrcs:
        return None
    asset_category = putils.get_asset_category(inst_type, assets)
    if asset_category not in const.ASSET_CATEGORY_EXT_RSRC:
        return None
    rsrc_ext = const.ASSET_CATEGORY_EXT_RSRC[asset_category]
    asset_rsrcs = rsrcs[inst_type]
    for ext, dst_file in asset_rsrcs.items():
        if ext == rsrc_ext:
            return dst_file
    return None


def _get_or_add_ext_rsrc(instance: jstype.Instance, rsrcs: jstype.Resources, assets: jstype.Assets, inst_type_ext_rsrcs: jstype.InstanceResource) -> int:
    """Lookup existing mapping from instance type to ext_rsrc id
    Add new ext_rsrc if no existing mapping is found and the type uses ext_resource
    Return id of the ext_resrc
    """
    inst_type = instance.inst_type
    if inst_type in inst_type_ext_rsrcs:
        return inst_type_ext_rsrcs[inst_type][1]

    ext_rsrc = _get_instance_ext_rsrc(instance, rsrcs, assets)
    if not ext_rsrc:
        return -1
    ext_rsrc_id = len(inst_type_ext_rsrcs)
    inst_type_ext_rsrcs[inst_type] = (ext_rsrc, ext_rsrc_id)
    return ext_rsrc_id


def _write_ext_rsrc_spatial(instance: jstype.Instance, rsrcs: jstype.Resources, assets: jstype.Assets, inst_type_ext_rsrcs: jstype.InstanceResource) -> str:
    ext_rsrc_id = _get_or_add_ext_rsrc(instance, rsrcs, assets, inst_type_ext_rsrcs)
    if ext_rsrc_id < 0:
        return ""
    return f'instance={const.CMPX_EXTRSRC}("{ext_rsrc_id}")'


def _write_ext_rsrc_volume(instance: jstype.Instance, rsrcs: jstype.Resources, assets: jstype.Assets, inst_type_ext_rsrcs: jstype.InstanceResource) -> str:
    ext_rsrc_id = _get_or_add_ext_rsrc(instance, rsrcs, assets, inst_type_ext_rsrcs)
    if ext_rsrc_id < 0:
        return ""
    prop_name = "script"
    prop_val = f'{const.CMPX_EXTRSRC}("{ext_rsrc_id}")'
    instance.props[prop_name] = jtypes.create_property("raw", prop_name).set_val(prop_val)
    return ""


JSON_TO_TSCN_PRE_PROP_CALLBACKS = {
    const.CONST_CATEGORY_SPATIAL: _create_instance_node_spatial,
    const.CONST_CATEGORY_VOLUME: _create_instance_node_volume,
    const.CONST_CATEGORY_POLYGON_VOLUME: _create_instance_node_polygon_volume,
    const.CONST_CATEGORY_OBB_VOLUME: _create_instance_node_spatial,
}

JSON_TO_TSCN_EXT_RSRC_CALLBACKS = {
    const.CONST_CATEGORY_SPATIAL: _write_ext_rsrc_spatial,
    const.CONST_CATEGORY_VOLUME: _write_ext_rsrc_volume,
    const.CONST_CATEGORY_POLYGON_VOLUME: _write_ext_rsrc_spatial,
    const.CONST_CATEGORY_OBB_VOLUME: _write_ext_rsrc_spatial,
}
