# BF-Script

This addon allows you to write your Battlefield logic in GDScript.
It uses the gd2ts godot addon for fast compilation.

Add a BFScript node to your level scene, right click the node and click "extend script", then save your new BFScript somewhere appropriate.
Notice in the Node inspector there is a "Compile" button, use this to compile all your scripts and save them in the export folder.

```
@tool
extends BFScript

## Fired OnGameModeStarted
func _ready():
	## "self." is not a hard requirement in GDScript usually, but for BFScript, it is.
	BFEvents.OnPlayerDeployed.connect(self._on_player_deployed)
	
func _on_player_deployed(eventPlayer: Variant):
	Mod.DisplayNotificationMessage(Mod.Message("Player Deployed", ModLib.getPlayerId(eventPlayer)))

## These will be put into the Strings.json file in the export folder
func type_strings() -> Dictionary:
	return {
		"Player Deployed": "{} was Deployed!!"
	}

```