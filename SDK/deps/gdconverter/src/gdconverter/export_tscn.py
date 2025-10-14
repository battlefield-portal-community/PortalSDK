import argparse
import os
import sys
from pathlib import Path

from gdconverter import _json_scene_types as jstype
from gdconverter import _logging, _meta, _utils
from gdconverter import _tscn_to_json as t2j


def export_tscn(tscn_file: Path, fb_export_data_dir: str, output_dir: str) -> Path | None:
    """Given a tscn, convert it to intermediate json.

    Returns the path to the resulting json, or None if there was an error during export"""

    if not tscn_file.exists():
        _logging.log_error(f"Scene does not exist: {tscn_file}")
        return None
    if not os.path.exists(fb_export_data_dir):
        _logging.log_error(f"FbExportData directory does not exist: {fb_export_data_dir}")
        return None

    if not tscn_file.is_file() or tscn_file.suffix != ".tscn":
        _logging.log_error(f"The given path is not a file ending an .tscn: {tscn_file}")
        return None

    os.makedirs(output_dir, exist_ok=True)

    config = _meta.get_configs(Path(fb_export_data_dir), Path(output_dir))

    assets: jstype.Assets = {}

    _utils.process_asset_types(config, assets)

    dst_file = (Path(output_dir) / tscn_file.name).with_suffix(".spatial.json")

    result = t2j.process_scene_file(tscn_file, dst_file, assets)
    if not result:
        _logging.log_error(f"Unable to export scene file {tscn_file}")
        return None
    return dst_file


def _main() -> None:
    parser = argparse.ArgumentParser(description="Given a tscn, convert it to intermediate json")
    parser.add_argument("SCENE_FILE", type=str, help="Scene (.tscn) file to export")
    parser.add_argument("FB_EXPORT_DATA", type=str, help="Path to FbExportData directory")
    parser.add_argument("OUTPUT_DIR", type=str, help="Path where exported level will be created")
    args = parser.parse_args()

    scene_file: str = args.SCENE_FILE
    fb_export_data_dir: str = args.FB_EXPORT_DATA
    output_dir: str = args.OUTPUT_DIR
    result = export_tscn(Path(scene_file), fb_export_data_dir, output_dir)
    if not result:
        sys.exit(1)
    print(result)


if __name__ in "__main__":
    _main()
