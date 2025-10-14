import argparse
import os
import shutil
import sys
from pathlib import Path

from gdconverter import _constants as const
from gdconverter import _json_parser as jparser
from gdconverter import _json_scene_types as jstype
from gdconverter import _json_to_tscn as j2t
from gdconverter import _logging, _meta, _utils


def create_godot(fb_export_data_dir: str, output_dir: str, overwrite_levels: bool = False) -> bool:
    """Create a godot project using level json and types"""
    if not os.path.exists(fb_export_data_dir):
        _logging.log_error(f"Path does not exist {fb_export_data_dir}")
        return False
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    project_filepath = Path(output_dir) / const.PROJECT_FILE_NAME
    project_filepath.write_text(const.PROJECT_FILE_CONTENT, encoding="utf-8")

    config = _meta.get_configs(Path(fb_export_data_dir), Path(output_dir))

    raw_resources: jstype.Resources = {}
    asset_resources: jstype.Resources = {}
    assets: jstype.Assets = {}
    levels: jstype.Levels = {}

    def resource_file_callback(src_file: Path, dst_file: Path) -> None:
        _utils.process_resource_file(src_file, dst_file, raw_resources)

    if not _utils.process_asset_types(config, assets):
        _logging.log_error("Error encountered while processing asset types")
        return False

    def level_file_callback(src_file: Path, dst_file: Path) -> None:
        _utils.process_level_file(src_file, dst_file, levels)

    _utils.walk_src(config.src_resources, config.dst_resources, file_callback=resource_file_callback)
    _utils.walk_src(config.src_levels, config.dst_levels, file_callback=level_file_callback)

    j2t.add_levels_to_assets(assets, levels, output_dir)

    if config.dst_assets.exists():
        try:
            shutil.rmtree(config.dst_assets)
        except PermissionError:
            _logging.log_error(f"Cannot remove path (is it being used by another process?): {config.dst_assets}")
            return False

    if config.dst_scripts.exists():
        try:
            shutil.rmtree(config.dst_scripts)
        except PermissionError:
            _logging.log_error(f"Cannot remove path (is it being used by another process?): {config.dst_scripts}")
            return False

    if not j2t.create_godot_files_from_assets(assets, raw_resources, asset_resources, output_dir, config):
        _logging.log_error("Error encountered while creating godot files from assets")
        return False
    jparser.resolve_property_types_levels(levels, assets)

    j2t.create_level_tscns(levels, assets, raw_resources, asset_resources, output_dir, overwrite_levels)

    return True


def _main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("FB_EXPORT_DATA", type=str, help="Path to FbExportData directory")
    parser.add_argument("OUTPUT_DIR", type=str, help="Path where godot project will be created")
    parser.add_argument("--overwrite-levels", action="store_true", help="Overwriting existing levels in project")
    args = parser.parse_args()

    fb_export_data_dir = args.FB_EXPORT_DATA
    output_dir = args.OUTPUT_DIR
    overwrite_levels = args.overwrite_levels
    result = create_godot(fb_export_data_dir, output_dir, overwrite_levels)
    if not result:
        sys.exit(1)


if __name__ in "__main__":
    _main()
