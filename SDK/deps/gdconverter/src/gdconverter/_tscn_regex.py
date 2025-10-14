import re

# Primitive Values
# "..." => string
RE_VAL_STR_PATTERN = r'"(?P<value>[^"]*)"'
re_val_str = re.compile(RE_VAL_STR_PATTERN)
# 123 => int
RE_VAL_INT_PATTERN = r"(?P<value>-?\d+)(?:, *|$| +)"
re_val_int = re.compile(RE_VAL_INT_PATTERN)
# 123.456 => num
RE_VAL_NUM_PATTERN = r"(?P<value>-?\d+(\.\d*)?)"
re_val_num = re.compile(RE_VAL_NUM_PATTERN)
# true => boolean
RE_VAL_BTRUE_PATTERN = "true"
re_val_btrue = re.compile(RE_VAL_BTRUE_PATTERN)
# false => boolean
RE_VAL_BFALSE_PATTERN = "false"
re_val_bfalse = re.compile(RE_VAL_BFALSE_PATTERN)
# [...] => array
RE_VAL_ARRAY_PATTERN = r"\[(?P<value>.+)\]"
re_val_array = re.compile(RE_VAL_ARRAY_PATTERN)
# StructName( params ) => complex
RE_VAL_CMPX_PATTERN = r"(?P<type>\w+)\( *(?P<params>.+?) *\)"
re_val_cmpx = re.compile(RE_VAL_CMPX_PATTERN)
# null
RE_VAL_NULL_PATTERN = r"(?P<value>null)"
re_val_null = re.compile(RE_VAL_NULL_PATTERN)


# Attributes
# opt space before/after '='
RE_ATTR_DECL_PATTERN = r"(?P<name>[\w\/]+) *= *"
# attribute_name="attribute value" => string attribute
re_attr_str = re.compile(RE_ATTR_DECL_PATTERN + RE_VAL_STR_PATTERN)
# attribute_name=non-negative-digits => int/float OR enum (aka selection) attribute
re_attr_enum = re.compile(RE_ATTR_DECL_PATTERN + RE_VAL_INT_PATTERN)
# attribute_name=digits => float attribute
re_attr_num = re.compile(RE_ATTR_DECL_PATTERN + RE_VAL_NUM_PATTERN)
# attribute_name=true => bool true attribute
re_attr_btrue = re.compile(RE_ATTR_DECL_PATTERN + RE_VAL_BTRUE_PATTERN)
# attribute_name=false => bool false attribute
re_attr_bfalse = re.compile(RE_ATTR_DECL_PATTERN + RE_VAL_BFALSE_PATTERN)
# attribute_name=array => array attributes
re_attr_array = re.compile(RE_ATTR_DECL_PATTERN + RE_VAL_ARRAY_PATTERN)
# metadata/attribute_name=* => meta attributes
re_attr_meta = re.compile("(?P<name>metadata/[^ ]+)" + " *= *" + ".*")
# atrribute_name=null -> null references
re_attr_null = re.compile(RE_ATTR_DECL_PATTERN + RE_VAL_NULL_PATTERN)

# attribute_name=StructName( params ) => complex attribute
RE_ATTR_CMPX_PATTERN = RE_ATTR_DECL_PATTERN + r"(?P<value>\w+\(.+?\))"
re_attr_cmpx = re.compile(RE_ATTR_CMPX_PATTERN)


# objects
RE_ATTR_OBJ_OPEN_PATTERN = RE_ATTR_DECL_PATTERN + r"\{"
re_attr_obj_open = re.compile(RE_ATTR_OBJ_OPEN_PATTERN)
RE_ATTR_OBJ_CLOSE_PATTERN = r" *\}"
re_attr_obj_close = re.compile(RE_ATTR_OBJ_CLOSE_PATTERN)

# "<data_name>": <data_value>
RE_ATTR_OBJ_DATA_PATTERN = r'"(?P<name>\w+)" ?: ?(?P<value>.+)'
re_attr_obj_data = re.compile(RE_ATTR_OBJ_DATA_PATTERN)

# "obj_property": .*
# RE_ATTR_OBJ_LIST_PATTERN = r'(?P<value>"\w+" ?: ?.+),?'
# re_attr_obj_list = re.compile(RE_ATTR_OBJ_LIST_PATTERN)

# [inst_type <attribute_list>] => instance
RE_INST_PATTERN = r"\[(?P<type>.+?) +(?P<attr_list>.+)\][\r\n]"
re_inst = re.compile(RE_INST_PATTERN)
