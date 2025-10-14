from decimal import Decimal, InvalidOperation
from pathlib import Path
from re import Match
from typing import Any

from gdconverter import _constants as const
from gdconverter import _logging
from gdconverter import _tscn_regex as tregex
from gdconverter import _tscn_types as ttype


def parse_scene(src_file: Path) -> dict[str, list[ttype.Instance]] | None:
    instances: dict[str, list[ttype.Instance]] = {}
    curr_inst = None
    curr_struct = None

    contents = src_file.read_text()
    lines = contents.splitlines(keepends=True)
    for i in range(len(lines)):
        line = lines[i]
        if line.strip() == "":
            continue
        line = line.lstrip()
        # Check if the next line starts a new instance
        # If there's a match, the current instance has reached its end and add it to instance list
        # Then parse the new instance and set it to current
        inst_match = tregex.re_inst.fullmatch(line)
        attr_list = ""
        if inst_match:
            if curr_inst:
                inst_in_type = instances.setdefault(curr_inst.type, [])
                inst_in_type.append(curr_inst)
            (curr_inst, attr_list) = _parse_inst(inst_match)
        elif curr_inst:
            attr_list = line
        else:
            _logging.log_error("ERROR: Orphan attribute that does not have an owner instance:")
            _logging.log_error(f"{src_file.name}:{i+1}\t{line.strip()}")
            return None
        # If we encounter an struct, it can span multiple lines.
        # Keep track of the current struct, if any.
        # When multiline is false, the struct is closed and we add the struct to current instance's attrs
        if curr_struct or _is_object_open(attr_list):
            (curr_struct, multiline) = _parse_struct_data(attr_list, curr_struct)
            if not multiline:
                curr_inst.attrs.update([(curr_struct.name, curr_struct)])
                curr_struct = None
        else:
            curr_inst.attrs.update(_parse_attr_list(attr_list))
    if curr_inst:
        inst_in_type = instances.setdefault(curr_inst.type, [])
        inst_in_type.append(curr_inst)
    _logging.log_debug(str(len(instances)) + " types")
    for instance_type, instance_list in instances.items():
        _logging.log_debug(f'{str(len(instance_list))} instances in type "{instance_type}":')
        for instance in instance_list:
            _logging.log_debug("\t" + str(vars(instance)))
    _logging.log_debug("")
    return instances


def _consume_attr_list(attr_list: str, attr_match: Match[str]) -> str:
    attr_list = attr_list[: attr_match.start()] + attr_list[attr_match.end() :].strip()
    return attr_list


def _clean_value(v: str) -> Any:
    if v == "true":
        return True
    if v == "false":
        return False
    if isinstance(v, str):
        v = v.strip('"')
    try:
        dec = Decimal(v)
        return dec
    except InvalidOperation:
        return v


def _parse_cmpx(cmpx: str) -> ttype.Complex | None:
    match = tregex.re_val_cmpx.match(cmpx)
    if not match:
        return None
    cmpx_type = match.group("type")
    cmpx_params = match.group("params")
    new_cmpx = ttype.Complex(cmpx_type)
    params = cmpx_params.split(", ")
    if cmpx_type in const.CMPX_EXTRSRC and len(params) == 1:
        new_cmpx.params.append(params[0].strip('"'))
        return new_cmpx
    for value in params:
        new_cmpx.params.append(_clean_value(value))
    return new_cmpx


def _parse_array(elems: str) -> ttype.Array:
    new_arr = ttype.Array()
    while elems != "":
        attr_match = None
        attr_value = None
        if not attr_match:
            attr_match = tregex.re_val_str.match(elems)
            attr_value = attr_match.group("value") if attr_match else attr_value
        if not attr_match:
            attr_match = tregex.re_val_num.match(elems)
            attr_value = float(attr_match.group("value")) if attr_match else attr_value
        if not attr_match:
            attr_match = tregex.re_val_btrue.match(elems)
            attr_value = True
        if not attr_match:
            attr_match = tregex.re_val_bfalse.match(elems)
            attr_value = False
        if not attr_match:
            attr_match = tregex.re_val_cmpx.match(elems)
            attr_value = _parse_cmpx(elems) if attr_match else attr_value
        if attr_match:
            new_arr.elems.append(attr_value)
            elems = elems[: attr_match.start()] + elems[attr_match.end() :].strip()
            if elems and elems[0] == ",":
                elems = elems[1:].strip()
        else:
            _logging.log_error(f"\tERROR: Failed to parse array: [{elems}]")
            break
    return new_arr


def _parse_first_attr(attr_list: str) -> tuple[Match[str] | None, str | None, Any]:
    attr_match = None
    attr_name = None
    attr_value = None
    if not attr_match:
        attr_match = tregex.re_attr_null.match(attr_list)
        attr_value = attr_match.group("value") if attr_match else attr_value
    if attr_match:
        print("null")
    if not attr_match:
        attr_match = tregex.re_attr_str.match(attr_list)
        attr_value = attr_match.group("value") if attr_match else attr_value
    # Make sure match for non-negative numbers since they can also be enums
    if not attr_match:
        attr_match = tregex.re_attr_enum.match(attr_list)
        attr_value = ttype.Enum(int(attr_match.group("value"))) if attr_match else attr_value
    if not attr_match:
        attr_match = tregex.re_attr_num.match(attr_list)
        attr_value = float(attr_match.group("value")) if attr_match else attr_value
    if not attr_match:
        attr_match = tregex.re_attr_btrue.match(attr_list)
        attr_value = True
    if not attr_match:
        attr_match = tregex.re_attr_bfalse.match(attr_list)
        attr_value = False
    if not attr_match:
        attr_match = tregex.re_attr_array.match(attr_list)
        attr_value = _parse_array(attr_match.group("value").strip()) if attr_match else attr_value
    if not attr_match:
        attr_match = tregex.re_attr_cmpx.match(attr_list)
        attr_value = _parse_cmpx(attr_match.group("value").strip()) if attr_match else attr_value
    if not attr_match:
        attr_match = tregex.re_attr_meta.match(attr_list)
        attr_value = None  # ignore metadata values
    if attr_match:
        attr_name = attr_match.group("name")
    return (attr_match, attr_name, attr_value)


def _parse_attr_list(attr_list: str) -> dict[str, Any]:
    attr_list = attr_list.strip()
    attrs = {}
    while attr_list != "":
        (attr_match, attr_name, attr_value) = _parse_first_attr(attr_list)
        if not attr_match:
            _logging.log_error("\t" + f"ERROR: Failed to parse attribute list: {attr_list}")
            break
        if attr_name is not None:
            attrs[attr_name] = attr_value
        attr_list = _consume_attr_list(attr_list, attr_match)
    return attrs


def _parse_inst(inst_match: Match[str]) -> tuple[ttype.Instance, str]:
    inst_type = inst_match.group("type")
    new_inst = ttype.Instance(inst_type)
    return (new_inst, inst_match.group("attr_list"))


def _is_object_open(attr_list: str) -> bool:
    attr_match = tregex.re_attr_obj_open.match(attr_list)
    return attr_match is not None


def _parse_struct_data(attr_list: str, curr_struct: ttype.Struct | None) -> tuple[ttype.Struct, bool]:
    """return (attr_list, attr_name, attr_value). attr_name is the same as struct name"""
    curr_struct = curr_struct if curr_struct else ttype.Struct("")
    attr_list = attr_list.strip()
    while attr_list != "":
        # match '{' to consume it. we also get name of the struct on the opening line
        attr_match = tregex.re_attr_obj_open.match(attr_list)
        if attr_match:
            curr_struct.name = attr_match.group("name")
            attr_list = _consume_attr_list(attr_list, attr_match)
            continue
        # when we see '}', return the struct and indicate there are no more lines for the struct
        attr_match = tregex.re_attr_obj_close.match(attr_list)
        if attr_match:
            attr_list = _consume_attr_list(attr_list, attr_match)
            return (curr_struct, False)
        # parse data of struct. each line should contain a data name and a data value.
        if attr_list[-1] == ",":
            attr_list = attr_list[:-1]
        attr_match = tregex.re_attr_obj_data.match(attr_list)
        if attr_match:
            attr_name = attr_match.group("name")
            attr_value_raw = attr_match.group("value")
            attr_value = _parse_cmpx(attr_value_raw)
            curr_struct.data[attr_name] = attr_value
            attr_list = _consume_attr_list(attr_list, attr_match)
        else:
            _logging.log_error("\t" + "ERROR: Failed to parse attribute list from struct")
            break
    return (curr_struct, True)
