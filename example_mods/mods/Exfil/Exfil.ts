// === src\Exfil_main.ts ===
const VERSION = [1, 17, 0];
//version format is [ship, delivery, patch/compile]


const debugAIBehavior = true;
const debugPlayer = true;
const debugAIEnemy = true;

const battlefieldWhite = mod.CreateVector(0.733, 0.808, 0.851);
const battlefieldBlue = mod.CreateVector(0.678, 0.753, 0.8);
const battlefieldBlueBg = mod.CreateVector(0.75, 0.75, 0.75);
const battlefieldGrey = mod.CreateVector(0.616, 0.635, 0.647);

let itemPickupDistance = 3.0;
const itemReturnTime = 20.0;
const enemyRespawnTime = 60;
const aiEngageRange = 17.5;
const aiLeashRange = 5;
let itemCarrySpeedFactor = 1.0;
const itemCarrySpeedFactorCap = 1.5;
const itemCarrySpeedIncrement = 0.05;
let itemCarryHealthFactor = 1.0;
const itemCarryHealthFactorCap = 1.5;
const itemCarryHealthIncrement = 0.05;
let heightToKillAt = 69.8;
const teamAmount = 5;
let teamMemberCount: number[] = [0, 0, 0, 0, 0, 0];
let teamColors: mod.Vector[] = [
    mod.CreateVector(1, 0.1, 0),
    mod.CreateVector(0, 1, 1),
    mod.CreateVector(0.5, 0, 1),
    mod.CreateVector(0, 0.8, 0),
    mod.CreateVector(0, 0, 0),
];

let baseGameStartCountdown: number = 60;
let gameStartCountdown: number = 60;
let requiredPlayersToStart: number = 4;

let uniqueNameNumber: number = 0;

const spawnPointsMap: Record<number, Vector3> = {
    7: { x: -9.368, y: 75.369 + 10, z: -107.521 },
    8: { x: -15.409, y: 78.495 + 10, z: -55.039 },
    9: { x: 3.288, y: 76.109 + 10, z: -86.37 },
    10: { x: 15.297, y: 75.933 + 10, z: -44.59 },
    11: { x: -59.808, y: 80.995 + 10, z: -68.389 },
    12: { x: -46.637, y: 76.143 + 10, z: -62.448 },
    13: { x: -18.436, y: 78.738 + 10, z: -68.249 },
    14: { x: -50.068, y: 79.755 + 10, z: -11.267 },
    15: { x: -55.907, y: 76.143 + 10, z: -86.698 },
    16: { x: -54.582, y: 71.972 + 10, z: -72.545 },
    17: { x: -62.288, y: 79.834 + 10, z: -26.115 },
    18: { x: -44.71, y: 75.795 + 10, z: -108.383 },
    19: { x: -24.366, y: 78.332 + 10, z: -129.02 },
};

const vfxSpawnMap: Record<number, Vector3> = {
    1: { x: -80.0, y: 64, z: 120.0 },
    2: { x: -65.0, y: 64, z: 100.0 },
    3: { x: -80.0, y: 64, z: 80.0 },
    4: { x: -65.0, y: 64, z: 60.0 },
    5: { x: -80.0, y: 64, z: 40.0 },
    6: { x: -65.0, y: 64, z: 20.0 },
    7: { x: -80.0, y: 64, z: 0 },
    8: { x: -65.0, y: 64, z: -20 },
    9: { x: -80.0, y: 64, z: -40.0 },
    10: { x: -65.0, y: 64, z: -60.0 },
    11: { x: -80.0, y: 64, z: -80.0 },
    12: { x: -65.0, y: 64, z: -100.0 },
    13: { x: -50.0, y: 64, z: 80.0 },
    14: { x: -35.0, y: 64, z: 60.0 },
    15: { x: -50.0, y: 64, z: 40.0 },
    16: { x: -35.0, y: 64, z: 20.0 },
    17: { x: -50.0, y: 64, z: 0 },
    18: { x: -35.0, y: 64, z: -20 },
    19: { x: -50.0, y: 64, z: -40.0 },
    20: { x: -35.0, y: 64, z: -60.0 },
    21: { x: -50.0, y: 64, z: -80.0 },
    22: { x: -35.0, y: 64, z: -100.0 },
    23: { x: -20.0, y: 64, z: 80.0 },
    24: { x: -5.0, y: 64, z: 60.0 },
    25: { x: -20.0, y: 64, z: 40.0 },
    26: { x: -5.0, y: 64, z: 20.0 },
    27: { x: -20.0, y: 64, z: 0 },
    28: { x: -5.0, y: 64, z: -20 },
    29: { x: -20.0, y: 64, z: -40.0 },
    30: { x: -5.0, y: 64, z: -60.0 },
    31: { x: -20.0, y: 64, z: -80.0 },
    32: { x: -5.0, y: 64, z: -100.0 },
    33: { x: 10.0, y: 64, z: 40.0 },
    34: { x: 25.0, y: 64, z: 20.0 },
    35: { x: 10.0, y: 64, z: 0 },
    36: { x: 25.0, y: 64, z: -20 },
    37: { x: 10.0, y: 64, z: -40.0 },
    38: { x: 25.0, y: 64, z: -60.0 },
    39: { x: 10.0, y: 64, z: -80.0 },
    40: { x: 25.0, y: 64, z: -100.0 },
    41: { x: 40.0, y: 64, z: 40.0 },
    42: { x: 55.0, y: 64, z: 20.0 },
    43: { x: 40.0, y: 64, z: 0 },
    44: { x: 55.0, y: 64, z: -20 },
    45: { x: 40.0, y: 64, z: -40.0 },
    46: { x: 55.0, y: 64, z: -60.0 },
    47: { x: 40.0, y: 64, z: -80.0 },
    48: { x: 55.0, y: 64, z: -100.0 },
    49: { x: 70.0, y: 64, z: 40.0 },
    50: { x: 85.0, y: 64, z: 20.0 },
    51: { x: 70.0, y: 64, z: 0 },
    52: { x: 85.0, y: 64, z: -20 },
    53: { x: 70.0, y: 64, z: -40.0 },
    54: { x: 85.0, y: 64, z: -60.0 },
    55: { x: 70.0, y: 64, z: -80.0 },
    56: { x: 85.0, y: 64, z: -100.0 },
};

type Vector3 = { x: number; y: number; z: number };

function InitializeSpawners() {
    for (let index = 7; index < 17; index++) {
        mod.SetUnspawnDelayInSeconds(mod.GetSpawner(index), 15);
    }
}

// spawns all necessary initial AI
async function SpawnEnemies() {
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 7,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 8,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 9,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 10,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 11,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 12,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 13,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 14,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 15,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 16,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 17,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 18,
        health: 100,
        speedMultiplier: 0.5,
    });
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        soldierClass: mod.SoldierClass.Assault,
        spawnPointID: 19,
        health: 100,
        speedMultiplier: 0.5,
    });
}

export async function OnGameModeStarted() {
    mod.EnableInteractPoint(mod.GetInteractPoint(0), true);
    console.log("Game Mode Started");
    SpawnAllGroundCloudVFX();
    InitializeSpawners();
    mod.SetAIToHumanDamageModifier(0.1);
    ExtractionPoint.Initialize();
    ObjectiveItemData.Initialize();
    ExtractionPoint.DeactivateAllExtractionPoints();

    gameStartCountdown = baseGameStartCountdown;

    TickUpdate();
    SlowerTickUpdate();
    SuperSlowTickUpdate();
}

async function SuperSlowTickUpdate() {
    while (true) {
        await mod.Wait(0.5);

        if (!ObjectiveItemData.isBeingCarried) continue;

        if (
            !mod.HasEquipment(
                ObjectiveItemData.carryingPlayer,
                mod.Gadgets.Misc_Supply_Pouch
            )
        ) {
            mod.AddEquipment(
                ObjectiveItemData.carryingPlayer,
                mod.Gadgets.Misc_Supply_Pouch
            );
        }

        try {
            const weapons = Object.values(mod.Weapons) as mod.Weapons[];
            const primaryWeapons = weapons.filter(
                (weapon) => !weapon.toString().startsWith("Sidearm_")
            );
            primaryWeapons.forEach((element) => {
                if (mod.HasEquipment(ObjectiveItemData.carryingPlayer, element)) {
                    mod.RemoveEquipment(
                        ObjectiveItemData.carryingPlayer,
                        mod.InventorySlots.PrimaryWeapon
                    );
                }
            });
        } catch { }
    }
}

async function SlowerTickUpdate() {
    while (true) {
        await mod.Wait(0.05);
        ObjectiveItemData.ItemProximityCheck();
        BelowHeightDamage();
    }
}

async function TickUpdate() {
    while (true) {
        await mod.Wait(0.0);
        ObjectiveItemData.ItemHeld();
    }
}

export async function OnPlayerJoinGame(player: mod.Player) {
    console.log("player " + mod.GetObjId(player) + " joined");
    mod.EnablePlayerDeploy(player, false);
    await mod.Wait(2.0);
    console.log(
        "JoinGame playerInstances length check: " +
        PlayerProfile.playerInstances.length
    );
    if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
        while (true) {
            if (mod.GetObjId(player) > -1) {
                break;
            }
            await mod.Wait(0.5);
        }
        const playerProfile = PlayerProfile.Get(player);
        if (playerProfile) {
            AssignTeam(playerProfile);
        }
        playerProfile?.UpdateUI(
            playerProfile.playerLoadoutWarningWidget,
            MakeMessage(mod.stringkeys.loading),
            true
        );
        mod.EnablePlayerDeploy(player, false);
        mod.SetRedeployTime(player, 5);
        console.log(
            "player " + mod.GetObjId(player) + " waiting to load for first deploy"
        );
        await mod.Wait(10.0);
    }

    if (!mod.IsPlayerValid(player)) return;

    if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
        console.log(
            "player " + mod.GetObjId(player) + " running remaining JoinGame code"
        );

        const playerProfile = PlayerProfile.Get(player);

        playerProfile?.UpdateUI(
            playerProfile.playerHeaderWidget,
            MakeMessage(mod.stringkeys.getObjectiveItem),
            true
        );
        playerProfile?.UpdateUI(
            playerProfile.playerSubHeaderWidget,
            MakeMessage(mod.stringkeys.subGetObjectiveItem),
            true
        );


        playerProfile?.ShowLoadoutWarningUI(true);

        ObjectiveItemData.RespawnSupplyVFX();
        ExtractionPoint.RespawnVFXForCurrentExtractionPoint();

        mod.EnablePlayerDeploy(player, true);

        console.log("enabled player deploy for player " + mod.GetObjId(player));

        if (!ObjectiveItemData.isBeingCarried) return;

        if (
            mod.GetObjId(mod.GetTeam(ObjectiveItemData.carryingPlayer)) ==
            mod.GetObjId(mod.GetTeam(player))
        ) {
            playerProfile?.UpdateUI(
                playerProfile.playerHeaderWidget,
                MakeMessage(mod.stringkeys.yourTeamHoldsTheItem),
                true
            );
            playerProfile?.UpdateUI(
                playerProfile.playerSubHeaderWidget,
                MakeMessage(mod.stringkeys.subYourTeamHoldsTheItem),
                true
            );
            playerProfile?.playerHeaderWidget &&
                mod.SetUITextColor(
                    playerProfile.playerHeaderWidget,
                    teamColors[
                    GetTrueTeamIDNumberOfPlayer(ObjectiveItemData.carryingPlayer) - 1
                    ]
                );
        } else {
            playerProfile?.UpdateUI(
                playerProfile.playerHeaderWidget,
                MakeMessage(
                    mod.stringkeys.playerHoldingObjectiveItem,
                    GetAdjustedTeamNumber(ObjectiveItemData.carryingPlayer)
                ),
                true
            );
            playerProfile?.UpdateUI(
                playerProfile.playerSubHeaderWidget,
                MakeMessage(mod.stringkeys.subPlayerHoldingObjectiveItem),
                true
            );
            playerProfile?.playerHeaderWidget &&
                mod.SetUITextColor(
                    playerProfile.playerHeaderWidget,
                    teamColors[
                    GetTrueTeamIDNumberOfPlayer(ObjectiveItemData.carryingPlayer) - 1
                    ]
                );
        }
    } else {
        mod.EnablePlayerDeploy(player, true);
        mod.SetTeam(player, mod.GetTeam(5)); // sets AI to team 5
    }
}


function GetAmountOfPlayersOnTheTeams(): Map<number, number> {
    const myMap = new Map<number, number>([[1, 0], [2, 0], [3, 0], [4, 0]]);

    const players = mod.AllPlayers();
    const n = mod.CountOf(players);

    for (let i = 0; i < n; i++) {
        const loopPlayer = mod.ValueInArray(players, i);

        if (
            mod.IsPlayerValid(loopPlayer) &&
            !mod.GetSoldierState(loopPlayer, mod.SoldierStateBool.IsAISoldier)
        ) {
            const teamId = PlayerProfile.Get(loopPlayer)?.playerTeamID;

            if (teamId && myMap.has(teamId)) {
                myMap.set(teamId, (myMap.get(teamId) ?? 0) + 1);
            }
        }
    }

    return myMap;
}


function GetTeamWithFewestPlayers(teamCounts: Map<number, number>): number {
    const entries = Array.from(teamCounts.entries());

    if (entries.length === 0) {
        return -1; // no teams
    }

    let [lowestTeam, lowestCount] = entries[0]; // take the first team as baseline

    for (let i = 1; i < entries.length; i++) {
        const [teamId, count] = entries[i];
        if (count < lowestCount) {
            lowestTeam = teamId;
            lowestCount = count;
        }
    }

    return lowestTeam;
}

function AssignTeam(player: PlayerProfile) {
    let amountInTeams = GetAmountOfPlayersOnTheTeams()

    // Find the team with the fewest players
    let minTeamId = GetTeamWithFewestPlayers(amountInTeams)

    // Assign player to that team
    player.playerTeamID = minTeamId;

    amountInTeams = GetAmountOfPlayersOnTheTeams()

    mod.SetTeam(player.player, mod.GetTeam(minTeamId));
}

export function OnPlayerSwitchTeam(
    eventPlayer: mod.Player,
    eventTeam: mod.Team
) {
    if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
        const playerprofile = PlayerProfile.Get(eventPlayer);
        if (playerprofile) {
            // IsPlayerOnRightTeamCheck(playerprofile);
        }
    }
}

export async function OnPlayerDeployed(player: mod.Player) {
    await mod.Wait(1.0);
    if (
        mod.IsPlayerValid(player) &&
        mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) &&
        !mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)
    ) {
        const playerProfile = PlayerProfile.Get(player);

        playerProfile && await IsPlayerOnRightTeamCheck(playerProfile);

        console.log("will show player " + mod.GetObjId(player) + " team widget");
        playerProfile?.ShowPlayerTeamWidget(true);

        if (playerProfile?.maxHealth != undefined) {
            playerProfile.maxHealth = mod.GetSoldierState(
                player,
                mod.SoldierStateNumber.MaxHealth
            );
        }

        console.log("will set player " + mod.GetObjId(player) + " loadout");

        SetPlayerLoadout(player);

        console.log(
            "will push player " + mod.GetObjId(player) + " to deployedplayers"
        );
        PlayerProfile.deployedPlayers.push(player);
        PlayerProfile.UpdateGameStartCountdown();

        if (!gameStartDebounce) {
            mod.EnableAllInputRestrictions(player, true);
        } else {
            mod.EnableAllInputRestrictions(player, false);
        }

        //mod.SkipManDown(player, true);
        await mod.Wait(0);
        console.log(
            "will unshow loadout warning for player " + mod.GetObjId(player)
        );
        playerProfile?.ShowLoadoutWarningUI(false);
    } else {
        AISpawnHandler.assignAIBehavior(player);
    }
}

async function IsPlayerOnRightTeamCheck(playerprofile: PlayerProfile) {
    const playerTeamID = mod.GetTeam(playerprofile.player)
    if ((mod.GetObjId(playerTeamID) != playerprofile.playerTeamID)) {
        mod.SetTeam(playerprofile.player, mod.GetTeam(playerprofile.playerTeamID + 1))
        console.log("player is not on the right team, reassign them to " + (playerprofile.playerTeamID + 1))
    }
    await mod.Wait(0.5)
}

export async function OnPlayerDied(player: mod.Player) {


    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == true) {
        AISpawnHandler.AiDied(player);
        return
    }

    if (
        ObjectiveItemData.carryingPlayer &&
        mod.IsPlayerValid(ObjectiveItemData.carryingPlayer) &&
        mod.GetObjId(player) == mod.GetObjId(ObjectiveItemData.carryingPlayer)
    ) {
        ObjectiveItemData.ItemDropped(ObjectiveItemData.carryingPlayer);
        ObjectiveItemData.itemDroppedDebounce = false;
        mod.YComponentOf(ObjectiveItemData.currentWorldIconPos) <
            heightToKillAt + 2.5 && ObjectiveItemData.ReturnItemToOriginalPosition(); // this is cursed but also very funny
        return;
    }

    if (
        mod.IsPlayerValid(player) &&
        mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false
    ) {
        PlayerProfile.RemovePlayerFromDeployedPlayers(player);
        if (!gameStartDebounce) {
            PlayerProfile.UpdateGameStartCountdown();
        }

        CheckToShowLoadoutWarning(player);
    }

}

async function CheckToShowLoadoutWarning(player: mod.Player) {
    let hasManDowned: boolean = false;
    try {
        while (mod.IsPlayerValid(player)) {
            await mod.Wait(0.1);
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown))
                hasManDowned = true;
            if (
                !mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown) &&
                !mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) &&
                mod.GetSoldierState(player, mod.SoldierStateBool.IsDead)
            ) {
                await (hasManDowned ? mod.Wait(2.4) : mod.Wait(6.7));
                PlayerProfile.Get(player)?.ShowLoadoutWarningUI(true);
                break;
            }
            continue;
        }
    } catch {
        console.log(
            "check to show loadout for player " + mod.GetObjId(player) + " failed"
        );
    }
}

export function OnPlayerLeaveGame(eventNumber: number) {


    try {
        if (
            (!ObjectiveItemData.carryingPlayer ||
                !mod.IsPlayerValid(ObjectiveItemData.carryingPlayer)) &&
            ObjectiveItemData.isBeingCarried
        ) {
            ObjectiveItemData.ItemDropped();
            ObjectiveItemData.itemDroppedDebounce = false;
        }
    } catch {
        if (ObjectiveItemData.isBeingCarried) {
            ObjectiveItemData.ItemDropped();
            ObjectiveItemData.itemDroppedDebounce = false;
        }
    }

    // iterate through and verify that all players in deployedPlayers are valid
    PlayerProfile.deployedPlayers.forEach((element) => {
        try {
            if (element == undefined || !mod.IsPlayerValid(element) || !element) {
                PlayerProfile.RemovePlayerFromDeployedPlayers(element);
            }
        } catch {
            PlayerProfile.RemovePlayerFromDeployedPlayers(element);
        }
    });

    PlayerProfile.playerInstances.forEach((element) => {
        try {
            if (element == undefined || !mod.IsPlayerValid(element) || !element) {
                PlayerProfile.RemovePlayerFromPlayerInstances(element);
            }
        } catch {
            PlayerProfile.RemovePlayerFromPlayerInstances(element);
        }
    });
    PlayerProfile.removePlayerProfile(eventNumber);
}

export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
) {
    if (
        eventPlayer &&
        mod.IsPlayerValid(eventPlayer) &&
        mod.GetObjId(eventPlayer) != mod.GetObjId(eventOtherPlayer) &&
        !mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)
    ) {
        try {
            const ammoToGive: number =
                mod.GetSoldierState(
                    eventPlayer,
                    mod.SoldierStateNumber.CurrentWeaponMagazineAmmo
                ) + 10;
            mod.SetInventoryMagazineAmmo(
                eventPlayer,
                mod.InventorySlots.SecondaryWeapon,
                ammoToGive
            );
            PlayerProfile.Get(eventPlayer)?.ShowAmmoFeedback();
        } catch { }
    }
}

/* function DoCustomInputRestrictions(player: mod.Player, bool: boolean){
    mod.EnableInputRestriction(player, mod.RestrictedInputs.MoveForwardBack, bool);
    mod.EnableInputRestriction(player, mod.RestrictedInputs.MoveLeftRight, bool);
} */

function SpawnAllGroundCloudVFX() {
    for (const key in vfxSpawnMap) {
        if (vfxSpawnMap.hasOwnProperty(Number(key))) {
            const convertedToBFVector = mod.CreateVector(
                vfxSpawnMap[Number(key)].x,
                vfxSpawnMap[Number(key)].y,
                vfxSpawnMap[Number(key)].z
            );
            const vfxInstance = H.SpawnVFX(
                mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Dirt,
                convertedToBFVector,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(1, 1, 1)
            );
        }
    }
}

function SetPlayerLoadout(player: mod.Player) {
    try {
        if (mod.HasEquipment(player, mod.Gadgets.Deployable_EOD_Bot)) {
            mod.RemoveEquipment(player, mod.Gadgets.Deployable_EOD_Bot);
        }

        if (mod.HasEquipment(player, mod.Gadgets.Deployable_Deploy_Beacon)) {
            mod.RemoveEquipment(player, mod.Gadgets.Deployable_Deploy_Beacon);
        }

        if (mod.HasEquipment(player, mod.Gadgets.Misc_Assault_Ladder)) {
            mod.RemoveEquipment(player, mod.Gadgets.Misc_Assault_Ladder);
        }
    } catch { }
}

function BelowHeightDamage() {
    let players = mod.AllPlayers();
    let n = mod.CountOf(players);

    for (let i = 0; i < n; i++) {
        let loopPlayer = mod.ValueInArray(players, i);
        if (
            mod.IsPlayerValid(loopPlayer) &&
            mod.GetSoldierState(loopPlayer, mod.SoldierStateBool.IsAlive)
        ) {
            const position = mod.GetSoldierState(
                loopPlayer,
                mod.SoldierStateVector.GetPosition
            );
            if (mod.YComponentOf(position) < heightToKillAt) {
                mod.Kill(loopPlayer);
            }
        }
    }
}

function Lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function MakeMessage(message: string, ...args: any[]) {
    switch (args.length) {
        case 0:
            return mod.Message(message);
        case 1:
            return mod.Message(message, args[0]);
        case 2:
            return mod.Message(message, args[0], args[1]);
        case 3:
            return mod.Message(message, args[0], args[1], args[2]);
        default:
            throw new Error("Invalid number of arguments");
    }
}

class ObjectiveItemData {
    static defaultWorldIcon: mod.WorldIcon;
    static teamWorldIcon1: mod.WorldIcon; // this was intended to use an array, but it did not work out
    static teamWorldIcon2: mod.WorldIcon;
    static teamWorldIcon3: mod.WorldIcon;
    static teamWorldIcon4: mod.WorldIcon;

    static vfxInstance: mod.VFX;

    static itemCurrentlyDropped = false;
    static isBeingCarried: boolean = false;
    static carryingPlayer: mod.Player;

    // for now, remember to set this every time you set the item's position. It's defined here using its placement in the map editor.
    static originalWorldIconPos: mod.Vector = mod.CreateVector(
        -62.228,
        81.284,
        -69.129
    );
    static currentWorldIconPos: mod.Vector = this.originalWorldIconPos;
    static lastCarryingPlayerPos: mod.Vector = mod.CreateVector(0, 0, 0);

    static itemDroppedDebounce: boolean = true;
    static hasBeenPickedUpOnce: boolean = false;

    static dropTime: number = 0;

    static extractionPointsMap: Record<number, mod.Vector>;

    static Initialize() {
        this.defaultWorldIcon = mod.GetWorldIcon(1500);
        this.teamWorldIcon1 = mod.GetWorldIcon(1501);
        this.teamWorldIcon2 = mod.GetWorldIcon(1502);
        this.teamWorldIcon3 = mod.GetWorldIcon(1503);
        this.teamWorldIcon4 = mod.GetWorldIcon(1504);
        mod.SetWorldIconOwner(this.teamWorldIcon1, mod.GetTeam(1));
        mod.SetWorldIconOwner(this.teamWorldIcon2, mod.GetTeam(2));
        mod.SetWorldIconOwner(this.teamWorldIcon3, mod.GetTeam(3));
        mod.SetWorldIconOwner(this.teamWorldIcon4, mod.GetTeam(4));
        //this.vfxInstance = H.SpawnVFX(mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom, this.originalWorldIconPos);
    }

    static async RespawnSupplyVFX() {
        await mod.Wait(3.0);
        if (this.vfxInstance) {
            mod.EnableVFX(this.vfxInstance, false);
        }
        this.vfxInstance = H.SpawnVFX(
            mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Yellow,
            this.currentWorldIconPos
        );
    }

    static RefreshWorldIconOwners() {
        mod.SetWorldIconColor(this.teamWorldIcon1, mod.CreateVector(1, 0, 0));
        mod.SetWorldIconColor(this.teamWorldIcon2, mod.CreateVector(1, 0, 0));
        mod.SetWorldIconColor(this.teamWorldIcon3, mod.CreateVector(1, 0, 0));
        mod.SetWorldIconColor(this.teamWorldIcon4, mod.CreateVector(1, 0, 0));

        switch (GetTrueTeamIDNumberOfPlayer(this.carryingPlayer)) {
            case 1:
                mod.SetWorldIconColor(this.teamWorldIcon1, mod.CreateVector(0, 1, 0));
                break;
            case 2:
                mod.SetWorldIconColor(this.teamWorldIcon2, mod.CreateVector(0, 1, 0));
                break;
            case 3:
                mod.SetWorldIconColor(this.teamWorldIcon3, mod.CreateVector(0, 1, 0));
                break;
            case 4:
                mod.SetWorldIconColor(this.teamWorldIcon4, mod.CreateVector(0, 1, 0));
                break;
            default:
                break;
        }
    }

    static EnableCarryingWorldIcons(bool: boolean) {
        this.RefreshWorldIconOwners();
        if (bool) {
            mod.EnableWorldIconImage(this.teamWorldIcon1, true);
            mod.EnableWorldIconImage(this.teamWorldIcon2, true);
            mod.EnableWorldIconImage(this.teamWorldIcon3, true);
            mod.EnableWorldIconImage(this.teamWorldIcon4, true);
            mod.EnableWorldIconImage(this.defaultWorldIcon, false);
        } else {
            mod.EnableWorldIconImage(this.teamWorldIcon1, false);
            mod.EnableWorldIconImage(this.teamWorldIcon2, false);
            mod.EnableWorldIconImage(this.teamWorldIcon3, false);
            mod.EnableWorldIconImage(this.teamWorldIcon4, false);
            mod.EnableWorldIconImage(this.defaultWorldIcon, true);
        }
    }

    static async ReturnItemToOriginalPosition() {
        this.dropTime = 0; // reset the drop time
        this.currentWorldIconPos = this.originalWorldIconPos;
        mod.SetWorldIconPosition(this.defaultWorldIcon, this.currentWorldIconPos);
        mod.MoveVFX(
            this.vfxInstance,
            this.currentWorldIconPos,
            mod.CreateVector(0, 0, 0)
        );
        console.log("should have returned to original position");
        this.itemCurrentlyDropped = false;

        PlayerProfile.playerInstances.forEach((element, elementIndex) => {
            const playerProfile = PlayerProfile.Get(element);
            playerProfile?.UpdateUI(
                playerProfile.playerHeaderWidget,
                MakeMessage(mod.stringkeys.getObjectiveItem, this.carryingPlayer),
                true
            );
            playerProfile?.UpdateUI(
                playerProfile.playerSubHeaderWidget,
                MakeMessage(mod.stringkeys.subGetObjectiveItem),
                true
            );
            playerProfile?.playerHeaderWidget &&
                mod.SetUITextColor(playerProfile.playerHeaderWidget, battlefieldWhite);
        });
    }

    static ItemProximityCheck() {
        // this implementation will potentially mess up when multiple players enter the pickup range in quicker succession than the tick, should probably have a failsafe
        if (!this.isBeingCarried) {
            const player = mod.ClosestPlayerTo(this.currentWorldIconPos);
            let pos;
            if (
                mod.IsPlayerValid(player) &&
                !mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) &&
                mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)
            ) {
                pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
                const playerPos = pos;
                const distance = mod.DistanceBetween(
                    this.currentWorldIconPos,
                    playerPos
                );

                if (distance <= itemPickupDistance) {
                    this.ItemPickedUp(player);
                }
            }
        }
    }

    static ItemPickedUp(player: mod.Player) {
        this.isBeingCarried = true;
        this.carryingPlayer = player;
        this.itemDroppedDebounce = true;
        this.itemCurrentlyDropped = false;
        this.dropTime = 0; // reset the drop time

        mod.SpotTarget(player, 10000000);

        // should maybe disable the world icon for the player holding the item,
        // though its position above the player's head should hide it enough.
        this.EnableCarryingWorldIcons(true);

        const playerProfile = PlayerProfile.Get(player);

        if (this.hasBeenPickedUpOnce) {
            mod.SetPlayerMovementSpeedMultiplier(player, itemCarrySpeedFactor);
            console.log("itemCarrySpeedFactor: ", itemCarrySpeedFactor);
            if (
                itemCarrySpeedFactor + itemCarrySpeedIncrement <
                itemCarrySpeedFactorCap + itemCarrySpeedIncrement
            )
                itemCarrySpeedFactor = itemCarrySpeedFactor + itemCarrySpeedIncrement;

            if (playerProfile?.maxHealth != undefined) {
                mod.SetPlayerMaxHealth(
                    player,
                    playerProfile?.maxHealth * itemCarryHealthFactor
                );
                console.log("itemCarryHealthFactor: ", itemCarryHealthFactor);
                if (
                    itemCarryHealthFactor + itemCarryHealthIncrement <
                    itemCarryHealthFactorCap + itemCarryHealthIncrement
                )
                    itemCarryHealthFactor =
                        itemCarryHealthFactor + itemCarryHealthIncrement;
            }
        }

        console.log("Item picked up, pre ShowCarryBuffUI");

        playerProfile?.ShowCarryBuffUI(true);

        mod.EnableInputRestriction(
            player,
            mod.RestrictedInputs.SelectPrimary,
            true
        );
        mod.ForceSwitchInventory(player, mod.InventorySlots.SecondaryWeapon);

        this.hasBeenPickedUpOnce = true;

        console.log("Item picked up has been run");

        PlayerProfile.playerInstances.forEach((element) => {
            console.log(
                "running carry UI update for player: " + mod.GetObjId(element)
            );
            const playerProfile = PlayerProfile.Get(element);
            if (
                mod.GetObjId(ObjectiveItemData.carryingPlayer) == mod.GetObjId(element)
            ) {
                playerProfile?.UpdateUI(
                    playerProfile.playerHeaderWidget,
                    MakeMessage(mod.stringkeys.youHoldTheItem),
                    true
                );
                playerProfile?.UpdateUI(
                    playerProfile.playerSubHeaderWidget,
                    MakeMessage(mod.stringkeys.subYouHoldTheItem),
                    true
                );
                playerProfile?.playerHeaderWidget &&
                    mod.SetUITextColor(
                        playerProfile.playerHeaderWidget,
                        teamColors[GetTrueTeamIDNumberOfPlayer(this.carryingPlayer) - 1]
                    );
            } else if (
                mod.GetObjId(mod.GetTeam(ObjectiveItemData.carryingPlayer)) ==
                mod.GetObjId(mod.GetTeam(element))
            ) {
                playerProfile?.UpdateUI(
                    playerProfile.playerHeaderWidget,
                    MakeMessage(mod.stringkeys.yourTeamHoldsTheItem),
                    true
                );
                playerProfile?.UpdateUI(
                    playerProfile.playerSubHeaderWidget,
                    MakeMessage(mod.stringkeys.subYourTeamHoldsTheItem),
                    true
                );
                playerProfile?.playerHeaderWidget &&
                    mod.SetUITextColor(
                        playerProfile.playerHeaderWidget,
                        teamColors[GetTrueTeamIDNumberOfPlayer(this.carryingPlayer) - 1]
                    );
            } else {
                playerProfile?.UpdateUI(
                    playerProfile.playerHeaderWidget,
                    MakeMessage(
                        mod.stringkeys.playerHoldingObjectiveItem,
                        GetAdjustedTeamNumber(this.carryingPlayer)
                    ),
                    true
                );
                playerProfile?.UpdateUI(
                    playerProfile.playerSubHeaderWidget,
                    MakeMessage(mod.stringkeys.subPlayerHoldingObjectiveItem),
                    true
                );
                playerProfile?.playerHeaderWidget &&
                    mod.SetUITextColor(
                        playerProfile.playerHeaderWidget,
                        teamColors[GetTrueTeamIDNumberOfPlayer(this.carryingPlayer) - 1]
                    );
            }
        });

        console.log(
            "will now activate extraction point for team " +
            GetTrueTeamIDNumberOfPlayer(this.carryingPlayer)
        );

        ExtractionPoint.ActivateExtractionPoint(mod.GetTeam(player));
    }

    static ItemDropped(player?: mod.Player) {
        this.isBeingCarried = false;
        this.currentWorldIconPos = mod.Add(
            this.lastCarryingPlayerPos,
            mod.CreateVector(0, 0.7, 0)
        );
        this.itemCurrentlyDropped = true;
        this.dropTime = mod.GetMatchTimeElapsed();

        ExtractionPoint.DeactivateAllExtractionPoints();

        if (player) {
            mod.SpotTarget(player, 0.1);
            mod.SetPlayerMovementSpeedMultiplier(player, 1.0);
            const playerProfile = PlayerProfile.Get(player);

            if (playerProfile?.maxHealth != undefined) {
                mod.SetPlayerMaxHealth(player, playerProfile?.maxHealth);
            }

            playerProfile?.ShowCarryBuffUI(false);

            mod.EnableInputRestriction(
                player,
                mod.RestrictedInputs.SelectPrimary,
                false
            );
        }

        this.EnableCarryingWorldIcons(false);

        mod.SetWorldIconPosition(this.defaultWorldIcon, this.currentWorldIconPos);

        PlayerProfile.playerInstances.forEach((element, elementIndex) => {
            const playerProfile = PlayerProfile.Get(element);
            playerProfile?.UpdateUI(
                playerProfile.playerHeaderWidget,
                MakeMessage(mod.stringkeys.objectiveItemDropped, this.carryingPlayer),
                true
            );
            playerProfile?.UpdateUI(
                playerProfile.playerSubHeaderWidget,
                MakeMessage(mod.stringkeys.subObjectiveItemDropped),
                true
            );
            playerProfile?.playerHeaderWidget &&
                mod.SetUITextColor(playerProfile.playerHeaderWidget, battlefieldWhite);
        });
    }

    static ItemHeld() {
        if (
            this.dropTime > 0 &&
            mod.GetMatchTimeElapsed() - this.dropTime > itemReturnTime
        ) {
            console.log(
                "item return time exceeded, returning item to original position"
            );
            this.ReturnItemToOriginalPosition();
            //mod.DisplayNotificationMessage(MakeMessage(mod.stringkeys.packageReturned));
        }

        if (!this.isBeingCarried) return;

        if (
            mod.IsPlayerValid(this.carryingPlayer) &&
            mod.GetSoldierState(this.carryingPlayer, mod.SoldierStateBool.IsAlive)
        ) {
            this.lastCarryingPlayerPos = mod.GetSoldierState(
                this.carryingPlayer,
                mod.SoldierStateVector.GetPosition
            );
            const playerPosWithOffset = mod.Add(
                this.lastCarryingPlayerPos,
                mod.CreateVector(0, 2.3, 0)
            );
            mod.SetWorldIconPosition(this.teamWorldIcon1, playerPosWithOffset);
            mod.SetWorldIconPosition(this.teamWorldIcon2, playerPosWithOffset);
            mod.SetWorldIconPosition(this.teamWorldIcon3, playerPosWithOffset);
            mod.SetWorldIconPosition(this.teamWorldIcon4, playerPosWithOffset);
            mod.MoveVFX(
                this.vfxInstance,
                mod.Add(this.lastCarryingPlayerPos, mod.CreateVector(0, 2.5, 0)),
                mod.CreateVector(0, 0, 0)
            );
            this.currentWorldIconPos = playerPosWithOffset;
        }
    }
}

function GetTrueTeamIDNumberOfPlayer(player: mod.Player) {
    if (!mod.IsPlayerValid(player) || mod.GetObjId(player) < 0) {
        console.log(
            `GetTrueTeamIDNumberOfPlayer called with invalid player: ${mod.GetObjId(
                player
            )}`
        );
        return 1; // Default to team 1 instead of 0
    }

    const teamId = mod.GetTeam(player);
    let teamInt = 1;

    // Start from 1 since team 0 doesn't exist
    for (let i = 1; i <= teamAmount; i++) {
        try {
            if (mod.GetObjId(teamId) == mod.GetObjId(mod.GetTeam(i))) {
                teamInt = i;
                break;
            }
        } catch (error) {
            console.log(
                `Error comparing team IDs for player ${mod.GetObjId(player)}: ${error}`
            );
        }
    }

    // Validate the result
    if (teamInt < 1 || teamInt > teamAmount) {
        console.log(
            `Invalid teamInt ${teamInt} for player ${mod.GetObjId(
                player
            )}, defaulting to team 1`
        );
        teamInt = 1;
    }

    console.log(
        `player ${mod.GetObjId(player)} teamInt is now set to ${teamInt}`
    );
    return teamInt;
}

function GetTrueTeamIDNumberOfTeam(team: mod.Team): number {
    const teamId = team;
    let teamInt = 0;

    for (let i = 1; i <= teamAmount; i++) {
        if (mod.GetObjId(teamId) == mod.GetObjId(mod.GetTeam(i))) {
            teamInt = i;
            break;
        }
    }

    return teamInt;
}

// this is no longer adjusted
function GetAdjustedTeamNumber(
    player?: mod.Player | undefined,
    team?: mod.Team | undefined
): number {
    let teamId: mod.Team | undefined;
    if (player) teamId = mod.GetTeam(player);
    if (team) teamId = team;
    let teamInt = 0;

    player && console.log("will get teamInt for player " + mod.GetObjId(player));

    if (teamId) {
        for (let i = 1; i <= teamAmount; i++) {
            if (mod.GetObjId(teamId) == mod.GetObjId(mod.GetTeam(i))) {
                teamInt = i;
                player &&
                    console.log(
                        "player " +
                        mod.GetObjId(player) +
                        " teamInt is now set to " +
                        teamInt
                    );
                break;
            }
        }
    }

    return teamInt;
}

let gameStartDebounce: boolean = false;

class PlayerProfile {
    player: mod.Player;
    playerTeamID: number = -1;
    maxHealth: number = 100;
    checkpointNb: number = 0;
    currentTrack: number = 1;
    playerTeamWidget: mod.UIWidget;
    playerHeaderWidget: mod.UIWidget;
    playerSubHeaderWidget: mod.UIWidget;
    playerAmmoFeedbackWidget: mod.UIWidget[];
    playerCarryBuffWidget: mod.UIWidget[];
    playerLoadoutWarningWidget: mod.UIWidget;
    versionWidget: mod.UIWidget;
    static playerInstances: mod.Player[] = [];
    static deployedPlayers: mod.Player[] = [];
    static #allPlayerProfiles: { [key: number]: PlayerProfile } = {}; // probably remove playerprofile here as well when players leave

    constructor(player: mod.Player) {
        this.player = player;
        this.playerHeaderWidget = this.CreateHeaderUI();
        this.playerSubHeaderWidget = this.CreateSubHeaderUI();
        this.playerTeamWidget = this.CreatePlayerTeamUI();
        this.playerAmmoFeedbackWidget = [
            this.CreateAmmoFeedbackUI(),
            this.CreateAmmoFadeLineUI(true),
            this.CreateAmmoFadeLineUI(false),
        ];
        this.playerCarryBuffWidget = [
            this.CreateCarryBuffUI(true),
            this.CreateCarryBuffUI(false),
            this.CreateCarryTextBlockUI(),
        ];
        this.playerLoadoutWarningWidget = this.CreateLoadoutWarningUI();
        this.versionWidget = this.CreateVersionUI();
        PlayerProfile.playerInstances.push(this.player);
        PlayerProfile.HandleIfTheGameIsFull();
    }

    static Get(player: mod.Player): PlayerProfile | undefined {
        if (mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);
            let playerProfile = this.#allPlayerProfiles[index];

            // if the player does not have a profile, create and initialize one
            if (!playerProfile) {
                playerProfile = new PlayerProfile(player);

                if (debugPlayer) console.log("Creating Player Profile");

                this.#allPlayerProfiles[index] = playerProfile;
            }
            return playerProfile;
        }
    }

    static removePlayerProfile(playerId: number): boolean {
        if (this.#allPlayerProfiles[playerId]) {
            delete this.#allPlayerProfiles[playerId];
            return true; // successfully deleted
        }
        return false; // playerId not found
    }

    static HandleIfTheGameIsFull() {
        console.log("would have tried to handle if the game is full");
    }

    static RemovePlayerFromDeployedPlayers(player: mod.Player) {
        const index = this.deployedPlayers.findIndex(
            (p) => mod.GetObjId(p) === mod.GetObjId(player)
        );
        if (index !== -1) {
            this.deployedPlayers.splice(index, 1);
            console.log(
                "Removed player from deployedPlayers: ",
                mod.GetObjId(player)
            );
        } else {
            console.log(
                "Player not found in deployedPlayers: ",
                mod.GetObjId(player)
            );
        }
    }

    static RemovePlayerFromPlayerInstances(player: mod.Player) {
        const index = this.playerInstances.findIndex(
            (p) => mod.GetObjId(p) === mod.GetObjId(player)
        );
        if (index !== -1) {
            this.playerInstances.splice(index, 1);
            console.log(
                "Removed player from playerInstances: ",
                mod.GetObjId(player)
            );
        } else {
            console.log(
                "Player not found in playerInstances: ",
                mod.GetObjId(player)
            );
        }
    }

    static whileLoopStarted: boolean = false;

    static async UpdateGameStartCountdown() {
        if (gameStartDebounce || this.whileLoopStarted) return;

        this.deployedPlayers.forEach((element) => {
            const playerProfile = this.Get(element);
            playerProfile?.UpdateUI(
                playerProfile.playerHeaderWidget,
                MakeMessage(mod.stringkeys.waitingForPlayers),
                true
            );
            playerProfile?.UpdateUI(
                playerProfile.playerSubHeaderWidget,
                MakeMessage(
                    mod.stringkeys.playersToWaitFor,
                    this.deployedPlayers.length,
                    requiredPlayersToStart
                ),
                true
            );
        });

        if (
            this.deployedPlayers.length >= requiredPlayersToStart &&
            !this.whileLoopStarted
        ) {
            //pls check for only deployed players yes
            this.whileLoopStarted = true;
            while (true) {
                this.playerInstances.forEach((element) => {
                    const playerProfile = this.Get(element);
                    const formattedTime = FormatTime(gameStartCountdown);
                    playerProfile?.UpdateUI(
                        playerProfile.playerHeaderWidget,
                        MakeMessage(mod.stringkeys.gameStartingIn),
                        true
                    );
                    playerProfile?.UpdateUI(
                        playerProfile.playerSubHeaderWidget,
                        MakeMessage(
                            mod.stringkeys.timerCounterThing,
                            formattedTime[0],
                            formattedTime[1],
                            formattedTime[2]
                        ),
                        true
                    );
                    if (
                        gameStartCountdown <= 0 &&
                        mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)
                    ) {
                        mod.EnableAllInputRestrictions(element, false);
                    }
                });

                if (this.deployedPlayers.length < requiredPlayersToStart) {
                    gameStartCountdown = baseGameStartCountdown; // reset the countdown if not enough players are deployed
                    this.playerInstances.forEach((element) => {
                        const playerProfile = this.Get(element);
                        playerProfile?.UpdateUI(
                            playerProfile.playerHeaderWidget,
                            MakeMessage(mod.stringkeys.waitingForPlayers),
                            true
                        );
                        playerProfile?.UpdateUI(
                            playerProfile.playerSubHeaderWidget,
                            MakeMessage(
                                mod.stringkeys.playersToWaitFor,
                                this.deployedPlayers.length,
                                requiredPlayersToStart
                            ),
                            true
                        );
                    });
                    this.whileLoopStarted = false;
                    break;
                }

                if (gameStartCountdown <= 0 && !gameStartDebounce) {
                    gameStartDebounce = true;
                    this.playerInstances.forEach((element) => {
                        const playerProfile = this.Get(element);
                        playerProfile?.UpdateUI(
                            playerProfile.playerHeaderWidget,
                            MakeMessage(mod.stringkeys.getObjectiveItem),
                            true
                        );
                        playerProfile?.UpdateUI(
                            playerProfile.playerSubHeaderWidget,
                            MakeMessage(mod.stringkeys.subGetObjectiveItem),
                            true
                        );
                    });
                    SpawnEnemies();
                    break;
                }

                await mod.Wait(1);
                gameStartCountdown--;
            }
        } else {
            gameStartCountdown = baseGameStartCountdown; // reset the countdown if not enough players are deployed
            this.deployedPlayers.forEach((element) => {
                const playerProfile = this.Get(element);
                playerProfile?.UpdateUI(
                    playerProfile.playerHeaderWidget,
                    MakeMessage(mod.stringkeys.waitingForPlayers),
                    true
                );
                playerProfile?.UpdateUI(
                    playerProfile.playerSubHeaderWidget,
                    MakeMessage(
                        mod.stringkeys.playersToWaitFor,
                        this.deployedPlayers.length,
                        requiredPlayersToStart
                    ),
                    true
                );
            });
        }
    }

    CreateVersionUI(): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        mod.AddUIText(
            coolahhuiname,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(200, 25, 0),
            mod.UIAnchor.BottomRight,
            MakeMessage(
                mod.stringkeys.modversion,
                VERSION[0],
                VERSION[1],
                VERSION[2]
            ),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 20);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(widget, true);

        return widget;
    }

    ShowLoadoutWarningUI(show: boolean) {
        mod.SetUIWidgetVisible(this.playerLoadoutWarningWidget, show);
        mod.SetUITextLabel(
            this.playerLoadoutWarningWidget,
            MakeMessage(mod.stringkeys.loadoutWarning)
        );
        console.log("showing loadout warning");
    }

    CreateLoadoutWarningUI(): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        mod.AddUIText(
            coolahhuiname,
            mod.CreateVector(0, 80, 0),
            mod.CreateVector(370, 35, 0),
            mod.UIAnchor.Center,
            MakeMessage(mod.stringkeys.loadoutWarning),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 20);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(1, 0.8, 0.8));
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    ShowCarryBuffUI(show: boolean) {
        if (show) {
            mod.SetUIWidgetVisible(this.playerCarryBuffWidget[0], true);
            mod.SetUIWidgetVisible(this.playerCarryBuffWidget[1], true);
            mod.SetUITextLabel(
                this.playerCarryBuffWidget[0],
                MakeMessage(mod.stringkeys.speedNumber, itemCarrySpeedFactor * 100)
            );
            mod.SetUITextLabel(
                this.playerCarryBuffWidget[1],
                MakeMessage(mod.stringkeys.healthNumber, itemCarryHealthFactor * 100)
            );
            mod.SetUIWidgetVisible(this.playerCarryBuffWidget[2], true);
        } else {
            mod.SetUIWidgetVisible(this.playerCarryBuffWidget[0], false);
            mod.SetUIWidgetVisible(this.playerCarryBuffWidget[1], false);
            mod.SetUITextLabel(
                this.playerCarryBuffWidget[0],
                MakeMessage(mod.stringkeys.speedNumber, itemCarrySpeedFactor * 100)
            );
            mod.SetUITextLabel(
                this.playerCarryBuffWidget[1],
                MakeMessage(mod.stringkeys.healthNumber, itemCarryHealthFactor * 100)
            );
            mod.SetUIWidgetVisible(this.playerCarryBuffWidget[2], false);
        }
    }

    CreateCarryTextBlockUI(): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        mod.AddUIText(
            coolahhuiname,
            mod.CreateVector(0, 148, 0),
            mod.CreateVector(170, 22, 0),
            mod.UIAnchor.TopCenter,
            MakeMessage(mod.stringkeys.xfirex),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 18);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, 0);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(1, 0.8, 0.8));
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    CreateCarryBuffUI(isSpeed: boolean): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        //console.log(coolahhteamuiname);
        const message: mod.Message = isSpeed
            ? MakeMessage(mod.stringkeys.speedNumber, itemCarrySpeedFactor * 100)
            : MakeMessage(mod.stringkeys.healthNumber, itemCarryHealthFactor * 100);
        mod.AddUIText(
            coolahhuiname,
            mod.CreateVector(isSpeed ? -140 : 140, 148, 0),
            mod.CreateVector(110, 22, 0),
            mod.UIAnchor.TopCenter,
            message,
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 18);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetBgColor(widget, battlefieldBlueBg);
        mod.SetUITextColor(widget, battlefieldWhite);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    CreatePlayerTeamUI() {
        const coolahhteamuiname = "name" + uniqueNameNumber++;
        console.log(coolahhteamuiname);
        mod.AddUIText(
            coolahhteamuiname,
            mod.CreateVector(56, 18, 0),
            mod.CreateVector(75, 25, 0),
            mod.UIAnchor.TopCenter,
            MakeMessage(
                mod.stringkeys.teamNumber,
                GetAdjustedTeamNumber(this.player)
            ),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhteamuiname);
        mod.SetUITextSize(widget, 20);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);

        // Safe team color assignment
        try {
            if (mod.IsPlayerValid(this.player)) {
                const teamInt = GetTrueTeamIDNumberOfPlayer(this.player);
                const teamColorIndex = teamInt - 1;

                if (
                    teamColorIndex >= 0 &&
                    teamColorIndex < teamColors.length &&
                    teamColors[teamColorIndex]
                ) {
                    mod.SetUIWidgetBgColor(widget, teamColors[teamColorIndex]);
                } else {
                    console.log(
                        `Invalid team color for player ${mod.GetObjId(
                            this.player
                        )}, using fallback`
                    );
                    mod.SetUIWidgetBgColor(widget, teamColors[0]);
                }
            } else {
                mod.SetUIWidgetBgColor(widget, teamColors[0]);
            }
        } catch (error) {
            console.log(`Error setting team color: ${error}`);
            mod.SetUIWidgetBgColor(widget, teamColors[0]);
        }

        mod.SetUITextColor(widget, mod.CreateVector(0, 0, 0));
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgAlpha(widget, 1);
        this.CreatePlayerTeamBgUI();
        return widget;
    }

    CreatePlayerTeamBgUI(): void {
        const coolahhteamuiname: string = "name" + uniqueNameNumber++;
        mod.AddUIText(
            coolahhteamuiname,
            mod.CreateVector(0, 13, 0),
            mod.CreateVector(214, 35, 0),
            mod.UIAnchor.TopCenter,
            MakeMessage(mod.stringkeys.youAreOnTeam),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhteamuiname) as mod.UIWidget;
        mod.SetUITextSize(widget, 26);
        mod.SetUITextAnchor(widget, mod.UIAnchor.CenterLeft);
        mod.SetUITextColor(widget, battlefieldWhite);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widget, battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widget, 1);
    }

    ShowPlayerTeamWidget(show: boolean) {
        if (!mod.IsPlayerValid(this.player)) {
            console.log("ShowPlayerTeamWidget: Invalid player, aborting");
            return;
        }

        if (show) {
            const teamInt = GetTrueTeamIDNumberOfPlayer(this.player);
            const teamColorIndex = teamInt - 1;

            // Validate team color exists
            if (
                teamColorIndex < 0 ||
                teamColorIndex >= teamColors.length ||
                !teamColors[teamColorIndex]
            ) {
                console.log(
                    `Invalid team color index ${teamColorIndex} for player ${mod.GetObjId(
                        this.player
                    )}, using default`
                );
                mod.SetUIWidgetBgColor(this.playerTeamWidget, teamColors[0]); // fallback to first color
            } else {
                mod.SetUIWidgetBgColor(
                    this.playerTeamWidget,
                    teamColors[teamColorIndex]
                );
            }

            mod.SetUIWidgetVisible(this.playerTeamWidget, true);
            mod.SetUITextLabel(
                this.playerTeamWidget,
                MakeMessage(
                    mod.stringkeys.teamNumber,
                    GetAdjustedTeamNumber(this.player)
                )
            );
        } else {
            mod.SetUIWidgetVisible(this.playerTeamWidget, false);
        }
    }

    UpdateUI(
        widget: mod.UIWidget | undefined,
        message?: mod.Message,
        show?: boolean
    ) {
        widget && message && mod.SetUITextLabel(widget, message);
        widget && show && mod.SetUIWidgetVisible(widget, show);
    }

    //currentLerpvalue: number = 0;

    async InterpAmmoFeedback() {
        let currentLerpvalue: number = 0;
        let lerpIncrement: number = 0;
        while (currentLerpvalue < 1.0) {
            if (!this.ammoFeedbackBeingShown) break;
            lerpIncrement = lerpIncrement + 0.1;
            currentLerpvalue = Lerp(currentLerpvalue, 1, lerpIncrement);
            mod.SetUIWidgetBgAlpha(
                this.playerAmmoFeedbackWidget[0],
                1 - currentLerpvalue
            );
            mod.SetUIWidgetBgAlpha(
                this.playerAmmoFeedbackWidget[1],
                1 - currentLerpvalue
            );
            mod.SetUIWidgetBgAlpha(
                this.playerAmmoFeedbackWidget[2],
                1 - currentLerpvalue
            );
            mod.SetUITextAlpha(
                this.playerAmmoFeedbackWidget[0],
                1 - currentLerpvalue
            );
            await mod.Wait(0.0);
        }
    }

    ammoFeedbackBeingShown: boolean = false;
    ammoFeedbackQueued: boolean = false;

    async ShowAmmoFeedback() {
        if (this.ammoFeedbackBeingShown) {
            this.ammoFeedbackQueued = true;
            return;
        }

        this.ammoFeedbackBeingShown = true;
        mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[0], true);
        mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[1], true);
        mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[2], true);
        mod.SetUIWidgetBgAlpha(this.playerAmmoFeedbackWidget[0], 1);
        mod.SetUIWidgetBgAlpha(this.playerAmmoFeedbackWidget[1], 1);
        mod.SetUIWidgetBgAlpha(this.playerAmmoFeedbackWidget[2], 1);

        mod.SetUITextAlpha(this.playerAmmoFeedbackWidget[0], 1);

        await mod.Wait(0.9);
        this.InterpAmmoFeedback();
        await mod.Wait(0.5);

        if (this.ammoFeedbackQueued) {
            this.ammoFeedbackBeingShown = false;
            this.ammoFeedbackQueued = false;
            mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[0], false);
            mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[1], false);
            mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[2], false);
            await mod.Wait(0.1);
            this.ShowAmmoFeedback();
            return;
        }

        this.ammoFeedbackBeingShown = false;
        mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[0], false);
        mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[1], false);
        mod.SetUIWidgetVisible(this.playerAmmoFeedbackWidget[2], false);
    }

    CreateAmmoFeedbackUI(): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        mod.AddUIText(
            coolahhuiname,
            mod.CreateVector(0, 185, 0),
            mod.CreateVector(150, 25, 0),
            mod.UIAnchor.TopCenter,
            MakeMessage(mod.stringkeys.ammoUp),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextColor(widget, mod.CreateVector(0, 0, 0));
        mod.SetUITextSize(widget, 18);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, -100);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    CreateAmmoFadeLineUI(right: boolean): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        let horizontalOffset: number = right ? 150 : -150;
        mod.AddUIContainer(
            coolahhuiname,
            mod.CreateVector(horizontalOffset, 185, 0),
            mod.CreateVector(150, 25, 0),
            mod.UIAnchor.TopCenter,
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUIWidgetPadding(widget, 1);
        right
            ? mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientLeft)
            : mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientRight);
        mod.SetUIWidgetBgColor(widget, battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }

    CreateHeaderUI(): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        mod.AddUIText(
            coolahhuiname,
            mod.CreateVector(0, 60, 0),
            mod.CreateVector(390, 82, 0),
            mod.UIAnchor.TopCenter,
            MakeMessage(mod.stringkeys.waitingForPlayers),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextColor(widget, battlefieldWhite);
        mod.SetUITextSize(widget, 38);
        mod.SetUITextAnchor(widget, mod.UIAnchor.TopCenter);
        mod.SetUIWidgetPadding(widget, 1);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(widget, battlefieldBlueBg);
        mod.SetUIWidgetBgAlpha(widget, 1);

        this.CreateDividingLineUI(true);
        this.CreateDividingLineUI(false);
        this.CreateFrameLineUI(true);
        this.CreateFrameLineUI(false);

        return widget;
    }

    CreateDividingLineUI(right: boolean): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        let horizontalOffset: number = right ? 85 : -85;
        mod.AddUIContainer(
            coolahhuiname,
            mod.CreateVector(horizontalOffset, 106, 0),
            mod.CreateVector(170, 1.0, 0),
            mod.UIAnchor.TopCenter,
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget, 1);

        return widget;
    }

    CreateFrameLineUI(right: boolean): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        let horizontalOffset: number = right ? 195 : -195;
        mod.AddUIContainer(
            coolahhuiname,
            mod.CreateVector(horizontalOffset, 60, 0),
            mod.CreateVector(1.0, 82, 0),
            mod.UIAnchor.TopCenter,
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, battlefieldWhite);
        mod.SetUIWidgetBgAlpha(widget, 1);

        return widget;
    }

    CreateSubHeaderUI(): mod.UIWidget {
        const coolahhuiname: string = "name" + uniqueNameNumber++;
        mod.AddUIText(
            coolahhuiname,
            mod.CreateVector(0, 60, 0),
            mod.CreateVector(450, 82, 0),
            mod.UIAnchor.TopCenter,
            MakeMessage(mod.stringkeys.subGetObjectiveItem),
            this.player
        );
        let widget = mod.FindUIWidgetWithName(coolahhuiname) as mod.UIWidget;
        mod.SetUITextColor(widget, battlefieldWhite);
        mod.SetUITextSize(widget, 24);
        mod.SetUITextAnchor(widget, mod.UIAnchor.BottomCenter);
        mod.SetUIWidgetPadding(widget, 5);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgAlpha(widget, 0);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Blur);

        return widget;
    }
}

type EnemyBehavior = {
    onSpawn: (player: mod.Player, enemy: AIEnemy) => void | Promise<void>;
    onDeath: (player: mod.Player, enemy: AIEnemy) => void | Promise<void>;
    onHit: (player: mod.Player, enemy: AIEnemy) => void | Promise<void>;
};

type EnemyOptions = {
    moveSpeed?: mod.MoveSpeed;
    speedMultiplier?: number;
    explosionRadius?: number;
    explosionDamage?: number;
    health?: number;
    stance?: mod.Stance;
    spawnPointID?: number;
    randomSpawn?: number[];
    soldierClass?: mod.SoldierClass;
};

class AIEnemy {
    public moveSpeed: mod.MoveSpeed;
    public speedMultiplier: number;
    public explosionRadius: number;
    public explosionDamage: number;
    public health: number;
    public stance: mod.Stance;
    public spawnPointID: number;
    public player?: mod.Player;
    public randomSpawn?: number[];
    public soldierClass: mod.SoldierClass;
    public baseAmmo: number = 0;

    constructor(private behavior: EnemyBehavior, options: EnemyOptions = {}) {
        this.moveSpeed = options.moveSpeed ?? mod.MoveSpeed.Sprint;
        this.explosionRadius = options.explosionRadius ?? 10;
        this.explosionDamage = options.explosionDamage ?? 10;
        this.health = options.health ?? 100;
        this.speedMultiplier = options.speedMultiplier ?? 1;
        this.stance = options.stance ?? mod.Stance.Stand;
        this.spawnPointID = options.spawnPointID ?? 1;

        if (options.randomSpawn && options.randomSpawn?.length > 0) {
            this.spawnPointID =
                options.randomSpawn[H.getRandomInt(options.randomSpawn.length)];
        }

        // If no soldierclass given, Random select a class
        if (options.soldierClass) {
            this.soldierClass = options.soldierClass;
        } else {
            const classes = Object.values(mod.SoldierClass) as mod.SoldierClass[];
            const randomClass = classes[Math.floor(Math.random() * classes.length)];
            this.soldierClass = mod.SoldierClass.Assault; // hardcoded to assault for now
        }
    }

    async InitBehavior(player: mod.Player) {
        this.player = player;
        mod.AIEnableShooting(player, false);
        mod.SetPlayerMaxHealth(player, this.health);
        mod.AISetMoveSpeed(player, this.moveSpeed);
        mod.AISetStance(player, this.stance);
        mod.SetPlayerMovementSpeedMultiplier(player, this.speedMultiplier);
        await this.behavior.onSpawn(player, this);
    }

    async die(player: mod.Player) {
        await this.behavior.onDeath(player, this);
    }

    async onHit(player: mod.Player) {
        await this.behavior.onHit(player, this);
    }
}

const meleeShooterBehavior: EnemyBehavior = {
    onSpawn: async (player: mod.Player, enemy: AIEnemy) => {
        // set up for Assault

        mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
        mod.RemoveEquipment(player, mod.InventorySlots.Throwable);
        mod.RemoveEquipment(player, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(player, mod.Weapons.SMG_SGX);
        mod.AddEquipment(player, mod.Weapons.Sidearm_M45A1);
        mod.AIEnableShooting(player, true);
        mod.AIEnableTargeting(player, false);
        mod.AIParachuteBehavior(player);
        await mod.Wait(5);
        mod.AIDefendPositionBehavior(
            player,
            mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition),
            0,
            aiLeashRange
        );
        MeleeShooterLogic(player, enemy);
    },
    onDeath: async (player: mod.Player, enemy: AIEnemy) => {
        if (debugAIBehavior) console.log("Default enemy died behavior triggered");
        RespawnEnemyAfterTime(enemy.spawnPointID);
    },
    onHit: async () => {
        if (debugAIBehavior) console.log("Default enemy hit behavior triggered");
    },
};

async function MeleeShooterLogic(player: mod.Player, enemy: AIEnemy) {
    await mod.Wait(2.0);
    while (true) {
        if (
            mod.IsPlayerValid(player) &&
            mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)
        ) {
            const aiPos = mod.GetSoldierState(
                player,
                mod.SoldierStateVector.GetPosition
            );
            let playerInRange: boolean = false;
            PlayerProfile.playerInstances.forEach((element) => {
                if (
                    element &&
                    mod.IsPlayerValid(element) &&
                    mod.GetSoldierState(element, mod.SoldierStateBool.IsAlive)
                ) {
                    const tempPlayerPos = mod.GetSoldierState(
                        element,
                        mod.SoldierStateVector.GetPosition
                    );
                    if (mod.DistanceBetween(aiPos, tempPlayerPos) < aiEngageRange) {
                        playerInRange = true;
                        return;
                    }
                }
            });

            if (playerInRange) {
                mod.AIEnableTargeting(player, true);
                await mod.Wait(Math.random() + 3.0);
                mod.AIEnableTargeting(player, false);
            } else {
                await mod.Wait(1.0);
            }
        } else {
            await mod.Wait(1.0);
        }
    }
}

class AISpawnHandler {
    static aiSpawnTask = new Map<number, AIEnemy[]>();
    static aiSpawnedPool = new Map<number, AIEnemy[]>();
    static aiBehaviorsAssignedMap = new Map<number, AIEnemy>();
    static activeSpawnLoops: Set<number> = new Set();
    static SpawnAIEnemyWithBehavior(
        enemyBehavior: EnemyBehavior,
        amount: number = 1,
        options?: any
    ) {
        for (let index = 0; index < amount; index++) {
            const aiEnemy = new AIEnemy(enemyBehavior, options);
            AISpawnHandler.addEnemyToPool(aiEnemy.spawnPointID, aiEnemy);
        }
    }

    static async addEnemyToPool(spawnPointID: number, enemy: AIEnemy) {
        if (!mod.GetSpawner(spawnPointID)) {
            return;
        }

        if (!AISpawnHandler.aiSpawnTask.has(spawnPointID)) {
            AISpawnHandler.aiSpawnTask.set(spawnPointID, []);
        }

        AISpawnHandler.aiSpawnTask.get(spawnPointID)?.push(enemy);

        // Start the spawn loop only if it's not already running
        if (!AISpawnHandler.activeSpawnLoops.has(spawnPointID)) {
            AISpawnHandler.startSpawnLoop(spawnPointID);
        }
    }

    static async ClearAllSpawns() {
        AISpawnHandler.aiSpawnedPool.clear();
        await mod.Wait(1);
        AISpawnHandler.aiBehaviorsAssignedMap.forEach((aiEnemy) => {
            const player = aiEnemy.player;

            if (player) {
                mod.Kill(player);
            }
        });
    }

    static async startSpawnLoop(spawnPointID: number): Promise<void> {
        AISpawnHandler.activeSpawnLoops.add(spawnPointID);
        while (true) {
            const pool = AISpawnHandler.aiSpawnTask.get(spawnPointID);

            if (!pool || pool.length === 0) {
                break; // Stop the loop when the pool is empty
            }

            const enemy = pool.shift(); // Remove the first enemy

            if (!enemy) break;

            mod.SpawnAIFromAISpawner(
                mod.GetSpawner(spawnPointID),
                enemy.soldierClass,
                mod.GetTeam(5)
            );

            if (!AISpawnHandler.aiSpawnedPool.has(spawnPointID)) {
                AISpawnHandler.aiSpawnedPool.set(spawnPointID, []);
            }

            AISpawnHandler.aiSpawnedPool.get(spawnPointID)?.push(enemy);
            await mod.Wait(0.5);
        }
        AISpawnHandler.activeSpawnLoops.delete(spawnPointID);
    }

    static async AiDied(player: mod.Player) {
        const aiID = mod.GetObjId(player);
        const aiPlayer = AISpawnHandler.aiBehaviorsAssignedMap.get(aiID);

        if (aiPlayer) {
            aiPlayer.die(player);
            AISpawnHandler.aiBehaviorsAssignedMap.delete(aiID);
        } else {
            if (debugAIEnemy) console.log("Error: Failed To find behavior class");
        }
    }

    static async assignAIBehavior(player: mod.Player) {
        let closetsSpawnPointID: number | null = null;

        for (const key in spawnPointsMap) {
            if (
                mod.IsPlayerValid(player) &&
                mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) &&
                spawnPointsMap.hasOwnProperty(Number(key))
            ) {
                const convertedToBFVector = mod.CreateVector(
                    spawnPointsMap[Number(key)].x,
                    spawnPointsMap[Number(key)].y,
                    spawnPointsMap[Number(key)].z
                );
                const playerPos = mod.GetSoldierState(
                    player,
                    mod.SoldierStateVector.GetPosition
                );
                const dinstanceCheck = mod.DistanceBetween(
                    convertedToBFVector,
                    playerPos
                );

                if (dinstanceCheck <= 5) {
                    closetsSpawnPointID = Number(key);
                    break;
                }
            }
        }

        if (closetsSpawnPointID == null) {
            mod.Kill(player);
            return;
        }

        const playerObjId = mod.GetObjId(player);
        const enemyAtSpawnPoint = AISpawnHandler.aiSpawnedPool
            .get(closetsSpawnPointID)
            ?.pop();

        if (!enemyAtSpawnPoint) {
            mod.Kill(player);
            return;
        }

        enemyAtSpawnPoint.InitBehavior(player);
        AISpawnHandler.aiBehaviorsAssignedMap.set(playerObjId, enemyAtSpawnPoint);
    }
}

async function RespawnEnemyAfterTime(id: number) {
    await mod.Wait(enemyRespawnTime);
    AISpawnHandler.SpawnAIEnemyWithBehavior(meleeShooterBehavior, 1, {
        spawnPointID: id,
        health: 100,
        speedMultiplier: 0.5,
    });
}

function ShuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]; // Create a copy to avoid mutating the original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

class ExtractionPoint {
    worldIcon: mod.WorldIcon;
    areaTrigger: mod.AreaTrigger;
    team: mod.Team | undefined;
    position: mod.Vector;
    vfx: mod.VFX[] | undefined;

    static currentExtractionPoint: ExtractionPoint | undefined;
    static availableExtractionPoints: ExtractionPoint[] = [];

    constructor(
        worldIcon: mod.WorldIcon,
        areaTriggerId: mod.AreaTrigger,
        teamId: mod.Team,
        position: mod.Vector
    ) {
        this.worldIcon = worldIcon;
        this.areaTrigger = areaTriggerId;
        this.team = teamId;
        this.position = position;
    }

    static Initialize() {
        let randomNumbers = [1, 2, 3, 4];
        randomNumbers = ShuffleArray(randomNumbers);

        this.availableExtractionPoints = [
            new ExtractionPoint(
                mod.GetWorldIcon(600),
                mod.GetAreaTrigger(500),
                mod.GetTeam(randomNumbers[0]),
                mod.CreateVector(20.633, 75.84, -58.129)
            ),
            new ExtractionPoint(
                mod.GetWorldIcon(601),
                mod.GetAreaTrigger(501),
                mod.GetTeam(randomNumbers[1]),
                mod.CreateVector(23.193, 80.317, -22.82)
            ),
            new ExtractionPoint(
                mod.GetWorldIcon(602),
                mod.GetAreaTrigger(502),
                mod.GetTeam(randomNumbers[2]),
                mod.CreateVector(-16.15, 80.397, 20.617)
            ),
            new ExtractionPoint(
                mod.GetWorldIcon(603),
                mod.GetAreaTrigger(503),
                mod.GetTeam(randomNumbers[3]),
                mod.CreateVector(7.352, 78.621, -133.505)
            ),
        ];
    }

    static ActivateExtractionPoint(team: mod.Team) {
        this.availableExtractionPoints.forEach((element) => {
            if (element?.team && mod.GetObjId(element.team) == mod.GetObjId(team)) {
                this.currentExtractionPoint?.Activate(false);
                this.currentExtractionPoint = element;
                this.currentExtractionPoint?.Activate(true);
                this.currentExtractionPoint.ExtractionPointVFXHandler();
                return;
            }
        });
    }

    static RespawnVFXForCurrentExtractionPoint() {
        this.currentExtractionPoint?.RespawnExtractionVFX();
    }

    async RespawnExtractionVFX() {
        if (ObjectiveItemData.carryingPlayer && this.vfx && this.vfx[1]) {
            mod.EnableVFX(this.vfx[1], false);
            this.vfx[1] = H.SpawnVFX(
                mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Yellow,
                mod.Add(this.position, mod.CreateVector(0, 0, 0))
            );
        }
    }

    async ExtractionPointVFXHandler() {
        this.vfx?.push(
            H.SpawnVFX(
                mod.RuntimeSpawn_Common.FX_Impact_SupplyDrop_Brick,
                mod.Add(this.position, mod.CreateVector(0, 0, 0))
            )
        );
        this.vfx?.push(
            H.SpawnVFX(
                mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Yellow,
                mod.Add(this.position, mod.CreateVector(0, 0, 0))
            )
        );
    }

    static DeactivateAllExtractionPoints() {
        this.availableExtractionPoints.forEach((element) => {
            element.vfx?.forEach((vfxEntity) => mod.EnableVFX(vfxEntity, false));
            element.vfx = [];
            this.currentExtractionPoint?.Activate(false);
            this.currentExtractionPoint = undefined;
        });
    }

    Activate(active: boolean) {
        if (active) {
            mod.EnableAreaTrigger(this.areaTrigger, true);
            mod.EnableWorldIconImage(this.worldIcon, true);
            mod.EnableWorldIconText(this.worldIcon, true);
            mod.SetWorldIconText(
                this.worldIcon,
                MakeMessage(
                    mod.stringkeys.extractionPointWorldIcon,
                    GetAdjustedTeamNumber(undefined, this.team)
                )
            );
            this.team &&
                mod.SetWorldIconColor(
                    this.worldIcon,
                    teamColors[GetTrueTeamIDNumberOfTeam(this.team) - 1]
                );
        } else {
            mod.EnableAreaTrigger(this.areaTrigger, false);
            mod.EnableWorldIconImage(this.worldIcon, false);
            mod.EnableWorldIconText(this.worldIcon, false);
        }
    }
}

function FormatTime(sec: number): [number, number, number] {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 10);
    const coolerSeconds = Math.floor((sec % 60) / 10);
    return [minutes, coolerSeconds, seconds];
}

export async function OnPlayerEnterAreaTrigger(
    eventPlayer: mod.Player,
    eventAreaTrigger: mod.AreaTrigger
) {
    if (
        eventPlayer &&
        mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive) &&
        mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier) == true
    ) {
        return;
    }

    if (debugPlayer) console.log("Enter Extraction Point 500");

    const objId = mod.GetObjId(eventAreaTrigger);

    if (
        eventPlayer &&
        ObjectiveItemData.carryingPlayer &&
        mod.GetObjId(eventPlayer) == mod.GetObjId(ObjectiveItemData.carryingPlayer)
    ) {
        if (
            ExtractionPoint.currentExtractionPoint &&
            objId == mod.GetObjId(ExtractionPoint.currentExtractionPoint?.areaTrigger)
        ) {
            mod.DeleteAllUIWidgets();
            mod.EndGameMode(mod.GetTeam(eventPlayer));
            console.log("Ending Game");
        }
    }
}

export async function OnPlayerExitAreaTrigger(
    eventPlayer: mod.Player,
    eventAreaTrigger: mod.AreaTrigger
) {
    if (
        eventPlayer &&
        mod.IsPlayerValid(eventPlayer) &&
        mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive) &&
        mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier) == true
    ) {
        return;
    }

    const objId = mod.GetObjId(eventAreaTrigger);
}


// === src\HoH_Helpers.ts ===
class H {
    static SpawnVFX(vfxId: any, targetpoint: mod.Vector, rotation: mod.Vector, scale: mod.Vector): mod.VFX;
    static SpawnVFX(vfxType: any, position: mod.Vector): mod.VFX;
    
    static SpawnVFX(
        vfxParam: any, 
        positionParam: mod.Vector, 
        rotationParam?: mod.Vector, 
        scaleParam?: mod.Vector
    ): mod.VFX | null {
        if (rotationParam !== undefined && scaleParam !== undefined) {
            // Handle the 4-parameter case
            const vfxObject = mod.SpawnObject(vfxParam, positionParam, rotationParam, scaleParam);
            mod.EnableVFX(vfxObject, true);
            const vfxInstance = mod.GetVFX(mod.GetObjId(vfxObject));
            return vfxInstance;
        } else {
            // Handle the 2-parameter case
            try {
                const vfxObject = mod.SpawnObject(vfxParam, positionParam, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
                if (vfxObject) {
                    mod.EnableVFX(vfxObject, true);
                    const vfxInstance = mod.GetVFX(mod.GetObjId(vfxObject));
                    return vfxInstance;
                }
            } catch (error) {
                console.log(`Error spawning VFX: ${error}`);
            }
            return null;
        }
    }
    
    static getRandomInt(max: number) {
        return Math.floor(Math.random() * max);
    }
}

