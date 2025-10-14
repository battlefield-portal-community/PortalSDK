import argparse
import os
import sys
from pathlib import Path

from gdconverter import _json_parser as jparser
from gdconverter import _json_scene_types as jstype
from gdconverter import _json_to_tscn as j2t
from gdconverter import _logging, _meta, _utils


def import_spatial(fb_export_data_dir: Path, output_dir: Path, spatial: Path) -> bool:
    """Create a godot project using level json and types"""
    if not os.path.exists(fb_export_data_dir):
        _logging.log_error(f"Path does not exist {fb_export_data_dir}")
        return False
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    config = _meta.get_configs(Path(fb_export_data_dir), Path(output_dir))

    raw_resources: jstype.Resources = {}
    asset_resources: jstype.Resources = {}
    assets: jstype.Assets = {}
    levels: jstype.Levels = {}

    if not _utils.process_asset_types(config, assets):
        _logging.log_error("Error encountered while processing asset types")
        return False

    _utils.process_level_file(spatial, output_dir / spatial.name, levels)

    j2t.add_levels_to_assets(assets, levels, str(output_dir))

    if not j2t.create_godot_files_from_assets(assets, raw_resources, asset_resources, str(output_dir), config, allow_missing_meshes=True, skip_writing_files=True):
        _logging.log_error("Error encountered while creating godot files from assets")
        return False
    jparser.resolve_property_types_levels(levels, assets)
    j2t.create_level_tscns(levels, assets, raw_resources, asset_resources, str(output_dir), True)

    return True


def _main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("FB_EXPORT_DATA", type=str, help="Path to FbExportData directory")
    parser.add_argument("OUTPUT_DIR", type=str, help="Path where godot project will be created")
    parser.add_argument("SPATIAL", type=str, help="Path to spatial json to import")
    args = parser.parse_args()

    fb_export_data_dir = Path(args.FB_EXPORT_DATA)
    output_dir = Path(args.OUTPUT_DIR)
    spatial = Path(args.SPATIAL)
    result = import_spatial(fb_export_data_dir, output_dir, spatial)
    if not result:
        sys.exit(1)


if __name__ in "__main__":
    _main()
