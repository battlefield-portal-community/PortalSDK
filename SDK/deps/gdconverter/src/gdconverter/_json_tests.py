from gdconverter import _constants as const
from gdconverter import _json_types as jtype


def _test_j2t_create_gd_property() -> None:
    p = [
        jtype.create_property("string"),
        jtype.create_property("int"),
        jtype.create_property("vector"),
        jtype.create_property("selection"),
        jtype.create_property("object"),
        jtype.create_property("string[]"),
        jtype.create_property("object[]"),
    ]
    for i, prop in enumerate(p):
        prop.id = "pid" + str(i)

    setattr(p[0], const.PROP_KEY_DEF, "p1def")
    setattr(p[1], const.PROP_KEY_DEF, 5)
    setattr(p[2], const.PROP_KEY_DEF, [0, 2, 1.0])
    setattr(p[3], const.PROP_KEY_DEF, "p4a")
    setattr(p[3], const.PROP_KEY_SEL, ["p4a", "p4b", "p4c"])
    p[5] = p[5].set_val(p[2].get_val())
    p[6] = p[6].set_val([p[4].get_val()])

    for prop in p:
        print(prop.to_gd_prop())


_test_j2t_create_gd_property()
