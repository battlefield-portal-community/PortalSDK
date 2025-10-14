from pathlib import Path

from gdconverter import _json_types as jtype


class Resource:
    def __init__(self) -> None:
        self.path = Path("")
        self.dst = ""
        self.ext = ""
        self.id = ""

    def set_path(self, path: Path) -> None:
        self.path = path
        self.dst = str(path)
        if len(path.suffixes) > 0:  # check if file, even if it doesn't exist
            self.ext = path.suffix
            self.id = path.stem.lower()


def create_resource(path: Path) -> Resource:
    resource = Resource()
    resource.set_path(path)
    return resource


class Asset(Resource):
    def __init__(self) -> None:
        super().__init__()
        self.consts: dict[str, jtype.Property] = {}
        self.props: dict[str, jtype.Property] = {}
        self.restrictions: list[str] = []


class Instance:
    def __init__(self) -> None:
        self.id = ""
        self.name = ""
        self.inst_type = ""
        self.tscn_type = ""
        self.props: dict[str, jtype.Property] = {}

    def get_ref_props(self) -> dict[str, jtype.Property]:
        return {k: v for k, v in self.props.items() if isinstance(v, jtype.PropertyReference) or (isinstance(v, jtype.PropertyArray) and v.elem_type_class is jtype.PropertyReference)}


class Layer:
    def __init__(self, data: list[Instance] | None = None, layer_name: str = "") -> None:
        self.id = layer_name
        self.insts = data if data is not None else []


class Level:
    def __init__(self, data: dict[str, list[Instance]] | None = None) -> None:
        self.src = ""
        self.dst = ""
        self.id = ""
        self.layers: list[Layer] = []
        data = {} if data is None else data
        for layer_name, layer_data in data.items():
            new_layer = Layer(layer_data, layer_name)
            self.layers.append(new_layer)


ResourceExtAndBlob = dict[str, Resource]
Resources = dict[str, ResourceExtAndBlob]
Assets = dict[str, Asset]
Levels = dict[str, Level]
InstanceResource = dict[str, tuple[Resource, int]]
