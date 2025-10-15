# gd2ts - GDScript to TypeScript Transpiler

A high-performance GDScript to TypeScript transpiler library, powered by a C++ GDExtension.

## Overview

**gd2ts** is designed for game teams that use Godot as their editor but write game logic in TypeScript. This library provides a simple API to transpile GDScript files to TypeScript, making it easy to prototype in GDScript and then convert to your production language.

## Building

### Prerequisites

- Python 3.6+ (for SCons)
- SCons 4.0+
- C++17 compatible compiler:
  - Linux: GCC 7+ or Clang 7+
  - Windows: MSVC 2019+
  - macOS: Xcode 10+

### Build Steps

```bash
# Clone with submodules
git clone --recursive https://github.com/NodotProject/gd2ts.git
cd gd2ts

# Build godot-cpp first
cd godot-cpp
scons target=template_debug
scons target=template_release
cd ..

# Build gd2ts extension
scons target=template_debug
scons target=template_release

# Binaries will be in addons/gd2ts/bin/
```

## Usage

```gdscript
# Create a transpiler instance
var converter = GD2TSConverter.new()

# Transpile a string
var typescript = converter.transpile_string("extends Node2D")
print(typescript)

# Transpile a file
var result = converter.transpile_file("res://player.gd", "res://player.ts")
if result["success"]:
    print("Transpiled successfully!")
```

## Testing

### Running Tests

The project uses [GUT (Godot Unit Test)](https://github.com/bitwes/Gut) framework.

```bash
# Run all tests
godot --headless --path . -s addons/gut/gut_cmdln.gd -gexit

# Run specific test file
godot --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=res://tests/unit/test_gd2ts_converter.gd \
  -gexit

# View test results
cat .ai/phase8-test-results.md
```

## Third Party Licenses

This project incorporates the following third-party components:

### tree-sitter
- **Repository**: https://github.com/tree-sitter/tree-sitter
- **License**: MIT License

### tree-sitter-gdscript
- **Repository**: https://github.com/PrestonKnopp/tree-sitter-gdscript
- **License**: MIT License

For the full text of the MIT License, see the LICENSE files in the respective submodule directories.

## 💖 Support Me
Hi! I’m krazyjakee 🎮, creator and maintain­er of the *NodotProject* - a suite of open‑source Godot tools (e.g. Nodot, Gedis, GedisQueue etc) that empower game developers to build faster and maintain cleaner code.

I’m looking for sponsors to help sustain and grow the project: more dev time, better docs, more features, and deeper community support. Your support means more stable, polished tools used by indie makers and studios alike.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/krazyjakee)

Every contribution helps maintain and improve this project. And encourage me to make more projects like this!

*This is optional support. The tool remains free and open-source regardless.*

---

**Created with ❤️ for Godot Developers**  
For contributions, please open PRs on GitHub
