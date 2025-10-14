from decimal import Decimal
from typing import Any, Self

from gdconverter import _constants as const

Json = dict[str, Any]
Vector3 = list[Decimal]
TransformFlat = list[Decimal]
JsonVector3 = dict[str, Decimal]
JsonTransform = dict[str, JsonVector3]


class Property:
    id: str = ""
    type: str = ""

    def __init__(self) -> None:
        setattr(self, const.PROP_KEY_VAL, "")
        setattr(self, const.PROP_KEY_DEF, "")

    def set_val(self, value: Any) -> Self:
        setattr(self, const.PROP_KEY_VAL, value)
        return self

    def get_val(self) -> Any:
        return getattr(self, const.PROP_KEY_VAL)

    def to_gd(self, attr: str = const.PROP_KEY_DEF) -> Any:
        val = getattr(self, attr)
        return val

    def to_gd_prop(self, attr: str = const.PROP_KEY_DEF) -> str:
        val = self.to_gd(attr)
        return f"@export var {self.id} = {val}"

    def to_tscn(self, attr: str = const.PROP_KEY_VAL) -> Any:
        return self.to_gd(attr)

    def to_tscn_prop(self, attr: str = const.PROP_KEY_VAL) -> str:
        val = self.to_tscn(attr)
        return f"{self.id} = {val}"

    def to_json(self, attr: str = const.PROP_KEY_VAL) -> Any:
        val = getattr(self, attr)
        return val

    def to_json_prop(self, attr: str = const.PROP_KEY_VAL) -> str:
        val = self.to_json(attr)
        return f'"{self.id}": {val}'


class PropertyRaw(Property):
    pass


class PropertyString(Property):
    def to_gd(self, attr: str = const.PROP_KEY_VAL) -> str:
        val_str = getattr(self, attr)
        return f'"{val_str}"'


class PropertyReference(PropertyString):
    def __init__(self, ref_type: str) -> None:
        super().__init__()
        self.ref_type = ref_type

    def to_gd_prop(self, attr: str = const.PROP_KEY_DEF) -> str:
        val = self.to_gd(attr)
        undefined_ref = f"# Skip reference prop which will be added by Godot\n# @export var {self.id} = {val}"
        known_type = f"@export var {self.id} : {self.type}"
        return undefined_ref if self.type == "reference" else known_type

    def to_tscn(self, attr: str = const.PROP_KEY_VAL) -> Any:
        val = getattr(self, attr)
        return f'NodePath("{val}")'

    def to_tscn_prop(self, attr: str = const.PROP_KEY_VAL) -> str:
        val = self.to_tscn(attr)
        return f"{self.id} = {val}"


class PropertyBool(Property):
    def __init__(self) -> None:
        super().__init__()
        setattr(self, const.PROP_KEY_VAL, False)
        setattr(self, const.PROP_KEY_DEF, False)

    def to_gd(self, attr: str = const.PROP_KEY_VAL) -> str:
        val = getattr(self, attr)
        val_str = "true" if val else "false"
        return val_str


class PropertyInt(Property):
    def __init__(self) -> None:
        super().__init__()
        setattr(self, const.PROP_KEY_VAL, 0)
        setattr(self, const.PROP_KEY_DEF, 0)
        setattr(self, const.PROP_KEY_MIN, None)
        setattr(self, const.PROP_KEY_MAX, None)

    def to_gd(self, attr: str = const.PROP_KEY_DEF) -> int:
        val = round(int(getattr(self, attr)))
        return val


class PropertyFloat(Property):
    def __init__(self) -> None:
        super().__init__()
        setattr(self, const.PROP_KEY_VAL, 0.0)
        setattr(self, const.PROP_KEY_DEF, 0.0)
        setattr(self, const.PROP_KEY_MIN, None)
        setattr(self, const.PROP_KEY_MAX, None)

    def to_gd(self, attr: str = const.PROP_KEY_DEF) -> Decimal:
        val = Decimal(getattr(self, attr))
        return val


class PropertyVector(Property):
    ZERO = [0.0] * 3
    ONE = [1.0] * 3
    X = [1.0, 0.0, 0.0]
    Y = [0.0, 1.0, 0.0]
    Z = [0.0, 0.0, 1.0]

    def __init__(self, value: Any | None = None) -> None:
        super().__init__()
        setattr(self, const.PROP_KEY_VAL, self.set_val(value) if value else PropertyVector.ZERO)
        setattr(self, const.PROP_KEY_DEF, PropertyVector.ZERO)
        setattr(self, const.PROP_KEY_MIN, None)
        setattr(self, const.PROP_KEY_MAX, None)

    def to_tscn_prop(self, attr: str = const.PROP_KEY_VAL) -> str:
        val = getattr(self, attr)
        type_str = "Vector3" if len(val) == 3 else "Vector2\n"
        as_list = [str(n) for n in val]
        return f'{self.id} = {type_str}({", ".join(as_list)})'

    def set_val(self, value: Any) -> Self:
        if isinstance(value, PropertyVector):
            setattr(self, const.PROP_KEY_VAL, getattr(value, const.PROP_KEY_VAL).copy())
        elif isinstance(value, list):
            setattr(self, const.PROP_KEY_VAL, value)
        elif isinstance(value, dict):
            x = value.get("x", 0.0)
            y = value.get("y", 0.0)
            z = value.get("z", 0.0)
            arr = [x, y, z]
            setattr(self, const.PROP_KEY_VAL, arr)
        return self

    def set_x(self, value: Any) -> Self:
        arr = getattr(self, const.PROP_KEY_VAL)
        arr[0] = value
        setattr(self, const.PROP_KEY_VAL, arr)
        return self

    def set_y(self, value: Any) -> Self:
        arr = getattr(self, const.PROP_KEY_VAL)
        arr[1] = value
        setattr(self, const.PROP_KEY_VAL, arr)
        return self

    def set_z(self, value: Any) -> Self:
        arr = getattr(self, const.PROP_KEY_VAL)
        arr[2] = value
        setattr(self, const.PROP_KEY_VAL, arr)
        return self

    def to_arr(self) -> Any:
        return getattr(self, const.PROP_KEY_VAL)


class PropertyTransform(Property):
    IDENTITY = [PropertyVector(PropertyVector.X), PropertyVector(PropertyVector.Y), PropertyVector(PropertyVector.Z), PropertyVector(PropertyVector.ZERO)]

    # Values don't matter. Just need a dictionary with the keys.
    KEY_TYPES_LIST = [
        ["right", "up", "front", "position"],
        ["x", "y", "z", "w"],
    ]
    KEY_TYPES_SET = [set(keys) for keys in KEY_TYPES_LIST]

    def __init__(self, value: Any = None) -> None:
        super().__init__()
        self.axes: list[str] = []
        setattr(self, const.PROP_KEY_VAL, value if value else PropertyTransform.IDENTITY)
        setattr(self, const.PROP_KEY_DEF, PropertyTransform.IDENTITY)
        setattr(self, const.PROP_KEY_MIN, None)
        setattr(self, const.PROP_KEY_MAX, None)

    def set_val(self, value: Any) -> Self:
        if isinstance(value, list):
            setattr(self, const.PROP_KEY_VAL, value)
        elif isinstance(value, dict):
            for keys_list, keys_set in zip(PropertyTransform.KEY_TYPES_LIST, PropertyTransform.KEY_TYPES_SET, strict=False):
                if len(keys_set & value.keys()) != len(keys_set):
                    continue
                self.axes = keys_list
                arr = PropertyTransform.IDENTITY
                for i, key in enumerate(keys_list):
                    arr[i].set_val(value[key])
                setattr(self, const.PROP_KEY_VAL, arr)
        return self

    def get_axes(self) -> list[str]:
        return self.axes

    def to_arr(self) -> Any:
        arr = []
        for v in getattr(self, const.PROP_KEY_VAL):
            arr += v if isinstance(v, list) else [v]
        return arr


class PropertySelection(Property):
    def __init__(self) -> None:
        super().__init__()
        setattr(self, const.PROP_KEY_VAL, -1)
        setattr(self, const.PROP_KEY_DEF, -1)
        setattr(self, const.PROP_KEY_SEL, [])

    def get_selections(self) -> list[str]:
        return list(getattr(self, const.PROP_KEY_SEL))

    def to_gd(self, attr: str = const.PROP_KEY_DEF) -> str:
        type_str = self.id + "_selection"
        list_val = getattr(self, const.PROP_KEY_SEL)
        sel_val = getattr(self, attr)
        sel_val = sel_val if sel_val in list_val else ""
        return f"{type_str}.{sel_val}"

    def to_gd_prop(self, attr: str = const.PROP_KEY_DEF) -> str:
        type_str = self.id + "_selection"
        list_val = getattr(self, const.PROP_KEY_SEL)
        list_str = "{" + ", ".join(list_val) + "}"
        sel_val = getattr(self, attr)
        sel_val = sel_val if sel_val in list_val else None
        sel_str = f" = {type_str}.{sel_val}" if sel_val else ""
        return f"\nenum {type_str} {list_str}\n@export var {self.id}: {type_str}{sel_str}\n"


class PropertyObject(Property):
    def __init__(self) -> None:
        super().__init__()
        setattr(self, const.PROP_KEY_VAL, "")
        setattr(self, const.PROP_KEY_DEF, "")

    def to_gd_prop(self, attr: str = const.PROP_KEY_DEF) -> str:
        return f"\n@export(NodePath) var {self.id}\nonready var {self.id}_node = get_node({self.id})\n"


class PropertyArray(Property):
    def __init__(self, elem_type: str, elem_type_class: type[Property] = Property) -> None:
        super().__init__()
        self.elem_type = elem_type
        self.elem_type_class = elem_type_class
        setattr(self, const.PROP_KEY_VAL, [])
        setattr(self, const.PROP_KEY_DEF, [])

    def set_val(self, value: Any) -> Self:
        if self.elem_type_class and isinstance(value, list) and len(value) > 0 and not isinstance(value[0], Property):
            props = []
            for elem in value:
                prop = PropertyReference(self.elem_type) if self.elem_type_class is PropertyReference else self.elem_type_class()
                prop.set_val(elem)
                props.append(prop)
            setattr(self, const.PROP_KEY_VAL, props)
        else:
            setattr(self, const.PROP_KEY_VAL, value)
        return self

    def append(self, value: Any = None) -> None:
        if not value:
            value = self.elem_type_class()
        arr = getattr(self, const.PROP_KEY_VAL)
        arr.append(value)
        setattr(self, const.PROP_KEY_VAL, arr)

    def to_tscn(self, attr: str = const.PROP_KEY_VAL) -> list[Any]:
        val = getattr(self, attr)
        val_str = [elem.to_tscn() for elem in val]
        return val_str

    def to_tscn_prop(self, attr: str = const.PROP_KEY_VAL) -> str:
        val = getattr(self, attr)
        val_str_list = [elem.to_tscn() for elem in val]
        val_str_list = [elem if isinstance(elem, str) else str(elem) for elem in val_str_list]
        val_str = ", ".join(val_str_list)
        return f"{self.id} = [{val_str}]"

    def to_gd_prop(self, attr: str = const.PROP_KEY_DEF) -> Any:
        return f"@export var {self.id} : Array[{self.elem_type}]"


class PropertyDefault(Property):
    def __init__(self, prop_type: str) -> None:
        super().__init__()
        setattr(self, const.PROP_KEY_VAL, "")
        setattr(self, const.PROP_KEY_DEF, "")
        self.prop_type = prop_type

    def to_gd_prop(self, attr: str = const.PROP_KEY_DEF) -> str:
        return f"@export var {self.id} : {self.type}"


def create_property(type_name: str, prop_name: str | None = None, custom_types: set[str] | None = None) -> Property:
    prop: Property | None = None
    if len(type_name) > 2 and type_name[-2:] == "[]":
        arr = True
        prop_type = type_name[:-2]
    elif type_name.startswith("Array[") and type_name.endswith("]"):
        arr = True
        prop_type = type_name[6:-1]
    else:
        arr = False
        prop_type = type_name
    if prop_type == "string":
        prop = PropertyString()
    elif prop_type == "bool":
        prop = PropertyBool()
    elif prop_type == "int":
        prop = PropertyInt()
    elif prop_type == "float":
        prop = PropertyFloat()
    elif prop_type == "vector":
        prop = PropertyVector()
    elif prop_type == "transform":
        prop = PropertyTransform()
    elif prop_type == "selection":
        prop = PropertySelection()
    elif prop_type == "object":
        prop = PropertyObject()
    elif prop_type == "reference":
        prop = PropertyReference("")
    elif prop_type == "raw":
        prop = PropertyRaw()
    elif custom_types and prop_type in custom_types:
        prop = PropertyReference(prop_type)
    else:
        prop = PropertyDefault(prop_type)
    if arr:
        prop = PropertyArray(elem_type=prop_type, elem_type_class=type(prop))
    prop.type = type_name
    if prop_name:
        prop.id = prop_name
    return prop


JsonProps = dict[str, Property]
