#!/bin/bash

# Convert TypeScript type declarations to GDScript
# Usage: ./convert_ts_to_gd.sh <input.d.ts> <output.gd>

INPUT_FILE="${1:-../../../code/mod/index.d.ts}"
OUTPUT_FILE="${2:-scripts/mod.gd}"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found"
    exit 1
fi

echo "Converting $INPUT_FILE to $OUTPUT_FILE..."

# Use awk for much faster processing
awk '
BEGIN {
    in_namespace = 0
    in_enum = 0
    enum_value = 0
    skip_next = 0
    last_comment = ""
    in_function = 0
    function_buffer = ""

    print "# Auto-generated GDScript type definitions"
    print "# DO NOT MODIFY - Generated from TypeScript declarations"
    print ""
    print "class_name Mod"
    print "extends RefCounted"
    print ""
}

# Skip header comments and empty lines at start
/^[[:space:]]*\/\// && NR < 10 { next }
/^[[:space:]]*$/ && in_enum == 0 { next }

# Detect namespace
/declare[[:space:]]+namespace/ {
    match($0, /declare[[:space:]]+namespace[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)/, arr)
    print "# Namespace: " arr[1]
    print ""
    in_namespace = 1
    next
}


in_namespace == 1 {
    # Skip all comment lines but save them for functions
    if (/^[[:space:]]*\/\//) {
        # Save comment for potential function
        gsub(/^[[:space:]]*\/\/[[:space:]]*/, "")
        last_comment = $0
        next
    }

    # Handle enum start
    if (/export[[:space:]]+enum[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\{/) {
        match($0, /export[[:space:]]+enum[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)/, arr)
        print "# Enum: " arr[1]
        print "enum " arr[1] " {"
        in_enum = 1
        enum_value = 0
        last_comment = ""
        next
    }

    # Handle enum end
    if (in_enum == 1 && /^[[:space:]]*\}/) {
        print "}"
        print ""
        in_enum = 0
        next
    }

    # Handle enum members
    if (in_enum == 1) {
        gsub(/^[[:space:]]+/, "")
        gsub(/[[:space:]]*,[[:space:]]*$/, "")

        if (match($0, /^([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*=[[:space:]]*([0-9]+)/, arr)) {
            print "\t" arr[1] " = " arr[2] ","
            enum_value = arr[2] + 1
        } else if (match($0, /^([a-zA-Z_][a-zA-Z0-9_]*)/, arr)) {
            print "\t" arr[1] " = " enum_value ","
            enum_value++
        }
        next
    }

    # Handle function declarations
    if (/^[[:space:]]*export[[:space:]]+function[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\(/) {
        # Start collecting function signature (might be multi-line)
        function_buffer = $0

        # If function ends on same line with semicolon
        if (/;[[:space:]]*$/) {
            # Process complete function
            gsub(/^[[:space:]]+/, "", function_buffer)

            # Extract function name
            match(function_buffer, /export[[:space:]]+function[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)/, arr)
            func_name = arr[1]

            # Extract parameters and return type
            match(function_buffer, /\(([^)]*)\)[[:space:]]*:[[:space:]]*([^;]+)/, arr)
            params = arr[1]
            return_type = arr[2]

            # Convert TypeScript types to GDScript
            gsub(/number/, "float", params)
            gsub(/boolean/, "bool", params)
            gsub(/string/, "String", params)
            gsub(/Any/, "Variant", params)
            gsub(/Promise<void>/, "void", return_type)
            gsub(/number/, "float", return_type)
            gsub(/boolean/, "bool", return_type)
            gsub(/string/, "String", return_type)
            gsub(/Any/, "Variant", return_type)

            # Build GDScript function signature
            gd_params = params
            gsub(/:[[:space:]]*[a-zA-Z_][a-zA-Z0-9_<>]*/, "", gd_params)

            # Print comment if exists
            if (last_comment != "") {
                print "# " last_comment
            }

            # Print function stub
            if (return_type == "void") {
                print "static func " func_name "(" gd_params ") -> void:"
            } else {
                print "static func " func_name "(" gd_params ") -> " return_type ":"
            }
            print "\tpass # TODO: Implement"
            print ""

            last_comment = ""
            function_buffer = ""
        } else {
            # Multi-line function, continue collecting
            in_function = 1
        }
        next
    }

    # Continue collecting multi-line function
    if (in_function == 1) {
        function_buffer = function_buffer " " $0

        # Check if this line ends the function
        if (/\;[[:space:]]*$/) {
            in_function = 0

            # Process complete function (same logic as above)
            gsub(/^[[:space:]]+/, "", function_buffer)

            match(function_buffer, /export[[:space:]]+function[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)/, arr)
            func_name = arr[1]

            match(function_buffer, /\(([^)]*)\)[[:space:]]*:[[:space:]]*([^;]+)/, arr)
            params = arr[1]
            return_type = arr[2]

            gsub(/number/, "float", params)
            gsub(/boolean/, "bool", params)
            gsub(/string/, "String", params)
            gsub(/Any/, "Variant", params)
            gsub(/Promise<void>/, "void", return_type)
            gsub(/number/, "float", return_type)
            gsub(/boolean/, "bool", return_type)
            gsub(/string/, "String", return_type)
            gsub(/Any/, "Variant", return_type)

            gd_params = params
            gsub(/:[[:space:]]*[a-zA-Z_][a-zA-Z0-9_<>]*/, "", gd_params)

            if (last_comment != "") {
                print "# " last_comment
            }

            if (return_type == "void") {
                print "static func " func_name "(" gd_params ") -> void:"
            } else {
                print "static func " func_name "(" gd_params ") -> " return_type ":"
            }
            print "\tpass # TODO: Implement"
            print ""

            last_comment = ""
            function_buffer = ""
        }
        next
    }

    # Handle opaque type symbol declaration
    if (/const[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*Symbol.*unique symbol/) {
        skip_next = 1
        match($0, /const[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)Symbol/, arr)
        pending_type = arr[1]
        next
    }

    # Handle opaque type export (must be checked before simple types)
    if (skip_next == 1 && /export[[:space:]]+type.*\{[[:space:]]*_opaque:/) {
        skip_next = 0
        match($0, /export[[:space:]]+type[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)/, arr)
        type_name = arr[1]
        print "# Opaque Type: " type_name " (opaque handle)"
        print "class " type_name ":"
        print "\textends RefCounted"
        print "\tvar _opaque: int = -1"
        print "\t"
        print "\tfunc _init(handle: int = -1):"
        print "\t\t_opaque = handle"
        print "\t"
        print "\tfunc is_valid() -> bool:"
        print "\t\treturn _opaque >= 0"
        print ""
        next
    }

    # Handle simple type alias (only if not an opaque type)
    if (skip_next == 0 && /export[[:space:]]+type.*=[[:space:]]*(any|Any);/) {
        match($0, /export[[:space:]]+type[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)/, arr)
        type_name = arr[1]
        print "# Type: " type_name " = Variant (any type)"
        print "class " type_name ":"
        print "\tvar _value"
        print "\tfunc _init(value = null):"
        print "\t\t_value = value"
        print ""
        next
    }
}

END {
    print ""
    print "# Utility functions"
    print "static func create_any(value = null) -> Any:"
    print "\treturn Any.new(value)"
    print ""
    print "static func is_valid_handle(obj) -> bool:"
    print "\tif obj == null:"
    print "\t\treturn false"
    print "\tif obj.has_method(\"is_valid\"):"
    print "\t\treturn obj.is_valid()"
    print "\treturn false"
}
' "$INPUT_FILE" > "$OUTPUT_FILE"

echo "Conversion complete! Output written to $OUTPUT_FILE"
