from gdconverter.create_godot import create_godot


def test_create_godot() -> None:
    assert create_godot("", "") is False
