import json
from glob import glob
from pathlib import Path

from gdconverter.export_tscn import export_tscn

from tests.utils import TEST_GD_LEVELS, check_object_equals, setup_mock_project


def test_waypointpath(tmp_path: Path) -> None:
    waypoint_type_name = "AI_WaypointPath"
    waypoint_entity_type_name = "WaypointPath"
    mock = setup_mock_project(tmp_path, [waypoint_type_name, waypoint_entity_type_name])
    assert mock is not None

    glob_tscn = glob(f"{mock.gd_proj}/**/{waypoint_type_name}.tscn", recursive=True)
    assert len(glob_tscn) == 1
    glob_tscn = glob(f"{mock.gd_proj}/**/{waypoint_entity_type_name}.tscn", recursive=True)
    assert len(glob_tscn) == 0

    glob_gd = glob(f"{mock.gd_proj}/**/{waypoint_type_name}.gd", recursive=True)
    assert len(glob_gd) == 1
    glob_gd = glob(f"{mock.gd_proj}/**/{waypoint_entity_type_name}.gd", recursive=True)
    assert len(glob_gd) == 0

    example_level = TEST_GD_LEVELS / "test_waypointpath.tscn"
    assert example_level.exists()

    exported_level_path = export_tscn(example_level, mock.fb_data, mock.export)
    assert exported_level_path.exists()

    exported_data = json.loads(exported_level_path.read_text())
    assert "Portal_Dynamic" in exported_data
    assert len(exported_data["Portal_Dynamic"]) == 2

    waypoint = exported_data["Portal_Dynamic"][0]
    waypoint_entity = exported_data["Portal_Dynamic"][1]
    entity_name = waypoint_entity.get("name")

    expected_waypoint = {
        "name": waypoint_type_name,
        "type": waypoint_type_name,
        "right": {"x": 1, "y": 0, "z": 0},
        "up": {"x": 0, "y": 1, "z": 0},
        "front": {"x": 0, "y": 0, "z": 1},
        "position": {"x": 3.31579, "y": 0, "z": 1.51627},
        "id": waypoint_type_name,
        "Waypoints": entity_name,
        "linked": ["Waypoints"],
    }

    check_object_equals(expected_waypoint, waypoint)

    expected_waypoint_entity = {
        "name": entity_name,
        "type": waypoint_entity_type_name,
        "id": entity_name,
        "points": [
            {"x": 2.657564, "y": 0.0711787, "z": 2.50575},
            {"x": 3.215021, "y": 0.6327, "z": 0.780355},
            {"x": 3.977378, "y": 0.408619, "z": -0.16352},
            {"x": 4.67219, "y": -0.606339, "z": 0.13325},
            {"x": 4.003764, "y": -1.10195, "z": 1.94853},
            {"x": 3.417719, "y": -1.00441, "z": 2.78074},
        ],
    }

    check_object_equals(expected_waypoint_entity, waypoint_entity)
