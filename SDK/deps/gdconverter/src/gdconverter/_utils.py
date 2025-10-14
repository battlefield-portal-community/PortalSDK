import filecmp
import json
import os
import shutil
from collections.abc import Callable
from pathlib import Path
from typing import Any

from gdconverter import _constants as const
from gdconverter import _json_parser as jparser
from gdconverter import _json_scene_types as jstype
from gdconverter import _logging
from gdconverter._meta import Config


def walk_src(src_dir: Path, dst_dir: Path, file_callback: Callable[[Path, Path], None]) -> None:
    """Walk directory tree, creating directories to mirror source"""
    _logging.log_debug(f"walk_src {src_dir} -> {dst_dir}")
    for root, _, files in os.walk(src_dir, topdown=True):
        dst_root = os.path.normpath(root.replace(str(src_dir), str(dst_dir), 1))
        if not os.path.exists(dst_root):
            os.makedirs(dst_root)
        for f in files:
            src_file = os.path.join(root, f)
            dst_file = os.path.join(dst_root, f)
            file_callback(Path(src_file), Path(dst_file))


def process_types(src_file: Path, file_callback: Callable[[str], None]) -> None:
    _logging.log_debug(f"process_types {src_file}")
    with open(src_file, encoding="utf-8") as asset_type_file:
        asset_type = json.load(asset_type_file)
    if not asset_type:
        return
    if "AssetTypes" not in asset_type:
        return
    for type in asset_type["AssetTypes"]:
        file_callback(json.dumps(type))


def read_src(src_dir: str, dst_dir: str, file_callback: Callable[[str, str], None]) -> None:
    """Walk directory tree"""
    _logging.log_debug(f"read_src {src_dir} -> {dst_dir}")
    for root, _, files in os.walk(src_dir, topdown=True):
        dst_root = os.path.normpath(root.replace(src_dir, dst_dir, 1))
        for f in files:
            src_file = os.path.join(root, f)
            dst_file = os.path.join(dst_root, f)
            file_callback(src_file, dst_file)


def process_resource_file(src_file: Path, dst_file: Path, resources: jstype.Resources) -> None:
    """Copies resource file from src to dst and create 'resource' object
    'resource' contains paths and file info about the copied file
    Add resource to resource collection with (key=inst_type, value=dict(key=file_ext, resource))
    """
    # can only handle glb meshes
    if src_file.suffix != ".glb":
        _logging.log_warning("Cannot handle non-glb resource. Skipping")
        return

    if dst_file.exists() and not filecmp.cmp(src_file, dst_file, shallow=True):
        # contents differ therefore copy over file
        shutil.copy2(src_file, dst_file)
    elif not dst_file.exists():
        shutil.copy2(src_file, dst_file)
    resource = jstype.create_resource(src_file)
    if not resource:
        return
    if resource.id not in resources:
        resources[resource.id] = {}
    resources[resource.id][resource.ext] = resource


def process_asset_types(config: Config, assets: jstype.Assets) -> bool:
    if not config.src_types.exists():
        _logging.log_error(f"Expected path to exist {config.src_types}")
        return False

    json_types: dict[str, Any] = json.loads(config.src_types.read_text())
    asset_types = json_types.get(const.TYPES_KEY_ID, None)
    if asset_types is None:
        _logging.log_error(f"Asset types malformed. Expected {const.TYPES_KEY_ID} object to be present")
        return False

    level_to_theater: dict[str, str] = {}
    level_info: dict[str, Any] = json.loads(config.level_info.read_text())
    for level_name, data in level_info.items():
        if "theater" in data:
            theater = data["theater"]
            level_to_theater[level_name] = theater

    custom_types: set[str] = set()
    # Add custom types to idenfity properties that are references
    for asset_type in asset_types:
        custom_types.add(asset_type["type"])
    # Some types are built-in Godot objects. Properties of these types are also references.
    for gd_type in const.TYPES_CUSTOM_TYPES:
        custom_types.add(gd_type)
    for asset_type in asset_types:
        dst_file = os.path.join(config.dst_assets, _get_level_directory(asset_type, level_to_theater), asset_type.get(const.ASSET_KEY_DIRECTORY, ""))
        asset = jparser.parse_asset_data(asset_type, custom_types, error_callback=lambda msg: _logging.log_error(msg))
        if not asset:
            _logging.log_error("Failed to parse asset")
            return False
        asset.set_path(Path(dst_file))
        assets[asset.id.lower()] = asset
    return True


def process_level_file(src_file: Path, dst_file: Path, levels: jstype.Levels) -> None:
    """Processes .json files and create 'level' object
    'level' contains layers and instances in the level described by .json file
    Add level to level collection with (key=src_file, value=level)
    """
    if src_file.suffixes[-2:] != [".spatial", ".json"]:
        return
    _logging.log_debug(f"process_level_file {src_file} -> {dst_file}")
    with open(src_file, encoding="utf-8") as level_file:
        level = jparser.parse_level(level_file.read())
    if not level:
        return
    level.src = str(src_file)
    level.dst = str(dst_file).replace(".spatial.json", ".tscn")
    levels[str(src_file)] = level


def get_filename_without_ext(path: str) -> str:
    """foo/bar/baz.txt -> baz"""
    return os.path.splitext(os.path.basename(path))[0]


def _get_level_directory(asset_type: dict[str, Any], level_to_theater: dict[str, str]) -> str:
    restrictions: list[str] = asset_type.get(const.ASSET_KEY_RESTRICTIONS, [])
    directory = asset_type.get(const.ASSET_KEY_DIRECTORY, "")
    directory = directory.lower()
    if len(restrictions) == 0:
        if "entities" not in directory and "gameplay" not in directory and "global" not in directory:
            return "Global/"
        else:
            return ""

    theaters = list(set([level_to_theater[level] for level in restrictions if level in level_to_theater]))
    if len(theaters) == 1:
        theater_name = theaters[0]
        if len(restrictions) == 1:
            level_name = restrictions[0]
            return f"{theater_name}/{level_name}"
        return f"{theater_name}/Shared"
    elif len(theaters) > 1:
        return "Shared"
    else:
        return ""
