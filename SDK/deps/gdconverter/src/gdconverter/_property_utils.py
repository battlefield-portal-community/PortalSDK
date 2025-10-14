from decimal import Decimal
from typing import Any

from gdconverter import _constants as const
from gdconverter import _json_scene_types as jstype
from gdconverter import _json_types as jtypes
from gdconverter import _utils

JSON_VECTOR_X = {"x": Decimal(1.0), "y": Decimal(0.0), "z": Decimal(0.0)}
JSON_VECTOR_Y = {"x": Decimal(0.0), "y": Decimal(1.0), "z": Decimal(0.0)}
JSON_VECTOR_Z = {"x": Decimal(0.0), "y": Decimal(0.0), "z": Decimal(1.0)}
JSON_VECTOR_ZERO = {"x": Decimal(0.0), "y": Decimal(0.0), "z": Decimal(0.0)}
JSON_TRANSFORM_IDENTITY = {"x": JSON_VECTOR_X, "y": JSON_VECTOR_Y, "z": JSON_VECTOR_Z, "p": JSON_VECTOR_ZERO}

TSCN_VECTOR_X = [Decimal(1.0), Decimal(0.0), Decimal(0.0)]
TSCN_VECTOR_Y = [Decimal(0.0), Decimal(1.0), Decimal(0.0)]
TSCN_VECTOR_Z = [Decimal(0.0), Decimal(0.0), Decimal(1.0)]
TSCN_VECTOR_ZERO = [Decimal(0.0), Decimal(0.0), Decimal(0.0)]
TSCN_TRANSFORM_IDENTITY = TSCN_VECTOR_X + TSCN_VECTOR_Y + TSCN_VECTOR_Z + TSCN_VECTOR_ZERO


def get_asset_category(inst_type: str, assets: jstype.Assets) -> Any:
    """Get the category of the asset"""
    inst_type = inst_type.lower()
    if inst_type == const.PROP_TYPE_CURVE.lower():
        return "waypointpath"
    if inst_type not in assets:
        return None
    asset = assets[inst_type]
    const_props = asset.consts
    if const.CONST_KEY_CATEGORY not in const_props:
        return None
    return const_props[const.CONST_KEY_CATEGORY].get_val()


def vector3_to_json(v: jtypes.Vector3) -> jtypes.JsonVector3:
    assert len(v) == 3
    return {"x": v[0], "y": v[1], "z": v[2]}


def json_to_vector3(v: jtypes.JsonVector3) -> jtypes.Vector3:
    assert len(v) == 3
    return [v["x"], v["y"], v["z"]]


def transform_flat_to_json(arr: jtypes.TransformFlat, name: str) -> jtypes.JsonTransform:
    matrix_as_json = {
        "right": vector3_to_json(arr[0:3]),
        "up": vector3_to_json(arr[3:6]),
        "front": vector3_to_json(arr[6:9]),
        "position": vector3_to_json(arr[9:12]),
    }

    # # ===================================================
    # rotation_matrix = np.array([x, y, z])
    # scale_x = math.sqrt(sum(i**2 for i in x))
    # scale_y = math.sqrt(sum(i**2 for i in y))
    # scale_z = math.sqrt(sum(i**2 for i in z))
    # rotation_matrix[0] /= scale_x
    # rotation_matrix[1] /= scale_y
    # rotation_matrix[2] /= scale_z
    # eulers = eulerangles.matrix2euler(rotation_matrix, axes="XYZ", intrinsic=False, right_handed_rotation=False)
    # nice_eulers = [round(i, 3) if not math.isclose(i, Decimal(0.0), abs_tol=1e-6) else Decimal(0.0) for i in eulers]
    # gd_transform = f"Transform3D({', '.join([str(i) for i in arr])})"

    # output_arr = [*p, round(scale_x, 3), round(scale_y, 3), round(scale_z, 3), nice_eulers[1]]
    # _logging.log_info(f"\n{name}\n{gd_transform}\n{output_arr}\n\n")
    # # ===================================================

    return matrix_as_json


def pos_to_parent_space(pos: jtypes.JsonVector3, parent: jtypes.JsonTransform) -> jtypes.JsonVector3:
    transform = {
        "right": JSON_VECTOR_X,
        "up": JSON_VECTOR_Y,
        "front": JSON_VECTOR_Z,
        "position": pos,
    }
    parent_space = object_to_parent_space(transform, parent)
    return parent_space["position"]


def object_to_parent_space(transform: jtypes.JsonTransform, parent: jtypes.JsonTransform) -> jtypes.JsonTransform:
    transform_matrix = [
        json_to_vector3(transform["right"]) + [Decimal(0.0)],
        json_to_vector3(transform["up"]) + [Decimal(0.0)],
        json_to_vector3(transform["front"]) + [Decimal(0.0)],
        json_to_vector3(transform["position"]) + [Decimal(1.0)],
    ]
    parent_matrix = [
        json_to_vector3(parent["right"]) + [Decimal(0.0)],
        json_to_vector3(parent["up"]) + [Decimal(0.0)],
        json_to_vector3(parent["front"]) + [Decimal(0.0)],
        json_to_vector3(parent["position"]) + [Decimal(1.0)],
    ]
    parent_space = matrix_multiply(transform_matrix, parent_matrix)
    return {
        "right": vector3_to_json(parent_space[0][:3]),
        "up": vector3_to_json(parent_space[1][:3]),
        "front": vector3_to_json(parent_space[2][:3]),
        "position": vector3_to_json(parent_space[3][:3]),
    }


def matrix_multiply(a: list[list[Decimal]], b: list[list[Decimal]]) -> list[list[Decimal]]:
    result = [[Decimal(0.0) for _ in range(4)] for _ in range(4)]
    for i in range(4):
        for j in range(4):
            for k in range(4):
                result[i][j] += a[i][k] * b[k][j]
    return result


def json_to_tscn_transform(props: dict[str, jtypes.Property]) -> list[Decimal] | None:
    transform = jtypes.create_property("transform")
    assert isinstance(transform, jtypes.PropertyTransform)
    transform = transform.set_val(props)
    for key in transform.get_axes():
        del props[key]
    fb_arr_val = [f for vec in transform.to_arr() for f in vec.to_arr()]
    gd_arr_val = transpose_flat_transform(fb_arr_val)
    return gd_arr_val


def tscn_to_json_type(node: dict[str, Any]) -> dict[str, str]:
    resolved_types: dict[str, str] = {}
    tscn_type = node.get("type")
    rsrc = node.get("instance", node.get("script"))
    if tscn_type is not None:
        resolved_types["tscn_type"] = tscn_type
    if rsrc is not None:
        resolved_types["type"] = _utils.get_filename_without_ext(rsrc)
    return resolved_types


def prop_transform_to_flat(prop: jtypes.PropertyTransform) -> jtypes.TransformFlat:
    out = [f for vec in prop.to_arr() for f in vec.to_arr()]
    return out


def transpose_flat_transform(t1: jtypes.TransformFlat) -> jtypes.TransformFlat:
    """Transpose a matrix's axes"""
    assert len(t1) == 12
    # fmt: off
    output = [
        t1[0], t1[3], t1[6],
        t1[1], t1[4], t1[7],
        t1[2], t1[5], t1[8],
        t1[9], t1[10], t1[11]
    ]
    # fmt: on
    return output
