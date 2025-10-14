
const debugJSPlayer = true;
const debugTeam: boolean = false; // DISABLE BEFORE SHARING

//////////////////// TEST VARIABLES ///////////////////
const CaptureTimeRequired = 20;
let CaptureProgress = 0;

var CaptureM: CaptureManager;
let HasBeenCaptured = false;

enum CaptureState {
    Idle,
    Capturing,
    Contested,
    Victory
}

let CurrentCaptureState: CaptureState = CaptureState.Idle;

var NormalizedGameTime = 0;
var GameModeProgressThresholds = [0.05, 0.2, 0.4, 0.65, 0.9, 1];

//////////////////////// Starting HQ ObjId ////////////////////////
let Team1CurrentHQ = 1;
let Team2CurrentHQ = 4;
let Team3CurrentHQ = 7;
let Team4CurrentHQ = 10;

//////////////////// CHECKPOINT VFX VECTORS /////////////////////////
let T1CP1L: mod.Vector = mod.CreateVector(9.7, 230.5, 107.5);
let T1CP1R: mod.Vector = mod.CreateVector(20, 230.5, 107.5);
let T1CP2L: mod.Vector = mod.CreateVector(111, 312.4, 101);
let T1CP2R: mod.Vector = mod.CreateVector(111.3, 312.5, 112.4);

let T2CP1L: mod.Vector = mod.CreateVector(96.8, 230.5, 114.2);
let T2CP1R: mod.Vector = mod.CreateVector(96.8, 230.5, 125.7);
let T2CP2L: mod.Vector = mod.CreateVector(111.6, 312.4, 197.6);
let T2CP2R: mod.Vector = mod.CreateVector(111.4, 312.4, 209.2);

let T3CP1L: mod.Vector = mod.CreateVector(89.6, 230.5, 201.8);
let T3CP1R: mod.Vector = mod.CreateVector(78.1, 230.5, 201.8);
let T3CP2L: mod.Vector = mod.CreateVector(-12.8, 312.4, 206.8);
let T3CP2R: mod.Vector = mod.CreateVector(-12.8, 312.4, 195.3);

let T4CP1L: mod.Vector = mod.CreateVector(2.1, 230.5, 195);
let T4CP1R: mod.Vector = mod.CreateVector(2.1, 230.5, 183.5);
let T4CP2L: mod.Vector = mod.CreateVector(-12.4, 312.4, 111);
let T4CP2R: mod.Vector = mod.CreateVector(-12.4, 312.4, 99.5);

let CapturePointLocation: mod.Vector = mod.CreateVector(49, 327, 153);
///////////////////////////////////////////////
let team1Count: number = 0;
let team2Count: number = 0;
let team3Count: number = 0;
let team4Count: number = 0;

let gameOver = false;
let vehicleSpawners: number[] = [];
let vehicleListTable: mod.VehicleList[] = [mod.VehicleList.Abrams, mod.VehicleList.Eurocopter, mod.VehicleList.Quadbike];
let weaponSpawners: any[] = [];


let capturePointObjective: mod.CapturePoint;

let hazardSpawn1: number;
let hazardSpawn2: number;
let hazardSpawn3: number;
let hazards: mod.VehicleSpawner[] = [];
let hazardpt1_1_1: mod.Vector = mod.CreateVector(-30.885, 132.6, -37.858);
let hazardpt1_1_2: mod.Vector = mod.CreateVector(-32.693, 134.875, -29.312);
let hazardpt1_1_3: mod.Vector = mod.CreateVector(-38, 136.05, -24.58);
let hazardpt1_2_1: mod.Vector = mod.CreateVector(-89.573, 158, -3.817);
let hazardpt1_2_2: mod.Vector = mod.CreateVector(-113.955, 161.979, -12.315);

let hazardpt2_1_1: mod.Vector = mod.CreateVector(-103.183, 131.075, -73.018);
let hazardpt2_1_2: mod.Vector = mod.CreateVector(-94.65, 133.783, -79.229);
let hazardpt2_1_3: mod.Vector = mod.CreateVector(-88.113, 134.654, -79.229);
let hazardpt2_2_1: mod.Vector = mod.CreateVector(-39.375, 152.541, -76.201);
let hazardpt2_2_2: mod.Vector = mod.CreateVector(-45.539, 162.643, -30.805);
let hazardpt2_2_3: mod.Vector = mod.CreateVector(-42.494, 165.173, -15.803);
let hazardpt2_2_4: mod.Vector = mod.CreateVector(-50.072, 169.131, -1.931);

let hazardpt1Cooldown: number = 0;

let heliTrigger1Spawner: mod.Vector = mod.CreateVector(-73.5, 170, -67.4);
let heliTrigger2Spawner: mod.Vector = mod.CreateVector(-55.5, 170, -70.4);
let heliTrigger3Spawner: mod.Vector = mod.CreateVector(-85.3, 170, -67.5);
let victoryPt: mod.Vector = mod.CreateVector(-86, 176, -43.5);
let lobbySpawnPt: mod.Vector = mod.CreateVector(52, 307.5, 17);

let initialPlayerCount: number = 0;
let combatCountdownStarted = false;
let combatStartDelayRemaining = 30;
let combatStarted = false;

let deathYPos: number = 160;
let messageTime: number = 0;

// UI
let headerWidget: mod.UIWidget;

type Widget= mod.UIWidget;

const onlyUpTeleportID: number = 1;
const quadBikeSpawnerInteract1: number = 8;
const quadBikeSpawnerInteract2: number = 17;
const quadBikeSpawnerInteract3: number = 18;
const quadBikeSpawnerInteract4: number = 19;

const ammoResupplyID: number = 11;
const team1HQ2Teleport: number = 12;
const team1Checkpoint1ID: number = 13;
const team2Checkpoint1ID: number = 14;
const team4Checkpoint1ID: number = 15;
const team3Checkpoint1ID: number = 16;
const team2HQ2Teleport: number = 21;
const team3HQ2Teleport: number = 22;
const team4HQ2Teleport: number = 23;
const startInteractPointID: number = 25;
const minimumInitialPlayerCount: number = 4;
const BLACKCOLOR: number[] = [1, 1, 1];
const REDCOLOR: number[] = [1, 0, 0];

const team1HQ1: number = 1;
const team2HQ1: number = 2;
const team3HQ1: number = 3;
const team4HQ1: number = 4;

const team1HQ2: number = 5;
const team2HQ2: number = 8;
const team3HQ2: number = 7;
const team4HQ2: number = 6;

const messageRemainTime: number = 2;

let vfxidx = 0;

const AlarmSFX = mod.RuntimeSpawn_Common.SFX_Alarm;

const vfxtest = [
    mod.RuntimeSpawn_Common.FX_BASE_Fire_L,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_M,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_M_NoSmoke,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_Oil_Medium,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_S,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_S_NoSmoke,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_XL,
]

export function OngoingGlobal() {
    NormalizedGameTime = mod.GetMatchTimeElapsed() / mod.GetRoundTime()
    //CaptureM.CheckGameModeProgressThreshold();
    //console.log(`Elapsed Time: ${mod.GetMatchTimeElapsed()} Remaining Time: ${mod.GetMatchTimeRemaining()} Normalized: ${RemainingTime}`);
}

///////////////////// Custom Capture Point //////////////////////////////

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    //CapturePoint
    if (mod.GetObjId(eventAreaTrigger) === 21) {
        CaptureM.AddPlayerToList(eventPlayer);

    //Team 1 CheckPoints
    } else if (mod.GetObjId(eventAreaTrigger) === 22 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 1) {
        if (Team1CurrentHQ === 1) {
            console.log("Activating Team 1 CheckPoint 1");
            mod.EnableHQ(mod.GetHQ(1), false);
            mod.EnableHQ(mod.GetHQ(2), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team1Checkpoint1Activated), BLACKCOLOR);
            Team1CurrentHQ = 2;
        } else {
            console.log("Check point already active");
        }
    } else if (mod.GetObjId(eventAreaTrigger) === 23 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 1) {
        if (Team1CurrentHQ === 1 || Team1CurrentHQ === 2) {
            console.log("Activating Team 1 CheckPoint 2");
            mod.EnableHQ(mod.GetHQ(1), false);
            mod.EnableHQ(mod.GetHQ(2), false);
            mod.EnableHQ(mod.GetHQ(3), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team1Checkpoint2Activated), BLACKCOLOR);
            Team1CurrentHQ = 3;
        } else {
            console.log("Check point already active");
        }

    //Team 2 CheckPoints
    } else if (mod.GetObjId(eventAreaTrigger) === 24 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 2) {
        if (Team2CurrentHQ === 4) {
            console.log("Activating Team 2 CheckPoint 1");
            mod.EnableHQ(mod.GetHQ(4), false);
            mod.EnableHQ(mod.GetHQ(5), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team2Checkpoint1Activated), BLACKCOLOR);
            Team2CurrentHQ = 5;
        } else {
            console.log("Check point already active");
        }
    } else if (mod.GetObjId(eventAreaTrigger) === 25 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 2) {
        if (Team2CurrentHQ === 4 || Team2CurrentHQ === 5) {
            console.log("Activating Team 2 CheckPoint 2");
            mod.EnableHQ(mod.GetHQ(4), false);
            mod.EnableHQ(mod.GetHQ(5), false);
            mod.EnableHQ(mod.GetHQ(6), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team2Checkpoint2Activated), BLACKCOLOR);
            Team2CurrentHQ = 6;
        } else {
            console.log("Check point already active");
        }

    //Team 3 CheckPoints
    } else if (mod.GetObjId(eventAreaTrigger) === 26 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 3) {
        if (Team3CurrentHQ === 7) {
            console.log("Activating Team 3 CheckPoint 1");
            mod.EnableHQ(mod.GetHQ(7), false);
            mod.EnableHQ(mod.GetHQ(8), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team3Checkpoint1Activated), BLACKCOLOR);
            Team3CurrentHQ = 8;
        } else {
            console.log("Check point already active");
        }

    } else if (mod.GetObjId(eventAreaTrigger) === 27 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 3) {
        if (Team3CurrentHQ === 7 || Team3CurrentHQ === 8) {
            console.log("Activating Team 3 CheckPoint 2");
            mod.EnableHQ(mod.GetHQ(7), false);
            mod.EnableHQ(mod.GetHQ(8), false);
            mod.EnableHQ(mod.GetHQ(9), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team3Checkpoint2Activated), BLACKCOLOR);
            Team3CurrentHQ = 9;
        } else {
            console.log("Check point already active");
        }

    //Team 4 CheckPoints
    } else if (mod.GetObjId(eventAreaTrigger) === 28 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 4) {
        if (Team4CurrentHQ === 10) {
            console.log("Activating Team 4 CheckPoint 1");
            mod.EnableHQ(mod.GetHQ(10), false);
            mod.EnableHQ(mod.GetHQ(11), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team4Checkpoint1Activated), BLACKCOLOR);
            Team4CurrentHQ = 11;
        } else {
            console.log("Check point already active");
        }

    } else if (mod.GetObjId(eventAreaTrigger) === 29 && mod.GetObjId(mod.GetTeam(eventPlayer)) === 4) {
        if (Team4CurrentHQ === 10 || Team4CurrentHQ === 11) {
            console.log("Activating Team 4 CheckPoint 2");
            mod.EnableHQ(mod.GetHQ(10), false);
            mod.EnableHQ(mod.GetHQ(11), false);
            mod.EnableHQ(mod.GetHQ(12), true);
            MessageAllUI(MakeMessage(mod.stringkeys.team4Checkpoint2Activated), BLACKCOLOR);
            Team4CurrentHQ = 12;
        } else {
            console.log("Check point already active");
        }
    }
}


export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (mod.GetObjId(eventAreaTrigger) === 21) {
        CaptureM.RemovePlayerFromList(eventPlayer);
    }
}

class CaptureManager {
    CaptureProgress = CaptureTimeRequired;
    CurrentState: CaptureState = CaptureState.Idle;
    IsBeingCaptured = false;
    CurrentTeam: number | null = null;
    CapturingTeam: number | null = null;
    CollidingPlayers: mod.Player[] = [];

    async StartCaptureTimer() {
        while (!HasBeenCaptured) {
            const teamsPresent = this.GetUniqueTeams(this.CollidingPlayers);
            this.CheckGameModeProgressThreshold();

            if (teamsPresent.length === 0) {
                CurrentCaptureState = CaptureState.Idle;

            } else if (teamsPresent.length === 1) {
                this.CurrentTeam = mod.GetObjId(mod.GetTeam(this.CollidingPlayers[0]));
                console.log("CurrentTeam set: " + this.CurrentTeam);

                if (this.CapturingTeam === null) {
                    this.CapturingTeam = this.CurrentTeam;
                    CurrentCaptureState = CaptureState.Capturing;
                } else if (this.CapturingTeam === this.CurrentTeam) {
                    CurrentCaptureState = CaptureState.Capturing;
                } else {
                    this.CapturingTeam = this.CurrentTeam;
                    CaptureProgress = CaptureTimeRequired;
                    CurrentCaptureState = CaptureState.Capturing;
                }

            } else {
                CurrentCaptureState = CaptureState.Contested;
            }

            switch (CurrentCaptureState) {
                case CaptureState.Idle:
                    CaptureProgress = CaptureTimeRequired;
                    this.CapturingTeam = null;
                    this.IsBeingCaptured = false;
                    //this.ToggleAlarmSFX();
                    //console.log("IDLE, time left: " + CaptureProgress);
                    break;

                case CaptureState.Capturing:
                    CaptureProgress--;
                    this.IsBeingCaptured = true;
                    //this.ToggleAlarmSFX();
                    //this.CurrentTeam = mod.GetTeam(this.CollidingPlayers[0]);
                    //console.log("CAPTURING, time left: " + CaptureProgress);
                    MessageAllUI(MakeMessage(mod.stringkeys.CaptureTimerCountdown, this.CurrentTeam, CaptureProgress), REDCOLOR);
                    break;

                case CaptureState.Contested:
                    //console.log("CONTESTED, time left: " + CaptureProgress);
                    MessageAllUI(MakeMessage(mod.stringkeys.CaptureTimerInterrupted), REDCOLOR);
                    break;
            }

            if (CaptureProgress <= 0) {
                CurrentCaptureState = CaptureState.Victory;
                HasBeenCaptured = true;
                console.log("VICTORY");
                this.TriggerVictory(mod.GetTeam(this.CollidingPlayers[0]));
                //this.TriggerVictory(this.CollidingPlayers[0]);
            }

            //console.log("Tick 1s");
            await mod.Wait(1);
        }
    }

    async CheckGameModeProgressThreshold() {
        for (let i = 0; i < GameModeProgressThresholds.length; i++) {
            if (NormalizedGameTime >= GameModeProgressThresholds[i]) {
                await mod.Wait(0.25);
                console.log("TRUE, removing value: " + GameModeProgressThresholds[i]);
                mod.DisablePlayerJoin();
                GameModeProgressThresholds.splice(i, 1);
                i--;
                //console.log(GameModeProgressThresholds.length);
            }
        }
    }

    // async StartLateJoinTimer() {
    //     while (!HasBeenCaptured) 
    //         console.log("Tick 0.5s");
    //         await mod.Wait(0.5);
    // }

    ToggleAlarmSFX() {
        var StartSFX = mod.SpawnObject(AlarmSFX, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        if (this.IsBeingCaptured) {
            mod.EnableSFX(StartSFX, true);
            mod.PlaySound(StartSFX, 80, mod.GetTeam(1));
            mod.PlaySound(StartSFX, 80, mod.GetTeam(2));
            mod.PlaySound(StartSFX, 80, mod.GetTeam(3));
            mod.PlaySound(StartSFX, 80, mod.GetTeam(4));
        } else {
            mod.EnableSFX(StartSFX, false);
        }

    }

    AddPlayerToList(eventPlayer: mod.Player) {
        this.CollidingPlayers.push(eventPlayer);
        //console.log("New list of colliding players: " + this.CollidingPlayers);
        //console.log("Obj Id: " + mod.GetObjId(eventPlayer));
    }

    RemovePlayerFromList(eventPlayer: mod.Player) {
        this.CollidingPlayers = this.CollidingPlayers.filter(player => mod.GetObjId(player) !== mod.GetObjId(eventPlayer));
        //console.log("Colliding player ids after removal: " + this.CollidingPlayers); 
        //console.log("Obj Id: " + mod.GetObjId(eventPlayer));
    }

    GetUniqueTeams(players: mod.Player[]): number[] {
        const teamSet = new Set<number>();

        for (const player of players) {
            const teamId = mod.GetObjId(mod.GetTeam(player));
            //console.log("Team Id is: " + teamId);
            teamSet.add(teamId);
        }

        return Array.from(teamSet);
    }

    TriggerVictory(eventTeam: mod.Team) {
        console.log("Captured by Team: " + mod.GetObjId(eventTeam));
        MessageAllUI(MakeMessage(mod.stringkeys.VictoryMessage, mod.GetObjId(eventTeam)), REDCOLOR);
        mod.EndGameMode(eventTeam);
        this.CleanUpCustomUI();

        // if (mod.GetObjId(eventTeam) >= 3) {
        //     console.log("DEBUG Captured by Team: " + mod.GetObjId(eventTeam));
        //     MessageAllUI(MakeMessage(mod.stringkeys.VictoryMessage, mod.GetObjId(eventTeam)), REDCOLOR);
        //     mod.EndGameMode(mod.GetTeam(1));
        // } else {
        //     console.log("Captured by Team: " + mod.GetObjId(eventTeam));
        //     MessageAllUI(MakeMessage(mod.stringkeys.VictoryMessage, mod.GetObjId(eventTeam)), REDCOLOR);
        //     mod.EndGameMode(eventTeam);
        // }
    }

    async CleanUpCustomUI() {
        await mod.Wait(2);
        mod.DeleteAllUIWidgets();
    }

}

/////////////////////////////////////////////////////////////////////////

// Use this as your "ready"/game startup function
export async function OnGameModeStarted() {
    console.log("Vertigo Game Mode Started!!!");
    mod.SetFriendlyFire(false);
    CaptureM = new CaptureManager();
    mod.EnableAreaTrigger(mod.GetAreaTrigger(21), true);
    
    mod.SetAIToHumanDamageModifier(0.1);

    // HQs
    mod.EnableHQ(mod.GetHQ(2), false);
    mod.EnableHQ(mod.GetHQ(3), false);
    mod.EnableHQ(mod.GetHQ(5), false);
    mod.EnableHQ(mod.GetHQ(6), false);
    mod.EnableHQ(mod.GetHQ(8), false);
    mod.EnableHQ(mod.GetHQ(9), false);
    mod.EnableHQ(mod.GetHQ(11), false);
    mod.EnableHQ(mod.GetHQ(12), false);
    
    // Check point VFXs
    let T1CP1LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T1CP1L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T1CP1RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T1CP1R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T1CP2LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T1CP2L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T1CP2RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T1CP2R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    mod.EnableVFX(T1CP1LVFX, true);
    mod.EnableVFX(T1CP1RVFX, true);
    mod.EnableVFX(T1CP2LVFX, true);
    mod.EnableVFX(T1CP2RVFX, true);

    let T2CP1LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T2CP1L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T2CP1RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T2CP1R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T2CP2LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T2CP2L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T2CP2RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T2CP2R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    mod.EnableVFX(T2CP1LVFX, true);
    mod.EnableVFX(T2CP1RVFX, true);
    mod.EnableVFX(T2CP2LVFX, true);
    mod.EnableVFX(T2CP2RVFX, true);

    let T3CP1LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T3CP1L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T3CP1RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T3CP1R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T3CP2LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T3CP2L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T3CP2RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T3CP2R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    mod.EnableVFX(T3CP1LVFX, true);
    mod.EnableVFX(T3CP1RVFX, true);
    mod.EnableVFX(T3CP2LVFX, true);
    mod.EnableVFX(T3CP2RVFX, true);

    let T4CP1LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T4CP1L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T4CP1RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T4CP1R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T4CP2LVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T4CP2L, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    let T4CP2RVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, T4CP2R, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    mod.EnableVFX(T4CP1LVFX, true);
    mod.EnableVFX(T4CP1RVFX, true);
    mod.EnableVFX(T4CP2LVFX, true);
    mod.EnableVFX(T4CP2RVFX, true);

    let CPVFX = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Green, CapturePointLocation, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    mod.EnableVFX(CPVFX, true);
    
    
    let startGameWorldIcon: mod.WorldIcon = mod.GetWorldIcon(25);
    mod.EnableWorldIconImage(startGameWorldIcon, true);
    mod.SetWorldIconText(startGameWorldIcon, MakeMessage(mod.stringkeys.worldIconStartGame));
    mod.EnableWorldIconText(startGameWorldIcon, true);
    
    mod.SetWorldIconText(mod.GetWorldIcon(1), MakeMessage(mod.stringkeys.corridorTeleport));
    mod.SetWorldIconText(mod.GetWorldIcon(3), MakeMessage(mod.stringkeys.topTeleport));
    mod.SetWorldIconText(mod.GetWorldIcon(12), MakeMessage(mod.stringkeys.Team1HQ2Teleport));
    mod.SetWorldIconText(mod.GetWorldIcon(21), MakeMessage(mod.stringkeys.Team2HQ2Teleport));
    mod.SetWorldIconText(mod.GetWorldIcon(22), MakeMessage(mod.stringkeys.Team3HQ2Teleport));
    mod.SetWorldIconText(mod.GetWorldIcon(23), MakeMessage(mod.stringkeys.Team4HQ2Teleport));
    
    mod.SetWorldIconText(mod.GetWorldIcon(26), MakeMessage(mod.stringkeys.GetAssaultRifle));
    mod.SetWorldIconText(mod.GetWorldIcon(27), MakeMessage(mod.stringkeys.GetAssaultRifle));
    mod.SetWorldIconText(mod.GetWorldIcon(28), MakeMessage(mod.stringkeys.GetAssaultRifle));
    mod.SetWorldIconText(mod.GetWorldIcon(29), MakeMessage(mod.stringkeys.GetAssaultRifle));
    
    mod.SetWorldIconText(mod.GetWorldIcon(team1Checkpoint1ID), MakeMessage(mod.stringkeys.Team1Checkpoint));
    mod.SetWorldIconText(mod.GetWorldIcon(team2Checkpoint1ID), MakeMessage(mod.stringkeys.Team2Checkpoint));
    mod.SetWorldIconText(mod.GetWorldIcon(team3Checkpoint1ID), MakeMessage(mod.stringkeys.Team3Checkpoint));
    mod.SetWorldIconText(mod.GetWorldIcon(team4Checkpoint1ID), MakeMessage(mod.stringkeys.Team4Checkpoint));
    
    capturePointObjective = mod.GetCapturePoint(1);
    mod.EnableGameModeObjective(capturePointObjective, true);
    
    // wait for required number of players to join the game. 
    while (initialPlayerCount < minimumInitialPlayerCount) {
        await mod.Wait(1);
    }
    
    console.log("Adequate players have entered lobby. Begin the game.");
    
    await CombatCountdown();
    
    ForceSpawnPlayers();
    
    
    mod.EnableWorldIconImage(startGameWorldIcon, false);
    mod.EnableWorldIconText(startGameWorldIcon, false);
    
    let vfxStartPos: mod.Vector = mod.CreateVector(-136, 76.5, -127);
    let lengthNum: number = 25;
    let distanceBetween = 5;
    for (let k = 0; k < lengthNum; ++k) {
        let x = mod.XComponentOf(vfxStartPos) + k * distanceBetween;

        for (let i = 0; i < lengthNum; ++i) {
            let y = mod.YComponentOf(vfxStartPos);
            let z = mod.ZComponentOf(vfxStartPos) + i * distanceBetween;
            SpawnVFX(mod.CreateVector(x, y, z), mod.RuntimeSpawn_Common.FX_BASE_Fire_M_NoSmoke, mod.CreateVector(0, 0, 0));
        }
    }

    // There isn't a defined update loop, so you can create some here.
    // I have ThrottledUpdate, which updates every 1 second.
    while (true) {
        await mod.Wait(1);
        ThrottledUpdate();
    }
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Player Functions:
//-----------------------------------------------------------------------------------------------//

export async function OnPlayerJoinGame(player: mod.Player) {

    await mod.Wait(1);

    // Check if this is a human player or not. 
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {

        if (!combatCountdownStarted) {
            mod.SetTeam(player, mod.GetTeam(1));
        }
        else {
            // Count up team sizes and add player to a team accordingly

            JsPlayer.playerInstances.forEach(p => {
                let teamId: number = mod.GetObjId(mod.GetTeam(p));

                switch (teamId) {
                    case 1:
                        team1Count++;
                    case 2:
                        team2Count++;
                    case 3:
                        team3Count++;
                    case 4:
                        team4Count++;
                    default:
                        console.log("Invalid team ID");
                }
            });
            
            const smallest: number = Math.min(team1Count, team2Count, team3Count, team4Count);
            if (team1Count == smallest && team2Count == smallest && team3Count == smallest && team4Count == smallest) {
                mod.SetTeam(player, mod.GetTeam(1));
            }
            else if (team1Count == smallest) { 
                mod.SetTeam(player, mod.GetTeam(1));
            }
            else if (team2Count == smallest) {
                mod.SetTeam(player, mod.GetTeam(2));
            }
            else if (team3Count == smallest) {
                mod.SetTeam(player, mod.GetTeam(3));
            }
            else if (team4Count == smallest) {
                mod.SetTeam(player, mod.GetTeam(4));
            }
        }

        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer) {
            console.log("not a player");
            return;
        }


        // Show the pre-game lobby window, assuming combat hasn't started. 
        if (!combatStarted){
            jsPlayer.lobbyUI.open();
            initialPlayerCount++;
            UpdateAllLobbyUI();
        }

    } 
    else {
        // The player is not a human so we will ignore them. 
    }
}

export async function OnPlayerLeaveGame(playerId: number) {
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

export function OnPlayerDeployed(eventPlayer: mod.Player): void{
    
    if (!combatStarted) {
        mod.Teleport(eventPlayer, lobbySpawnPt, 0);
        mod.SetFriendlyFire(false);
    }

    // }
    // mod.Wait(0.5);
    //mod.RemovePlayerInventoryAtSlot(eventPlayer, mod.InventorySlots.PrimaryWeapon);
    // mod.RemovePlayerInventoryAtSlot(eventPlayer, mod.InventorySlots.GadgetOne);
    // mod.RemovePlayerInventoryAtSlot(eventPlayer, mod.InventorySlots.GadgetTwo);
    // mod.RemovePlayerInventoryAtSlot(eventPlayer, mod.InventorySlots.MiscGadget);
    // mod.RemovePlayerInventoryAtSlot(eventPlayer, mod.InventorySlots.ClassGadget);
    //mod.ReplacePlayerInventory(eventPlayer, mod.Throwables.SmokeGrenade);
    //mod.SetInventoryMagazineAmmo(eventPlayer, mod.InventorySlots.SecondaryWeapon, 1000);
    //mod.SetInventoryAmmo(eventPlayer, mod.InventorySlots.SecondaryWeapon, 100);
    
}


// Updates every 1 second
function ThrottledUpdate() {

    if (!gameOver) {
        UpdateCheckpoints();
        PollAmmo();
        UpdateHazards();
        UpdateMessages();
    }

}


// Spawns an explosion at targetpoint and will also damage + knockback players
async function Explosion(targetpoint: mod.Vector, damage: number, explosionRadius: number, vfx: mod.RuntimeSpawn_Common) {

    let flareVFX = mod.SpawnObject(vfx, targetpoint, mod.CreateVector(0, 0, 0), mod.CreateVector(2, 2, 2));

    mod.EnableVFX(flareVFX, true);

    let closePlayers = await GetPlayersInRange(targetpoint, explosionRadius);

    for (let index = 0; index < closePlayers.length; index++) {
        const closePlayer = closePlayers[index];
        mod.DealDamage(closePlayer, damage);
    }
}

// This actually for firing any VFX lol
async function SpawnVFX(targetPoint: mod.Vector, vfx: any, rot: mod.Vector){
    let flareVFX = mod.SpawnObject(vfx, targetPoint, rot, mod.CreateVector(1, 1, 1));
    mod.EnableVFX(flareVFX, true);
}

function PollAmmo() {
    let p18MaxMagazine: number = 18;
    // Set p18 ammo to max every second
    JsPlayer.playerInstances.forEach(player => {
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true) {
            mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, p18MaxMagazine);
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

async function UpdateHazards(){
    // try area triggers again, this is stupid
    // let hazardTriggerDistance: number = 15
    // JsPlayer.playerInstances.forEach(player => {
    //     if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true) {
    //         let pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
    //         if (hazardpt1Cooldown > 0) {
    //             hazardpt1Cooldown--;
    //         }
    //         else {
    //             let dis1 = mod.DistanceBetween(pos, hazardpt1_1_1);
    //             let dis2 = mod.DistanceBetween(pos, hazardpt1_1_2);
    //             let dis3 = mod.DistanceBetween(pos, hazardpt1_1_3);

    //             if (dis < hazardTriggerDistance){
    //                 // Will need to break down hazards into smaller arrays for different locations
    //                 SpawnVehiclesFromSpawners(hazards, 1);
    //             }
    //         }
    //     }
    // });
}

async function UpdateCheckpoints(){
    JsPlayer.playerInstances.forEach(player => {
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true) {
            let pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            let testPos = mod.GetObjectPosition(player);
            //console.log("X = " + mod.XComponentOf(testPos));
            //console.log("Y = " + mod.YComponentOf(testPos));
            //console.log("Z = " + mod.ZComponentOf(testPos));


            if (mod.YComponentOf(pos) <= deathYPos) {
                mod.Kill(player);
                MessageAllUI(MakeMessage(mod.stringkeys.playerFell, player), REDCOLOR);
            }
    
            //WorldIconDistanceCheck(pos, mod.CreateVector(-120, 82, -18), [1, 2, 3, 12, 21, 22, 23]);
            //console.log("player pos x: " + mod.XComponentOf(pos));
            //WorldIconDistanceCheck(pos, mod.GetObjectPosition(mod.GetWorldIcon(30)), [30]); 
            // WorldIconDistanceCheck(pos, mod.GetObjectPosition(mod.GetHQ(6)), [team2Checkpoint1ID, 27]);
            // WorldIconDistanceCheck(pos, mod.GetObjectPosition(mod.GetHQ(7)), [team3Checkpoint1ID, 28]);
            // WorldIconDistanceCheck(pos, mod.GetObjectPosition(mod.GetHQ(8)), [team4Checkpoint1ID, 29]);
        }
        
    });
        
}

function WorldIconDistanceCheck(playerPos: mod.Vector, checkPt: mod.Vector, iconIDs: number[]) {
    let dis: number = mod.DistanceBetween(playerPos, checkPt);
    let canDisable: boolean = true;
    if (dis < 10) {
        iconIDs.forEach(id => {
            console.log("SHOW");
            mod.EnableWorldIconText(mod.GetWorldIcon(id), true);
            mod.EnableWorldIconImage(mod.GetWorldIcon(id), true);
        });
        canDisable = false;
    }
    else {
        if (canDisable) {
            iconIDs.forEach(id => {
                console.log("HIDE");
                mod.EnableWorldIconText(mod.GetWorldIcon(id), false);
                mod.EnableWorldIconImage(mod.GetWorldIcon(id), false);
            });
        }
    }
}

async function GetPlayersInRange(point: mod.Vector, distance: number): Promise<mod.Player[]> {

    let closePlayers: mod.Player[] = [];
    
    JsPlayer.playerInstances.forEach(player => {
        
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true) {

            let pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);

            let dis = mod.DistanceBetween(pos, point);

            if (dis <= distance) {
                closePlayers.push(player);
            }
        }
    });

    return closePlayers;
}

function SpawnVehicleSpawner(positionVector: mod.Vector, rotationVector: mod.Vector){
    let yOffset = 0;
    let idNum = mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, mod.CreateVector(mod.XComponentOf(positionVector), mod.YComponentOf(positionVector) + yOffset, mod.ZComponentOf(positionVector)), rotationVector, mod.CreateVector(1,1,1));
    vehicleSpawners.push(idNum);
    return idNum;
}


// Called whenever a player interacts with an object
export async function OnPlayerInteract(player: mod.Player, interactPoint: any)
{
    // ObjIds are assigned IN GODOT. I recommend assigning them to const numbers in the global scope
    let id = mod.GetObjId(interactPoint);
    if (id == onlyUpTeleportID){
        console.log("Teleport player");
        mod.Teleport(player, mod.CreateVector(-61.8, 114.3, -48), 0);
    }
    else if (id == quadBikeSpawnerInteract1){
        console.log("Spawn Vehicle Checkpoint 1");
        let quadSpawn = SpawnVehicleSpawner(mod.CreateVector(-148, 138.5, -8.75), mod.CreateVector(0, -68, 0));
        SpawnVehiclesFromSpawners([quadSpawn], 2);
    }
    else if (id == quadBikeSpawnerInteract2){
        console.log("Spawn Vehicle Checkpoint 2");
        let quadSpawn = SpawnVehicleSpawner(mod.CreateVector(-71.25, 138.5, 46), mod.CreateVector(0, -248, 0));
        SpawnVehiclesFromSpawners([quadSpawn], 2);
    }
    else if (id == quadBikeSpawnerInteract3){
        console.log("Spawn Vehicle Checkpoint 3");
        let quadSpawn = SpawnVehicleSpawner(mod.CreateVector(-26, 136.5, -149.5), mod.CreateVector(0, 22, 0));
        SpawnVehiclesFromSpawners([quadSpawn], 2);
    }
    else if (id == quadBikeSpawnerInteract4){
        console.log("Spawn Vehicle Checkpoint 4");
        let quadSpawn = SpawnVehicleSpawner(mod.CreateVector(-13.5, 136.5, -9.5), mod.CreateVector(0, -68, 0));
        SpawnVehiclesFromSpawners([quadSpawn], 2);
    }
    else if (id == ammoResupplyID){
        // mod.ReplacePlayerInventory(player, mod.PrimaryWeapons.USG_90);
        // mod.ReplacePlayerInventory(player, mod.Throwables.MiniFragGrenade);
        // mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
        // mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 9999);
        // mod.SetInventoryAmmo(player, mod.InventorySlots.Throwable, 9999);
        // mod.SetInventoryAmmo(player, mod.InventorySlots.GadgetOne, 9999);
        // mod.SetInventoryAmmo(player, mod.InventorySlots.GadgetTwo, 9999);
        // mod.SetInventoryAmmo(player, mod.InventorySlots.MiscGadget, 9999);
        // mod.SetInventoryAmmo(player, mod.InventorySlots.ClassGadget, 9999);
    }
    // else if (id == 99){
    //     TestVFXSpawn();
    // }
    else if (id == team1HQ2Teleport){
        mod.Teleport(player, mod.CreateVector(-147.5, 138.5, -9), 0);
    }
    else if (id == team1Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(mod.GetTeam(1))){
        console.log("Update Team 1 Checkpoint");
        mod.EnableHQ(mod.GetHQ(team1HQ2), true);
        mod.EnableHQ(mod.GetHQ(team1HQ1), false);
        mod.SetWorldIconText(mod.GetWorldIcon(team1Checkpoint1ID), MakeMessage(mod.stringkeys.checkPointActivated));
        mod.EnableInteractPoint(mod.GetInteractPoint(team1Checkpoint1ID), false);
        MessageAllUI(MakeMessage(mod.stringkeys.team1CheckpointActivated), BLACKCOLOR);
    }
    else if (id == team1Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) != mod.GetObjId(mod.GetTeam(1))){
        console.log("Wrong team at team 1 checkpoint: player is ", mod.GetObjId(mod.GetTeam(player)), " , Checkpoint is for: ", mod.GetObjId(mod.GetTeam(1)));
    }
    else if (id == team4Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(mod.GetTeam(4))){
        console.log("Update Team 4 Checkpoint");
        mod.EnableHQ(mod.GetHQ(team4HQ2), true);
        mod.EnableHQ(mod.GetHQ(team4HQ1), false);
        mod.SetWorldIconText(mod.GetWorldIcon(team4Checkpoint1ID), MakeMessage(mod.stringkeys.checkPointActivated));
        mod.EnableInteractPoint(mod.GetInteractPoint(team4Checkpoint1ID), false);
        MessageAllUI(MakeMessage(mod.stringkeys.team4CheckpointActivated), BLACKCOLOR);
    }
    else if (id == team4Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) != mod.GetObjId(mod.GetTeam(4))){
        console.log("Wrong team at team 4 checkpoint: player is ", mod.GetObjId(mod.GetTeam(player)), " , Checkpoint is for: ", mod.GetObjId(mod.GetTeam(4)));
    }
    else if (id == team2Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(mod.GetTeam(2))){
        console.log("Update Team 2 Checkpoint");
        mod.EnableHQ(mod.GetHQ(team2HQ2), true);
        mod.EnableHQ(mod.GetHQ(team2HQ1), false);
        mod.SetWorldIconText(mod.GetWorldIcon(team2Checkpoint1ID), MakeMessage(mod.stringkeys.checkPointActivated));
        mod.EnableInteractPoint(mod.GetInteractPoint(team2Checkpoint1ID), false);
        MessageAllUI(MakeMessage(mod.stringkeys.team2CheckpointActivated), BLACKCOLOR);
    }
    else if (id == team2Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) != mod.GetObjId(mod.GetTeam(2))){
        console.log("Wrong team at team 2 checkpoint: player is ", mod.GetObjId(mod.GetTeam(player)), " , Checkpoint is for: ", mod.GetObjId(mod.GetTeam(2)));
    }
    else if (id == team3Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) == mod.GetObjId(mod.GetTeam(3))){
        console.log("Update Team 3 Checkpoint");
        mod.EnableHQ(mod.GetHQ(team3HQ2), true);
        mod.EnableHQ(mod.GetHQ(team3HQ1), false);
        mod.SetWorldIconText(mod.GetWorldIcon(team3Checkpoint1ID), MakeMessage(mod.stringkeys.checkPointActivated));
        mod.EnableInteractPoint(mod.GetInteractPoint(team3Checkpoint1ID), false);
        MessageAllUI(MakeMessage(mod.stringkeys.team3CheckpointActivated), BLACKCOLOR);
    }
    else if (id == team3Checkpoint1ID && mod.GetObjId(mod.GetTeam(player)) != mod.GetObjId(mod.GetTeam(3))){
        console.log("Wrong team at team 3 checkpoint: player is ", mod.GetObjId(mod.GetTeam(player)), " , Checkpoint is for: ", mod.GetObjId(mod.GetTeam(3)));
    }
    else if (id == team2HQ2Teleport) {
        mod.Teleport(player, mod.CreateVector(-12.9, 136, -8.25), 0);
    }
    else if (id == team3HQ2Teleport) {
        mod.Teleport(player, mod.CreateVector(-10.25, 136.1, -132), 0);
    }
    else if (id == team4HQ2Teleport) {
        mod.Teleport(player, mod.CreateVector(-44, 137.3, 35.3), 0);
    }
    else if (id == 98) {
        mod.Teleport(player, victoryPt, 0);
    }
    else if (id == startInteractPointID) {
        initialPlayerCount = minimumInitialPlayerCount;
        mod.EnableInteractPoint(mod.GetInteractPoint(startInteractPointID), false);
    }
    else if (id == 96) { 
        console.log("MoveObjectOverTimeTest");
        mod.MoveObjectOverTime(mod.GetSpatialObject(60), mod.CreateVector(10, 10, 0), mod.CreateVector(0, 180, 0), 1, false, false);
    }
    else if (id == 69) {
        SpawnVFX(mod.CreateVector(-75, 66, -65), vfxtest[vfxidx], mod.CreateVector(0, 0, 0));
        vfxidx++;
    }
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void{
    gameOver = true;
    mod.EndGameMode(mod.GetCurrentOwnerTeam(eventCapturePoint));
} 

async function SpawnVehiclesFromSpawners(vehicleSpawners: mod.VehicleSpawner[], spawnVehicleIdx: number){
    vehicleSpawners.forEach(spawner => {
        console.log("Attempting to spawn vehicle: ", spawnVehicleIdx, " from vehicle spawner: ");
        mod.SetVehicleSpawnerVehicleType(spawner, vehicleListTable[spawnVehicleIdx]);
        mod.SetVehicleSpawnerRespawnTime(spawner, 5);
        mod.ForceVehicleSpawnerSpawn(spawner);
    });
}

export async function OnVehicleSpawned(eventVehicle: mod.Vehicle){
    const vehPos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
    const explodePoint1 = mod.CreateVector(-62.859, 90, 33);
    const explodePt2 = mod.CreateVector(-72, 147, -77);
    let dist = mod.DistanceBetween(vehPos, explodePoint1);
    if (dist <= 15) {
        console.log("Explode Vehicle");
        await mod.Wait(0.5);
        mod.Kill(eventVehicle);
    }

    dist = mod.DistanceBetween(vehPos, explodePt2);
    if (dist <= 50){
        console.log("Explode Vehicle");
        await mod.Wait(0.5);
        mod.Kill(eventVehicle);
    }
}


function ForceSpawnPlayers() {
    console.log("Force Spawn Players");
    mod.EnableAllPlayerDeploy(true);

    console.log(JsPlayer.playerInstances.length, " Players to Spawn");
    let i = 0
    JsPlayer.playerInstances.forEach(player => {
        if (debugTeam) {
            mod.SetTeam(player, mod.GetTeam(4)); // Set to team to debug
        }
        else {
            let is_alive = mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
            switch(i % 4) {
                case 0:
                    console.log("add player to Team 1");
                    if (mod.GetObjId(mod.GetTeam(player)) != 1) {
                        mod.SetTeam(player, mod.GetTeam(1));
                    }

                    if (is_alive){
                        mod.Teleport(player, mod.GetObjectPosition(mod.GetHQ(1)), 0);
                    }
                    break;
                case 1:
                    console.log("add player to Team 2");
                    if (mod.GetObjId(mod.GetTeam(player)) != 2) {
                        mod.SetTeam(player, mod.GetTeam(2));
                    }

                    if (is_alive){
                        mod.Teleport(player, mod.GetObjectPosition(mod.GetHQ(4)), 0);
                    }
                    break;
                case 2:
                    console.log("add player to Team 3");
                    if (mod.GetObjId(mod.GetTeam(player)) != 3) {
                        mod.SetTeam(player, mod.GetTeam(3));
                    }

                    if (is_alive){
                        mod.Teleport(player, mod.GetObjectPosition(mod.GetHQ(7)), 0);
                    }
                    break;
                case 3:
                    console.log("add player to Team 4");
                    if (mod.GetObjId(mod.GetTeam(player)) != 4) {
                        mod.SetTeam(player, mod.GetTeam(4));
                    }

                    if (is_alive){
                        mod.Teleport(player, mod.GetObjectPosition(mod.GetHQ(10)), 0);
                    }
                    break;
            }
    
            mod.DeployPlayer(player as mod.Player);
            i++;
            
        }
    });

}

async function CombatCountdown(): Promise<void> {
    combatCountdownStarted = true;
    console.log("Combat Countdown Started")

    while (combatStartDelayRemaining > -1) {
        UpdateAllLobbyUI();
        await mod.Wait(1);
        combatStartDelayRemaining--;
    }

    combatStarted = true;
    mod.DisablePlayerJoin();
    console.log("CombatStarted Set To True");
    HideAllLobbyUI();
    CaptureM.StartCaptureTimer();
    //CaptureM.StartLateJoinTimer();
    return Promise.resolve();
    
}


function UpdateAllLobbyUI() {

    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        jsPlayer.lobbyUI.refresh();
    });
}

function MessageAllUI(message: mod.Message, textColor: number[]) {
    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        if (jsPlayer.messageUI.isOpen()) {
            jsPlayer.messageUI.refresh(message);
        }
        else {
            jsPlayer.messageUI.open(message, textColor);
        }
    });
    messageTime = messageRemainTime;
}

function HideAllMessageUI() {
    console.log("Hide all message UI");
    JsPlayer.playerInstances.forEach(player => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        jsPlayer.messageUI.close();
    });
}

function HideAllLobbyUI() {
    console.log("Hide lobby UI");
    JsPlayer.playerInstances.forEach((player) => {
        let jsPlayer = JsPlayer.get(player);
        if (!jsPlayer)
            return;
        jsPlayer.lobbyUI.close();
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


export function OnPlayerDied(eventPlayer: mod.Player, otherPlayer: mod.Player){
    if (eventPlayer != otherPlayer){
        SwapPlaces(eventPlayer, otherPlayer)
    }
    else {
        console.log("Not Swaping Players")
    }
}

function SwapPlaces(victimPlayer: mod.Player, killerPlayer: mod.Player) {
    if (!combatStarted) {
        console.log("Not Swaping Players")
        return;
    }

    console.log("Swaping Players")
    //let victimLocation = mod.GetSoldierState(victimPlayer, mod.SoldierStateVector.GetPosition);
    let victimLocation = mod.GetSoldierState(victimPlayer, mod.SoldierStateVector.GetPosition);
    victimLocation = mod.Add(victimLocation, mod.CreateVector(0, 2, 0));

    let killerLocation = mod.GetSoldierState(killerPlayer, mod.SoldierStateVector.GetPosition);

    let teleportVFX = mod.SpawnObject(
        mod.RuntimeSpawn_Common.FX_BASE_Sparks_Pulse_L,
        victimLocation,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(5, 5, 5)
    );
    let teleportTargetVFX = mod.SpawnObject(
        mod.RuntimeSpawn_Common.FX_BASE_Sparks_Pulse_L,
        killerLocation,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(5, 5, 5)
    );

    let rotationAngle: number = FindAngleToLocation2D(
        mod.XComponentOf(victimLocation),
        mod.ZComponentOf(victimLocation),
        mod.XComponentOf(killerLocation),
        mod.ZComponentOf(killerLocation)
    );

    let rotationAngle2: number = FindAngleToLocation2D(
        mod.XComponentOf(killerLocation),
        mod.ZComponentOf(killerLocation),
        mod.XComponentOf(victimLocation),
        mod.ZComponentOf(victimLocation)
    );

    mod.EnableVFX(teleportVFX, true);
    mod.EnableVFX(teleportTargetVFX, true);

    mod.Teleport(killerPlayer, victimLocation, rotationAngle);
    mod.Teleport(victimPlayer, killerLocation, rotationAngle2);
}

function FindAngleToLocation2D(currentX: number, currentY: number, targetX: number, targetY: number) {
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    // Calculate the angle using atan2
    const angle = Math.atan2(dx, dy);

    return angle;
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Helper Functions:
//-----------------------------------------------------------------------------------------------//

function GetRandomFloatInRange(max: number, min: number){
    return Math.random() * (max - min) + min;
}

function GetRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

/// ----------------------------------- JS PLAYER --------------------------------------------------------------

class JsPlayer {
    player: mod.Player;
    playerId: number;
    maxHealth = 100;
    currentHealth = 100;
    bonusDamage = 0;

    isDeployed = false;
    hasDeployed = false;

    playerNotificationWidget: mod.UIWidget|undefined;
    playerhealthWidget: mod.UIWidget|undefined;


    lobbyUI;
    messageUI;


    static playerInstances: mod.Player[] = [];

    constructor(player: mod.Player) {
        this.player = player;
        this.playerId = mod.GetObjId(player);
        JsPlayer.playerInstances.push(this.player);
        if (debugJSPlayer) {console.log("Vertigo Mode Adding Player [", mod.GetObjId(this.player), "] Creating JS Player: ", JsPlayer.playerInstances.length)};
        //this.createPlayerNotificationUI();
        this.lobbyUI = new LobbyUI(this);
        this.messageUI = new MessageUI(this);
    }

    // declare dictionary with int keys
    static #allJsPlayers: { [key: number] : JsPlayer }  = {};

    static get(player: mod.Player) {
        if (!gameOver && mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);

            //if (instance == null){instance = 1000};
            //if (debugJSPlayer) {console.log("Calling JSPlayer.get Instance [", instance, "] on Player [", index, "]")}

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


    // createPlayerNotificationUI() {

    //     this.playerNotificationWidget = ParseUI({
    //         type: "Text",
    //         textSize: 54,
    //         position: [0, 220, 0],
    //         size: [800, 80],
    //         anchor: mod.UIAnchor.TopCenter,
    //         bgColor: REDCOLOR,
    //         textLabel: MakeMessage(mod.stringkeys.youAreInJail),
    //         playerId: this.player,

    //     })
    // }
}

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
        // this.refilterAttachmentsTab();
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
            console.log("Not the lobby status text");
            return;
        }
        // refresh the lobby status text:
        if (combatCountdownStarted) {
            mod.SetUITextLabel(this.#lobbyStatusText, MakeMessage(mod.stringkeys.combatStartDelayCountdown, combatStartDelayRemaining));
        } else {
            mod.SetUITextLabel(this.#lobbyStatusText, MakeMessage(mod.stringkeys.waitingforplayersX, initialPlayerCount, 16));
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
            textLabel: MakeMessage(mod.stringkeys.waitingforplayersX, initialPlayerCount, 16),
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
        console.log("Open message UI");
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
        console.log("refresh message text with ", );
        if (!this.#messageText)
        {
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
            position: [0, 25],
            anchor: mod.UIAnchor.TopCenter,
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
            //bgColor: [1, 0, 0],
            textLabel: message,
        });
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



///////////////////////////// UI Progress BAR ////////////////////////////////////
// class ProgressBar {

//     currentPercentage;

//     constructor(parent, anchor, position, size, barColor) {
//         var padding = 6;
//         this.size = [size[0]-padding*2, size[1]-padding*2];
//         this.widget = ParseUI({
//             type: "Container",
//             parent: parent,
//             position: position,
//             size: size,
//             anchor: anchor,
//             padding: 0,
//             bgFill: mod.UIBgFill.Solid,
//             bgColor: [0,0,0],
//             bgAlpha: 1,
//             children: [{
//                 type: "Container",
//                 size: size,
//                 bgFill: mod.UIBgFill.OutlineThin,
//                 bgColor: [1,1,1],
//                 bgAlpha: 1
//             }]
//         });
//         this.bar = ParseUI({
//             type: "Container",
//             parent: this.widget,
//             position: [padding, padding],
//             size: [size[0]*0.5, size[1]],
//             anchor: mod.UIAnchor.TopLeft,
//             bgFill: mod.UIBgFill.Solid,
//             bgColor: barColor,
//             bgAlpha: 1
//         });
//     }

//     setProgress(fillPercent) {
//         if (fillPercent > 0){
//             mod.SetUIWidgetSize(this.bar, mod.CreateVector(this.size[0]*fillPercent, this.size[1], 0));
//         }
//         else {
//             mod.SetUIWidgetSize(this.bar, mod.CreateVector(this.size[0]*0, this.size[1], 0));
//         }
        
//         this.currentPercentage = fillPercent;
//     }

//     open() {
//         mod.SetUIWidgetVisible(this.widget, true);


//     }
//     close() {
//         mod.SetUIWidgetVisible(this.widget, false);
//     }
// }