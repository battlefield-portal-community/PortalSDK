extends Node

signal OngoingGlobal()

signal OngoingAreaTrigger(eventAreaTrigger)

signal OngoingCapturePoint(eventCapturePoint)

signal OngoingEmplacementSpawner(
  eventEmplacementSpawner
)

signal OngoingHQ(eventHQ)

signal OngoingInteractPoint(eventInteractPoint)

signal OngoingMCOM(eventMCOM)

signal OngoingPlayer(eventPlayer)

signal OngoingScreenEffect(eventScreenEffect)

signal OngoingSector(eventSector)

signal OngoingSpawner(eventSpawner)

signal OngoingSpawnPoint(eventSpawnPoint)

signal OngoingTeam(eventTeam)

signal OngoingVehicle(eventVehicle)

signal OngoingVehicleSpawner(
  eventVehicleSpawner
)

signal OngoingWaypointPath(eventWaypointPath)

signal OngoingWorldIcon(eventWorldIcon)

## This will trigger when an AI Soldier stops trying to reach a destination.
signal OnAIMoveToFailed(eventPlayer)

## This will trigger when an AI Soldier starts moving to a target location.
signal OnAIMoveToRunning(eventPlayer)

## This will trigger when an AI Soldier reaches target location.
signal OnAIMoveToSucceeded(eventPlayer)

## This will trigger when an AI Soldier parachute action is running.
signal OnAIParachuteRunning(eventPlayer)

## This will trigger when an AI Soldier parachute action has succeeded.
signal OnAIParachuteSucceeded(eventPlayer)

## This will trigger when an AI Soldier stops following a waypoint.
signal OnAIWaypointIdleFailed(eventPlayer)

## This will trigger when an AI Soldier starts following a waypoint.
signal OnAIWaypointIdleRunning(eventPlayer)

## This will trigger when an AI Soldier finishes following a waypoint.
signal OnAIWaypointIdleSucceeded(eventPlayer)

## This will trigger when a team takes control of a CapturePoint.
signal OnCapturePointCaptured(eventCapturePoint)

## This will trigger when a team begins capturing a CapturePoint.
signal OnCapturePointCapturing(eventCapturePoint)

## This will trigger when a team loses control of a CapturePoint.
signal OnCapturePointLost(eventCapturePoint)

## This will trigger when the gamemode ends.
signal OnGameModeEnding()

## This will trigger at the start of the gamemode.
signal OnGameModeStarted()

## This will trigger when a Player is forced into the mandown state.
signal OnMandown(
  eventPlayer,
  eventOtherPlayer
)

## This will trigger when a MCOM is armed.
signal OnMCOMArmed(eventMCOM)

## This will trigger when a MCOM is defused.
signal OnMCOMDefused(eventMCOM)

## This will trigger when a MCOM detonates.
signal OnMCOMDestroyed(eventMCOM)

## This will trigger when a Player takes damage.
signal OnPlayerDamaged(
  eventPlayer,
  eventOtherPlayer,
  eventDamageType,
  eventWeaponUnlock
)

## This will trigger whenever a Player deploys.
signal OnPlayerDeployed(eventPlayer)

## This will trigger whenever a Player dies.
signal OnPlayerDied(
  eventPlayer,
  eventOtherPlayer,
  eventDeathType,
  eventWeaponUnlock
)

## This will trigger when a Player earns a kill against another Player.
signal OnPlayerEarnedKill(
  eventPlayer,
  eventOtherPlayer,
  eventDeathType,
  eventWeaponUnlock
)

## This will trigger when a Player earns a kill assist.
signal OnPlayerEarnedKillAssist(
  eventPlayer,
  eventOtherPlayer
)

## This will trigger when a Player enters an AreaTrigger.
signal OnPlayerEnterAreaTrigger(
  eventPlayer,
  eventAreaTrigger
)

## This will trigger when a Player enters a CapturePoint capturing area.
signal OnPlayerEnterCapturePoint(
  eventPlayer,
  eventCapturePoint
)

## This will trigger when a Player enters a Vehicle seat.
signal OnPlayerEnterVehicle(
  eventPlayer,
  eventVehicle
)

## This will trigger when a Player enters a Vehicle seat.
signal OnPlayerEnterVehicleSeat(
  eventPlayer,
  eventVehicle,
  eventSeat
)

## This will trigger when a Player exits an AreaTrigger.
signal OnPlayerExitAreaTrigger(
  eventPlayer,
  eventAreaTrigger
)

## This will trigger when a Player exits a CapturePoint capturing area.
signal OnPlayerExitCapturePoint(
  eventPlayer,
  eventCapturePoint
)

## This will trigger when a Player exits a Vehicle.
signal OnPlayerExitVehicle(
  eventPlayer,
  eventVehicle
)

## This will trigger when a Player exits a Vehicle seat.
signal OnPlayerExitVehicleSeat(
  eventPlayer,
  eventVehicle,
  eventSeat
)

## This will trigger when a Player interacts with InteractPoint.
signal OnPlayerInteract(
  eventPlayer,
  eventInteractPoint
)

## This will trigger when a Player joins the game.
signal OnPlayerJoinGame(eventPlayer)

## This will trigger when any player leaves the game.
signal OnPlayerLeaveGame(eventNumber: int)

## This will trigger when a Player changes team.
signal OnPlayerSwitchTeam(
  eventPlayer,
  eventTeam
)

## This will trigger when a Player interacts with an UI button.
signal OnPlayerUIButtonEvent(
  eventPlayer,
  eventUIWidget,
  eventUIButtonEvent
)

## This will trigger when the Player dies and returns to the deploy screen.
signal OnPlayerUndeploy(eventPlayer)

## This will trigger when a Raycast hits a target.
signal OnRayCastHit(
  eventPlayer,
  eventPoint,
  eventNormal
)

## This will trigger when a Raycast is called and doesn't hit any target.
signal OnRayCastMissed(eventPlayer)

## This will trigger when a Player is revived by another Player.
signal OnRevived(
  eventPlayer,
  eventOtherPlayer
)

## This will trigger when an AISpawner spawns an AI Soldier.
signal OnSpawnerSpawned(
  eventPlayer,
  eventSpawner
)

## This will trigger when the gamemode time limit has been reached.
signal OnTimeLimitReached()

## This will trigger when a Vehicle is destroyed.
signal OnVehicleDestroyed(eventVehicle)

## This will trigger when a Vehicle is called into the map.
signal OnVehicleSpawned(eventVehicle)
