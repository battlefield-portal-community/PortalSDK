from pathlib import Path

EXPORT_LEVEL_IGNORE_DIR = {"assets", "types"}


class Config:
    src_types: Path
    src_resources: Path
    src_levels: Path
    dst_assets: Path
    dst_scripts: Path
    dst_resources: Path
    dst_levels: Path
    level_info: Path


def get_configs(src: Path, dst: Path) -> Config:
    """Load configs from meta file and populate module variables"""

    config = Config()

    config.src_types = src / "asset_types.json"
    config.src_resources = src / "raw"
    config.src_levels = src / "levels"

    config.dst_assets = dst / "objects"
    config.dst_scripts = dst / "scripts"
    config.dst_resources = dst / "raw"
    config.dst_levels = dst / "levels"

    config.level_info = src / "level_info.json"

    return config
