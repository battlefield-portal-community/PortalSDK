/* 

Welcome to basic templates!

Here you can find some of the commonly used events and functions that'll hopefully kickstart your scripting journey. 
'mod/index.d.ts' is your bestfriend when it comes to learning about all that is capable within Portal scripting. 
If you're ever unsure how to do something, try searching for a relevant function in it! 

*/

////////////////////////////////// ON PLAYER EVENTS ///////////////////////////////////////
//////////// Useful player action-related events to hook up reactive logics to ////////////

// Triggered when player joins the game. Useful for pregame setup, team management, etc.
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {}

// Triggered when player leaves the game. Useful for clean up logic, team management, etc.
export function OnPlayerLeaveGame(eventNumber: number): void {}

// Triggered when player selects their class and deploys into game. Useful for any spawn/start logic.
export function OnPlayerDeployed(eventPlayer: mod.Player): void {}

// Triggered on player death/kill, returns dying player, the killer, etc. Useful for updating scores, updating progression, handling any death/kill related logic.
export function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock): void {}

export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {}

// Triggered when a player is damaged, returns same variables as OnPlayerDied. Useful for custom on damage logic and updating custom UI.
export function OnPlayerDamaged(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDamageType: mod.DamageType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {}

// Triggered when a player interacts with InteractPoint. Reference by using 'mod.GetObjId(InteractPoint);'.
// Useful for any custom logic on player interaction such as updating check point, open custom UI, etc.
// Note that InteractPoint has to be placed in Godot scene and assigned an ObjId for reference.
export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): void {}

// Triggered when a player enters/leaves referenced BF6 capture point. Useful for tracking capture point activities and overlapping players.
// Note that CapturePoint has to be placed in Godot scene, assigned an ObjId and a CapturePointArea(volume).
export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {}
export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {}

// Triggered when a player enters/leaves referenced AreaTrigger volume. Useful for creating custom OnOverlap logic, creating custom capture point, etc.
// Note that AreaTrigger has to be placed in Godot scene, assigned an ObjId and a CollisionPolygon3D(volume).
export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {}
export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {}

/////////////////////// GAMEMODE EVENTS AND USEFUL FUNCTIONS //////////////////////////////
////////// Various useful events and functions to manipulate gameplay and actors //////////

export function OnGameModeEnding(): void {}

export function OngoingGlobal(): void {}

// Triggered on main gamemode start/end. Useful for game start setup and cleanup.
export async function OnGameModeStarted() {

    // Enables or disables a headquater. Note that HQ_PlayerSpawner has to be placed in Godot scene, assigned an ObjId and a HQArea(CollisionPolygon3D).
    const hq = mod.GetHQ(0);
    mod.EnableHQ(hq, true);

    // Enables or disables the provided objective.
    const capturePoint = mod.GetCapturePoint(0);
    mod.EnableGameModeObjective(capturePoint, true);

    // Returns the id corresponding to the provided object.
    const capturePointId = mod.GetObjId(capturePoint);

    // Returns a vector composed of three provided 'X' (left), 'Y' (up), and 'Z' (forward) values.
    // Useful for specifying transform, 3d velocity or RGB color.
    const vector = mod.CreateVector(1, 2, 3);

    // Get player closest to a point
    const player = mod.ClosestPlayerTo(vector);

    // Returns the team value of the specified player OR the corresponding team of the provided number.
    const teamOfPlayer = mod.GetTeam(player);
    const teamObject = mod.GetTeam(0);

    // Displays a notification-type Message on the top-right of the screen for 6 seconds. Useful for communicating game state/info or debugging.
    const exampleMessage = mod.Message('example');
    mod.DisplayNotificationMessage(exampleMessage);
    mod.DisplayNotificationMessage(exampleMessage, player);
    mod.DisplayNotificationMessage(exampleMessage, teamOfPlayer);

    // Adds X delay in seconds. Useful for making sure that everything has been initialized before running logic or delaying triggers.
    await mod.Wait(5);

    // Teleports a target to a provided valid position facing a specified angle (in radians).
    mod.Teleport(player, mod.CreateVector(100, 0, 100), mod.Pi());

    // Returns the 'X', 'Y', or 'Z' component of a provided vector.
    // Useful for modifying specific vector component or debugging transform.
    const x = mod.XComponentOf(vector);
    const y = mod.YComponentOf(vector);
    const z = mod.ZComponentOf(vector);
    const changedVector = mod.CreateVector(x + 10, y - 5, z * 2);

    // Returns various player state information
    const eyePosition = mod.GetSoldierState(player, mod.SoldierStateVector.EyePosition);
    const facingDirection = mod.GetSoldierState(player, mod.SoldierStateVector.GetFacingDirection);
    const health = mod.GetSoldierState(player, mod.SoldierStateNumber.CurrentHealth);
    const isInWater = mod.GetSoldierState(player, mod.SoldierStateBool.IsInWater);
}
