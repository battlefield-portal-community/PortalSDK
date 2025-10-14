import json
import os
from pathlib import Path

from gdconverter.export_tscn import export_tscn

from tests.utils import TEST_FB_DATA, TEST_FB_LEVELS, TEST_GD_LEVELS

ROOT = Path(os.path.dirname(os.path.abspath(__file__)))


def test_export_empty() -> None:
    assert export_tscn(Path(""), "", "") is None


def test_export_dir() -> None:
    assert export_tscn(ROOT, TEST_FB_DATA, ".") is None


def test_export_non_tscn() -> None:
    fb_export_data = TEST_FB_DATA
    non_tscn = TEST_FB_LEVELS / "simple.spatial.json"
    assert export_tscn(non_tscn, fb_export_data, ".") is None


def test_export_simple(tmp_path: Path) -> None:
    simple_scene = TEST_GD_LEVELS / "simple.tscn"
    fb_export_data = TEST_FB_DATA
    output = tmp_path
    output_file = export_tscn(simple_scene, str(fb_export_data), str(output))
    assert output_file
    data = json.loads(output_file.read_text())
    objects = data["Portal_Dynamic"]
    assert len(objects) == 1
