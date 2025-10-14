import os
from collections.abc import Iterable, Sized
from pathlib import Path

from gdconverter import _constants as const
from gdconverter import _json_scene_types as jstype
from gdconverter import _json_to_tscn_callbacks as j2tcallback
from gdconverter import _json_types as jtype
from gdconverter import _logging, _utils
from gdconverter import _property_utils as putils
from gdconverter._meta import Config


def create_level_tscns(levels: dict[str, jstype.Level], assets: jstype.Assets, rsrcs: jstype.Resources, asset_resources: jstype.Resources, dst_dir: str, overwrite_levels: bool) -> None:
    """Create the given level tscn files

    Further reading: https://docs.godotengine.org/en/stable/contributing/development/file_formats/tscn.html"""

    for level in levels.values():
        if not overwrite_levels and os.path.exists(level.dst):
            print("Skipping existing level: ", level.dst)
            continue
        with open(level.dst, "w", encoding="utf-8") as tscn_file:
            level_name = _utils.get_filename_without_ext(level.dst)
            nodes, ext_rsrc = _create_level_nodes(level_name, level, assets, asset_resources)
            ext_rsrcs = _create_level_ext_rsrcs(ext_rsrc, dst_dir)
            tscn_file.write(_create_tscn_scene(ext_rsrc))
            for rsrc in ext_rsrcs:
                tscn_file.write(rsrc + "\n")
            for lines in nodes:
                tscn_file.write("\n")
                for line in lines:
                    tscn_file.write(line + "\n")


def create_godot_files_from_assets(
    assets: jstype.Assets, raw_resources: jstype.Resources, asset_resources: jstype.Resources, dst_dir: str, config: Config, allow_missing_meshes: bool = False, skip_writing_files: bool = False
) -> bool:
    missing_meshes: set[str] = set()

    dst_dir = str(dst_dir)

    for asset_id, asset in assets.items():
        asset_rsrcs: jstype.ResourceExtAndBlob = {}
        category_prop = asset.consts.get(const.CONST_KEY_CATEGORY)
        assert category_prop
        category: str = category_prop.get_val()

        if category == const.CONST_CATEGORY_SPATIAL:
            mesh = asset.consts.get(const.CONST_KEY_MESH)
            assert mesh
            mesh_id = mesh.get_val().lower()
            if mesh_id not in raw_resources:
                missing_meshes.add(mesh_id)
            else:
                mesh_resource = raw_resources[mesh_id]
                asset_rsrcs[".glb"] = mesh_resource[".glb"]

            if allow_missing_meshes:
                dummy_resource = jstype.Resource()
                dummy_path = Path(f"{dst_dir}/dummy.glb")
                dummy_resource.set_path(dummy_path)
                asset_rsrcs[".glb"] = dummy_resource
        elif category == const.CONST_CATEGORY_WAYPOINTPATH:
            continue  # don't create gd or tscn
        elif category == const.CONST_CATEGORY_POLYGON_VOLUME:
            addon_path = "addons/bf_portal/portal_tools/types"
            asset.ext = ".tscn"
            asset_rsrcs[".gd"] = jstype.create_resource(Path(f"{dst_dir}/{addon_path}/PolygonVolume/PolygonVolume.gd"))
            asset_rsrcs[".tscn"] = jstype.create_resource(Path(f"{dst_dir}/{addon_path}/PolygonVolume/PolygonVolume.tscn"))
            asset_resources[asset_id] = asset_rsrcs
            continue
        elif category == const.CONST_CATEGORY_OBB_VOLUME:
            addon_path = "addons/bf_portal/portal_tools/types"
            asset.ext = ".tscn"
            asset_rsrcs[".gd"] = jstype.create_resource(Path(f"{dst_dir}/{addon_path}/OBBVolume/OBBVolume.gd"))
            asset_rsrcs[".tscn"] = jstype.create_resource(Path(f"{dst_dir}/{addon_path}/OBBVolume/OBBVolume.tscn"))
            asset_resources[asset_id] = asset_rsrcs
            continue

        dst = os.path.join(asset.dst, asset.id)
        project_dir = Path(dst.removeprefix(dst_dir + os.path.sep))
        if project_dir.parts[0] == config.dst_assets.stem:  # assumption that all spatials will be present here
            dst_gd = Path(dst.replace(config.dst_assets.stem, config.dst_scripts.stem, 1) + ".gd")
            if skip_writing_files:
                asset_rsrcs[".gd"] = jstype.create_resource(dst_gd)
            else:
                if _create_gd_file(asset, dst_gd):
                    asset_rsrcs[".gd"] = jstype.create_resource(dst_gd)

        dst_tscn = Path(dst + ".tscn")
        if skip_writing_files:
            asset_rsrcs[".tscn"] = jstype.create_resource(Path(dst_tscn))
        else:
            if _create_asset_tscn(assets, asset, asset_rsrcs, dst_dir, dst_tscn):
                asset_rsrcs[".tscn"] = jstype.create_resource(Path(dst_tscn))

        asset_resources[asset_id] = asset_rsrcs

    if len(missing_meshes) > 0:
        missing_meshes_list = list(missing_meshes)
        missing_meshes_list.sort()
        for mesh_name in missing_meshes_list:
            if allow_missing_meshes:
                _logging.log_warning(f"(Skipped) Missing mesh: {mesh_name}")
            else:
                _logging.log_error(f"Missing mesh: {mesh_name}")
        if not allow_missing_meshes:
            return False
    return True


def add_levels_to_assets(assets: jstype.Assets, levels: jstype.Levels, dst_dir: str) -> jstype.Assets:
    def create_asset_from_level(name: str) -> jstype.Asset:
        asset = jstype.Asset()

        asset.id = name
        asset.dst = os.path.join(dst_dir, "static")

        spatial_prop = jtype.PropertyString().set_val(const.CONST_CATEGORY_SPATIAL)
        asset.consts[const.CONST_KEY_CATEGORY] = spatial_prop

        mesh_prop = jtype.PropertyString().set_val(asset.id)
        asset.consts[const.CONST_KEY_MESH] = mesh_prop

        return asset

    for level in levels.values():
        filename = os.path.basename(level.dst)
        filename, ext = os.path.splitext(filename)

        terrain_asset = create_asset_from_level(f"{filename}_Terrain")
        assets[terrain_asset.id.lower()] = terrain_asset

        assets_asset = create_asset_from_level(f"{filename}_Assets")
        assets[assets_asset.id.lower()] = assets_asset
    return assets


def _get_tscn_type(asset: jstype.Asset) -> str:
    if asset.id == "AI_WaypointPath":
        return const.PROP_TYPE_PATH
    return const.PROP_TYPE_NODE3D


def _create_tscn_sub_resource(assets: jstype.Assets, asset: jstype.Asset, root_node: str, root: str) -> tuple[str, str]:
    sub_type = const.PROP_TYPE_NODE3D
    if root_node == const.PROP_TYPE_PATH:
        sub_type = const.PROP_TYPE_CURVE
        sub_asset = assets["waypointpath"]
        asset_dst = sub_asset.dst + "/WaypointPath.gd"
        rel_path = os.path.relpath(asset_dst, root)
        rel_path = rel_path.replace("objects", "scripts")
        path_str = const.PROP_PATH_PREFIX + rel_path.replace("\\", "/")
    else:
        _logging.log_warning("WARNING: Asset " + asset.id + " has an invalid reference property")
    return sub_type, path_str


def _create_tscn_ext_resource(rsrc_id: int, rsrc: jstype.Resource, root: str) -> str:
    dst = rsrc.dst.replace("FbExportData", "GodotProject")
    rel_path = os.path.relpath(dst, root)
    path_str = const.PROP_PATH_PREFIX + rel_path.replace("\\", "/")
    type_str = const.EXT_RSRC_TYPE.get(rsrc.ext, "")
    ext_resources = f'[{const.TYPE_EXTRES} path="{path_str}" type="{type_str}" id="{rsrc_id}"]'
    return ext_resources


def _create_tscn_node(ext: str, node_id: int) -> str:
    if ext in [".fbx", ".glb"]:
        return f'[{const.TYPE_NODE} name="Mesh" parent="." instance={const.CMPX_EXTRSRC}("{node_id}")]'
    if ext == ".gd":
        return f'script = {const.CMPX_EXTRSRC}("{node_id}")'
    return ""


def _create_tscn_scene(ext_resources: Sized) -> str:
    load_steps = len(ext_resources) + 1
    return f"[{const.TYPE_SCENE} load_steps={load_steps} format={const.FORMAT}]\n\n"


def _create_root_node(node_name: str = const.PROP_TYPE_NODE3D, node_type: str = const.PROP_TYPE_NODE3D) -> str:
    return f'[{const.TYPE_NODE} name="{node_name}" type="{node_type}"]'


def _create_gd_file(asset: jstype.Asset, dst: Path) -> Path | None:
    """Create script file (.gd) used by assets. Returns path of created file"""

    if not asset.props:
        return None

    tscn_type = _get_tscn_type(asset)

    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, "w", encoding="utf-8") as gd_file:
        gd_file.write("@tool\n")
        gd_file.write(f"class_name {asset.id}\n")
        gd_file.write(f"extends {tscn_type}\n\n")
        for prop_data in asset.props.values():
            # in this case, don't export points as a prop because it is unused in godot
            # other node types will have their own way to create points
            # however it must still remain as a generic json prop so can't be removed from type json
            if prop_data.id == "points":
                continue
            # Godot volumes use depth rather than height.
            if prop_data.id == "height" and asset.id == "Volume":
                continue
            # confusing if present in godot
            if prop_data.id == "Waypoints":
                continue
            gd_file.write(prop_data.to_gd_prop() + "\n")
        gd_file.write(const.CONFIG_WARNING_FUNC)
        gd_file.write(const.VALIDATE_PROPERTY_FUNC)
    return dst


def _create_asset_tscn(assets: jstype.Assets, asset: jstype.Asset, rsrcs: jstype.ResourceExtAndBlob, root: str, dst: Path) -> Path | None:
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, "w", encoding="utf-8") as tscn_file:
        ext_resources: list[str] = []
        sub_resources: list[str] = []
        nodes: list[list[str]] = []
        root_name = dst.stem
        tscn_type = _get_tscn_type(asset)
        nodes.append([_create_root_node(root_name, tscn_type)])
        for ext, rsrc in rsrcs.items():
            rsrc_id = len(ext_resources) + 1
            ext_rsrc = _create_tscn_ext_resource(rsrc_id, rsrc, root)
            node_str = _create_tscn_node(ext, rsrc_id)
            ext_resources.append(ext_rsrc)
            if ext == ".gd":
                nodes[0].append(node_str)
            else:
                nodes.append([node_str])
        tscn_file.write(_create_tscn_scene(ext_resources))
        for ext_rsrc in ext_resources:
            tscn_file.write(ext_rsrc + "\n")
        tscn_file.write("\n")
        for sub_rsrc in sub_resources:
            tscn_file.write(sub_rsrc + "\n")
        for node in nodes:
            tscn_file.write("\n")
            for line in node:
                tscn_file.write(line + "\n")
    return dst


def _create_properties(json_props: jtype.JsonProps) -> list[str]:
    props = []
    if "script" in json_props:
        props.append(json_props["script"].to_tscn_prop())
    for k, json_prop in json_props.items():
        if k != "script":
            props.append(json_prop.to_tscn_prop())
    return props


def _create_level_ext_rsrcs(ext_rsrc_ids: jstype.InstanceResource, root: str) -> list[str]:
    ext_rsrcs = list(ext_rsrc_ids.values())
    ext_rsrcs = sorted(ext_rsrcs, key=lambda er: er[1])
    ext_resources = []
    for rsrc, rsrc_id in ext_rsrcs:
        ext_rsrc = _create_tscn_ext_resource(rsrc_id, rsrc, root)
        ext_resources.append(ext_rsrc)
    return ext_resources


def _resolve_name_conflicts(instances: list[jstype.Instance]) -> None:
    # Instances in a level/layer can have the same name but nodes in the same layer cannot.
    # Check for name conflicts and add postfix to the name if needed
    node_names: set[str] = set()
    for inst in instances:
        inst_type = inst.inst_type.lower()
        name_str = inst.name if inst.name != "" else inst_type
        name_full = name_str
        postfix = 0
        while name_full in node_names:
            name_full = name_str + "_" + str(postfix)
            postfix += 1
        node_names.add(name_full)
        inst.name = name_full


def _resolve_ref_properties(instances: list[jstype.Instance]) -> None:
    # json files use id to reference other instances, but Godot needs the relative path in the scene
    # Map each instance's id to its relative path and update the reference properties
    id_to_rel_path: dict[str, str] = {}
    for inst in instances:
        if inst.id:
            # Assume references are always in the same layer and there's no nested layers
            id_to_rel_path[inst.id] = "../" + inst.name
    for inst in instances:
        for prop in inst.props.values():
            if isinstance(prop, jtype.PropertyReference):
                ref_id = prop.get_val()
                if ref_id in id_to_rel_path:
                    prop.set_val(id_to_rel_path[ref_id])
            elif isinstance(prop, jtype.PropertyArray) and prop.elem_type_class is jtype.PropertyReference:
                arr_val = prop.get_val()
                if isinstance(arr_val, Iterable):
                    for elem_prop in arr_val:
                        assert isinstance(elem_prop, jtype.PropertyReference)
                        ref_id = elem_prop.get_val()
                        if ref_id in id_to_rel_path:
                            elem_prop.set_val(id_to_rel_path[ref_id])


def _create_instance_nodes(instances: list[jstype.Instance], assets: jstype.Assets, rsrcs: jstype.Resources, parent: str, ext_rsrcs: jstype.InstanceResource) -> list[list[str]]:
    nodes: list[list[str]] = []
    _resolve_name_conflicts(instances)
    _resolve_ref_properties(instances)
    for inst in instances:
        inst_type = inst.inst_type.lower()
        asset_category = putils.get_asset_category(inst_type, assets)

        # Pre-processing instances properties
        if asset_category and asset_category in j2tcallback.JSON_TO_TSCN_PRE_PROP_CALLBACKS:
            j2tcallback.JSON_TO_TSCN_PRE_PROP_CALLBACKS[asset_category](inst)

        # Add property for ext_resource and to be used in ext_rsrc info in heading [node ... instance=ExtResource("...")]
        # If the reference type is script, the reference is not in heading but rather as separate property
        # The callback should decide whether the reference is returned as heading or added as a raw property
        ext_rsrc_hearder = ""
        if asset_category and asset_category in j2tcallback.JSON_TO_TSCN_EXT_RSRC_CALLBACKS:
            ext_rsrc_hearder = j2tcallback.JSON_TO_TSCN_EXT_RSRC_CALLBACKS[asset_category](inst, rsrcs, assets, ext_rsrcs)

        # Godot needs a list of NodePath (aka reference properties) in the first line of the node
        ref_props = inst.get_ref_props().keys()
        ref_props_names = [f'"{name}"' for name in ref_props]
        ref_props_str = ", ".join(ref_props_names)

        node: list[str] = []

        node_type = f' type="{inst.tscn_type}"' if inst.tscn_type != "" else ""
        node_paths = f" {const.PROP_NODE_PATHS}=PackedStringArray({ref_props_str})" if ref_props else ""
        node_heading = f'[{const.TYPE_NODE} name="{inst.name}"{node_type} parent="{parent}"{node_paths} {ext_rsrc_hearder}]'

        node.append(node_heading)
        node.extend(_create_properties(inst.props))
        node.append(f'id = "{inst.id}"')
        nodes.append(node)
    return nodes


def _create_level_nodes(level_name: str, json_level: jstype.Level, assets: jstype.Assets, rsrcs: jstype.Resources) -> tuple[list[list[str]], jstype.InstanceResource]:
    level_nodes: list[list[str]] = []
    ext_rsrcs: jstype.InstanceResource = {}
    level_nodes.append([_create_root_node(level_name)])
    for layer in json_level.layers:
        level_nodes.append([f'[{const.TYPE_NODE} name="{layer.id}" type="{const.PROP_TYPE_NODE3D}" parent="."]'])
        layer_nodes = _create_instance_nodes(layer.insts, assets, rsrcs, layer.id, ext_rsrcs)
        level_nodes.extend(layer_nodes)
    return level_nodes, ext_rsrcs
