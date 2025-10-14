const VERSION = [1, 4, 59];
const debugJSPlayer = true;
const debugSkipBuyPhase = false;
const debugSwitchTeamsEachRound = false;
const AIBackfill = false;
const INSTANT_START = false;


let gameOver = false;

let initialPlayerCount: number = 0;
let combatCountdownStarted = false;
let combatStartDelayRemaining = 60;
let combatStarted = false;
let roundEnded: boolean = false;

let bombPickupDistance = 3.0;
let bombInteractDistance = 3.0;

let messageTime: number = 0;

let initialCash = 800;

let teamSwitchOccurred: boolean = false;

let team1Score: number = 0;
let team2Score: number = 0;
let attackingTeam: mod.Team = mod.GetTeam(1);
let defendingTeam: mod.Team = mod.GetTeam(2);
let roundNum: number = 0;
let roundTime: number = 300; // Max time for round in seconds (extended when bomb is planted)
// This is the amount of time remaining until the round begins (buy/setup phases)
let buyPhaseTimeRemaining: number = 60;

let interactPointA: mod.InteractPoint = mod.GetInteractPoint(1);
let interactPointB: mod.InteractPoint = mod.GetInteractPoint(2);
let worldIconA: mod.WorldIcon = mod.GetWorldIcon(20);
let worldIconB: mod.WorldIcon = mod.GetWorldIcon(21);
let bombExplodesSFX_A: mod.SFX;
let bombExplodesSFX_B: mod.SFX;
let bombExplodesVFX_A: mod.VFX;
let bombExplodesVFX_B: mod.VFX;
let alarmSFX_A: mod.SFX;
let alarmSFX_B: mod.SFX;

let attackersStoreInteractPoint = mod.GetInteractPoint(500);
let defendersStoreInteractPoint = mod.GetInteractPoint(501);
let attackersStoreWI = mod.GetWorldIcon(500);
let defendersStoreWI = mod.GetWorldIcon(501);

const pointAAreaID: number = 1;
const pointBAreaID: number = 2;

const storeID_attackers: number = 500;
const storeID_defenders: number = 501;


const MCOMPositionA: mod.Vector = mod.CreateVector(128.70, 184.04, 137.26);
const MCOMPositionB: mod.Vector = mod.CreateVector(213.2, 182.12, 128.51);

const SpawnWallPos1: mod.Vector = mod.CreateVector(136.2, 174.24, 134.51);
const SpawnWallPos2: mod.Vector = mod.CreateVector(169.7, 174.24, 129.51);
const SpawnWallPos3: mod.Vector = mod.CreateVector(161.7, 184.24, 41.519);
const SpawnWallPos4: mod.Vector = mod.CreateVector(182.2, 184.24, 38.519);
const SpawnWall1ID: number = 100;
const SpawnWall2ID: number = 101;
const SpawnWall3ID: number = 102;
const SpawnWall4ID: number = 103;
const loserBox1Pos: mod.Vector = mod.CreateVector(171, 235.5, 16);
const loserBox2Pos: mod.Vector = mod.CreateVector(171, 235.5, 160);
const wallMoveDelta: number = -20;

const attackersHQID: number = 1;
const defendersHQID: number = 2;

let attackersHQ: mod.HQ = mod.GetHQ(attackersHQID);
let defendersHQ: mod.HQ = mod.GetHQ(defendersHQID);

const defendersSpawnID: number = 1000;
const attackersSpawnID: number = 2000;

// Attackers will have their ability to interact removed within this distance of either MCOM
const disabledInteractDistance: number = 5;

// Money Rewards
const roundWinReward: number = 2400;
const roundLoseReward: number = 1200; // Might want to make scales for these
const killReward: number = 300;
const defuseReward: number = 1000;
const plantReward: number = 800;

let roundStarted: boolean = false;
let buyPhase: boolean = false;
const buyPhaseLength: number = 35;
const roundEndBuffer: number = 10;

// UI
type Widget = mod.UIWidget;

const minimumInitialPlayerCount: number = 2;
const BLACKCOLOR: number[] = [1, 1, 1];
const REDCOLOR: number[] = [1, 0, 0];
const WHITECOLOR: number[] = [0, 0, 0];
const maxRounds: number = 14;
const deathYPos: number = 160;
const ZEROVEC: mod.Vector = mod.CreateVector(0, 0, 0);
const ONEVEC: mod.Vector = mod.CreateVector(1, 1, 1);


const MCOMFuseTime: number = 60;
const armTime: number = 3;
const disarmTime: number = 3;

const messageRemainTime: number = 5;
const maxRoundTime: number = 300;
type Dict = { [key: string]: any };

let vfxidx = 0;


// Use this as your "ready"/game startup function
export async function OnGameModeStarted() {
    console.log("Bomb Defusal v", VERSION[0], ".", VERSION[1], ".", VERSION[2], " Game Mode Started");
    combatStartDelayRemaining = 60; // Reset in case the game is restarted ig

    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn)

    gameOver = false;
    mod.SetWorldIconText(worldIconA, MakeMessage(mod.stringkeys.a));
    mod.SetWorldIconText(worldIconB, MakeMessage(mod.stringkeys.b));
    mod.SetWorldIconText(attackersStoreWI, MakeMessage(mod.stringkeys.shop));
    mod.SetWorldIconText(defendersStoreWI, MakeMessage(mod.stringkeys.shop));
    mod.SetWorldIconOwner(attackersStoreWI, attackingTeam);
    mod.SetWorldIconOwner(defendersStoreWI, defendingTeam);

    BombData.Initialize();

    bombExplodesSFX_A = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Gadgets_C4_Activate_OneShot3D, MCOMPositionA, ZEROVEC);
    bombExplodesSFX_B = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Gadgets_C4_Activate_OneShot3D, MCOMPositionB, ZEROVEC);
    bombExplodesVFX_A = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_GS, MCOMPositionA, ZEROVEC);
    bombExplodesVFX_B = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_GS, MCOMPositionB, ZEROVEC);
    alarmSFX_A = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Alarm, MCOMPositionA, ZEROVEC);
    alarmSFX_B = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Alarm, MCOMPositionB, ZEROVEC);
    mod.EnableSFX(alarmSFX_A, false);
    mod.EnableSFX(alarmSFX_B, false);

    if (!INSTANT_START) {
        // wait for required number of players to join the game.
        while (initialPlayerCount < minimumInitialPlayerCount) {
            await mod.Wait(1);
            //console.log("initial player count is ", initialPlayerCount);
        }
    }

    // console.log("Adequate players have entered lobby. Begin the game.");

    await CombatCountdown();

    SetupRound();

    TickUpdate();
    ThrottledUpdate();
}

async function TickUpdate() {
    let tickRate: number = 0.016;
    while (true) {
        await mod.Wait(tickRate);

        BombData.ItemProximityCheck();
        BombData.ItemHeld();

        if (BombData.carryingPlayer && mod.GetSoldierState(BombData.carryingPlayer, mod.SoldierStateBool.IsAlive)) {
            let jsPlayer = JsPlayer.get(BombData.carryingPlayer);

            // Invalid check
            if (!jsPlayer)
                return;

            if (!BombData.isPlanting && mod.IsInventorySlotActive(BombData.carryingPlayer, mod.InventorySlots.MeleeWeapon)) {
                
                if (mod.GetSoldierState(BombData.carryingPlayer, mod.SoldierStateBool.IsProne)) {
                    BombData.ItemDropped(BombData.carryingPlayer);
                }
            }

            // Extra sanity check.
            if (buyPhase)
                continue;

            if (BombData.isPlanting) {
                if (BombData.carryingPlayer != null) {
                    if (BombData.isAtA) {
                        if (mod.DistanceBetween(mod.GetSoldierState(BombData.carryingPlayer, mod.SoldierStateVector.GetPosition), MCOMPositionA) > bombInteractDistance) {
                            BombData.CancelPlant();
                        }
                    }
                    else if (BombData.isAtB) {
                        if (mod.DistanceBetween(mod.GetSoldierState(BombData.carryingPlayer, mod.SoldierStateVector.GetPosition), MCOMPositionB) > bombInteractDistance) {
                            BombData.CancelPlant();
                        }
                    }
                }
                else {
                    BombData.CancelPlant();
                }

                // Might have just been cancelled, so check again
                if (BombData.isPlanting && (BombData.isAtA || BombData.isAtB)) {
                    BombData.plantProgress += tickRate / armTime;
                    console.log("Update Plant Progress: ", BombData.plantProgress);
                    jsPlayer.progressBarUI?.refresh(BombData.plantProgress);
                    if (BombData.plantProgress >= 1) {
                        BombData.PlantBomb();
                    }
                }

            }

        }

        // Extra sanity check.
        if (buyPhase)
            continue;

        if (BombData.isPlanted && BombData.defusingPlayer != null) {
            let jsPlayer = JsPlayer.get(BombData.defusingPlayer);
            if (!jsPlayer) {
                return;
            }

            if (BombData.isAtA) {
                if (mod.DistanceBetween(mod.GetSoldierState(BombData.defusingPlayer, mod.SoldierStateVector.GetPosition), MCOMPositionA) > bombInteractDistance) {
                    BombData.CancelDefuse();
                }
            }
            else if (BombData.isAtB) {
                if (mod.DistanceBetween(mod.GetSoldierState(BombData.defusingPlayer, mod.SoldierStateVector.GetPosition), MCOMPositionB) > bombInteractDistance) {
                    BombData.CancelDefuse();
                }
            }

            // May have just been cancelled, so check again
            if (BombData.defusingPlayer != null) {
                BombData.defusingProgress += tickRate / disarmTime;
                jsPlayer.progressBarUI?.refresh(BombData.defusingProgress);
                if (BombData.defusingProgress >= 1) {
                    BombData.DefuseBomb();
                }
            }

        }
    }
}

// Updates every 1 second
async function ThrottledUpdate() {
    while (true) {
        if (!gameOver) {
            if (roundStarted && !roundEnded) {
                roundTime--;

                if (roundTime <= 0 && !BombData.isPlanted) {
                    EndRound(defendingTeam);
                }

            }
            else {
                buyPhaseTimeRemaining--;
            }

            UpdateMessages();

            BombData.BombPlanted(); // Will simply return if the bomb is not currently planted

            JsPlayer.playerInstances.forEach(player => {
                // IDK why, but AI soldiers keep returning low ypositions despite standing alongside human players that are at acceptable y positions
                if (player && mod.GetObjId(player) >= 0) {
                    if (!gameOver)
                        UpdateScoreUI(player);

                    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
                        UpdateInteracts(player);
                        let yPos = mod.YComponentOf(mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition));
                        if (yPos < deathYPos) {
                            mod.Kill(player);
                        }
                    }
                }
            });
        }
        await mod.Wait(1);
    }
}

// Check the player, and if they are on the attacking team, and not carrying the bomb,
// disable/enable interact input restriction based on their distance to either MCOM
function UpdateInteracts(player: mod.Player) {
    if (!roundStarted || buyPhase)
        return;

    let onAttackingTeam = mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(attackingTeam)
    if (onAttackingTeam) {
        if (BombData.carryingPlayer != null && mod.GetObjId(player) == mod.GetObjId(BombData.carryingPlayer)) {
            mod.EnableInputRestriction(player, mod.RestrictedInputs.Interact, false)
        }
        else {
            let playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            let mcomADist = mod.DistanceBetween(playerPos, MCOMPositionA);
            let mcomBDist = mod.DistanceBetween(playerPos, MCOMPositionB);
            if (mcomADist < disabledInteractDistance || mcomBDist < disabledInteractDistance)
                mod.EnableInputRestriction(player, mod.RestrictedInputs.Interact, true);
        }
    }
    else {
        mod.EnableInputRestriction(player, mod.RestrictedInputs.Interact, false);
    }

}

function UpdateScoreUI(player: mod.Player) {
    let jsPlayer = JsPlayer.get(player);

    if (jsPlayer)
        jsPlayer.scoreUI?.refresh();
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Player Functions:
//-----------------------------------------------------------------------------------------------//
export async function OnPlayerJoinGame(player: mod.Player) {

    let jsPlayer = JsPlayer.get(player);
    if (!jsPlayer)
        return;

    // Check if this is a human player or not. 
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {

        // Show the pre-game lobby window, assuming combat hasn't started. 
        if (!combatStarted) {
            jsPlayer.lobbyUI?.open();
            initialPlayerCount++;
            console.log("There are now ", initialPlayerCount, " players in the lobby.");
            UpdateAllLobbyUI();
        }

    }
    else {
        // The player is not a human so we will ignore them.
    }

    let teamID = mod.GetObjId(mod.GetTeam(player));


    if (roundStarted) {
        console.log("player ID(", mod.GetObjId(player), ") joined mid-round on team", teamID);
        //mod.EnablePlayerDeploy(player, false);
    }
}

export async function OnPlayerLeaveGame(playerId: number) {
    try {
        if ((!BombData.carryingPlayer || !mod.IsPlayerValid(BombData.carryingPlayer)) && BombData.isBeingCarried) {
            BombData.ItemDropped();
        }
    } catch {
        if (BombData.isBeingCarried) {
            BombData.ItemDropped();
        }
    }

    // reduce player count. 
    JsPlayer.removeInvalidJSPlayers(playerId);

    // Updated valid combatants count

    if (combatCountdownStarted && !gameOver) {
        //validCombatants = GetNumberOfPlayersOnTeam(combatTeam);
        //UpdateValidCombatantsUI();
        //CheckVictoryState();
    } else if (!combatCountdownStarted) {
        if (!gameOver) {
            initialPlayerCount--;
            UpdateAllLobbyUI();
        }
    }
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    let jsPlayer = JsPlayer.get(eventPlayer);
    let teamID = mod.GetObjId(mod.GetTeam(eventPlayer));
    let attackingTeamID = mod.GetObjId(attackingTeam);

    if (jsPlayer) {

        jsPlayer.isDeployed = true;

        if (roundStarted && !roundEnded) {
            // this is redundant with death, but it covers late joiners and I need to mark players out of round immediately on death so I can count "living" team members
            jsPlayer.outOfRound = true;
        }
        else {
            jsPlayer.outOfRound = false;
        }

        if (!jsPlayer.outOfRound) {
            if (teamID == attackingTeamID) {
                let hqPos: mod.Vector = mod.GetObjectPosition(attackersHQ);
                console.log("Player is deploying on team ", teamID, ". Teleport them to HQ ", mod.GetObjId(attackersHQ), " at position: ", mod.XComponentOf(hqPos), ", ", mod.YComponentOf(hqPos), ", ", mod.ZComponentOf(hqPos));
                mod.Teleport(eventPlayer, hqPos, 0);
            }
            else {
                let hqPos: mod.Vector = mod.GetObjectPosition(defendersHQ);
                console.log("Player is deploying on team ", teamID, ". Teleport them to HQ ", mod.GetObjId(defendersHQ), " at position: ", mod.XComponentOf(hqPos), ", ", mod.YComponentOf(hqPos), ", ", mod.ZComponentOf(hqPos));
                mod.Teleport(eventPlayer, hqPos, 0);
            }
        }


        if (buyPhase == true) {
            if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
                jsPlayer.store?.open();
                jsPlayer.updateWalletUI();
            }
        }
        else {
            if (jsPlayer.outOfRound) {
                if (teamID == attackingTeamID) {
                    mod.Teleport(eventPlayer, loserBox1Pos, 0);
                }
                else {
                    mod.Teleport(eventPlayer, loserBox2Pos, 0);
                }

                ResetPlayerLoadout(eventPlayer, true);
                return;
            }
        }

    }
    else {
        console.log("Player deploying with invalid jsPlayer!");
    }

    ResetPlayerLoadout(eventPlayer, false);

}

function EnableStores(enable: boolean) {
    mod.EnableInteractPoint(attackersStoreInteractPoint, enable);
    mod.EnableInteractPoint(defendersStoreInteractPoint, enable);

    mod.EnableWorldIconImage(attackersStoreWI, enable);
    mod.EnableWorldIconText(attackersStoreWI, enable);
    mod.EnableWorldIconImage(defendersStoreWI, enable);
    mod.EnableWorldIconText(defendersStoreWI, enable);
}

async function SetupRound() {
    roundNum++;
    console.log("Set up Round ", roundNum);
    roundEnded = false;
    buyPhase = true;
    RefillAmmo();

    EnableStores(true);


    if (BombData.isBeingCarried) {
        if (BombData.carryingPlayer != null)
            BombData.ItemDropped(BombData.carryingPlayer);
        else
            BombData.ItemDropped();
    }


    let teamsSwitched: boolean = roundNum == maxRounds / 2 + 1 || (debugSwitchTeamsEachRound && roundNum != 1);
    
    if (teamsSwitched) {
        SwitchTeams();
    }
    
    let attackers: mod.Player[] = [];
    let attackingTeamID: number = mod.GetObjId(attackingTeam);
    let defendingTeamID: number = mod.GetObjId(defendingTeam);

    // Reset Bomb data here? This is where MCOMs were reset.
    mod.EnableInteractPoint(interactPointA, true);
    mod.EnableInteractPoint(interactPointB, true);
    mod.EnableWorldIconImage(worldIconA, true);
    mod.EnableWorldIconText(worldIconA, true);
    mod.EnableWorldIconImage(worldIconB, true);
    mod.EnableWorldIconText(worldIconB, true);

    JsPlayer.playerInstances.forEach(player => {
        let teamID = mod.GetObjId(mod.GetTeam(player));
        let jsPlayer = JsPlayer.get(player);
        let isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

        if (isAI) {
            mod.Kill(player);
        }
        else {
            // Return to base / respawn
            if (jsPlayer && jsPlayer.isDeployed) {
                if (teamID == attackingTeamID) {
                    let hqPos: mod.Vector = mod.GetObjectPosition(attackersHQ);
                    console.log("Player is on team ", teamID, ". Teleport them to HQ ", mod.GetObjId(attackersHQ), " at position: ", mod.XComponentOf(hqPos), ", ", mod.YComponentOf(hqPos), ", ", mod.ZComponentOf(hqPos));
                    mod.Teleport(player, hqPos, 0);
                }
                else {
                    let hqPos: mod.Vector = mod.GetObjectPosition(defendersHQ);
                    console.log("Player is on team ", teamID, ". Teleport them to HQ ", mod.GetObjId(defendersHQ), " at position: ", mod.XComponentOf(hqPos), ", ", mod.YComponentOf(hqPos), ", ", mod.ZComponentOf(hqPos));
                    mod.Teleport(player, hqPos, 0);
                }
            }
    
            if (teamID == attackingTeamID) {
                attackers.push(player)
            }
        }

        if (jsPlayer) {
            if (jsPlayer.outOfRound && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive))
                ResetPlayerLoadout(player, false);

            jsPlayer.outOfRound = false;
        }

    });

    // Another await after spawning before opening the shop up
    await mod.Wait(0.5);
    
    JsPlayer.playerInstances.forEach(player => {
        // There should not be any AI at this point, but just for extreme sanity....
        let isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
    
        let jsPlayer = JsPlayer.get(player)
        if (jsPlayer) {

            // Reset cash to starting value
            if (teamsSwitched)
                jsPlayer.cash = initialCash;

            
            if (!isAI) {
                if (jsPlayer.isDeployed && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive))
                    jsPlayer.store?.open();

                jsPlayer.updateWalletUI();
            }
        }
    });
    
    // Pick a random attacker and give them the bomb
    if (attackers.length == 0) {
        console.log("THERE ARE NO ATTACKERS!!!!");
        BombData.currentWorldIconPos = mod.GetObjectPosition(attackersHQ);
        mod.SetWorldIconPosition(BombData.bombPositionWorldIcon, BombData.currentWorldIconPos);
    }
    else {
        let playerAttackers: mod.Player[] = []
        attackers.forEach(attacker => {
            if (!mod.GetSoldierState(attacker, mod.SoldierStateBool.IsAISoldier) && mod.GetSoldierState(attacker, mod.SoldierStateBool.IsAlive))
                playerAttackers.push(attacker);
        });

        // Only allow for players to begin with the bomb, unless there are no players on the attacking team
        let arr = playerAttackers
        if (playerAttackers.length == 0)
            arr = attackers;

        let rand = GetRandomInt(arr.length - 1);
        BombData.ItemPickedUp(arr[rand]);
        console.log("Give bomb to ", arr[rand], " on team ", mod.GetObjId(mod.GetTeam(arr[rand])));
    }

    if (!debugSkipBuyPhase) {
        console.log("Start Buy Phase Timer")
        buyPhaseTimeRemaining = buyPhaseLength;
        while (buyPhaseTimeRemaining > 0) {
            await mod.Wait(1);
        }
    }
    
    roundTime = maxRoundTime;

    let attackingTeamSize: number = 0;
    let defendingTeamSize: number = 0;

    JsPlayer.playerInstances.forEach(player => {
        // Close the shops
        let jsPlayer = JsPlayer.get(player);
        if (jsPlayer)
            jsPlayer.store?.close();

        // Return AI players to default pathfinding behavior
        if (AIBackfill && mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
            mod.AIBattlefieldBehavior(player);
        }

        if (mod.GetObjId(mod.GetTeam(player)) == attackingTeamID) {
            attackingTeamSize++;
        }
        else {
            defendingTeamSize++;
        }

        // Make extra sure this is disabled for all players when Round Setup ends
        mod.EnableUIInputMode(false, player);
    });
    
    let tWall1 = mod.GetSpatialObject(SpawnWall1ID);
    let tWall2 = mod.GetSpatialObject(SpawnWall2ID);
    let tWall3 = mod.GetSpatialObject(SpawnWall3ID);
    let tWall4 = mod.GetSpatialObject(SpawnWall4ID);
    mod.MoveObjectOverTime(tWall1, mod.CreateVector(0, wallMoveDelta, 0), mod.CreateVector(0, 0, 0), 3, false, false);
    mod.MoveObjectOverTime(tWall2, mod.CreateVector(0, wallMoveDelta, 0), mod.CreateVector(0, 0, 0), 3, false, false);
    mod.MoveObjectOverTime(tWall3, mod.CreateVector(0, wallMoveDelta, 0), mod.CreateVector(0, 0, 0), 3, false, false);
    mod.MoveObjectOverTime(tWall4, mod.CreateVector(0, wallMoveDelta, 0), mod.CreateVector(0, 0, 0), 3, false, false);

    RefillAmmo();
    EnableStores(false);

    if (AIBackfill) {
        console.log("There are ", attackingTeamSize, " members of attacking team");
        console.log("spawn ", (5 - attackingTeamSize), " AI to attacking team");
        console.log("There are ", defendingTeamSize, " members of defending team");
        console.log("spawn ", (5 - defendingTeamSize), " AI to defending team");
        
        
        // Spawn AI characters to backfill
        for (let i = 0; i < 5 - attackingTeamSize; i++) {
            console.log("Spawn AI from spawner ID: ", mod.GetObjId(mod.GetSpawner(i + 10)), " to Team ID  ", attackingTeamID);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(i + 10), mod.SoldierClass.Assault, attackingTeam);
            await mod.Wait(0.1);
        }
        
        for (let i = 0; i < 5 - defendingTeamSize; i++) {
            console.log("Spawn AI from spawner ID: ", mod.GetObjId(mod.GetSpawner(i + 15)), " to Team ID ", defendingTeamID);
            mod.SpawnAIFromAISpawner(mod.GetSpawner(i + 15), mod.SoldierClass.Assault, defendingTeam);
            await mod.Wait(0.1);
        }
    }


    buyPhase = false;
    roundStarted = true;
    
    //mod.EnableAllPlayerDeploy(false);
    await mod.Wait(8);

    JsPlayer.playerInstances.forEach(player => {
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
            mod.AIBattlefieldBehavior(player);
        }
    });
    
    
}

function RefillAmmo() {
    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (jsPlayer) {
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) && jsPlayer.isDeployed) {
                RefillPlayersAmmo(player);
                console.log("Refill Ammo")
            }
        }
    });
}

function RefillPlayersAmmo(player: mod.Player) {
    mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 1000);
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 1000);

    mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 1000);
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, 1000);
}

function IsPrimarySlotFilled(player: mod.Player): boolean {
    for (var enumMember in mod.Weapons) {
        var isValueProperty = Number(enumMember) >= 0
        if (isValueProperty) {
            let em = mod.Weapons[enumMember];
            if (em.includes("AssaultRifle") || em.includes("Carbine") || em.includes("DMR") || 
                    em.includes("LMG") || em.includes("Shotgun") || em.includes("SMG") || 
                    em.includes("Sniper")) {
                if (mod.HasEquipment(player, Number(enumMember))) {
                    return true;
                }
            }
        }
    }
    return false;
}

function IsSecondarySlotFilled(player: mod.Player): boolean {
    for (let enumMember in mod.Weapons) {
        let isValueProperty = Number(enumMember) >= 0;
        if (isValueProperty) {
            let em = mod.Weapons[enumMember];
            if (em.includes("Sidearm")) {
                if (mod.HasEquipment(player, Number(enumMember))) {
                    return true;
                }
            }
        }
    }
    return false;
}

// NO WAY TO CHECK WHICH SLOT A GADGET IS IN!!!
// function IsGadget1Filled(player: mod.Player): boolean {
//     for (let enumMember in mod.Gadgets) {
//         let isValueProperty = Number(enumMember) >= 0;
//         if (isValueProperty) {
//             let em = mod.Gadgets[enumMember];
//             if (mod.HasEquipment(player, Number(enumMember))) {
//                 return true;
//             }
//         }
//     }
//     return false;
// }

function ExplodeFeedback(pos: mod.Vector): void {
    let vfx: mod.VFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_GS, pos, ZEROVEC);
    mod.EnableVFX(vfx, true);
    let sfx: mod.SFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Gadget_C4_Explosives_Detonation, pos, ZEROVEC);
    mod.EnableSFX(sfx, true);
    mod.PlaySound(sfx, 100);
}


async function EndRound(winners: mod.Team): Promise<void> {
    let winningTeamID: number = mod.GetObjId(winners);
    console.log("End Round, Winning Team ID is: ", winningTeamID);
    console.log("Attacking Team ID is currently: ", mod.GetObjId(attackingTeam));
    console.log("Defending Team ID is currently: ", mod.GetObjId(defendingTeam));
    roundEnded = true;
    
    BombData.Reset();

    if (winningTeamID == mod.GetObjId(attackingTeam)) {
        MessageAllUI(MakeMessage(mod.stringkeys.AttackersWin), REDCOLOR);
        if (teamSwitchOccurred) {
            team2Score++;
        }
        else {
            team1Score++;
        }
    }
    else {
        MessageAllUI(MakeMessage(mod.stringkeys.DefendersWin), REDCOLOR);
        if (teamSwitchOccurred) {
            team1Score++;
        }
        else {
            team2Score++;
        }
    }

    await mod.Wait(roundEndBuffer);

    roundStarted = false;

    console.log("Team 1 score is: ", team1Score);
    console.log("Team 2 score is: ", team2Score);

    if (CheckVictoryState()) {
        return;
    }

    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (jsPlayer) {
            if (mod.GetObjId(mod.GetTeam(player)) == winningTeamID) {
                jsPlayer.cash += roundWinReward;
            }
            else {
                jsPlayer.cash += roundLoseReward;
            }

            jsPlayer.updateWalletUI();

            // Kill downed players (might be causing bugs if they're downed going into the next round)
            if (jsPlayer.isDeployed && mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)) {
                mod.DealDamage(player, 100);
            }
        }
    });

    let tWall1 = mod.GetSpatialObject(SpawnWall1ID);
    let tWall2 = mod.GetSpatialObject(SpawnWall2ID);
    let tWall3 = mod.GetSpatialObject(SpawnWall3ID);
    let tWall4 = mod.GetSpatialObject(SpawnWall4ID);
    mod.MoveObject(tWall1, mod.Subtract(SpawnWallPos1, mod.GetObjectPosition(tWall1)), mod.CreateVector(0, 0, 0));
    mod.MoveObject(tWall2, mod.Subtract(SpawnWallPos2, mod.GetObjectPosition(tWall2)), mod.CreateVector(0, 0, 0));
    mod.MoveObject(tWall3, mod.Subtract(SpawnWallPos3, mod.GetObjectPosition(tWall3)), mod.CreateVector(0, 0, 0));
    mod.MoveObject(tWall4, mod.Subtract(SpawnWallPos4, mod.GetObjectPosition(tWall4)), mod.CreateVector(0, 0, 0));

    // If neither team won, reset the round
    SetupRound();
}

function SwitchTeams(): void {
    console.log("SWITCH TEAMS");

    if (mod.GetObjId(attackingTeam) == mod.GetObjId(mod.GetTeam(1))) {
        defendingTeam = mod.GetTeam(1);
        attackingTeam = mod.GetTeam(2);
        teamSwitchOccurred = true;
    }
    else {
        defendingTeam = mod.GetTeam(2);
        attackingTeam = mod.GetTeam(1);
        teamSwitchOccurred = false; // Teams switched back
    }

    console.log("Attacking Team ID is currently: ", mod.GetObjId(attackingTeam));
    console.log("Defending Team ID is currently: ", mod.GetObjId(defendingTeam));

    mod.SetWorldIconOwner(attackersStoreWI, attackingTeam);
    mod.SetWorldIconOwner(defendersStoreWI, defendingTeam);

    mod.UndeployAllPlayers();
}


function ResetPlayerLoadout(player: mod.Player, isOutOfRound: boolean) {
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
        if (isOutOfRound)
            mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon);
        else
            mod.AddEquipment(player, mod.Weapons.Sidearm_P18, SidearmPackage_Standard_P18);
    
        mod.AddEquipment(player, mod.Gadgets.Melee_Combat_Knife);
        mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon);
        
        try {
            mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
        }
        catch(e) {
            
        }
        try {
            mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
        }
        catch(e) {
    
        }
    }
}

function CheckVictoryState(): boolean {
    let scoreToWin = maxRounds / 2 + 1;

    // This is stupid, but winning will always occur after the team switch, so team 1 would be defending and team 2 would be attacking
    if (team1Score >= scoreToWin) {
        mod.EndGameMode(defendingTeam); 
        return true;
    }
    else if (team2Score >= scoreToWin) {
        mod.EndGameMode(attackingTeam);
        return true;
    }
    return false;
}

function CleanUp() {
    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (jsPlayer) {
            jsPlayer.destroyUI();
        }
    });
}


async function UpdateMessages() {
    if (messageTime > 0) {
        messageTime--;
        if (messageTime <= 0) {
            HideAllMessageUI();
            messageTime = 0;
        }
    }
}


export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {

    if (mod.EventDeathTypeCompare(eventDeathType, mod.PlayerDeathTypes.Redeploy))
        return;

    let jsPlayer = JsPlayer.get(eventPlayer);

    if (!jsPlayer)
        return;

    let playerTeamID: number = mod.GetObjId(mod.GetTeam(eventPlayer));
    let otherPlayerTeamID: number = -1;
    if (eventOtherPlayer != null) {
        otherPlayerTeamID = mod.GetObjId(mod.GetTeam(eventOtherPlayer));
    }

    if (playerTeamID != otherPlayerTeamID) {
        jsPlayer.cash += killReward;
    }

    jsPlayer.updateWalletUI();
}

export function OnPlayerDied(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {

    if (BombData.carryingPlayer && mod.IsPlayerValid(BombData.carryingPlayer) && mod.GetObjId(eventPlayer) == mod.GetObjId(BombData.carryingPlayer)) {
        BombData.ItemDropped(BombData.carryingPlayer);
        console.log("ObjectiveItemData.currentWorldIconPos: ", mod.XComponentOf(BombData.currentWorldIconPos), mod.YComponentOf(BombData.currentWorldIconPos), mod.ZComponentOf(BombData.currentWorldIconPos));
    }

    if (roundEnded) {
        return;
    }

    let jsPlayer = JsPlayer.get(eventPlayer);
    if (jsPlayer) {
        jsPlayer.progressBarUI?.close();

        if (roundStarted && !roundEnded && !buyPhase) {
            jsPlayer.outOfRound = true;
        }
    }

    if (BombData.defusingPlayer != null && mod.GetObjId(BombData.defusingPlayer) == mod.GetObjId(eventPlayer)) {
        console.log("Defusing player killed mid-defuse");
        BombData.CancelDefuse();
    }

    // Check for any remaining surviving players on the team.
    // When playing with a team full of bots, this often gets triggered during team assignment!
    if (combatStarted && !roundEnded && !buyPhase) {
        let deadPlayerTeamID: number = mod.GetObjId(mod.GetTeam(eventPlayer));
        let survivingTeamMembers: mod.Player[] = GetLivingPlayersOnTeam(mod.GetTeam(eventPlayer));

        
        console.log("Player on team ", deadPlayerTeamID, " Died. They have ", survivingTeamMembers.length, " remaining teammates.");
        if (survivingTeamMembers.length == 0) {
            if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsManDown)) {
                console.log("Player that died is still in man down state. FINISH THEM!");
                mod.DealDamage(eventPlayer, 100);
            }

            // Defending team all dying is always a win for the attackers
            if (deadPlayerTeamID == mod.GetObjId(defendingTeam)) {
                console.log("All defenders have died.");
                EndRound(attackingTeam);
            }
            // Bomb isn't planted and attacking team is all dead
            if (!BombData.isPlanted && mod.GetObjId(attackingTeam) == deadPlayerTeamID) {
                console.log("All attackers are dead and the bomb is not planted.");
                EndRound(defendingTeam);
            }
            else if (BombData.isPlanted && mod.GetObjId(attackingTeam) == deadPlayerTeamID) {
                console.log("Player on attacking team is killed. Bomb is currently planted, so must be defused before round can end.");
            }
        }
        
    }
}

function GetLivingPlayersOnTeam(team: mod.Team): mod.Player[] {
    let teamArr: mod.Player[] = [];
    let teamID = mod.GetObjId(team);
    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (mod.GetObjId(mod.GetTeam(player)) == teamID && !jsPlayer?.outOfRound) {
            teamArr.push(player);
        }
    });

    return teamArr;
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    let jsPlayer = JsPlayer.get(eventPlayer);
    if (jsPlayer)
        jsPlayer.isDeployed = false;
}


// Called whenever a player interacts with an object
export async function OnPlayerInteract(player: mod.Player, interactPoint: any) {
    // ObjIds are assigned IN GODOT. I recommend assigning them to const numbers in the global scope
    let id = mod.GetObjId(interactPoint);
    let jsPlayer = JsPlayer.get(player);

    if (!jsPlayer) {
        console.log("Interaction attempted with invalid JSPlayer! Interact Point ID is: ", id);
        return;
    }

    if (buyPhase && (id == storeID_attackers || storeID_defenders)) {
        jsPlayer.store?.open();
    }

    if (BombData.carryingPlayer != null && mod.GetObjId(player) == mod.GetObjId(BombData.carryingPlayer)) {
        if (id == pointAAreaID) {
            console.log("Begin planting at A");
            BombData.isAtA = true;
            jsPlayer.progressBarUI?.open(MakeMessage(mod.stringkeys.planting));
            BombData.isPlanting = true;
        }
        else if (id == pointBAreaID) {
            console.log("Begin planting at B");
            BombData.isAtB = true;
            jsPlayer.progressBarUI?.open(MakeMessage(mod.stringkeys.planting));
            BombData.isPlanting = true;
        }
    }

    if (BombData.isPlanted && mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(defendingTeam)) {
        if (id == pointAAreaID || id == pointBAreaID) {
            BombData.defusingPlayer = player;
            let jsPlayer = JsPlayer.get(player);
            if (!jsPlayer) {
                console.log("Attempting bomb defuse with invalid JSPlayer!!!!");
                return;
            }
            jsPlayer.progressBarUI?.open(MakeMessage(mod.stringkeys.defusing));
        }
    }
}


async function CombatCountdown(): Promise<void> {
    combatCountdownStarted = true;
    console.log("Combat Countdown Started")

    // INSTANT_START debug flag will skip the countdown delay
    while (combatStartDelayRemaining > -1 && !INSTANT_START) {
        UpdateAllLobbyUI();
        await mod.Wait(1);
        combatStartDelayRemaining--;
    }

    combatStarted = true;
    HideAllLobbyUI();
    return Promise.resolve();
    
}


function UpdateAllLobbyUI() {

    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        jsPlayer.lobbyUI?.refresh();
    });
}

function MessageAllUI(message: mod.Message, textColor: number[]) {
    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        if (jsPlayer.messageUI?.isOpen()) {
            jsPlayer.messageUI.refresh(message);
        }
        else {
            jsPlayer.messageUI?.open(message, textColor);
        }
    });
    messageTime = messageRemainTime;
}

function MessagePlayer(player: JsPlayer, message: mod.Message, textColor: number[]) {
    if (player.messageUI?.isOpen()) {
        player.messageUI?.refresh(message);
    }
    else {
        player.messageUI?.open(message, textColor);
    }

    mod.Wait(3);
    player.messageUI?.close();
}

function HideAllMessageUI() {
    console.log("Hide all message UI");
    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        jsPlayer.messageUI?.close();
    });
}

function HideAllLobbyUI() {
    console.log("Hide lobby UI");
    JsPlayer.playerInstances.forEach((player) => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        jsPlayer.lobbyUI?.close();
    });
}

function MakeMessage(message: string, ...args: any[]) {
    switch (args.length) {
        case 0:
            return mod.Message(message);
        case 1:
            return mod.Message(message, args[0]);
        case 2:
            return mod.Message(message, args[0], args[1]);
        default:
            return mod.Message(message, args[0], args[1], args[2]);
    }
}


export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint): void {
    mod.DisplayNotificationMessage(MakeMessage(mod.stringkeys.teamCapture));
}

export function OnGameModeEnding(): void {
    HideAllMessageUI();
    CleanUp();
}




//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-------------------------------------- RYAN W STORE -------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//


export function OnPlayerUIButtonEvent(player: mod.Player, widget: any, event: any) {
    //console.log("got button event for widget: " + mod.GetUIWidgetName(widget));

    // send to the store?
    let jsPlayer = JsPlayer.get(player);
    if (!jsPlayer)
        return;
    jsPlayer.store.onUIButtonEvent(widget as mod.UIWidget, event);
}


//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Helper Functions:
//-----------------------------------------------------------------------------------------------//

function GetRandomFloatInRange(max: number, min: number) {
    return Math.random() * (max - min) + min;
}

function GetRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

/// ----------------------------------- JS PLAYER --------------------------------------------------------------

class JsPlayer {
    player: mod.Player;
    playerId: number;
    store: any;
    cash = initialCash
    maxHealth = 100;
    currentHealth = 100;
    bonusDamage = 0;

    // stats:
    kills: number = 0;
    deaths: number = 0;
    totalCashEarned: number = 0;


    isDeployed = false;
    hasDeployed = false;

    outOfRound: boolean = false;

    playerwalletWidget: mod.UIWidget|undefined;
    playerNotificationWidget: mod.UIWidget|undefined;
    playerhealthWidget: mod.UIWidget|undefined;
    itemBuysPerRound: any = {};  // a count of each item bought this round, keyed by itemDatas.id


    lobbyUI;
    messageUI;
    scoreUI;
    dropBombIndicator;
    hasBombIndicator;
    versionUI;
    progressBarUI;

    static playerInstances: mod.Player[] = [];

    constructor(player: mod.Player) {
        this.player = player;
        this.playerId = mod.GetObjId(player);
        JsPlayer.playerInstances.push(this.player);
        if (debugJSPlayer) {console.log("Bomb Defusal Adding Player [", mod.GetObjId(this.player), "] Creating JS Player: ", JsPlayer.playerInstances.length)};

        // Never create UI elements for AI soldiers, because late joining players will inherit their Object IDs, and thus their UI
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
            this.createWalletUI();
            this.openWalletUI();
    
            this.store = new Store(this, cStoreData);
            this.lobbyUI = new LobbyUI(this);
            this.scoreUI = new ScoreUI(this);
            this.messageUI = new MessageUI(this);
            this.dropBombIndicator = new DropBombIndicator(this);
            this.hasBombIndicator = new HasBombIndicator(this);
            this.versionUI = new VersionUI(this);
            this.progressBarUI = new ProgressBar(this);
        }
    }

    // declare dictionary with int keys
    static #allJsPlayers: { [key: number] : JsPlayer }  = {};

    static get(player: mod.Player) {
        if (!gameOver && mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);

            let jsPlayer = this.#allJsPlayers[index];
            if (!jsPlayer) {
                jsPlayer = new JsPlayer(player);
                this.#allJsPlayers[index] = jsPlayer;
            }

            return jsPlayer;
        }
        return undefined;
    }

    static removeInvalidJSPlayers(invalidPlayerId: number){
        if (!gameOver){
            if (debugJSPlayer) {console.log("Removing Invalid JSPlayers currently: ", JsPlayer.playerInstances.length)}
            let allPlayersLength = Object.keys((JsPlayer.#allJsPlayers)).length;
            if (debugJSPlayer) {console.log("#allJsPlayers Length: ", JsPlayer.playerInstances.length)}
            let n = 0;
            let indexToRemove = -1;
            JsPlayer.playerInstances.forEach((indexPlayer) => {
                if (mod.GetObjId(JsPlayer.playerInstances[n]) < 0){
                    indexToRemove = n;
                } 
                n++
            })

            this.#allJsPlayers[invalidPlayerId].destroyUI(); // Brute force disallow the double UI bug
            delete this.#allJsPlayers[invalidPlayerId];

            if (indexToRemove > -1){
                JsPlayer.playerInstances.splice(indexToRemove, 1)
            }

            if (debugJSPlayer) {console.log("Player [", invalidPlayerId, "] removed. JSPlayers Remaining: ", JsPlayer.playerInstances.length)}
            allPlayersLength = Object.keys((JsPlayer.#allJsPlayers)).length;
            if (debugJSPlayer) {console.log("#allJsPlayers New Length: ", JsPlayer.playerInstances.length)}

        }  
    }

    static getAllAsArray() {
        return Object.values(this.#allJsPlayers);
    }

    static IsPlayer(id: number) {
        if (!this.#allJsPlayers[id]) {
            return false;
        }
        return true;
    }

    static getRandomJsPlayer() {
        let i = GetRandomInt(JsPlayer.playerInstances.length);
        return JsPlayer.playerInstances[i];
    }

    static getValidJsPlayer() {

        //console.log("M12 getValidJsPlayer: ")

        let aliveAndFreeJSPlayers: mod.Player[] = [];

        let n = JsPlayer.playerInstances.length;
        //console.log("M12 getValidJsPlayer length: ", n)
        for (let i = 0; i < n; i++) {
            //console.log("M12 candidate player = ", JsPlayer.get(JsPlayer.playerInstances[i]))
            let candidateJsPlayer = JsPlayer.get(JsPlayer.playerInstances[i]);
            if (!candidateJsPlayer)
                continue;
        }

        if (aliveAndFreeJSPlayers.length > 0) {
            let i = GetRandomInt(aliveAndFreeJSPlayers.length);
            let validJsPlayer = aliveAndFreeJSPlayers[i];
            //console.log("M12 Returning Valid JS Player: ", validJsPlayer)
            return validJsPlayer as mod.Player
        } else {
            //console.log("M12 There are no Free & Alive JS Players")
            return null;
        }
    }

    static anyJsPlayersAlive() {
        let anyPlayersStillAlive = false;

        JsPlayer.playerInstances.forEach((player) => {
            let jsPlayer = JsPlayer.get(player);
            if (!jsPlayer)
                return;
        });

        if (anyPlayersStillAlive) {
            return true;
        } else {
            return false;
        }

    }

    destroyUI() {
        console.log("Destroy UI");
        this.closeWalletUI();
        this.store?.close();
        this.lobbyUI?.close();
        this.scoreUI?.close();
        this.messageUI?.close();
        this.dropBombIndicator?.close();
        this.hasBombIndicator?.close();
        this.versionUI?.close();
        this.progressBarUI?.close();
    }


    createWalletUI() {
        this.playerwalletWidget = ParseUI({
            type: "Text",
            position: [50, 50],
            size: [200, 40],
            anchor: mod.UIAnchor.TopLeft,
            textLabel: MakeMessage(mod.stringkeys.playerwallet, this.cash),
            playerId: this.player,
            visible: false,
        })
    }

    openWalletUI() {
        if (!this.playerwalletWidget)
            return;
        mod.SetUIWidgetVisible(this.playerwalletWidget, true);
    }

    updateWalletUI() {
        if (!this.playerwalletWidget)
            return;
        mod.SetUITextLabel(this.playerwalletWidget, MakeMessage(mod.stringkeys.playerwallet, this.cash));
    }

    closeWalletUI() {
        if (this.playerwalletWidget) {
            mod.SetUIWidgetVisible(this.playerwalletWidget, false);
        }
    }
}


//-----------------------------------------------------------------------------------------------//

class ScoreUI {
    #jsPlayer;
    #rootWidget: mod.UIWidget|undefined;

    #containerWidth = 150;
    #containerHeight = 60;
    #isIndicatorVisible = false;

    #roundTime: mod.UIWidget|undefined;
    #allyTeamScore: mod.UIWidget|undefined;
    #enemyTeamScore: mod.UIWidget|undefined;
    #teamDesignation: mod.UIWidget|undefined;
    

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;
        console.log("Create score UI for ", jsPlayer.player, " with ID: ", jsPlayer.playerId)
        this.#create();
        if (!this.#rootWidget)
            return;

        mod.SetUIWidgetVisible(this.#rootWidget, true);
    }
    

    refresh() {
        if (!this.#roundTime || !this.#allyTeamScore || !this.#enemyTeamScore || !this.#teamDesignation)
        {
            return;
        }

        // refresh the lobby status text:
        let time: number; // Either display setup/buy time or round time remaining
        if (roundStarted) {
            time = roundTime;
            if (mod.GetObjId(attackingTeam) == mod.GetObjId(mod.GetTeam(this.#jsPlayer.player))) {
                mod.SetUITextLabel(this.#teamDesignation, MakeMessage(mod.stringkeys.attackingTeam));
            }
            else {
                mod.SetUITextLabel(this.#teamDesignation, MakeMessage(mod.stringkeys.defendingTeam));
            }
        }
        else {
            time = buyPhaseTimeRemaining;
            mod.SetUITextLabel(this.#teamDesignation, MakeMessage(mod.stringkeys.buyPhase));
            //console.log("there is ", time, " time remaining in the buy phase");
        }


        let minutes = Math.max(Math.floor(time / 60), 0);
        let seconds = Math.max(Math.ceil(time % 60), 0);
        let seconds1 = Math.max(Math.floor(seconds / 10), 0);
        let seconds2 = Math.max(Math.floor(seconds % 10), 0);
        mod.SetUITextLabel(this.#roundTime, MakeMessage(mod.stringkeys.roundTime, minutes, seconds1, seconds2));

        // #allyTeamScore is just the score on the left, and #enemyTeamScore is the one on the right
        // so really #allyTeamScore is "allied team" score and #enemyTeamScore is "enemy team score"
        if (mod.GetObjId(mod.GetTeam(this.#jsPlayer.player)) == 1) {
            mod.SetUITextLabel(this.#allyTeamScore, MakeMessage(mod.stringkeys.score, team1Score));
            mod.SetUITextLabel(this.#enemyTeamScore, MakeMessage(mod.stringkeys.score, team2Score));
        }
        else {
            mod.SetUITextLabel(this.#allyTeamScore, MakeMessage(mod.stringkeys.score, team2Score));
            mod.SetUITextLabel(this.#enemyTeamScore, MakeMessage(mod.stringkeys.score, team1Score));
        }

        mod.SetUITextColor(this.#allyTeamScore, mod.CreateVector(0, .2, 1));
        mod.SetUITextColor(this.#enemyTeamScore, mod.CreateVector(1, 0, 0));
    }

    #create() {
        this.#isIndicatorVisible = true;
        // background:
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#containerWidth, this.#containerHeight],
            position: [0, 30],
            anchor: mod.UIAnchor.TopCenter,
            bgFill: mod.UIBgFill.Blur,
            //bgColor: this.#activeTabBgColor,
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
        });
        this.#roundTime = ParseUI({
            type: "Text",
            parent: this.#rootWidget,
            textSize: 24,
            position: [0, 10, 0],
            size: [this.#containerWidth / 3, 50],
            anchor: mod.UIAnchor.TopCenter,
            textAnchor: mod.UIAnchor.Center,
            bgAlpha: 0,
            bgColor: [0, 0, 0],
            textLabel: MakeMessage(mod.stringkeys.roundTime, "05", "00"),
        });
        this.#allyTeamScore = ParseUI({
            type: "Text",
            parent: this.#rootWidget,
            textSize: 24,
            position: [4, 20, 0],
            size: [this.#containerWidth / 4, 50],
            anchor: mod.UIAnchor.TopLeft,
            textAnchor: mod.UIAnchor.TopLeft,
            bgAlpha: 0,
            bgColor: [0, 0, 0],
            textLabel: MakeMessage(mod.stringkeys.score, 0),
        });
        this.#enemyTeamScore = ParseUI({
            type: "Text",
            parent: this.#rootWidget,
            textSize: 24,
            position: [4, 20, 0],
            size: [this.#containerWidth / 4, 50],
            anchor: mod.UIAnchor.TopRight,
            textAnchor: mod.UIAnchor.TopRight,
            bgAlpha: 0,
            bgColor: [0, 0, 0],
            textLabel: MakeMessage(mod.stringkeys.score, 0),
        });
        this.#teamDesignation = ParseUI({
            type: "Text",
            parent: this.#rootWidget,
            textSize: 24,
            position: [0, -50, 0],
            size: [this.#containerWidth * 2 / 3, 50],
            anchor: mod.UIAnchor.BottomCenter,
            textAnchor: mod.UIAnchor.Center,
            bgAlpha: 0.5,
            bgColor: [0, 0, 1],
            textColor: [1, 1, 1],
            textLabel: MakeMessage(mod.stringkeys.waiting, 0),
        });
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isIndicatorVisible = false;
        }
    }

    isOpen() {
        return this.#isIndicatorVisible;
    }
}

class VersionUI {
    #jsPlayer: JsPlayer;
    #rootWidget: mod.UIWidget|undefined;

    #containerWidth = 180;
    #containerHeight = 40;
    #backgroundSpacing = 4;
    #isIndicatorVisible = false;

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;

        if (!this.#rootWidget)
            this.#create();
        if (!this.#rootWidget)
            return;
    
        mod.SetUIWidgetVisible(this.#rootWidget, true);
    }

    #create() {
        console.log("Create VersionUI")
        this.#isIndicatorVisible = true;
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#containerWidth, this.#containerHeight],
            position: [0, 20],
            anchor: mod.UIAnchor.TopRight,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0,0,0],
            bgAlpha: 0,
            playerId: this.#jsPlayer.player,
            children: [{
                type: "Text",
                textSize: 18,
                position: [0, 0, 0],
                size: [this.#containerWidth - this.#backgroundSpacing * 2, this.#containerHeight],
                anchor: mod.UIAnchor.Center,
                textAnchor: mod.UIAnchor.Center,
                bgAlpha: 0,
                textLabel: MakeMessage(mod.stringkeys.version, VERSION[0], VERSION[1], VERSION[2]),
            }] 
        })
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isIndicatorVisible = false;
        }
    }

    isOpen() {
        return this.#isIndicatorVisible;
    }
}

class ProgressBar {
    #jsPlayer;
    #rootWidget: mod.UIWidget|undefined;
    #fillWidget: mod.UIWidget|undefined;
    #labelWidget: mod.UIWidget|undefined;
    #currentProgress: number = 0; // 0-1
    #isIndicatorVisible = false;
    #containerWidth = 180;
    #containerHeight = 50;

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;
    }

    open(label: mod.Message) {
        if (!this.#rootWidget)
            this.#create(label);
        if (!this.#rootWidget)
            return;

        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isIndicatorVisible = true;
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isIndicatorVisible = false;
        }
    }

    refresh(progress: number) {
        this.#currentProgress = progress;
        
        if (this.#fillWidget)
            mod.SetUIWidgetSize(this.#fillWidget, mod.CreateVector(progress * this.#containerWidth, this.#containerHeight, 1));
        else 
            console.log("fill widget is null!");
    }

    isOpen() {
        return this.#isIndicatorVisible;
    }

    #create(label: mod.Message) {
        console.log("Create has bomb indicator UI");
        // background:
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#containerWidth, this.#containerHeight],
            position: [0, 150],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.None,
            bgColor: [0, 0, 0],
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [{
                // Background
                type: "Container",
                position: [0, 0],
                size: [this.#containerWidth, this.#containerHeight],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Blur,
                bgColor: BLACKCOLOR,
                bgAlpha: 1,
            }, ]
        });

        this.#fillWidget = ParseUI({
            type: "Container",
            parent: this.#rootWidget,
            size: [0, this.#containerHeight],
            position: [0, 0],
            anchor: mod.UIAnchor.CenterLeft,
            bgFill: mod.UIBgFill.GradientLeft,
            bgColor: [0, 1, 0.3],
            bgAlpha: 1,
        });

        this.#labelWidget = ParseUI({
                type: "Text",
                parent: this.#rootWidget,
                textSize: 18,
                position: [-this.#containerWidth, 0, 0],
                size: [this.#containerWidth, this.#containerHeight],
                anchor: mod.UIAnchor.CenterLeft,
                textAnchor: mod.UIAnchor.Center,
                bgAlpha: 0,
                textLabel: label,
        });
    }
}


class HasBombIndicator {
    #jsPlayer: JsPlayer;
    #rootWidget: mod.UIWidget|undefined;

    #containerWidth = 180;
    #containerHeight = 80;
    #backgroundSpacing = 4;


    #isIndicatorVisible = false;

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;
    }

    open() {
        if (!this.#rootWidget)
            this.#create();
        if (!this.#rootWidget)
            return;

        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isIndicatorVisible = true;
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isIndicatorVisible = false;
        }
    }

    isOpen() {
        return this.#isIndicatorVisible;
    }

    #create() {
        console.log("Create has bomb indicator UI");
        // background:
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#containerWidth, this.#containerHeight],
            position: [200, 30],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0, 0, 0],
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [{
                // Black Background
                type: "Container",
                position: [0, 0],
                size: [this.#containerWidth - this.#backgroundSpacing, this.#containerHeight - this.#backgroundSpacing],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Blur,
                bgColor: BLACKCOLOR,
                bgAlpha: 1,
            }, {
                type: "Text",
                textSize: 18,
                position: [0, 0, 0],
                size: [this.#containerWidth - this.#backgroundSpacing * 2, this.#containerHeight],
                anchor: mod.UIAnchor.Center,
                textAnchor: mod.UIAnchor.Center,
                bgAlpha: 0,
                textLabel: MakeMessage(mod.stringkeys.bombCarrier),
            }, ]
        });
    }
}


//-----------------------------------------------------------------------------------------------//


class DropBombIndicator {
    #jsPlayer: JsPlayer;
    #rootWidget: mod.UIWidget|undefined;


    #containerWidth = 180;
    #containerHeight = 80;
    #backgroundSpacing = 4;


    #isIndicatorVisible = false;

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;
    }

    open() {
        if (!this.#rootWidget)
            this.#create();
        if (!this.#rootWidget)
            return;

        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isIndicatorVisible = true;
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isIndicatorVisible = false;
        }
    }

    isOpen() {
        return this.#isIndicatorVisible;
    }

    #create() {
        // background:
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#containerWidth, this.#containerHeight],
            position: [0, 30],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0, 0, 0],
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [{
                // Black Background
                type: "Container",
                position: [0, 0],
                size: [this.#containerWidth - this.#backgroundSpacing, this.#containerHeight - this.#backgroundSpacing],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Blur,
                bgColor: BLACKCOLOR,
                bgAlpha: 1,
            }, {
                type: "Text",
                textSize: 18,
                position: [0, 0, 0],
                size: [this.#containerWidth - this.#backgroundSpacing * 2, this.#containerHeight],
                anchor: mod.UIAnchor.Center,
                textAnchor: mod.UIAnchor.Center,
                bgAlpha: 0,
                textLabel: MakeMessage(mod.stringkeys.dropBombTip),
            }] 
        });
    }
}

//-----------------------------------------------------------------------------------------------//

class LobbyUI {
    #jsPlayer;
    #rootWidget: mod.UIWidget|undefined;

    #containerWidth = 700;
    #containerHeight = 300;
    #lineBreakHeight = 3;
    #backgroundSpacing = 4;
    #activeTabBgColor = BLACKCOLOR;

    #lobbyStatusText: mod.UIWidget|undefined;

    #isUIVisible = false;

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;
    }

    open() {
        if (!this.#rootWidget)
            this.#create();
        if (!this.#rootWidget)
            return;
        // this.refresh();
        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isUIVisible = true;
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isUIVisible = false;
        }
    }

    isOpen() {
        return this.#isUIVisible;
    }

    refresh() {
        if (!this.#lobbyStatusText)
        {
            console.log("No lobby status text");
            return;
        }
        // refresh the lobby status text:
        if (combatCountdownStarted) {
            mod.SetUITextLabel(this.#lobbyStatusText, MakeMessage(mod.stringkeys.combatStartDelayCountdown, combatStartDelayRemaining));
        }
        else {
            mod.SetUITextLabel(this.#lobbyStatusText, MakeMessage(mod.stringkeys.waitingforplayersX, initialPlayerCount, 10, minimumInitialPlayerCount));
        }
    }

    #create() {
        // background:
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#containerWidth, this.#containerHeight],
            position: [0, 100],
            anchor: mod.UIAnchor.TopCenter,
            bgFill: mod.UIBgFill.Solid,
            bgColor: this.#activeTabBgColor,
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [{
                // Black Background
                type: "Container",
                position: [0, 0],
                size: [this.#containerWidth - this.#backgroundSpacing, this.#containerHeight - this.#backgroundSpacing],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: [0.1, 0.1, 0.1],
                bgAlpha: 1
            }, {
                // Line Break Line
                type: "Container",
                position: [0, 100],
                size: [this.#containerWidth - 50, this.#lineBreakHeight],
                anchor: mod.UIAnchor.BottomCenter,
                bgFill: mod.UIBgFill.Solid,
                bgColor: BLACKCOLOR,
                bgAlpha: 1
            }, {
                // Experience Title Text:
                type: "Text",
                textSize: 72,
                position: [0, 25, 0],
                size: [this.#containerWidth, 150],
                anchor: mod.UIAnchor.TopCenter,
                textAnchor: mod.UIAnchor.TopCenter,
                bgAlpha: 0,
                //bgColor: REDCOLOR,
                textLabel: MakeMessage(mod.stringkeys.titleLineOne),
            },
                {
                    // Experience Title Text:
                    type: "Text",
                    textSize: 72,
                    position: [0, 90, 0],
                    size: [this.#containerWidth, 150],
                    anchor: mod.UIAnchor.TopCenter,
                    textAnchor: mod.UIAnchor.TopCenter,
                    bgAlpha: 0,
                    //bgColor: REDCOLOR,
                    textLabel: MakeMessage(mod.stringkeys.titleLineTwo),
                }]
        });
        // lobby status text:
        this.#lobbyStatusText = ParseUI({
            type: "Text",
            parent: this.#rootWidget,
            textSize: 36,
            position: [0, 30, 0],
            size: [this.#containerWidth, 50],
            anchor: mod.UIAnchor.BottomCenter,
            textAnchor: mod.UIAnchor.Center,
            bgAlpha: 0,
            //bgColor: REDCOLOR,
            textLabel: MakeMessage(mod.stringkeys.waitingforplayersX, initialPlayerCount, 12),
        });
    }
}

class MessageUI {
    #jsPlayer;
    #rootWidget: mod.UIWidget|undefined;

    #containerWidth = 700;
    #containerHeight = 100;
    #lineBreakHeight = 3;
    #backgroundSpacing = 4;
    #activeTabBgColor = [0, 0, 0];

    #messageText: mod.UIWidget|undefined;

    #isUIVisible = false;

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;
    }

    open(message: mod.Message, textColor: number[]) {
        //console.log("Open message UI");
        if (!this.#rootWidget)
            this.#create(message, textColor);
        else {
            this.refresh(message);
            if (this.#messageText && textColor.length >= 3)
                mod.SetUITextColor(this.#messageText, mod.CreateVector(textColor[0], textColor[1], textColor[2]));
        }
        
        if (!this.#rootWidget)
            return;

        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isUIVisible = true;
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isUIVisible = false;
        }
    }

    isOpen() {
        return this.#isUIVisible;
    }

    refresh(message: mod.Message) {
        //console.log("refresh message text");
        if (!this.#messageText) {
            console.log("Missing Message Text!");
            return;
        }
        mod.SetUITextLabel(this.#messageText, message);

    }

    #create(message: mod.Message, textColor: number[]) {
        // background:
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#containerWidth, this.#containerHeight],
            position: [0, 100],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.Blur,
            bgColor: this.#activeTabBgColor,
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [{
                // Black Background
                type: "Container",
                position: [0, 0],
                size: [this.#containerWidth - this.#backgroundSpacing, this.#containerHeight - this.#backgroundSpacing],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Blur,
                bgColor: BLACKCOLOR,
                bgAlpha: 1,
            },
        ]});
        // message
        this.#messageText = ParseUI({
            type: "Text",
            parent: this.#rootWidget,
            textSize: 36,
            position: [0, 30, 0],
            size: [this.#containerWidth, 50],
            anchor: mod.UIAnchor.BottomCenter,
            textAnchor: mod.UIAnchor.Center,
            bgAlpha: 0,
            textColor: textColor,
            textLabel: message,
        });
    }
}

//-----------------------------------------------------------------------------------------------//
class BombData {
    static currentWorldIconPos: mod.Vector = mod.CreateVector(0, 0, 0);
    static lastCarryingPlayerPos: mod.Vector = mod.CreateVector(0, 0, 0);
    static bombPositionWorldIcon: mod.WorldIcon;// For when the bomb is dropped
    static isAtA: boolean = false;
    static isAtB: boolean = false;
    static isPlanting: boolean = false;
    static plantProgress: number = 0;

    static countDown: number = 60;

    static defusingPlayer: mod.Player | null;
    static defusingProgress: number = 0;

    static isBeingCarried: boolean = false;
    static isPlanted: boolean = false;
    static carryingPlayer: mod.Player | null;

    static canBePickedUp: boolean = true;
    static bombModel: mod.SpatialObject | null = null;

    static Initialize() {
        // Init things here
        this.bombPositionWorldIcon = mod.GetWorldIcon(1502);

        mod.SetWorldIconText(this.bombPositionWorldIcon, MakeMessage(mod.stringkeys.bomb));

        mod.SetWorldIconColor(this.bombPositionWorldIcon, mod.CreateVector(1, 0, 0));

        mod.EnableWorldIconImage(this.bombPositionWorldIcon, false);
        mod.EnableWorldIconText(this.bombPositionWorldIcon, false);
    }

    static Reset() {
        mod.EnableSFX(alarmSFX_A, false);
        mod.EnableSFX(alarmSFX_B, false);

        this.isPlanted = false;
        this.isPlanting = false;

        this.isAtA = false;
        this.isAtB = false;

        this.defusingProgress = 0;
        this.plantProgress = 0;
        this.defusingPlayer = null;
        
        if (this.isBeingCarried) {
            if (this.carryingPlayer != null)
                this.ItemDropped(this.carryingPlayer);
            else
                this.ItemDropped();
    }
    }

    static ItemProximityCheck(){
        // this implementation will potentially mess up when multiple players enter the pickup range in quicker succession than the tick, should probably have a failsafe
        if (!this.isBeingCarried && this.canBePickedUp) {
            const player = mod.ClosestPlayerTo(this.currentWorldIconPos, attackingTeam);
            let pos;
            if (mod.IsPlayerValid(player) && !mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)){ 
                pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
                const playerPos = pos;
                const distance = mod.DistanceBetween(this.currentWorldIconPos, playerPos);

                if (distance <= bombPickupDistance) {
                    this.ItemPickedUp(player);
                }
            }
        }
    }

    static ItemPickedUp(player: mod.Player) {
        this.isBeingCarried = true;
        this.isAtA = false;
        this.isAtB = false;
        this.carryingPlayer = player;
        mod.AddUIIcon(this.carryingPlayer, mod.WorldIconImages.Bomb, 2.0, mod.CreateVector(0, 1, 0.1), mod.Message("Bomb"), mod.GetTeam(this.carryingPlayer));
        mod.EnableWorldIconImage(this.bombPositionWorldIcon, false);
        mod.EnableWorldIconText(this.bombPositionWorldIcon, false);

        console.log("Bomb model ID is ", this.bombModel);

        if (this.bombModel != null) {
            mod.UnspawnObject(this.bombModel);
        }
        
        console.log("Bomb has been picked up");

        mod.EnableInputRestriction(player, mod.RestrictedInputs.Interact, false);

        // Message all Teammates
        JsPlayer.playerInstances.forEach(playerInst => {
            if (mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(mod.GetTeam(playerInst))) {
                let jsPlayer = JsPlayer.get(playerInst);
                if (jsPlayer) {
                    MessagePlayer(jsPlayer, MakeMessage(mod.stringkeys.bombPickedUp), WHITECOLOR);
                    if (mod.GetObjId(player) == mod.GetObjId(playerInst)) {
                        jsPlayer.hasBombIndicator?.open();
                        jsPlayer.dropBombIndicator?.open();
                    }
                }
            }
        });
    }

    static ItemHeld() {
        if (!this.isBeingCarried || this.isPlanted)
            return;

        if (this.carryingPlayer && mod.IsPlayerValid(this.carryingPlayer) && mod.GetSoldierState(this.carryingPlayer, mod.SoldierStateBool.IsAlive)) {
            this.lastCarryingPlayerPos = mod.GetSoldierState(this.carryingPlayer, mod.SoldierStateVector.GetPosition);
        }
    }

    static BombPlanted() {
        if (!this.isPlanted || roundEnded || !roundStarted)
            return;

        this.countDown -= 1;

        if (this.countDown <= 0) {

            if (this.isAtA) {
                mod.EnableSFX(alarmSFX_A, false);
                ExplodeFeedback(MCOMPositionA);
            }
            else {
                mod.EnableSFX(alarmSFX_B, false);
                ExplodeFeedback(MCOMPositionB);
            }

            console.log("Explode Bomb!");
            MessageAllUI(MakeMessage(mod.stringkeys.bombExploded), WHITECOLOR);
            EndRound(attackingTeam);
        }
    }

    static ItemDropped(player?: mod.Player) {
        this.isBeingCarried = false;
        this.isAtA = false;
        this.isAtB = false;
        this.currentWorldIconPos = mod.Add(this.lastCarryingPlayerPos, mod.CreateVector(0, 1.5, 0));

        this.carryingPlayer = null;
        mod.EnableWorldIconImage(this.bombPositionWorldIcon, true);
        mod.EnableWorldIconText(this.bombPositionWorldIcon, true);
        
        if (player) {
            mod.EnableInputRestriction(player, mod.RestrictedInputs.Interact, true);
            let jsPlayer = JsPlayer.get(player);
            if (jsPlayer) {
                jsPlayer.dropBombIndicator?.close();
                jsPlayer.hasBombIndicator?.close();
            }

            mod.RemoveUIIcon(player);
        }

        mod.SetWorldIconPosition(this.bombPositionWorldIcon, this.currentWorldIconPos);

        if (this.bombModel != null) {
            mod.UnspawnObject(this.bombModel);
        }

        this.bombModel = mod.SpawnObject(mod.RuntimeSpawn_Capstone.RetroBoomBox_01, mod.Add(this.lastCarryingPlayerPos, mod.CreateVector(0, 0.25, 0)), ZEROVEC);
        
        console.log("Bomb Dropped")
        MessageAllUI(MakeMessage(mod.stringkeys.bombDropped, player), REDCOLOR);
        console.log("Bomb World Icon should be at position: ", mod.XComponentOf(this.currentWorldIconPos), " ", mod.YComponentOf(this.currentWorldIconPos), " ", mod.ZComponentOf(this.currentWorldIconPos));
        BombDropTimer();
    }

    static PlantBomb() {
        console.log("Bomb is planted")
        roundTime = MCOMFuseTime;
        this.plantProgress = 0;
        this.isPlanting = false;
        
        if (this.carryingPlayer)
            mod.RemoveUIIcon(this.carryingPlayer);
        
        if (this.carryingPlayer != null) {
            mod.EnableInputRestriction(this.carryingPlayer, mod.RestrictedInputs.Interact, true);
            let jsPlayer = JsPlayer.get(this.carryingPlayer);
            if (jsPlayer) {
                jsPlayer.dropBombIndicator?.close();
                jsPlayer.hasBombIndicator?.close();
                jsPlayer.progressBarUI?.close();
            }
        }
        else
            console.log("Bomb was Planted but had no carrying player. This should not be possible.");
        
        HideAllMessageUI();
        if (BombData.isAtA) {
            console.log("Bomb planted at B feedback");
            MessageAllUI(MakeMessage(mod.stringkeys.aArmed), REDCOLOR);
            mod.EnableInteractPoint(interactPointB, false);
            mod.EnableWorldIconImage(worldIconB, false);
            mod.EnableWorldIconText(worldIconB, false);
            mod.EnableSFX(alarmSFX_A, true);
            mod.PlaySound(alarmSFX_A, 100, MCOMPositionA, 1);
        }
        else if (BombData.isAtB) {
            console.log("Bomb planted at A feedback");
            MessageAllUI(MakeMessage(mod.stringkeys.bArmed), REDCOLOR);
            mod.EnableInteractPoint(interactPointA, false);
            mod.EnableWorldIconImage(worldIconA, false);
            mod.EnableWorldIconText(worldIconA, false);
            mod.EnableSFX(alarmSFX_B, true);
            mod.PlaySound(alarmSFX_B, 100, MCOMPositionB, 1);
        }
        else {
            console.log("Bomb is at neither A nor B when planted! This should not be possible.");
        }

        this.countDown = MCOMFuseTime;
        this.isBeingCarried = false;
        this.isPlanted = true;
        this.carryingPlayer = null;
        this.canBePickedUp = false;
        mod.EnableWorldIconImage(this.bombPositionWorldIcon, false);
        mod.EnableWorldIconText(this.bombPositionWorldIcon, false);

        // Reward the team
        JsPlayer.playerInstances.forEach(player => {
            if (mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(attackingTeam)) {
                let jsPlayer = JsPlayer.get(player);
                if (jsPlayer) {
                    jsPlayer.cash += plantReward;
                    jsPlayer.updateWalletUI();
                }
            }
        });
    }

    static DefuseBomb() {
        MessageAllUI(MakeMessage(mod.stringkeys.bombDefused), WHITECOLOR);
        console.log("Bomb is defused!");

        // Reward the team
        JsPlayer.playerInstances.forEach(player => {
            if (mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(defendingTeam)) {
                let jsPlayer = JsPlayer.get(player);
                if (jsPlayer)
                {
                    jsPlayer.cash += defuseReward;
                    jsPlayer.updateWalletUI();
                }
            }
        });

        if (this.defusingPlayer) {
            let jsPlayer = JsPlayer.get(this.defusingPlayer);
            if (jsPlayer) {
                jsPlayer.progressBarUI?.close();
            }
        }

            if (this.isAtA) {
                mod.EnableSFX(alarmSFX_A, false);
            }
            else {
                mod.EnableSFX(alarmSFX_B, false);
            }

        this.defusingPlayer = null;
        this.isPlanted = false;
        this.defusingProgress = 0;

        EndRound(defendingTeam);
    }

    static CancelDefuse() {
        console.log("Bomb Defusing Cancelled");
        if (this.defusingPlayer != null) {
            let jsPlayer = JsPlayer.get(this.defusingPlayer);
            if (jsPlayer) {
                jsPlayer.progressBarUI?.close();
            }
        }

        this.defusingPlayer = null;
        this.defusingProgress = 0;
    }

    static CancelPlant() {
        console.log("Bomb Planting Cancelled");
        BombData.isAtA = false;
        BombData.isAtB = false;
        BombData.plantProgress = 0;
        BombData.isPlanting = false;

        if (this.carryingPlayer != null) {
            let jsPlayer = JsPlayer.get(this.carryingPlayer);
            if (jsPlayer) {
                jsPlayer.progressBarUI?.close();
            }
        }
    }
}

async function BombDropTimer() {
    BombData.canBePickedUp = false;
    await mod.Wait(3)
    BombData.canBePickedUp = true;
}


//-----------------------------------------------------------------------------------------------//

class StoreItemData {
    id: any;
    name: any;           // string or mod.Message
    cost = 1;
    bonusDamage = 0;
    bonusHealth = 0;
    weapon: any;

    constructor(params: { [key: string]: any }) {
        const fields: { [key: string]: any } = this;
        for (const id in params)
            fields[id] = params[id];
    }

    canAffordIt(jsPlayer: JsPlayer, itemData: any) {
        return jsPlayer.cash >= itemData.cost;
    }

    // return null if unlocked, or a String or mod.Message with the locked reason
    getDisabledMessageCallback(jsPlayer: JsPlayer, itemData: any) {
        if (itemData.inventoryPerRound > 0) {
            let buysThisRound = jsPlayer.itemBuysPerRound[itemData.id];
            if (buysThisRound >= itemData.inventoryPerRound)
                return mod.stringkeys.outOfInventory;
        }
        return null;
    }

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();
        //console.log("Make Player " + mod.GetObjId(jsPlayer.player) + " buy: " + itemData.id);
    }
}

class StoreItemDataWeapon extends StoreItemData {

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();

        ////////// Can't do any of this for launch because of the Loot Spawner //////////

        // if (itemData.weapon in mod.Weapons && mod.IsInventorySlotActive(jsPlayer.player, mod.InventorySlots.PrimaryWeapon)) {
        //     for (let i = 0; i < Object.keys(mod.PrimaryWeapons).length; ++i) {
        //         if (mod.HasInventory(jsPlayer.player, i)) {
        //             let lootSpawner: mod.LootSpawner = mod.SpawnObject(mod.RuntimeSpawn_Common.LootSpawner, mod.GetSoldierState(jsPlayer.player, mod.SoldierStateVector.GetPosition), ZEROVEC, ONEVEC);
        //             mod.SpawnLoot(lootSpawner, i);
        //             mod.UnspawnObject(lootSpawner);
        //             break;
        //         }
        //     }
        // }
        // else if (itemData.weapon in mod.SecondaryWeapons && mod.IsInventorySlotActive(jsPlayer.player, mod.InventorySlots.SecondaryWeapon)) {
        //     for (let i = 0; i < Object.keys(mod.SecondaryWeapons).length; ++i) {
        //         if (mod.HasInventory(jsPlayer.player, i)) {
        //             let lootSpawner: mod.LootSpawner = mod.SpawnObject(mod.RuntimeSpawn_Common.LootSpawner, mod.GetSoldierState(jsPlayer.player, mod.SoldierStateVector.GetPosition), ZEROVEC, ONEVEC);
        //             mod.SpawnLoot(lootSpawner, i);
        //             mod.UnspawnObject(lootSpawner);
        //             break;
        //         }
        //     }
        // }

        if (itemData.weaponPackage != null){
            console.log("removing and adding new equipment");
            //mod.RemoveEquipment(jsPlayer.player, mod.InventorySlots.PrimaryWeapon)
            
            mod.AddEquipment(jsPlayer.player, itemData.weapon, itemData.weaponPackage);
        }
        else {
            mod.AddEquipment(jsPlayer.player, itemData.weapon);
        }

    }
}

class StoreItemDataGadget extends StoreItemData {

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();

        // if (mod.IsInventorySlotActive(jsPlayer.player, mod.InventorySlots.GadgetOne)) {
        //     if (mod.IsInventorySlotActive(jsPlayer.player, mod.InventorySlots.GadgetTwo)) {
        //         ////////// Can't do any of this for launch because of the Loot Spawner //////////
        //         // No open gadget slots, drop gadget 2
        //         // for (let i = 0; i < Object.keys(mod.Gadgets).length; ++i) {
        //         //     if (mod.HasInventory(jsPlayer.player, i)) {
        //         //         let lootSpawner: mod.LootSpawner = mod.SpawnObject(mod.RuntimeSpawn_Common.LootSpawner, mod.GetSoldierState(jsPlayer.player, mod.SoldierStateVector.GetPosition), ZEROVEC, ONEVEC);
        //         //         mod.SpawnLoot(lootSpawner, i);
        //         //         mod.UnspawnObject(lootSpawner);
        //         //         break;
        //         //     }
        //         // }
        //         mod.AddEquipment(jsPlayer.player, itemData.weapon, mod.InventorySlots.GadgetTwo);
        //     }
        //     else {
        //         // Gadget slot 2 is clear
        //         mod.AddEquipment(jsPlayer.player, itemData.weapon, mod.InventorySlots.GadgetTwo);
        //     }
        // }
        // else {
        //     // Gadget slots are clear
        //     mod.AddEquipment(jsPlayer.player, itemData.weapon, mod.InventorySlots.GadgetOne);

        // }
        mod.AddEquipment(jsPlayer.player, itemData.weapon);


    }
}

//// - Assault Rifle Weapon Packages - ////

let assaultRiflePackage_Basic = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Basic)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, assaultRiflePackage_Basic)


let assaultRiflePackage_Standard = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_1p87_150x, assaultRiflePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, assaultRiflePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, assaultRiflePackage_Standard)


let assaultRiflePackage_Elite = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Fast_Mag, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_R4T_200x, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Full_Angled, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Standard_Suppressor, assaultRiflePackage_Elite)


let assaultRiflePackage_Basic_B36A4 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Basic_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, assaultRiflePackage_Basic_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_480mm_Factory, assaultRiflePackage_Basic_B36A4)

let assaultRiflePackage_Standard_B36A4 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_1p87_150x, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_480mm_Factory, assaultRiflePackage_Standard_B36A4)

let assaultRiflePackage_Elite_B36A4 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Fast_Mag, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_R4T_200x, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Full_Angled, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Standard_Suppressor, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_480mm_Factory, assaultRiflePackage_Elite_B36A4)

//// - Carbine Weapon Packages - ////

let carbinePackage_Basic = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, carbinePackage_Basic)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, carbinePackage_Basic)


let carbinePackage_Standard = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, carbinePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_CCO_200x, carbinePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Vertical, carbinePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, carbinePackage_Standard)


let carbinePackage_Elite = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Fast_Mag, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_ST_Prisim_500x, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Standard_Suppressor, carbinePackage_Elite)

let carbinePackage_Basic_M4A1 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, carbinePackage_Basic_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, carbinePackage_Basic_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_145_Carbine, carbinePackage_Basic_M4A1)

let carbinePackage_Standard_M4A1 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Fast_Mag, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_1p87_150x, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_145_Carbine, carbinePackage_Standard_M4A1)

let carbinePackage_Elite_M4A1 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_40rnd_Fast_Mag, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_R4T_200x, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Lightened_Suppressor, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_115_Commando, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ergonomic_Improved_Mag_Catch, carbinePackage_Elite_M4A1)


//// - PDW Weapon Packages - ////

let PDWPackage_Basic_SMG_PW7A2 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, PDWPackage_Basic_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, PDWPackage_Basic_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_180mm_Standard, PDWPackage_Basic_SMG_PW7A2)

let PDWPackage_Standard_SMG_PW7A2 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Mini_Flex_100x, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Compact_Handstop, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_180mm_Standard, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_5_mW_Red, PDWPackage_Standard_SMG_PW7A2)

let PDWPackage_Elite_SMG_PW7A2 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_40rnd_Magazine, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_SU_123_150x, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Folding_Vertical, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_CQB_Suppressor, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_180mm_Prototype, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_5_mW_Red, PDWPackage_Elite_SMG_PW7A2)


//// - DMR Weapon Packages - ////

let DMRPackage_Basic_SVDM = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_10rnd_Magazine, DMRPackage_Basic_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Baker_300x, DMRPackage_Basic_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_550mm_Factory, DMRPackage_Basic_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, DMRPackage_Basic_SVDM)

let DMRPackage_Standard_SVDM = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_10rnd_Fast_Mag, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_LDS_450x, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_6H64_Vertical, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_550mm_Factory, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, DMRPackage_Standard_SVDM)


let DMRPackage_Elite_SVDM = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_PAS_35_300x, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Long_Suppressor, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_620mm_Classic, DMRPackage_Elite_SVDM)

//// - Sniper Weapon Packages - ////

let SniperPackage_Basic_M2010ESR = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_5rnd_Magazine, SniperPackage_Basic_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_LDS_450x, SniperPackage_Basic_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, SniperPackage_Basic_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_24_Full, SniperPackage_Basic_M2010ESR)

let SniperPackage_Standard_SV_98 = mod.CreateNewWeaponPackage();
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, SniperPackage_Standard_SV_98);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_LDS_450x, SniperPackage_Standard_SV_98);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_650mm_Factory, SniperPackage_Standard_SV_98);

let SniperPackage_Standard_M2010ESR = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_5rnd_Fast_Mag, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_SSDS_600x, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_24_Full, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, SniperPackage_Standard_M2010ESR)

let SniperPackage_Elite_M2010ESR = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_8rnd_Magazine, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_NFX_800x, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Match_Grade, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Long_Suppressor, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_26_Carbon, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Left_Range_Finder, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ergonomic_DLC_Bolt, SniperPackage_Elite_M2010ESR)


//// - LMG Weapon Packages - ////

let LMGPackage_Basic = mod.CreateNewWeaponPackage();
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, LMGPackage_Basic)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, LMGPackage_Basic)

let LMGPackage_Basic_M240L = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_50rnd_Loose_Belt, LMGPackage_Basic_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, LMGPackage_Basic_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, LMGPackage_Basic_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_20_Lima, LMGPackage_Basic_M240L)

let LMGPackage_Standard_M240L = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_75rnd_Belt_Box, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_BF_2M_250x, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_20_Lima, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, LMGPackage_Standard_M240L)

let LMGPackage_Elite_M240L = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_100rnd_Belt_Box, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_LDS_450x, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Linear_Comp, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_24_Bravo, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_120_mW_Blue, LMGPackage_Elite_M240L)

//// - Shotgun Weapon Packages - ////

let ShotgunPackage_Basic = mod.CreateNewWeaponPackage();
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, ShotgunPackage_Basic);

let ShotgunPackage_Basic_185KS_K = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_4rnd_Magazine, ShotgunPackage_Basic_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, ShotgunPackage_Basic_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_430mm_Factory, ShotgunPackage_Basic_185KS_K)

let ShotgunPackage_Standard_185KS_K = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_4rnd_Fast_Mag, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Mini_Flex_100x, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Flechette, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Folding_Stubby, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_430mm_Factory, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_5_mW_Red, ShotgunPackage_Standard_185KS_K)

let ShotgunPackage_Elite_185KS_K = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_8rnd_Fast_Mag, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_SU_123_150x, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Slugs, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_CQB_Suppressor, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_430mm_Cut, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_120_mW_Blue, ShotgunPackage_Elite_185KS_K)

//// - Pistol Weapon Packages - ////

let SidearmPackage_Standard_ES_57 = mod.CreateNewWeaponPackage();
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, SidearmPackage_Standard_ES_57);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_122mm_Factory, SidearmPackage_Standard_ES_57);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, SidearmPackage_Standard_ES_57);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, SidearmPackage_Standard_ES_57);

let SidearmPackage_Standard_M44 = mod.CreateNewWeaponPackage();
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, SidearmPackage_Standard_M44);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, SidearmPackage_Standard_M44);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_675_Factory, SidearmPackage_Standard_M44);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_6rnd_Speedloader, SidearmPackage_Standard_M44);

let SidearmPackage_Standard_M45A1 = mod.CreateNewWeaponPackage();
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, SidearmPackage_Standard_M45A1);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, SidearmPackage_Standard_M45A1);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_5_Factory, SidearmPackage_Standard_M45A1);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_11rnd_Magazine, SidearmPackage_Standard_M45A1);

let SidearmPackage_Standard_P18 = mod.CreateNewWeaponPackage();
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, SidearmPackage_Standard_P18);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, SidearmPackage_Standard_P18);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_17rnd_Magazine, SidearmPackage_Standard_P18);
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_39_Factory, SidearmPackage_Standard_P18);

//-----------------------------------------------------------------------------------------------//

const cStoreData = [
    {
        tabName: mod.stringkeys.store.riflestab,
        tabRandomized: false,
        itemDatas: [
            new StoreItemDataWeapon({
                id: "gun_M4A1",
                name: mod.stringkeys.store.rifle1_1,
                cost: 2400,
                weapon: mod.Weapons.Carbine_M4A1,
                weaponPackage: carbinePackage_Basic_M4A1
            }),
            new StoreItemDataWeapon({
                id: "gun_AK4D",
                name: mod.stringkeys.store.rifle1_2,
                cost: 2400,
                weapon: mod.Weapons.Carbine_AK_205,
                weaponPackage: carbinePackage_Basic
            }),
            new StoreItemDataWeapon({
                id: "gun_KORD_6P67",
                name: mod.stringkeys.store.rifle3,
                cost: 2000,
                weapon: mod.Weapons.AssaultRifle_KORD_6P67,
                weaponPackage: assaultRiflePackage_Basic
            }),
            new StoreItemDataWeapon({
                id: "gun_TR-7",
                name: mod.stringkeys.store.rifle4,
                cost: 3000,
                weapon: mod.Weapons.AssaultRifle_TR_7,
                weaponPackage: assaultRiflePackage_Basic
            }),
            new StoreItemDataWeapon({
                id: "gun_M2010",
                name: mod.stringkeys.store.rifle5,
                cost: 3500,
                weapon: mod.Weapons.Sniper_M2010_ESR,
                weaponPackage: SniperPackage_Elite_M2010ESR
            }),
            new StoreItemDataWeapon({
                id: "gun_SV98",
                name: mod.stringkeys.store.rifle6,
                cost: 4000,
                weapon: mod.Weapons.Sniper_SV_98,
                weaponPackage: SniperPackage_Standard_SV_98
            })
        ]
    }, {
        tabName: mod.stringkeys.store.pistolstab,
        tabRandomized: false,
        itemDatas: [
            new StoreItemDataWeapon({
                id: "gun_P18",
                name: mod.stringkeys.store.pistol1_1,
                cost: 200,
                weapon: mod.Weapons.Sidearm_P18,
                weaponPackage: SidearmPackage_Standard_P18
            }),
            new StoreItemDataWeapon({
                id: "gun_m45a1",
                name: mod.stringkeys.store.pistol2,
                cost: 300,
                weapon: mod.Weapons.Sidearm_M45A1,
                weaponPackage: SidearmPackage_Standard_M45A1
            }),
            new StoreItemDataWeapon({
                id: "gun_es5.7",
                name: mod.stringkeys.store.pistol3,
                cost: 500,
                weapon: mod.Weapons.Sidearm_ES_57,
                weaponPackage: SidearmPackage_Standard_ES_57
            }),
            new StoreItemDataWeapon({
                id: "gun_m44",
                name: mod.stringkeys.store.pistol4,
                cost: 800,
                weapon: mod.Weapons.Sidearm_M44,
                weaponPackage: SidearmPackage_Standard_M44
            })
        ]
    }, {
        tabName: mod.stringkeys.store.shotgunstab,
        tabRandomized: false,
        itemDatas: [
            new StoreItemDataWeapon({
                id: "gun_m7a1",
                name: mod.stringkeys.store.shotgun1,
                cost: 1100,
                weapon: mod.Weapons.Shotgun_M87A1,
                weaponPackage: ShotgunPackage_Basic
            }),
            new StoreItemDataWeapon({
                id: "gun_m1014",
                name: mod.stringkeys.store.shotgun3,
                cost: 1800,
                weapon: mod.Weapons.Shotgun_M1014,
                weaponPackage: ShotgunPackage_Basic
            })
        ]
    }, {
        tabName: mod.stringkeys.store.grenadestab,
        tabRandomized: false,
        itemDatas: [
            new StoreItemDataGadget({
                id: "grenade_exlosive",
                name: mod.stringkeys.store.grenade1,
                cost: 1000,
                weapon: mod.Gadgets.Throwable_Mini_Frag_Grenade
            }),
            new StoreItemDataGadget({
                id: "grenade_incendiary",
                name: mod.stringkeys.store.grenade2,
                cost: 500,
                weapon: mod.Gadgets.Throwable_Incendiary_Grenade
            }),
            new StoreItemDataGadget({
                id: "grenade_smoke",
                name: mod.stringkeys.store.grenade3,
                cost: 200,
                weapon: mod.Gadgets.Throwable_Smoke_Grenade
            }),
            new StoreItemDataGadget({
                id: "grenade_flash",
                name: mod.stringkeys.store.grenade4,
                cost: 150,
                weapon: mod.Gadgets.Throwable_Flash_Grenade
            }),
        ]
    }, {
        tabName: mod.stringkeys.store.specialstab,
        tabRandomized: false,
        itemDatas: [
            new StoreItemDataWeapon({
                id: "gun_l110",
                name: mod.stringkeys.store.special1,
                cost: 3000,
                weapon: mod.Weapons.LMG_L110,
                weaponPackage: LMGPackage_Basic
            }),
            new StoreItemDataWeapon({
                id: "gun_kts100_mk8",
                name: mod.stringkeys.store.special2,
                cost: 3600,
                weapon: mod.Weapons.LMG_KTS100_MK8,
                weaponPackage: LMGPackage_Basic
            }),
            new StoreItemDataGadget({
                id: "special_rpg7",
                name: mod.stringkeys.store.special4,
                cost: 2000,
                weapon: mod.Gadgets.Launcher_Unguided_Rocket
            }),
            new StoreItemDataGadget({
                id: "special_defibrillator",
                name: mod.stringkeys.store.special5,
                cost: 1000,
                weapon: mod.Gadgets.Misc_Defibrillator
            }),
        ]
    }
];

function getTabIndexForItemData(itemData: any) {
    for (let i = 0; i < cStoreData.length; i++) {
        for (let j = 0; j < cStoreData[i].itemDatas.length; j++) {
            if (cStoreData[i].itemDatas[j] == itemData)
                return i;
        }
    }
    return -1;
}




//-----------------------------------------------------------------------------------------------//

class Store {
    #jsPlayer: JsPlayer;
    #storeData: Dict;
    #rootWidget: mod.UIWidget|undefined;


    #storeWidth = 1200;
    #storeHeight = 600;
    #headerHeight = 60;
    #tabHeight = 50;
    #tabSpacing = 10;
    #tabNamePrefix = "__tab";
    #currentTabIndex = 0;
    #activeTabBgColor = [0.44, 0.42, 0.4];
    #inactiveTabBgColor = [0.34, 0.32, 0.3];
    #itemSize = 250;
    #itemSizeH = 250;
    #itemSizeV = 166;
    #itemSpacingHorizontal = 20;
    #itemSpacingVertical = 20;
    #closeButtonName = "__close";

    #tabWidgets: Widget[] = [];   // UIWidgets, in order by cStoreData[]
    #itemButtons: { [key: string] : any } = {};  // ItemButton objects, keyed by itemDatas.id

    #isStoreVisible = false;

    constructor(jsPlayer: JsPlayer, storeData: any) {
        this.#jsPlayer = jsPlayer;
        this.#storeData = storeData;
    }

    open() {
        if (!this.#rootWidget) {
            console.log("Open shop UI for ", this.#jsPlayer.player, " with ID: ", this.#jsPlayer.playerId);
            this.#create();
        }
        if (!this.#rootWidget)
            return;
        this.refresh();
        mod.EnableUIInputMode(true, this.#jsPlayer.player);
        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isStoreVisible = true;
        this.#jsPlayer.updateWalletUI();
    }

    close() {
        mod.EnableUIInputMode(false, this.#jsPlayer.player);
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isStoreVisible = false;

        } else {
            console.log("Store not yet opened for this player.")
        }
    }

    isOpen() {
        return this.#isStoreVisible;
    }

    onUIButtonEvent(widget: Widget, event: any) {
        
        let widgetName = mod.GetUIWidgetName(widget);
        //console.log("Clicked on ", widgetName);
        // click on a tab?
        if (widgetName.slice(0, this.#tabNamePrefix.length) == this.#tabNamePrefix) {
            //mod.TriggerAudio( mod.SoundEvents2D.ShowObjective, this.#jsPlayer.player);
            let tabIndex = parseInt(widgetName.slice(this.#tabNamePrefix.length));
            this.selectTab(tabIndex);
        }
        // close button?
        if (widgetName == this.#closeButtonName) {
            //mod.TriggerAudio( mod.SoundEvents2D.ObjectiveCappingStop, this.#jsPlayer.player);
            this.close();
            //tell everyone you closed your store. 
        }
        // click on a store item:
        if (this.#itemButtons.hasOwnProperty(widgetName)) {
            //mod.TriggerAudio( mod.SoundEvents2D.ObjectiveCappingComplete, this.#jsPlayer.player);
            // call the buy callback:
            let itemData = this.#itemButtons[widgetName].itemData;
            itemData.onBuyCallback?.(this.#jsPlayer, itemData);
            this.#jsPlayer.itemBuysPerRound[itemData.id] = (this.#jsPlayer.itemBuysPerRound[itemData.id] || 0) + 1;
            this.refresh();
            this.#jsPlayer.player
            mod.SetScoreboardPlayerValues(this.#jsPlayer.player, this.#jsPlayer.kills, this.#jsPlayer.deaths, this.#jsPlayer.totalCashEarned, this.#jsPlayer.totalCashEarned - this.#jsPlayer.cash + initialCash, 0)
        }


    }

    selectTab(tabIndex: number) {
        
        
        if (tabIndex < 0 || tabIndex >= this.#tabWidgets.length || tabIndex == this.#currentTabIndex) {
            console.log("TabIndex is invalid ", tabIndex, " There are ", this.#tabWidgets, " tabs");
            return;
        }

        // turn off the old one:
        mod.SetUIWidgetVisible(this.#tabWidgets[this.#currentTabIndex], false);
        // turn on the new one:
        this.#currentTabIndex = tabIndex;
        mod.SetUIWidgetVisible(this.#tabWidgets[this.#currentTabIndex], true);


    }

    refresh() {
        if (this.#rootWidget) {
            // refresh all store items:
            for (const id in this.#itemButtons) {
                this.#itemButtons[id].refresh();
            }
        } else {
            console.log("Store not yet opened for this player.")
        }
    }

    #create() {
        // background:
        this.#rootWidget = ParseUI({
            type: "Container",
            size: [this.#storeWidth, this.#storeHeight],
            position: [0, 40],
            anchor: mod.UIAnchor.Center,
            bgFill: mod.UIBgFill.Solid,
            bgColor: this.#activeTabBgColor,
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [{
                type: "Container",
                position: [0, -this.#headerHeight],
                size: [this.#storeWidth, this.#headerHeight],
                anchor: mod.UIAnchor.TopLeft,
                bgFill: mod.UIBgFill.Solid,
                bgColor: [0.1, 0.1, 0.1],
                bgAlpha: 1
            }, {
                // close button:
                type: "Button",
                name: this.#closeButtonName,
                size: [this.#headerHeight - 16, this.#headerHeight - 16],
                position: [8, 8 - this.#headerHeight],
                anchor: mod.UIAnchor.TopRight,
                bgFill: mod.UIBgFill.Solid,
                bgColor: [1, 0.3, 0.3],
                bgAlpha: 1
            }, {
                // close button X:
                type: "Text",
                parent: this.#closeButtonName,
                size: [this.#headerHeight - 16, this.#headerHeight - 16],
                position: [8, 8 - this.#headerHeight],
                anchor: mod.UIAnchor.TopRight,
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                textLabel: MakeMessage(mod.stringkeys.store.closeStore),
                textSize: 50
            }]
        });

        // tabs:
        this.#createTabs();
    }

    #createTabs() {
        // how many tabs are there?
        let tabDatas = this.#storeData;
        let tabCnt = tabDatas.length;
        // tab size, clamped if there's only a few tabs:
        let widthForTabs = this.#storeWidth - this.#tabSpacing * 2 - this.#headerHeight;
        let tabWidth = Math.min(250, widthForTabs / (tabCnt + 1));
        for (let a = 0; a < tabCnt; a++)
            this.#createTab(a, tabWidth, tabDatas[a]);
    }

    #createTab(tabIndex: number, tabWidth: number, tabData: any) {
        //console.log("Create Tab ", tabIndex);
        let headerPosition = [this.#tabSpacing + tabIndex * tabWidth, -this.#tabHeight];
        let headerSize = [tabWidth - 10, this.#tabHeight];
        // tab header bg.  not part of the tab / always shown:
        ParseUI({
            type: "Button",
            name: this.#tabNamePrefix + tabIndex,
            parent: this.#rootWidget,
            position: headerPosition,
            size: headerSize,
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.OutlineThick,
            bgColor: this.#inactiveTabBgColor,
            //bgColor: [1,0,0],
            bgAlpha: 1
        });

        // tab container.  this is the part that turns on and off:
        let tabWidget = ParseUI({
            type: "Container",
            visible: (tabIndex == 0),
            parent: this.#rootWidget,
            size: [this.#storeWidth, this.#headerHeight],
            bgFill: mod.UIBgFill.None,
            children: [
                {   // selected header outline if active:
                    type: "Container",
                    position: headerPosition,
                    size: headerSize,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: this.#activeTabBgColor,
                    bgAlpha: 0.25
                }
            ]
        });
        if (!tabWidget)
            return;
        this.#tabWidgets.push(tabWidget);
        this.#createItems(tabIndex, tabData.itemDatas, tabData.tabRandomized);

        // header label.  not part of the tab / always shown.  after the tab so it gets drawn on top.
        ParseUI({
            type: "Text",
            parent: this.#rootWidget,
            position: headerPosition,
            size: headerSize,
            bgFill: mod.UIBgFill.None,
            textLabel: tabData.tabName,
            textSize: 30,
            textAnchor: mod.UIAnchor.Center,
            textColor: [1, 0.9, 0.8]
        });
    }

    #createItems(tabIndex: number, itemDatas: any[], randomize: boolean) {
        let itemCount = itemDatas.length;
        let maxItems = 12;
        let selectedItems: any[] = [];

        if (itemCount < maxItems) {
            maxItems = itemCount;
        }

        let isItemFiltered = function (jsPlayer: JsPlayer, itemData: any) {
            if (jsPlayer.isDeployed == false)
                return true;

            try {
                return itemData.hasOwnProperty("filter_weapon") && !mod.HasEquipment(jsPlayer.player, itemData.filter_weapon);
            } catch (e) {
                console.log("HasInventory exception: " + e);
                return true;
            }
            return false;
        }

        if (randomize == true) {
            let isItemRandomized = function (itemData: any) {
                return !itemData.hasOwnProperty("itemRandomized") || itemData.itemRandomized == true;
            }
            // get all the non-randomized items first:
            let nonRandomCount = 0;
            for (let itemIndex = 0; itemIndex < itemCount; ++itemIndex) {
                if (!isItemRandomized(itemDatas[itemIndex])) {
                    this.#createItem(tabIndex, itemDatas[itemIndex], itemIndex);
                    nonRandomCount++;
                }
            }

            // add randomized items:
            for (let itemIndex = nonRandomCount; itemIndex < maxItems; ++itemIndex) {
                let randomItem = Math.floor(Math.random() * itemCount);

                if (selectedItems.includes(randomItem) || !isItemRandomized(itemDatas[randomItem])) {
                    itemIndex--;
                } else {
                    this.#createItem(tabIndex, itemDatas[randomItem], itemIndex);
                    selectedItems.push(randomItem)
                }
            }
        } else {
            //console.log("Create ", itemCount, " non-random items");
            let itemsCreated = 0;
            for (let itemIndex = 0; itemIndex < itemCount; ++itemIndex) {
                this.#createItem(tabIndex, itemDatas[itemIndex], itemsCreated++);
                //console.log("Item Created")
            }
        }
    }

    #createItem(tabIndex: number, itemData: any, itemIndex: number) {
        let yi = Math.floor(itemIndex / 4);
        let xi = Math.floor(itemIndex % 4);
        let x = 50 + (1 + xi) * this.#itemSpacingHorizontal + xi * this.#itemSizeH;
        let y = (1 + yi) * this.#itemSpacingVertical + yi * this.#itemSizeV;
        let itemPos = [x, y];
        this.#itemButtons[itemData.id] = new ItemButton(this.#jsPlayer, this.#tabWidgets[tabIndex], tabIndex, itemData, itemPos, this.#itemSize, this.#itemSizeH, this.#itemSizeV);
    }

    rerollTabItems(tabIndex: number) {
        this.#deleteTabItems(tabIndex);
        let tabData = this.#storeData[tabIndex];
        this.#createItems(tabIndex, tabData.itemDatas, tabData.tabRandomized);
    }

    #deleteTabItems(tabIndex: number) {
        for (const id in this.#itemButtons) {
            if (this.#itemButtons[id].tabIndex == tabIndex) {
                this.#itemButtons[id].destroy();
                delete this.#itemButtons[id];
            }
        }
    }

    autoBuyRandom() {
        let itemKeys = Object.keys(this.#itemButtons);
        let rnd = GetRandomInt(itemKeys.length);
        debugger;
        let itemData = this.#itemButtons[itemKeys[rnd]].itemData;
        itemData.onBuyCallback?.(this.#jsPlayer, itemData);
    }
}


//-----------------------------------------------------------------------------------------------//

class ItemButton {
    #jsPlayer;
    #itemBgColor = [0.9, 0.6, 0.4];
    tabIndex;
    itemData;
    #isDisabled;
    #widget: mod.UIWidget|undefined;
    #widgetButton: mod.UIWidget|undefined;
    #widgetCost: mod.UIWidget|undefined;
    #widgetCostName = "__cost";
    #widgetDisabled: mod.UIWidget|undefined;
    #widgetDisabledName = "__disabled";

    constructor(jsPlayer: JsPlayer, parentWidget: Widget, tabIndex: number, itemData: any, position: any, itemSize: number, itemSizeH: number, itemSizeV: number) {
        this.#jsPlayer = jsPlayer;
        this.tabIndex = tabIndex;
        this.itemData = itemData;
        let size = [itemSizeH, itemSizeV];
        let disabledMsg = itemData.getDisabledMessageCallback?.(jsPlayer, itemData);
        this.#isDisabled = disabledMsg != null;
        let canAffordIt = this.itemData.canAffordIt(this.#jsPlayer, this.itemData);
        this.#widget = ParseUI({
            type: "Container",
            parent: parentWidget,
            position: position,
            size: size,
            bgFill: mod.UIBgFill.None,
            playerID: jsPlayer.player,
            children: [
                {
                    type: "Button",
                    name: itemData.id,
                    size: size,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: this.#itemBgColor,
                    bgAlpha: 1,
                    buttonEnabled: !this.#isDisabled && canAffordIt
                }, {
                    type: "Text",
                    size: [itemSize, 100],
                    anchor: mod.UIAnchor.TopCenter,
                    bgFill: mod.UIBgFill.None,
                    textLabel: itemData.name,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 20,
                }, {
                    type: "Text",
                    name: this.#widgetCostName,
                    anchor: mod.UIAnchor.BottomRight,
                    bgFill: mod.UIBgFill.None,
                    textLabel: MakeMessage(mod.stringkeys.store.costFmt, itemData.cost),
                    textAnchor: mod.UIAnchor.BottomRight,
                    textColor: canAffordIt ? [1, 1, 1] : [1, 0, 0],
                    textSize: 30,
                }, {
                    type: "Text",
                    name: this.#widgetDisabledName,
                    visible: this.#isDisabled,
                    size: size,
                    padding: 10,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [0.25, 0.25, 0.25],
                    bgAlpha: 0.8,
                    textLabel: disabledMsg ?? mod.stringkeys.store.disabledMsg.locked,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 30,
                    textAlpha: 1
                }
            ]
        });

        
        if (!this.#widget)
            return;
        
        if (itemData instanceof StoreItemDataWeapon) {
            console.log("Create Image for weapon: ", itemData.name);
            mod.AddUIWeaponImage(itemData.name, ZEROVEC, mod.CreateVector(size[0], size[1], 1), mod.UIAnchor.Center, itemData.weapon, this.#widget);
        }
        else if (itemData instanceof StoreItemDataGadget) {
            console.log("Create Image for Gadget: ", itemData.name);
            mod.AddUIGadgetImage(itemData.name, ZEROVEC, mod.CreateVector(size[0] * 0.7, size[1] * 0.7, 1), mod.UIAnchor.Center, itemData.weapon, this.#widget);
        }
        
        this.#widgetButton = mod.FindUIWidgetWithName(itemData.id, this.#widget);
        this.#widgetCost = mod.FindUIWidgetWithName(this.#widgetCostName, this.#widget);
        this.#widgetDisabled = mod.FindUIWidgetWithName(this.#widgetDisabledName, this.#widget);
        this.refresh();
    }

    destroy() {
        if (!this.#widget)
            return;
        mod.DeleteUIWidget(this.#widget);
    }

    refresh() {
        if (!this.#widgetCost || !this.#widgetButton || !this.#widgetDisabled)
            return;
        // price change ?
        mod.SetUITextLabel(this.#widgetCost, MakeMessage(mod.stringkeys.store.costFmt, this.itemData.cost));
        // disabled?
        let wasDisabled = this.#isDisabled;
        let disabledMsg = this.itemData.getDisabledMessageCallback?.(this.#jsPlayer, this.itemData);
        let isDisabled = disabledMsg != null;
        // has it changed?
        if (wasDisabled !== isDisabled) {
            this.#isDisabled = isDisabled;
            mod.SetUIButtonEnabled(this.#widgetButton, !isDisabled);
            mod.SetUIWidgetVisible(this.#widgetDisabled, isDisabled);
            if (disabledMsg) {
                if (typeof (disabledMsg) === "string")
                    disabledMsg = MakeMessage(disabledMsg);
                mod.SetUITextLabel(this.#widgetDisabled, disabledMsg as mod.Message);
            }
        }

        // update if you can afford it?
        let canAffordIt = this.itemData.canAffordIt(this.#jsPlayer, this.itemData);
        if (!isDisabled)
            mod.SetUIButtonEnabled(this.#widgetButton, canAffordIt);
        mod.SetUITextColor(this.#widgetCost, canAffordIt ? mod.CreateVector(1, 1, 1) : mod.CreateVector(1, 0, 0));
    }
}


//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Helper functions to create UI from a JSON object tree:
//-----------------------------------------------------------------------------------------------//

type UIVector = mod.Vector | number[];

interface UIParams {
    name: string;
    type: string;
    position: any;
    size: any;
    anchor: mod.UIAnchor;
    parent: mod.UIWidget;
    visible: boolean;
    textLabel: string;
    textColor: UIVector;
    textAlpha: number;
    textSize: number;
    textAnchor: mod.UIAnchor;
    padding: number;
    bgColor: UIVector;
    bgAlpha: number;
    bgFill: mod.UIBgFill;
    imageType: mod.UIImageType;
    imageColor: UIVector;
    imageAlpha: number;
    teamId?: mod.Team;
    playerId?: mod.Player;
    children?: any[];
    buttonEnabled: boolean;
    buttonColorBase: UIVector;
    buttonAlphaBase: number;
    buttonColorDisabled: UIVector;
    buttonAlphaDisabled: number;
    buttonColorPressed: UIVector;
    buttonAlphaPressed: number;
    buttonColorHover: UIVector;
    buttonAlphaHover: number;
    buttonColorFocused: UIVector;
    buttonAlphaFocused: number;
}

function __asModVector(param: number[]|mod.Vector) {
    if (Array.isArray(param))
        return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
    else
        return param;
}

function __asModMessage(param: string|mod.Message) {
    if (typeof (param) === "string")
        return mod.Message(param);
    return param;
}

function __fillInDefaultArgs(params: UIParams) {
    if (!params.hasOwnProperty('name'))
        params.name = "";
    if (!params.hasOwnProperty('position'))
        params.position = mod.CreateVector(0, 0, 0);
    if (!params.hasOwnProperty('size'))
        params.size = mod.CreateVector(100, 100, 0);
    if (!params.hasOwnProperty('anchor'))
        params.anchor = mod.UIAnchor.TopLeft;
    if (!params.hasOwnProperty('parent'))
        params.parent = mod.GetUIRoot();
    if (!params.hasOwnProperty('visible'))
        params.visible = true;
    if (!params.hasOwnProperty('padding'))
        params.padding = (params.type == "Container") ? 0 : 8;
    if (!params.hasOwnProperty('bgColor'))
        params.bgColor = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('bgAlpha'))
        params.bgAlpha = 0.5;
    if (!params.hasOwnProperty('bgFill'))
        params.bgFill = mod.UIBgFill.Solid;
}

function __setNameAndGetWidget(uniqueName: any, params: any) {
    let widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
    mod.SetUIWidgetName(widget, params.name);
    return widget;
}

const __cUniqueName = "----uniquename----";

function __addUIContainer(params: UIParams) {
    __fillInDefaultArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIContainer(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            restrict);
    } else {
        mod.AddUIContainer(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill);
    }
    let widget = __setNameAndGetWidget(__cUniqueName, params);
    if (params.children) {
        params.children.forEach((childParams: any) => {
            childParams.parent = widget;
            __addUIWidget(childParams);
        });
    }
    return widget;
}

function __fillInDefaultTextArgs(params: UIParams) {
    if (!params.hasOwnProperty('textLabel'))
        params.textLabel = "";
    if (!params.hasOwnProperty('textSize'))
        params.textSize = 0;
    if (!params.hasOwnProperty('textColor'))
        params.textColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('textAlpha'))
        params.textAlpha = 1;
    if (!params.hasOwnProperty('textAnchor'))
        params.textAnchor = mod.UIAnchor.CenterLeft;
}

function __addUIText(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultTextArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIText(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            __asModMessage(params.textLabel),
            params.textSize,
            __asModVector(params.textColor),
            params.textAlpha,
            params.textAnchor,
            restrict);
    } else {
        mod.AddUIText(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            __asModMessage(params.textLabel),
            params.textSize,
            __asModVector(params.textColor),
            params.textAlpha,
            params.textAnchor);
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultImageArgs(params: any) {
    if (!params.hasOwnProperty('imageType'))
        params.imageType = mod.UIImageType.None;
    if (!params.hasOwnProperty('imageColor'))
        params.imageColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('imageAlpha'))
        params.imageAlpha = 1;
}

function __addUIImage(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultImageArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIImage(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.imageType,
            __asModVector(params.imageColor),
            params.imageAlpha,
            restrict);
    } else {
        mod.AddUIImage(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.imageType,
            __asModVector(params.imageColor),
            params.imageAlpha);
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultArg(params: any, argName: any, defaultValue: any) {
    if (!params.hasOwnProperty(argName))
        params[argName] = defaultValue;
}

function __fillInDefaultButtonArgs(params: any) {
    if (!params.hasOwnProperty('buttonEnabled'))
        params.buttonEnabled = true;
    if (!params.hasOwnProperty('buttonColorBase'))
        params.buttonColorBase = mod.CreateVector(0.7, 0.7, 0.7);
    if (!params.hasOwnProperty('buttonAlphaBase'))
        params.buttonAlphaBase = 1;
    if (!params.hasOwnProperty('buttonColorDisabled'))
        params.buttonColorDisabled = mod.CreateVector(0.2, 0.2, 0.2);
    if (!params.hasOwnProperty('buttonAlphaDisabled'))
        params.buttonAlphaDisabled = 0.5;
    if (!params.hasOwnProperty('buttonColorPressed'))
        params.buttonColorPressed = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('buttonAlphaPressed'))
        params.buttonAlphaPressed = 1;
    if (!params.hasOwnProperty('buttonColorHover'))
        params.buttonColorHover = mod.CreateVector(1,1,1);
    if (!params.hasOwnProperty('buttonAlphaHover'))
        params.buttonAlphaHover = 1;
    if (!params.hasOwnProperty('buttonColorFocused'))
        params.buttonColorFocused = mod.CreateVector(1,1,1);
    if (!params.hasOwnProperty('buttonAlphaFocused'))
        params.buttonAlphaFocused = 1;
}

function __addUIButton(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultButtonArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIButton(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.buttonEnabled,
            __asModVector(params.buttonColorBase), params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled), params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed), params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover), params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused), params.buttonAlphaFocused,
            restrict);
    } else {
        mod.AddUIButton(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.buttonEnabled,
            __asModVector(params.buttonColorBase), params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled), params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed), params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover), params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused), params.buttonAlphaFocused);
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __addUIWidget(params: UIParams) {
    if (params == null)
        return undefined;
    if (params.type == "Container")
        return __addUIContainer(params);
    else if (params.type == "Text")
        return __addUIText(params);
    else if (params.type == "Image")
        return __addUIImage(params);
    else if (params.type == "Button")
        return __addUIButton(params);
    return undefined;
}

export function ParseUI(...params: any[]) {
    let widget: mod.UIWidget|undefined;
    for (let a = 0; a < params.length; a++) {
        widget = __addUIWidget(params[a] as UIParams);
    }
    return widget;
}
