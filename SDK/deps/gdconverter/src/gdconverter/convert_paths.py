import argparse
import os
import sys
import tempfile
from pathlib import Path

from gdconverter import _constants as const
from gdconverter import _json_scene_types as jstype
from gdconverter import _logging, _meta, _utils
from gdconverter import _tscn_parser as tparser
from gdconverter import _tscn_to_json as t2j
from gdconverter import _tscn_types as ttype


class ConvertPathsArgs:
    tscn_file: Path
    fb_export_data_dir: Path
    dry_run: bool = False
    ignore_case: bool = False
    error_missing_types: bool = False


def convert_paths(args: ConvertPathsArgs) -> bool:
    """Given a level tscn, convert its paths to match the expected object tscns.

    Returns true if successfully converted, or no conversion required. Otherwise false if parsing errors existed"""

    if not args.tscn_file.exists():
        _logging.log_error(f"Scene does not exist: {args.tscn_file}")
        return False
    if not os.path.exists(args.fb_export_data_dir):
        _logging.log_error(f"FbExportData directory does not exist: {args.fb_export_data_dir}")
        return False

    if not args.tscn_file.is_file() or args.tscn_file.suffix != ".tscn":
        _logging.log_error(f"The given path is not a file ending an .tscn: {args.tscn_file}")
        return False

    temp_output = Path(tempfile.gettempdir()) / "temp_convert_paths"
    config = _meta.get_configs(Path(args.fb_export_data_dir), temp_output)

    assets: jstype.Assets = {}

    if not _utils.process_asset_types(config, assets):
        _logging.log_error("Error encountered while processing asset types")
        return False

    print(f"Reading {args.tscn_file}")
    tscn_instances = tparser.parse_scene(args.tscn_file)
    if not tscn_instances:
        _logging.log_error(f"{args.tscn_file.name}: Unable to parse scene: {args.tscn_file}")
        return False

    scene_data = ttype.Scene()
    t2j._create_ext_resources(scene_data, tscn_instances.setdefault(const.TYPE_EXTRES, []))

    fixes: dict[str, str] = {}  # key: broken path, value: fixed path
    has_missing_types = False

    for ext_resource in scene_data.ext_resources.values():
        if ".glb" in Path(ext_resource.path).suffix:
            continue  # don't handle glb files
        type_name = Path(ext_resource.path).stem.lower()
        if type_name not in assets:
            if "_terrain" in type_name or "_assets" in type_name:
                continue
            # type is simply gone
            _logging.log_error(f"{args.tscn_file.name}: Type does not exist: {type_name}")
            has_missing_types = True
            continue
        asset = assets[type_name]
        expected_path = "res://" + asset.dst.removeprefix(str(temp_output) + os.path.sep).replace("\\", "/") + f"/{asset.id}"
        if type_name == "volume":
            expected_path = expected_path.replace(config.dst_assets.stem, config.dst_scripts.stem)
        elif type_name == "polygonvolume":
            expected_path = "res://addons/bf_portal/portal_tools/types/PolygonVolume/PolygonVolume"
        elif type_name == "obbvolume":
            expected_path = "res://addons/bf_portal/portal_tools/types/OBBVolume/OBBVolume"
        actual_path = "res://" + str(Path(ext_resource.path).with_suffix("")).replace("\\", "/")

        path_mismatch = expected_path != actual_path if not args.ignore_case else expected_path.lower() != actual_path.lower()
        if path_mismatch:
            _logging.log_warning(f"{args.tscn_file.name}: Type does not use correct path:\n" + f"\tCorrect: {expected_path}\n" + f"\tFound:   {actual_path}")
            fixes[actual_path] = expected_path

    if has_missing_types:
        _logging.log_error("Types in tscn found to be missing. This is considered a failed conversion.")
        if args.error_missing_types:
            _logging.log_error("Will not attempt conversion since error_missing_types is enabled")
            return False

    if not args.dry_run:
        if len(fixes) == 0:
            _logging.log_info(f"{args.tscn_file.name}: No path fixes to apply for {args.tscn_file}")
            return True
        contents = args.tscn_file.read_text()
        for broken, fixed in fixes.items():
            contents = contents.replace(broken, fixed)
        args.tscn_file.write_text(contents, encoding="utf-8")

    return True


def _main() -> None:
    parser = argparse.ArgumentParser(description="Given a tscn, update its tscn references to correctly point to new ones")
    parser.add_argument("SCENE_FILE", type=str, help="Scene (.tscn) file to export")
    parser.add_argument("FB_EXPORT_DATA", type=str, help="Path to FbExportData directory")
    parser.add_argument("--dry-run", required=False, action="store_true", help="Show would would change but don't write to any files")
    parser.add_argument("--error-missing-types", required=False, action="store_true", help="Missing types results in an error")
    args = parser.parse_args()

    convert_args = ConvertPathsArgs()
    convert_args.tscn_file = Path(args.SCENE_FILE)
    convert_args.fb_export_data_dir = Path(args.FB_EXPORT_DATA)
    convert_args.dry_run = args.dry_run
    convert_args.error_missing_types = args.error_missing_types

    result = convert_paths(convert_args)
    if result is None:
        sys.exit(1)


if __name__ in "__main__":
    _main()
