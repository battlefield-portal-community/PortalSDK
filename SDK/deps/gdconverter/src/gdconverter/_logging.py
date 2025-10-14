"""Logging functions using built-in logging package"""

import inspect
import logging
from typing import Any

from gdconverter._termcolor import colored

DEBUG_ASSET = False
DEBUG_LEVEL = False
VERBOSE = True
CALLSTACK = False


def log_error(msg: str) -> None:
    """Log error message"""
    _get_logger().error(colored(msg, "red"))
    _log_callstack()


def log_warning(msg: str) -> None:
    """Log warning message"""
    _get_logger().warning(colored(msg, "yellow"))
    _log_callstack()


def log_info(msg: str) -> None:
    """Log info message"""
    _get_logger().info(msg)
    _log_callstack()


def log_debug(msg: str) -> None:
    """Log debug message"""
    _get_logger().debug(msg)
    _log_callstack()


def log_debug_object(obj: Any, indent: int = 0) -> None:
    """Log object structure, indenting by the given amount"""
    avars = [(attr, getattr(obj, attr)) for attr in dir(obj) if not callable(getattr(obj, attr)) and not attr.startswith("__")]
    for avar in avars:
        log_debug("\t" * indent + str(avar[0]) + ":")
        try:
            log_debug("\t" * (indent + 1) + str(vars(avar[1])) if isinstance(avar[1], object) else str(avar[1]))
        except Exception:  # pylint: disable=broad-exception-caught
            log_debug("\t" * (indent + 1) + str(avar[1]))


def log_debug_asset(asset: Any) -> None:
    """Log dbx asset"""
    if not DEBUG_ASSET:
        return
    log_debug("=" * 80)
    attrs = [(attr, getattr(asset, attr)) for attr in dir(asset) if not callable(getattr(asset, attr)) and not attr.startswith("__")]
    for attr in attrs:
        log_debug(attr[0] + " :")
        if not isinstance(attr[1], dict):
            log_debug("\t" + str(attr[1]))
            continue
        for key, value in attr[1].items():
            log_debug("\t" + str(key) + ":")
            if not isinstance(value, object):
                log_debug("\t\t" + str(value))
                continue
            log_debug_object(value, 2)
        log_debug("-" * 40)
    log_debug("=" * 80)
    log_debug("\n")


def log_debug_level(level: Any) -> None:
    """Log level"""
    if not DEBUG_LEVEL:
        return
    log_debug("=" * 80)
    log_debug(vars(level))
    log_debug("-" * 40)
    log_debug("Layers: ")
    for layer in level.layers:
        log_debug("\t" + "-" * 40)
        log_debug("\t" + str(vars(layer)))
        log_debug("\tInstances: ")
        for inst in layer.insts:
            log_debug("\t\t" + "-" * 40)
            log_debug("\t\t" + str(vars(inst)))
    log_debug("=" * 80)
    log_debug("\n\n")


def _get_logger() -> logging.Logger:
    return logging.getLogger(__package__)


def _log_callstack() -> None:
    if not CALLSTACK or not VERBOSE:
        return
    for callstack in inspect.stack():
        _get_logger().info("\t %s", str(callstack[1:4]))
    _get_logger().info("")
