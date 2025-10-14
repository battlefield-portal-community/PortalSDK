import json
import os
import shutil
from pathlib import Path
from typing import Any

from gdconverter import _json_scene_types as jstype
from gdconverter import _json_to_tscn as j2t
from gdconverter import _meta, _utils

ROOT = Path(os.path.dirname(os.path.abspath(__file__)))
TEST_FB_DATA = ROOT / "TestFbExportData"
TEST_FB_LEVELS = TEST_FB_DATA / "levels"
TEST_GD_LEVELS = ROOT / "TestGodotProject" / "levels"


class MockProject:
    gd_proj: Path
    fb_data: Path
    export: Path


def get_type_data(type_name: str, asset_types: list[dict[str, Any]]) -> dict[str, Any] | None:
    for asset in asset_types:
        assert "type" in asset
        if asset["type"] == type_name:
            return asset
    return None


def setup_mock_project(tmp_path: Path, type_names: list[str]) -> MockProject | None:
    """Setup a mock project with only the types specified. Makes for easier testing in isolation"""

    gd_proj = tmp_path / "gd_proj"
    gd_proj.mkdir()

    fb_data = tmp_path / "fb_data"
    fb_data.mkdir()

    base_fb_data = TEST_FB_DATA

    export = tmp_path / "export"
    export.mkdir()

    level_info_path = base_fb_data / "level_info.json"
    shutil.copyfile(level_info_path, fb_data / level_info_path.name)

    asset_types_path = base_fb_data / "asset_types.json"
    asset_types_obj = json.load(asset_types_path.open())
    assert "AssetTypes" in asset_types_obj
    asset_types = asset_types_obj["AssetTypes"]

    type_data_list: list[dict[str, Any]] = []
    for type_name in type_names:
        type_data = get_type_data(type_name, asset_types)
        assert type_data is not None, f"Expected {type_name} to exist in asset types"
        type_data_list.append(type_data)

    mock_asset_types = {"AssetTypes": type_data_list}
    mock_asset_types_path = fb_data / "asset_types.json"
    mock_asset_types_path.write_text(json.dumps(mock_asset_types))

    config = _meta.get_configs(fb_data, gd_proj)
    config.src_types = mock_asset_types_path

    assets: jstype.Assets = {}

    assert _utils.process_asset_types(config, assets), "Error encountered while processing asset types"

    if not j2t.create_godot_files_from_assets(assets, {}, {}, str(gd_proj), config, allow_missing_meshes=True):
        raise AssertionError("Failed to create godot files")

    mock_project = MockProject()
    mock_project.gd_proj = gd_proj
    mock_project.fb_data = fb_data
    mock_project.export = export
    return mock_project


def check_object_equals(expected: dict[str, Any], obj: dict[str, Any]) -> None:
    for prop, data in expected.items():
        assert prop in obj
        assert data == obj[prop]

    expected_props = set(expected.keys())
    obj_props = set(obj.keys())
    extra_props = obj_props.difference(expected_props)

    assert len(extra_props) == 0, f"Expected no other properties to exist. Found {extra_props}"
