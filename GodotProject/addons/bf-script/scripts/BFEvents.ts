class SignalStore {
  _store: { [key: string]: Function[] } = {};

  add(signal: string, callable: Function) {
    if (!this._store[signal]) {
      this._store[signal] = [];
    }
    this._store[signal].push(callable);
  }

  emit(signal: string, ...args: any[]) {
    if (!this._store[signal]) return;
    for (const cb of this._store[signal]) {
      cb(...args);
    }
  }

  remove(signal: string, callable: Function) {
    if (!this._store[signal]) return;
    this._store[signal] = this._store[signal].filter((cb) => cb !== callable);
  }
}

const signalStore = new SignalStore();

function createSignal(signal: string) {
  return {
    disconnect: function (signal: string, callable: Function) {
      signalStore.remove(signal, callable);
    },
    connect: function (callable: Function) {
      signalStore.add(signal, callable);
    },
    emit: function (...args: any[]) {
      signalStore.emit(signal, ...args);
    },
  };
}

function emitSignal(signal: string, ...args: any[]) {
  signalStore.emit(signal, ...args);
}

const BFEvents = {
  OngoingGlobal: createSignal("OngoingGlobal"),
  OngoingAreaTrigger: createSignal("OngoingAreaTrigger"),
  OngoingCapturePoint: createSignal("OngoingCapturePoint"),
  OngoingEmplacementSpawner: createSignal("OngoingEmplacementSpawner"),
  OngoingHQ: createSignal("OngoingHQ"),
  OngoingInteractPoint: createSignal("OngoingInteractPoint"),
  OngoingMCOM: createSignal("OngoingMCOM"),
  OngoingPlayer: createSignal("OngoingPlayer"),
  OngoingScreenEffect: createSignal("OngoingScreenEffect"),
  OngoingSector: createSignal("OngoingSector"),
  OngoingSpawner: createSignal("OngoingSpawner"),
  OngoingSpawnPoint: createSignal("OngoingSpawnPoint"),
  OngoingTeam: createSignal("OngoingTeam"),
  OngoingVehicle: createSignal("OngoingVehicle"),
  OngoingVehicleSpawner: createSignal("OngoingVehicleSpawner"),
  OngoingWaypointPath: createSignal("OngoingWaypointPath"),
  OngoingWorldIcon: createSignal("OngoingWorldIcon"),
  OnAIMoveToFailed: createSignal("OnAIMoveToFailed"),
  OnAIMoveToRunning: createSignal("OnAIMoveToRunning"),
  OnAIMoveToSucceeded: createSignal("OnAIMoveToSucceeded"),
  OnAIParachuteRunning: createSignal("OnAIParachuteRunning"),
  OnAIParachuteSucceeded: createSignal("OnAIParachuteSucceeded"),
  OnAIWaypointIdleFailed: createSignal("OnAIWaypointIdleFailed"),
  OnAIWaypointIdleRunning: createSignal("OnAIWaypointIdleRunning"),
  OnAIWaypointIdleSucceeded: createSignal("OnAIWaypointIdleSucceeded"),
  OnCapturePointCaptured: createSignal("OnCapturePointCaptured"),
  OnCapturePointCapturing: createSignal("OnCapturePointCapturing"),
  OnCapturePointLost: createSignal("OnCapturePointLost"),
  OnGameModeEnding: createSignal("OnGameModeEnding"),
  OnGameModeStarted: createSignal("OnGameModeStarted"),
  OnMandown: createSignal("OnMandown"),
  OnMCOMArmed: createSignal("OnMCOMArmed"),
  OnMCOMDefused: createSignal("OnMCOMDefused"),
  OnMCOMDestroyed: createSignal("OnMCOMDestroyed"),
  OnPlayerDamaged: createSignal("OnPlayerDamaged"),
  OnPlayerDeployed: createSignal("OnPlayerDeployed"),
  OnPlayerDied: createSignal("OnPlayerDied"),
  OnPlayerEarnedKill: createSignal("OnPlayerEarnedKill"),
  OnPlayerEarnedKillAssist: createSignal("OnPlayerEarnedKillAssist"),
  OnPlayerEnterAreaTrigger: createSignal("OnPlayerEnterAreaTrigger"),
  OnPlayerEnterCapturePoint: createSignal("OnPlayerEnterCapturePoint"),
  OnPlayerEnterVehicle: createSignal("OnPlayerEnterVehicle"),
  OnPlayerEnterVehicleSeat: createSignal("OnPlayerEnterVehicleSeat"),
  OnPlayerExitAreaTrigger: createSignal("OnPlayerExitAreaTrigger"),
  OnPlayerExitCapturePoint: createSignal("OnPlayerExitCapturePoint"),
  OnPlayerExitVehicle: createSignal("OnPlayerExitVehicle"),
  OnPlayerExitVehicleSeat: createSignal("OnPlayerExitVehicleSeat"),
  OnPlayerInteract: createSignal("OnPlayerInteract"),
  OnPlayerJoinGame: createSignal("OnPlayerJoinGame"),
  OnPlayerLeaveGame: createSignal("OnPlayerLeaveGame"),
  OnPlayerSwitchTeam: createSignal("OnPlayerSwitchTeam"),
  OnPlayerUIButtonEvent: createSignal("OnPlayerUIButtonEvent"),
  OnPlayerUndeploy: createSignal("OnPlayerUndeploy"),
  OnRayCastHit: createSignal("OnRayCastHit"),
  OnRayCastMissed: createSignal("OnRayCastMissed"),
  OnRevived: createSignal("OnRevived"),
  OnSpawnerSpawned: createSignal("OnSpawnerSpawned"),
  OnTimeLimitReached: createSignal("OnTimeLimitReached"),
  OnVehicleDestroyed: createSignal("OnVehicleDestroyed"),
  OnVehicleSpawned: createSignal("OnVehicleSpawned"),
};

export function OngoingGlobal() {
  emitSignal("OngoingGlobal");
}

export function OngoingAreaTrigger(eventAreaTrigger: mod.AreaTrigger) {
  emitSignal("OngoingAreaTrigger", eventAreaTrigger);
}

export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint) {
  emitSignal("OngoingCapturePoint", eventCapturePoint);
}

export function OngoingEmplacementSpawner(
  eventEmplacementSpawner: mod.EmplacementSpawner
) {
  emitSignal("OngoingEmplacementSpawner", eventEmplacementSpawner);
}

export function OngoingHQ(eventHQ: mod.HQ) {
  emitSignal("OngoingHQ", eventHQ);
}

export function OngoingInteractPoint(eventInteractPoint: mod.InteractPoint) {
  emitSignal("OngoingInteractPoint", eventInteractPoint);
}

export function OngoingMCOM(eventMCOM: mod.MCOM) {
  emitSignal("OngoingMCOM", eventMCOM);
}

export function OngoingPlayer(eventPlayer: mod.Player) {
  emitSignal("OngoingPlayer", eventPlayer);
}

export function OngoingScreenEffect(eventScreenEffect: mod.ScreenEffect) {
  emitSignal("OngoingScreenEffect", eventScreenEffect);
}

export function OngoingSector(eventSector: mod.Sector) {
  emitSignal("OngoingSector", eventSector);
}

export function OngoingSpawner(eventSpawner: mod.Spawner) {
  emitSignal("OngoingSpawner", eventSpawner);
}

export function OngoingSpawnPoint(eventSpawnPoint: mod.SpawnPoint) {
  emitSignal("OngoingSpawnPoint", eventSpawnPoint);
}

export function OngoingTeam(eventTeam: mod.Team) {
  emitSignal("OngoingTeam", eventTeam);
}

export function OngoingVehicle(eventVehicle: mod.Vehicle) {
  emitSignal("OngoingVehicle", eventVehicle);
}

export function OngoingVehicleSpawner(eventVehicleSpawner: mod.VehicleSpawner) {
  emitSignal("OngoingVehicleSpawner", eventVehicleSpawner);
}

export function OngoingWaypointPath(eventWaypointPath: mod.WaypointPath) {
  emitSignal("OngoingWaypointPath", eventWaypointPath);
}

export function OngoingWorldIcon(eventWorldIcon: mod.WorldIcon) {
  emitSignal("OngoingWorldIcon", eventWorldIcon);
}

// This will trigger when an AI Soldier stops trying to reach a destination.
export function OnAIMoveToFailed(eventPlayer: mod.Player) {
  emitSignal("OnAIMoveToFailed", eventPlayer);
}

// This will trigger when an AI Soldier starts moving to a target location.
export function OnAIMoveToRunning(eventPlayer: mod.Player) {
  emitSignal("OnAIMoveToRunning", eventPlayer);
}

// This will trigger when an AI Soldier reaches target location.
export function OnAIMoveToSucceeded(eventPlayer: mod.Player) {
  emitSignal("OnAIMoveToSucceeded", eventPlayer);
}

// This will trigger when an AI Soldier parachute action is running.
export function OnAIParachuteRunning(eventPlayer: mod.Player) {
  emitSignal("OnAIParachuteRunning", eventPlayer);
}

// This will trigger when an AI Soldier parachute action has succeeded.
export function OnAIParachuteSucceeded(eventPlayer: mod.Player) {
  emitSignal("OnAIParachuteSucceeded", eventPlayer);
}

// This will trigger when an AI Soldier stops following a waypoint.
export function OnAIWaypointIdleFailed(eventPlayer: mod.Player) {
  emitSignal("OnAIWaypointIdleFailed", eventPlayer);
}

// This will trigger when an AI Soldier starts following a waypoint.
export function OnAIWaypointIdleRunning(eventPlayer: mod.Player) {
  emitSignal("OnAIWaypointIdleRunning", eventPlayer);
}

// This will trigger when an AI Soldier finishes following a waypoint.
export function OnAIWaypointIdleSucceeded(eventPlayer: mod.Player) {
  emitSignal("OnAIWaypointIdleSucceeded", eventPlayer);
}

// This will trigger when a team takes control of a CapturePoint.
export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint) {
  emitSignal("OnCapturePointCaptured", eventCapturePoint);
}

// This will trigger when a team begins capturing a CapturePoint.
export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint) {
  emitSignal("OnCapturePointCapturing", eventCapturePoint);
}

// This will trigger when a team loses control of a CapturePoint.
export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint) {
  emitSignal("OnCapturePointLost", eventCapturePoint);
}

// This will trigger when the gamemode ends.
export function OnGameModeEnding() {
  emitSignal("OnGameModeEnding");
}

// This will trigger at the start of the gamemode.
export async function OnGameModeStarted() {
  await mod.Wait(5.0);

  custom_classes.forEach((custom_class: any) => {
    custom_class._ready();
  });

  emitSignal("OnGameModeStarted");
}

// This will trigger when a Player is forced into the mandown state.
export function OnMandown(
  eventPlayer: mod.Player,
  eventOtherPlayer: mod.Player
) {
  emitSignal("OnMandown", eventPlayer, eventOtherPlayer);
}

// This will trigger when a MCOM is armed.
export function OnMCOMArmed(eventMCOM: mod.MCOM) {
  emitSignal("OnMCOMArmed", eventMCOM);
}

// This will trigger when a MCOM is defused.
export function OnMCOMDefused(eventMCOM: mod.MCOM) {
  emitSignal("OnMCOMDefused", eventMCOM);
}

// This will trigger when a MCOM detonates.
export function OnMCOMDestroyed(eventMCOM: mod.MCOM) {
  emitSignal("OnMCOMDestroyed", eventMCOM);
}

// This will trigger when a Player takes damage.
export function OnPlayerDamaged(
  eventPlayer: mod.Player,
  eventOtherPlayer: mod.Player,
  eventDamageType: mod.DamageType,
  eventWeaponUnlock: mod.WeaponUnlock
) {
  emitSignal(
    "OnPlayerDamaged",
    eventPlayer,
    eventOtherPlayer,
    eventDamageType,
    eventWeaponUnlock
  );
}

// This will trigger whenever a Player deploys.
export function OnPlayerDeployed(eventPlayer: mod.Player) {
  emitSignal("OnPlayerDeployed", eventPlayer);
}

// This will trigger whenever a Player dies.
export function OnPlayerDied(
  eventPlayer: mod.Player,
  eventOtherPlayer: mod.Player,
  eventDeathType: mod.DeathType,
  eventWeaponUnlock: mod.WeaponUnlock
) {
  emitSignal(
    "OnPlayerDied",
    eventPlayer,
    eventOtherPlayer,
    eventDeathType,
    eventWeaponUnlock
  );
}

// This will trigger when a Player earns a kill against another Player.
export function OnPlayerEarnedKill(
  eventPlayer: mod.Player,
  eventOtherPlayer: mod.Player,
  eventDeathType: mod.DeathType,
  eventWeaponUnlock: mod.WeaponUnlock
) {
  emitSignal(
    "OnPlayerEarnedKill",
    eventPlayer,
    eventOtherPlayer,
    eventDeathType,
    eventWeaponUnlock
  );
}

// This will trigger when a Player earns a kill assist.
export function OnPlayerEarnedKillAssist(
  eventPlayer: mod.Player,
  eventOtherPlayer: mod.Player
) {
  emitSignal("OnPlayerEarnedKillAssist", eventPlayer, eventOtherPlayer);
}

// This will trigger when a Player enters an AreaTrigger.
export function OnPlayerEnterAreaTrigger(
  eventPlayer: mod.Player,
  eventAreaTrigger: mod.AreaTrigger
) {
  emitSignal("OnPlayerEnterAreaTrigger", eventPlayer, eventAreaTrigger);
}

// This will trigger when a Player enters a CapturePoint capturing area.
export function OnPlayerEnterCapturePoint(
  eventPlayer: mod.Player,
  eventCapturePoint: mod.CapturePoint
) {
  emitSignal("OnPlayerEnterCapturePoint", eventPlayer, eventCapturePoint);
}

// This will trigger when a Player enters a Vehicle seat.
export function OnPlayerEnterVehicle(
  eventPlayer: mod.Player,
  eventVehicle: mod.Vehicle
) {
  emitSignal("OnPlayerEnterVehicle", eventPlayer, eventVehicle);
}

// This will trigger when a Player enters a Vehicle seat.
export function OnPlayerEnterVehicleSeat(
  eventPlayer: mod.Player,
  eventVehicle: mod.Vehicle,
  eventSeat: mod.Object
) {
  emitSignal("OnPlayerEnterVehicleSeat", eventPlayer, eventVehicle, eventSeat);
}

// This will trigger when a Player exits an AreaTrigger.
export function OnPlayerExitAreaTrigger(
  eventPlayer: mod.Player,
  eventAreaTrigger: mod.AreaTrigger
) {
  emitSignal("OnPlayerExitAreaTrigger", eventPlayer, eventAreaTrigger);
}

// This will trigger when a Player exits a CapturePoint capturing area.
export function OnPlayerExitCapturePoint(
  eventPlayer: mod.Player,
  eventCapturePoint: mod.CapturePoint
) {
  emitSignal("OnPlayerExitCapturePoint", eventPlayer, eventCapturePoint);
}

// This will trigger when a Player exits a Vehicle.
export function OnPlayerExitVehicle(
  eventPlayer: mod.Player,
  eventVehicle: mod.Vehicle
) {
  emitSignal("OnPlayerExitVehicle", eventPlayer, eventVehicle);
}

// This will trigger when a Player exits a Vehicle seat.
export function OnPlayerExitVehicleSeat(
  eventPlayer: mod.Player,
  eventVehicle: mod.Vehicle,
  eventSeat: mod.Object
) {
  emitSignal("OnPlayerExitVehicleSeat", eventPlayer, eventVehicle, eventSeat);
}

// This will trigger when a Player interacts with InteractPoint.
export function OnPlayerInteract(
  eventPlayer: mod.Player,
  eventInteractPoint: mod.InteractPoint
) {
  emitSignal("OnPlayerInteract", eventPlayer, eventInteractPoint);
}

// This will trigger when a Player joins the game.
export function OnPlayerJoinGame(eventPlayer: mod.Player) {
  emitSignal("OnPlayerJoinGame", eventPlayer);
}

// This will trigger when any player leaves the game.
export function OnPlayerLeaveGame(eventNumber: number) {
  emitSignal("OnPlayerLeaveGame", eventNumber);
}

// This will trigger when a Player changes team.
export function OnPlayerSwitchTeam(
  eventPlayer: mod.Player,
  eventTeam: mod.Team
) {
  emitSignal("OnPlayerSwitchTeam", eventPlayer, eventTeam);
}

// This will trigger when a Player interacts with an UI button.
export function OnPlayerUIButtonEvent(
  eventPlayer: mod.Player,
  eventUIWidget: mod.UIWidget,
  eventUIButtonEvent: mod.UIButtonEvent
) {
  emitSignal(
    "OnPlayerUIButtonEvent",
    eventPlayer,
    eventUIWidget,
    eventUIButtonEvent
  );
}

// This will trigger when the Player dies and returns to the deploy screen.
export function OnPlayerUndeploy(eventPlayer: mod.Player) {
  emitSignal("OnPlayerUndeploy", eventPlayer);
}

// This will trigger when a Raycast hits a target.
export function OnRayCastHit(
  eventPlayer: mod.Player,
  eventPoint: mod.Vector,
  eventNormal: mod.Vector
) {
  emitSignal("OnRayCastHit", eventPlayer, eventPoint, eventNormal);
}

// This will trigger when a Raycast is called and doesn't hit any target.
export function OnRayCastMissed(eventPlayer: mod.Player) {
  emitSignal("OnRayCastMissed", eventPlayer);
}

// This will trigger when a Player is revived by another Player.
export function OnRevived(
  eventPlayer: mod.Player,
  eventOtherPlayer: mod.Player
) {
  emitSignal("OnRevived", eventPlayer, eventOtherPlayer);
}

// This will trigger when an AISpawner spawns an AI Soldier.
export function OnSpawnerSpawned(
  eventPlayer: mod.Player,
  eventSpawner: mod.Spawner
) {
  emitSignal("OnSpawnerSpawned", eventPlayer, eventSpawner);
}

// This will trigger when the gamemode time limit has been reached.
export function OnTimeLimitReached() {
  emitSignal("OnTimeLimitReached");
}

// This will trigger when a Vehicle is destroyed.
export function OnVehicleDestroyed(eventVehicle: mod.Vehicle) {
  emitSignal("OnVehicleDestroyed", eventVehicle);
}

// This will trigger when a Vehicle is called into the map.
export function OnVehicleSpawned(eventVehicle: mod.Vehicle) {
  emitSignal("OnVehicleSpawned", eventVehicle);
}
