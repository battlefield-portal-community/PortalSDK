import json
import os
from pathlib import Path
from typing import Any

from gdconverter.export_tscn import export_tscn
from gdconverter.import_spatial import import_spatial

from tests.utils import TEST_GD_LEVELS, check_object_equals, setup_mock_project


def test_polygon_volume(tmp_path: Path) -> None:
    test_type = "PolygonVolume"
    mock = setup_mock_project(tmp_path, [test_type])
    assert mock is not None
    assert len(os.listdir(mock.gd_proj)) == 0, f"Expected no files to have been created for {test_type}"

    example_level = TEST_GD_LEVELS / "test_polygon_volume.tscn"
    assert example_level.exists()

    exported_level_path = export_tscn(example_level, mock.fb_data, mock.export)
    assert exported_level_path.exists()

    exported_data = json.loads(exported_level_path.read_text())

    assert "Portal_Dynamic" in exported_data
    assert len(exported_data["Portal_Dynamic"]) == 1
    polygon: dict[str, Any] = exported_data["Portal_Dynamic"][0]

    expected = {
        "type": test_type,
        "name": test_type,
        "id": test_type,
        "height": 0,
        "points": [
            {"x": 0, "y": 6, "z": 2},
            {"x": 0, "y": 6, "z": 12},
            {"x": 10, "y": 6, "z": 12},
            {"x": 10, "y": 6, "z": 2},
        ],
    }
    check_object_equals(expected, polygon)

    assert import_spatial(mock.fb_data, mock.gd_proj / "levels", exported_level_path)
    imported_level_path = mock.gd_proj / "levels" / example_level.name
    assert imported_level_path.exists()

    exported_level_path = export_tscn(imported_level_path, mock.fb_data, mock.export.with_name("export_again"))
    assert exported_level_path.exists()
    exported_data = json.loads(exported_level_path.read_text())

    assert "Portal_Dynamic" in exported_data
    assert len(exported_data["Portal_Dynamic"]) == 1
    polygon = exported_data["Portal_Dynamic"][0]
    polygon["id"] = test_type

    check_object_equals(expected, polygon)


def test_obb_volume(tmp_path: Path) -> None:
    test_type = "OBBVolume"
    mock = setup_mock_project(tmp_path, [test_type])
    assert mock is not None
    assert len(os.listdir(mock.gd_proj)) == 0, f"Expected no files to have been created for {test_type}"

    example_level = TEST_GD_LEVELS / "test_obb_volume.tscn"
    assert example_level.exists()

    exported_level_path = export_tscn(example_level, mock.fb_data, mock.export)
    assert exported_level_path.exists()

    exported_data = json.loads(exported_level_path.read_text())

    assert "Portal_Dynamic" in exported_data
    assert len(exported_data["Portal_Dynamic"]) == 1
    obb: dict[str, Any] = exported_data["Portal_Dynamic"][0]

    expected = {
        "name": test_type,
        "type": test_type,
        "id": test_type,
        "right": {"x": 1, "y": 0, "z": 0},
        "up": {"x": 0, "y": 1, "z": 0},
        "front": {"x": 0, "y": 0, "z": 1},
        "position": {"x": 5, "y": 6, "z": 7},
        "size": [3, 4, 5],
    }
    check_object_equals(expected, obb)

    assert import_spatial(mock.fb_data, mock.gd_proj / "levels", exported_level_path)
    imported_level_path = mock.gd_proj / "levels" / example_level.name
    assert imported_level_path.exists()

    exported_level_path = export_tscn(imported_level_path, mock.fb_data, mock.export.with_name("export_again"))
    assert exported_level_path.exists()
    exported_data = json.loads(exported_level_path.read_text())

    assert "Portal_Dynamic" in exported_data
    assert len(exported_data["Portal_Dynamic"]) == 1
    obb = exported_data["Portal_Dynamic"][0]
    obb["id"] = test_type

    check_object_equals(expected, obb)
