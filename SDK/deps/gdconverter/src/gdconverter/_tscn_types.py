from pathlib import Path
from typing import Any


class Enum:
    def __init__(self, value: int) -> None:
        self.selected: int = value


class Array:
    def __init__(self) -> None:
        self.elems: list[Any] = []


class Object:
    def __init__(self, obj_type: str):
        self.type = obj_type


class Instance(Object):
    def __init__(self, obj_type: str):
        super().__init__(obj_type)
        self.attrs: dict[str, Any] = {}


class Complex(Object):
    def __init__(self, obj_type: str):
        super().__init__(obj_type)
        self.params: list[Any] = []


class Struct(Object):
    def __init__(self, obj_type: str):
        super().__init__(obj_type)
        self.name = ""
        self.data: dict[str, Any] = {}


class SubResource(Object):
    def __init__(self, obj_type: str):
        super().__init__(obj_type)
        self.name = ""
        self.data: dict[str, Any] = {}


class ExtResource(Object):
    def __init__(self, obj_type: str):
        super().__init__(obj_type)
        self.id = ""
        self.path = ""


class Node(Instance):
    def __init__(self, obj_type: str):
        super().__init__(obj_type)
        self.name = ""
        self.parent = ""


class Scene:
    def __init__(self) -> None:
        self.ext_resources: dict[str, ExtResource] = {}
        self.sub_resources: dict[str, SubResource] = {}
        self.node_list: dict[str, Node] = {}
        self.flattened_list: list[dict[str, Any]] = []
        self.layer_list: dict[str, list[dict[str, Any]]] = {}
        self.flattened_name_to_node: dict[str, Any] = {}
        self.flattened_name_to_id: dict[str, str] = {}
        self.flattened_id_to_name: dict[str, str] = {}
        self.referencing_node_props: dict[str, list[tuple[str, str]]] = {}
        self.filepath: Path
