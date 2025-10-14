// === acePursuit.ts ===
const VERSION = [1, 8, 239];










// Version Format [ship, delivery, patch/compile]
const debugPlayer = false;

const catchupMechanicSprintDisable = true;

const MinimumPlayerToStart = 1;
const MapPlayers = 8;

const CIRCLE_MAX = 70;
const CIRCLE_MIN = 25;

enum GameType {
    race = 0,
    timeSurvival = 1,
}

type Checkpoint = {
    id: number;
    position: Vector3;
    checkpointStart: Vector3;
    checkpointEnd: Vector3;
    flipdir?: boolean;
};

type RaceTrack = {
    trackId: string;
    name: string;
    laps: number;
    gametype: GameType;
    availableVehicles: mod.VehicleList[]
    checkPoints: Checkpoint[];
};

type Vector3 = { x: number; y: number, z: number };

function getTrackById(id: string): RaceTrack | undefined {
    return tracks.find(track => track.trackId === id);
}

class TrackData {

    trackId: string;
    checkPoints: Checkpoint[];
    laps: number;
    playersInRace: PlayerProfile[] = [];
    raceTime: number = 0;
    winner: boolean = false;
    #maxReadyupCountdown: number = 350;
    readyupCountDown: number = 350;
    countdownToStart: number = 3;
    countdownToEnd: number = 45;
    winnerPlayer: PlayerProfile | undefined;
    availableVehicles: mod.VehicleList[] = [];
    trackState: TrackState = TrackState.none
    gametype: GameType = GameType.race;
    firstPlayerHasJoined: boolean = false

    constructor(track: RaceTrack) {

        console.log("Prepere Track " + track.name)

        this.checkPoints = track.checkPoints;
        this.laps = track.laps;
        this.availableVehicles = track.availableVehicles;
        this.trackId = track.trackId;
        this.trackState = TrackState.selected;
        this.gametype = track.gametype;
    }

    PlayerCompletedTrack(playerProfile: PlayerProfile) {
        playerProfile.playerRaceTime = mod.GetMatchTimeElapsed();
        playerProfile.completedTrack = true;

        this.playersInRace.forEach(playerProfile => {
            playerProfile.ScoreboardUI?.update()
        })

        if (this.winnerPlayer == undefined) {
            console.log("Winner Found")
            this.Winner(playerProfile)

        } else {
            this.CompletedTrackShowPlacement(playerProfile)
        }
    }

    CompletedTrackShowPlacement(playerProfile: PlayerProfile) {
        playerProfile.PlacementUI?.Open(mod.stringkeys.header_placement, currentRace.playersInRace.findIndex(pp => pp.player == playerProfile.player) + 1, 45)
    }

    async Winner(playerProfile: PlayerProfile) {

        this.winnerPlayer = playerProfile;
        playerProfile.PlacementUI?.Open(mod.stringkeys.victory, 0, 85)
        currentRace.trackState = TrackState.winnerFound;

        await mod.Wait(2)

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.EndingCountDownUI?.Open(this.countdownToEnd)
        });

        while (this.countdownToEnd > 0 && this.hasActiveRacers()) {
            currentRace.playersInRace.forEach(playerProfile => {
                playerProfile.EndingCountDownUI?.update(this.countdownToEnd)
            });
            await mod.Wait(1)
            this.countdownToEnd--;
        }

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.EndingCountDownUI?.Close()
        });

        currentRace.trackState = TrackState.over;

        console.log("Ending game")
        mod.EndGameMode(playerProfile.player)
    }


    hasActiveRacers() {
        return currentRace.playersInRace.some(player => player.completedTrack === false);
    }

    async AddPlayerToTrack(player: mod.Player) {
        const playerP = PlayerProfile.get(player);

        if (playerP) {

            if (this.playersInRace.includes(playerP)) {
                console.log("Player already in the race")
                return
            }

            playerP.readyUp = false;
            playerP.lap = 0;
            playerP.checkpoint = 0;
            playerP.nextCheckpoint = 0;
            playerP.playerRaceTime = null;
            playerP.completedTrack = false;
            playerP.currentTrackID = currentRace.trackId;
            playerP.checkPointPosition = ConverVector3ToModVector(currentRace.checkPoints[0].position)
            this.playersInRace.push(playerP)
            currentRace.AssignPlayerNumber(playerP)

            if (currentRace.trackState == TrackState.selected) {
                playerP.VehicleShopUI?.cameraTeleport()
                playerP.OpenVehicleOptionsUI()
                playerP.ScoreboardUI?.open()

                currentRace.playersInRace.forEach(PlayerProfile => {
                    PlayerProfile.VehicleShopUI?.UIUpdatePlayersReady()
                    PlayerProfile.ScoreboardUI?.update()
                });
            }

            console.log("player pushed to race array")
        } else {
            console.log("could not find player to put into race")
        }

    }

    PlayerLeftGame() {
        // Remove invalid players and clean them up
        currentRace.playersInRace = currentRace.playersInRace.filter(playerProfile => {
            if (!this.isValidPlayer(playerProfile.player)) {
                playerProfile.CloseAllUI()
                playerProfile.DeletePlayerWidgets()
                playerProfile.DestroyVehicle();
                playerProfile.RemoveWorldIcons();

                return false; // remove from list
            }
            return true; // keep
        });

        // Update UI and possibly start countdown
        if (currentRace.trackState === TrackState.selected) {
            currentRace.playersInRace.forEach(player => {
                player.VehicleShopUI?.UIUpdatePlayersReady();
                player.ScoreboardUI?.update();
            });
            // Updated scoreboard   
        } else if (currentRace.trackState === TrackState.running || currentRace.trackState === TrackState.winnerFound) {
            currentRace.playersInRace.forEach(player => {
                player.ScoreboardUI?.update();
            });
            this.UpdateOrder()
        }
    }


    isValidPlayer(player: mod.Player | null | undefined): boolean {
        return player != null && mod.IsPlayerValid(player);
    }

    AssignPlayerNumber(playerProfile: PlayerProfile) {

        const usedIds = currentRace.playersInRace.map(p => p.playerRacerNumber);

        // Find the first free ID.
        let freeId = -1;
        for (let i = 0; i < MapPlayers; i++) {
            if (!usedIds.includes(i)) {
                freeId = i;
                break;
            }
        }

        if (freeId === -1) {
            console.log("ERROR: No available slots for new players!");
        }

        // Assign the ID to the joining player
        playerProfile.playerRacerNumber = freeId;
        console.log("Player joined race, Assign race number: " + freeId)
    }

    async RaceStartCountdown() {
        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.StartCountDownUI?.Open(mod.stringkeys.scoreboard_1_name, this.countdownToStart)
        });

        await mod.Wait(1)
        while (this.countdownToStart > 1) {
            this.countdownToStart--;

            currentRace.playersInRace.forEach(playerProfile => {
                playerProfile.StartCountDownUI?.update(mod.stringkeys.scoreboard_1_name, this.countdownToStart)
            });

            await mod.Wait(1)
        }

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.StartCountDownUI?.update(mod.stringkeys.gamestart, this.countdownToStart)
        });

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.StartCountDownUI?.Close(3)
        });
    }

    countdownInProgress: boolean = false;

    async StartCountdown() {

        if (this.countdownInProgress === true) {
            console.log("Countdown already running");
            return;
        }

        if (!this.HasMinimumPlayers()) {
            console.log("Countdown cancelled: not enough players in game");
            return
        }

        this.countdownInProgress = true;
        this.readyupCountDown = this.#maxReadyupCountdown;

        while (this.readyupCountDown > 0) {
            this.readyupCountDown--;

            this.playersInRace.forEach(player => {
                player.VehicleShopUI?.UIUpdatePlayersReady()
            });

            await mod.Wait(1)

            const playerReady = this.GetPlayersReady();

            if (playerReady.total == 0) {
                console.log("Countdown cancelled: No players in lobby");
                this.countdownInProgress = false;
                return
            } else if (playerReady.ready == playerReady.total) {
                this.readyupCountDown = 0;
            }
        }

        console.log("Starting game...");

        await this.StartGame()
        this.countdownInProgress = false;
    }
    HasMinimumPlayers() {
        return this.playersInRace.length >= MinimumPlayerToStart
    }

    IsPlayersReady() {
        return this.playersInRace.every(player => player.readyUp === true);
    }

    IndexExists<T>(array: T[], index: number): boolean {
        return index >= 0 && index < array.length;
    }

    GetPlayersReady() {
        const readyCount = this.playersInRace.filter(p => p.readyUp).length;
        return { ready: readyCount, total: this.playersInRace.length };
    }

    IsPlayerInRace(player: mod.Player) {

        const playerPro = PlayerProfile.get(player)

        if (!playerPro) {
            return false;
        }

        return currentRace?.playersInRace?.some(
            item => mod.GetObjId(item.player) == mod.GetObjId(playerPro.player)
        ) ?? false;
    }

    async StartGame() {
        mod.DisablePlayerJoin()

        currentRace.trackState = TrackState.starting

        this.playersInRace.forEach(playerProfile => {
            playerProfile.VehicleShopUI?.close();
            if (mod.IsPlayerValid(playerProfile.player) && mod.GetSoldierState(playerProfile.player, mod.SoldierStateBool.IsAlive)) {
                mod.EnableAllInputRestrictions(playerProfile.player, true)
            }
            playerProfile.FadeInScreenUI?.FadeIn()
        });

        await mod.Wait(1)

        this.playersInRace.forEach(playerProfile => {
            playerProfile.InitRacer();
        });

        await mod.Wait(5)


        this.playersInRace.forEach(playerProfile => {
            playerProfile.FadeInScreenUI?.FadeOut()
        });

        await mod.Wait(2)


        await this.RaceStartCountdown()

        this.playersInRace.forEach(playerProfile => {
            playerProfile.UpdateWorldIconPosition();
        });

        currentRace.trackState = TrackState.running

        currentRace.raceTime = mod.GetMatchTimeElapsed();

        this.playersInRace.forEach(playerProfile => {
            if (mod.IsPlayerValid(playerProfile.player) && mod.GetSoldierState(playerProfile.player, mod.SoldierStateBool.IsAlive)) {
                mod.EnableAllInputRestrictions(playerProfile.player, false)
            }

        });

        this.playersInRace.forEach(playerProfile => {
            playerProfile.ScoreboardUI?.update()
        })

        this.DistanceCheckToCheckpoint();
        this.SpawnAiEnemyVehicle();
        this.UpdateScoreboardLoop();
        this.StartFireworks();


    }
    async DebugLoop() {

        while (true) {

            currentRace.playersInRace.forEach(element => {

                element.boosterDisabled = true
                element.BoosterDisableUI?.Trigger()

            });

            await mod.Wait(5)
            currentRace.playersInRace.forEach(element => {
                element.boosterDisabled = false
                element.BoosterDisableUI?.Trigger()

            });
            await mod.Wait(5)
        }


    }


    async DistanceCheckToCheckpoint() {

        while (this.trackState == TrackState.running || this.trackState == TrackState.winnerFound) {
            this.playersInRace.forEach(playerProfile => {

                if (playerProfile.completedTrack == true) {
                    console.log("Player have already completed track")
                    return;
                }


                if (!playerProfile.player) {
                    return;
                }


                if (!mod.GetSoldierState(playerProfile.player, mod.SoldierStateBool.IsAlive)) {
                    return
                }

                const playerPosition = mod.GetSoldierState(playerProfile.player, mod.SoldierStateVector.GetPosition)

                if (!playerPosition) {
                    return
                }

                const targetCheckpoint = ConverVector3ToModVector(this.checkPoints[playerProfile.nextCheckpoint].position)

                const distance = mod.DistanceBetween(playerPosition, targetCheckpoint)


                if (distance <= playerProfile.checkpointCircleSize) {

                    playerProfile.checkpoint++;

                    const positionInRace = this.playersInRace.indexOf(playerProfile)
                    playerProfile.checkpointCircleSize = getCheckpointSize(positionInRace, currentRace.playersInRace.length);

                    //update checkpoint position
                    playerProfile.nextCheckpoint = (playerProfile.checkpoint) % this.checkPoints.length
                    playerProfile.checkPointPosition = ConverVector3ToModVector(this.checkPoints[playerProfile.nextCheckpoint].position)

                    const lapsCompl = Math.floor((playerProfile.checkpoint / this.checkPoints.length))

                    if (lapsCompl != playerProfile.lap) {
                        playerProfile.lap = lapsCompl;
                        console.log("lap" + playerProfile.lap)
                    }

                    if (playerProfile.lap >= this.laps && ((playerProfile.checkpoint % this.checkPoints.length) >= 1) && !playerProfile.completedTrack) {
                        this.PlayerCompletedTrack(playerProfile)
                        console.log("player win " + playerProfile.playerRaceTime)
                    }

                    playerProfile.UpdateWorldIconPosition();
                    this.UpdateOrder()
                }

            });
            await mod.Wait(0.1)
        }
    }

    StartFireworks() {
        const fireworkArray = generateSpawnLine({ x: 121.062789916992, y: 177.110992431641, z: 163.706634521484 }, { x: 277.184600830078, y: 177.110992431641, z: 13.0980796813965 }, 6)

        fireworkArray.forEach(firework => {
            SpawnVFXAtPosition(ConverVector3ToModVector(firework.position), mod.RuntimeSpawn_Common.FX_Sparks)
        });
    }

    async SpawnAiEnemyVehicle() {
        console.log("start SpawnAi EnemyVehicle")

        const vehicArray = [
            mod.GetVehicleSpawner(1),
            mod.GetVehicleSpawner(2),
            mod.GetVehicleSpawner(3),
            mod.GetVehicleSpawner(4),
            mod.GetVehicleSpawner(5),
            mod.GetVehicleSpawner(6),
            mod.GetVehicleSpawner(7),
            mod.GetVehicleSpawner(8),
            mod.GetVehicleSpawner(9),
            mod.GetVehicleSpawner(10),
            mod.GetVehicleSpawner(11),
            mod.GetVehicleSpawner(12),
            mod.GetVehicleSpawner(13),
            mod.GetVehicleSpawner(14),
        ]


        for (let index = 0; index < vehicArray.length; index++) {
            mod.ForceVehicleSpawnerSpawn(vehicArray[index])
            await mod.Wait(0.1)
        }

        const aiArray = [
            mod.GetSpawner(1),
            mod.GetSpawner(2),
            mod.GetSpawner(3),
            mod.GetSpawner(4),
            mod.GetSpawner(5),
            mod.GetSpawner(6),
            mod.GetSpawner(7),
            mod.GetSpawner(8),
            mod.GetSpawner(9),
            mod.GetSpawner(10),
            mod.GetSpawner(11),
            mod.GetSpawner(12),
            mod.GetSpawner(13),
            mod.GetSpawner(14),
        ]

        for (let index = 0; index < aiArray.length; index++) {
            mod.SpawnAIFromAISpawner(aiArray[index], mod.SoldierClass.Assault, mod.GetTeam(9))
            await mod.Wait(0.1)
        }

        console.log("completed SpawnAiEnemyVehicle")
    }

    async TimeLoop() {
        console.log("Starting: TimeLoop")

        while (currentRace.trackState == TrackState.running || currentRace.trackState == TrackState.winnerFound) {
            let foundPlayerInRace = false;

            for (let index = 0; index < this.playersInRace.length; index++) {
                const pp = this.playersInRace[index];

                if (pp) {
                    // pp.UITest.open();
                }

                if (pp.completedTrack) {
                    continue
                }




                let timeleft = pp.timeLeft - 0.1

                if (timeleft < 0) {
                    pp.timeLeft = 0;
                } else {
                    pp.timeLeft = timeleft;
                }

                if (pp.timeLeft == 0) {
                    continue;
                }


                if (pp.timeLeft > 0) {
                    foundPlayerInRace = true;
                }
            }


            if (foundPlayerInRace == false) {
                return
            }

            await mod.Wait(0.1)
        }
    }

    async UpdateScoreboardLoop() {
        console.log("Start UpdateScoreboard loop")
        while (this.trackState == TrackState.running || this.trackState == TrackState.winnerFound) {
            await mod.Wait(1.0)
            this.UpdateOrder();
        }
    }


    UpdateScoreboard() {
        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.ScoreboardUI?.update()
        })

    }


    UpdateOrder() {

        const oldarray = JSON.parse(JSON.stringify(this.playersInRace));

        const updatedArray = sortRaceStanding(this.playersInRace);

        let overtakingPlayers = detectOvertakes(oldarray, updatedArray);
        for (let playerProfile of overtakingPlayers) {
            playerProfile.OvertookPlayer();
        }

        if (hasOrderChangedByKey(oldarray, updatedArray)) {
            console.log("Race Order Changed")
            this.playersInRace = updatedArray

            currentRace.playersInRace.forEach(playerProfile => {
                playerProfile.ScoreboardUI?.update()
            })

            if (currentRace.playersInRace.length >= 2 && catchupMechanicSprintDisable) {
                const players = currentRace.playersInRace;

                // Calculate how many players should have sprint disabled (round up to at least 1)
                const disableCount = Math.max(1, Math.ceil(players.length * 0.3));

                for (let i = 0; i < players.length; i++) {
                    const disableSprint = i < disableCount; // First X players have sprint disabled
                    mod.EnableInputRestriction(players[i].player, mod.RestrictedInputs.Sprint, disableSprint);
                    players[i].boosterDisabled = disableSprint;
                    players[i].BoosterDisableUI?.Trigger()
                }
            } else if (currentRace.playersInRace.length <= 1 && catchupMechanicSprintDisable) {
                // If a player leaves the game, and only one player is left. reactivate sprint.
                const playerProf = currentRace.playersInRace[0];
                if (playerProf && playerProf.boosterDisabled) {
                    mod.EnableInputRestriction(playerProf.player, mod.RestrictedInputs.Sprint, false);
                    playerProf.boosterDisabled = false;
                    playerProf.BoosterDisableUI?.Trigger()
                }
            }


        }
    }

}

function detectOvertakes(oldOrder: PlayerProfile[], newOrder: PlayerProfile[]) {
    let overtakes: PlayerProfile[] = [];

    for (let player of newOrder) {
        const id = player.playerProfileId;
        const oldPos = oldOrder.findIndex(p => p.playerProfileId === id);
        const newPos = newOrder.findIndex(p => p.playerProfileId === id);

        if (newPos < oldPos) {
            overtakes.push(player);
        }
    }
    return overtakes;
}

function hasOrderChangedByKey(prev: PlayerProfile[], current: PlayerProfile[]): boolean {
    if (prev.length !== current.length) return true;
    return prev.some((p, i) =>
        p.playerProfileId !== current[i].playerProfileId
    );
}

function compareRacers(a: PlayerProfile, b: PlayerProfile): number {


    if (a.completedTrack && b.completedTrack) return a.playerRaceTime! - b.playerRaceTime!;
    if (a.completedTrack) return -1;
    if (b.completedTrack) return 1;


    if (a.lap !== b.lap) return b.lap - a.lap;
    if (a.checkpoint !== b.checkpoint) return b.checkpoint - a.checkpoint;


    const aDistance = mod.DistanceBetween(mod.GetSoldierState(a.player, mod.SoldierStateVector.GetPosition), a.checkPointPosition)
    const bDistance = mod.DistanceBetween(mod.GetSoldierState(b.player, mod.SoldierStateVector.GetPosition), b.checkPointPosition)

    if (aDistance !== bDistance) return aDistance - bDistance;

    return 0;
}


function sortRaceStanding(racers: PlayerProfile[]): PlayerProfile[] {
    return [...racers].sort(compareRacers);
}

let currentRace: TrackData;

function PrepareRace(trackId: string) {
    const track = getTrackById(trackId);
    if (track) {
        currentRace = new TrackData(track);
    } else {
        console.log("Could not find trackid")
    }
}

export async function OnGameModeStarted() {

    console.log("HoH Test Game Mode Started");

    PrepareRace("track_02")

    mod.SetAIToHumanDamageModifier(0.5)
    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn)
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

enum TrackState {
    none = 0,
    selected = 1,
    starting = 2,
    running = 3,
    winnerFound = 4,
    over = 5
}

let uniqueID: number = 0;

class PlayerProfile {

    timeLeft: number = 30;
    player: mod.Player;
    checkpoint: number = 0;
    nextCheckpoint: number = 1;
    lap: number = 0;
    currentTrackID: string = "";
    playerRaceTime: number | null = null;
    completedTrack: boolean = false;
    checkPointPosition: mod.Vector = mod.CreateVector(0, 0, 0);
    checkPointPositionLookDirection2: Vector3 = { x: 0, y: 0, z: 0 }
    checkPointPosition2: Vector3 = { x: 0, y: 0, z: 0 }
    selectedVehicle: mod.VehicleList = mod.VehicleList.F22;
    playerProfileId: number = -1;
    playerRacerNumber: number = -1;
    readyUp: boolean = false;
    checkpointCircleSize: number = 20;
    boosterDisabled: boolean = false;

    checkpointWorldIcons: mod.WorldIcon[] = [];
    checkpointDirectionWorldIcons: mod.WorldIcon[] = [];

    checkpointWorldIconsTwo: mod.WorldIcon[] = [];
    checkpointDirectionWorldIconsTwo: mod.WorldIcon[] = [];

    checkpointWorldIconsHolder: HoH_CheckpointWorldIconsHolder | undefined;
    nextcheckpointWorldIconsHolder: HoH_CheckpointWorldIconsHolder | undefined;



    VehicleShopUI: HoH_UIVehicleSelect | undefined;
    FadeInScreenUI: HoH_UIBlackScreen | undefined;
    StartCountDownUI: HoH_UIStartCountdown | undefined;
    PlacementUI: HoH_UIPlacementHeader | undefined;
    EndingCountDownUI: HoH_UIEndingGameCountdown | undefined;
    OvertakeUI: HoH_BenjiOvertakeUI | undefined;
    VersionNumberUI: HoH_Version | undefined;
    BoosterDisableUI: HoH_BoosterDisabledUI | undefined;
    ScoreboardUI: HoH_ScoreboardUI | undefined;

    playerSpawnedVeh: mod.Vehicle | undefined;
    playerSpawnedVehSpawner: mod.VehicleSpawner | undefined;

    static playerInstances: mod.Player[] = [];

    static #allHoHPlayers: { [key: number]: PlayerProfile } = {};


    constructor(player: mod.Player) {
        this.player = player;
        this.playerProfileId = uniqueID++;

        this.FadeInScreenUI = new HoH_UIBlackScreen(this);
        this.StartCountDownUI = new HoH_UIStartCountdown(this);
        this.PlacementUI = new HoH_UIPlacementHeader(this);
        this.EndingCountDownUI = new HoH_UIEndingGameCountdown(this);
        this.OvertakeUI = new HoH_BenjiOvertakeUI(this);
        this.VersionNumberUI = new HoH_Version(this)
        this.BoosterDisableUI = new HoH_BoosterDisabledUI(this)
        this.ScoreboardUI = new HoH_ScoreboardUI(this)
    }

    CloseAllUI() {
        this.FadeInScreenUI?.Close()
        this.StartCountDownUI?.Close()
        this.PlacementUI?.Close()
        this.EndingCountDownUI?.Close()
        this.OvertakeUI?.Close()
        this.VersionNumberUI?.Close()
        this.BoosterDisableUI?.Close()
        this.ScoreboardUI?.Close()
        this.VehicleShopUI?.close()
    }


    static get(player: mod.Player) {
        if (mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);

            let hohPlayer = this.#allHoHPlayers[index];
            if (!hohPlayer) {
                hohPlayer = new PlayerProfile(player);
                if (debugPlayer) console.log("Creating Player Profile");
                this.#allHoHPlayers[index] = hohPlayer;
                this.playerInstances.push(player)
            }
            return hohPlayer;
        }
        if (debugPlayer) console.log("Error: could not finds an valid player object ID.");
        return undefined;
    }

    async DeletePlayerWidgets() {

        this.FadeInScreenUI?.Delete()
        this.StartCountDownUI?.Delete()
        this.PlacementUI?.Delete()
        this.EndingCountDownUI?.Delete()
        this.OvertakeUI?.Delete()
        this.VersionNumberUI?.Delete()
        this.BoosterDisableUI?.Delete()
        this.ScoreboardUI?.Delete()


    }

    DestroyVehicle() {

        if (this.playerSpawnedVeh) {
            mod.DealDamage(this.playerSpawnedVeh, 9999)
        }
        if (this.playerSpawnedVehSpawner) {
            mod.UnspawnObject(this.playerSpawnedVehSpawner)
            this.playerSpawnedVehSpawner = undefined;
        }
    }

    SetVehicle(vehicle: mod.VehicleList) {
        this.selectedVehicle = vehicle
    }

    InitRacer() {

        this.checkPointPosition = ConverVector3ToModVector(currentRace.checkPoints[0].position);
        this.checkPointPosition2 = currentRace.checkPoints[0].position;

        this.checkpointWorldIconsHolder = new HoH_CheckpointWorldIconsHolder(this, mod.CreateVector(0, 1, 0))
        this.nextcheckpointWorldIconsHolder = new HoH_CheckpointWorldIconsHolder(this, mod.CreateVector(1, 0, 0))

        VehicleHandler.RequestVehicle(this)
    }

    OpenVehicleOptionsUI() {

        if (this.VehicleShopUI == undefined) {
            this.VehicleShopUI = new HoH_UIVehicleSelect(this)
        }
        this.VehicleShopUI.open();
    }


    RefreshWorldIcons() {
        this.checkpointWorldIconsHolder?.Refresh()
        if ((this.checkpoint) < currentRace.laps * currentRace.checkPoints.length) {
            this.nextcheckpointWorldIconsHolder?.Refresh()
        }
    }


    RemoveWorldIcons() {

        if (this.checkpointWorldIconsHolder) {
            this.checkpointWorldIconsHolder.checkpointWorldIcons.forEach(element => {
                mod.UnspawnObject(element)
            });
        }

        if (this.nextcheckpointWorldIconsHolder) {
            this.nextcheckpointWorldIconsHolder.checkpointWorldIcons.forEach(element => {
                mod.UnspawnObject(element)
            });
        }

    }

    UpdateWorldIconPosition() {
        if (this.completedTrack) {
            this.checkpointWorldIconsHolder?.Hide()
            this.nextcheckpointWorldIconsHolder?.Hide()
            console.log("Hide ui since player completed track")
            return;
        }

        this.checkPointPosition2 = currentRace.checkPoints[this.nextCheckpoint].position


        this.checkPointPositionLookDirection2 = currentRace.checkPoints[(this.checkpoint + 1) % currentRace.checkPoints.length].position


        if (!this.checkpointWorldIconsHolder) {
            console.log("checkpointWorldIconsHolder not found")
        }

        this.checkpointWorldIconsHolder?.Update(this.checkPointPosition2, this.checkPointPositionLookDirection2, this.checkpointCircleSize)


        //upcoming checkpoint after target checkpoint
        const upcomingCheckpoint = (this.checkpoint + 1) % currentRace.checkPoints.length
        const upcomingcheckpointPosition2 = currentRace.checkPoints[upcomingCheckpoint].position


        this.nextcheckpointWorldIconsHolder?.Update(upcomingcheckpointPosition2, currentRace.checkPoints[(this.checkpoint + 2) % currentRace.checkPoints.length].position, this.checkpointCircleSize)

        if (!this.nextcheckpointWorldIconsHolder) {
            console.log("nextcheckpointWorldIconsHolder not found")
        }

        // Make the final checkpoint not have a next checkpoint.
        if ((this.checkpoint) >= currentRace.laps * currentRace.checkPoints.length) {
            this.nextcheckpointWorldIconsHolder?.Hide()
            console.log("hide last checkpoint")
        }

    }


    static removePlayer(player: mod.Player) {
        let index = mod.GetObjId(player);

        let hohPlayer = this.#allHoHPlayers[index];
        if (hohPlayer) {
            this.playerInstances.filter(item => item !== player);
            delete this.#allHoHPlayers[index];
        } else {
            if (debugPlayer) console.log("Error: could not find player with profile to remove");
        }
    }


    static removeInvalidPlayers() {
        // Remove invalid from array
        PlayerProfile.playerInstances = PlayerProfile.playerInstances.filter(player =>
            this.isValidPlayer(player)
        );

        // Remove invalid from object
        for (const id in PlayerProfile.#allHoHPlayers) {
            const { player } = PlayerProfile.#allHoHPlayers[id];
            if (!this.isValidPlayer(player)) {
                delete PlayerProfile.#allHoHPlayers[id];
            }
        }
    }

    static isValidPlayer(player: mod.Player | null | undefined): boolean {
        // Check for null/undefined before calling mod function
        return player != null && mod.IsPlayerValid(player);
    }



    OvertookPlayer() {
        this.OvertakeUI?.Trigger()
    }

}

function getCheckpointSize(index: number, totalPlayers: number) {


    if (index < 0 || index >= totalPlayers) {
        return CIRCLE_MIN;
    }


    if (totalPlayers === 1) {
        return CIRCLE_MIN
    }


    const normalized = index / (totalPlayers - 1);


    return CIRCLE_MIN + normalized * (CIRCLE_MAX - CIRCLE_MIN);
}

class HoH_CheckpointWorldIconsHolder {

    #playerprofile: PlayerProfile;

    color: mod.Vector;
    circleSize: number = 40;
    directionForwardOffset: number = 35
    amountoficons: number = 8;
    checkpointWorldIcons: mod.WorldIcon[] = [];



    constructor(playerprofile: PlayerProfile, color: mod.Vector) {
        this.#playerprofile = playerprofile;
        this.color = color;

        const checkpointWidgets = generatePointsInACircle(this.#playerprofile.checkPointPosition2, this.#playerprofile.checkPointPositionLookDirection2, this.circleSize, this.amountoficons)



        //Circle widgets
        checkpointWidgets.forEach(element => {
            const worldicon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, mod.CreateVector(element.x, element.y, element.z), mod.CreateVector(0, 0, 0))
            mod.SetWorldIconPosition(worldicon, mod.CreateVector(element.x, element.y, element.z))
            mod.SetWorldIconColor(worldicon, color)
            mod.SetWorldIconImage(worldicon, mod.WorldIconImages.Triangle)
            mod.EnableWorldIconImage(worldicon, false)
            mod.SetWorldIconOwner(worldicon, mod.GetTeam(this.#playerprofile.player))
            this.checkpointWorldIcons.push(worldicon)
        });
    }


    Hide() {
        this.checkpointWorldIcons.forEach(worldicon => {
            mod.EnableWorldIconImage(worldicon, false)
        });
    }

    async Refresh() {
        if (!this.#playerprofile.completedTrack) {
            this.Hide()

            await mod.Wait(1)

            this.checkpointWorldIcons.forEach(worldicon => {
                mod.EnableWorldIconImage(worldicon, true)
                mod.GetObjectPosition(worldicon)
            });
        }
    }

    Update(checkpointposition: Vector3, nextcheckpointPosition: Vector3, circleSize: number = this.circleSize) {
        console.log("Update world icon positions")

        const checkpointWidgets = generatePointsInACircle(checkpointposition, nextcheckpointPosition, circleSize, this.amountoficons)

        for (let index = 0; index < this.checkpointWorldIcons.length; index++) {

            const position = checkpointWidgets[index]
            const widget = this.checkpointWorldIcons[index]

            mod.SetWorldIconPosition(widget, mod.CreateVector(position.x, position.y, position.z))
            mod.EnableWorldIconImage(widget, true)
        }

    }
}

function getLookAtRotation(from: Vector3, to: Vector3): Vector3 {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;

    const distanceXZ = Math.sqrt(dx * dx + dz * dz);

    const pitch = Math.atan2(dy, distanceXZ);
    const yaw = Math.atan2(dx, dz);
    const roll = 0;

    return { x: pitch, y: yaw, z: roll };
}

async function SpawnVFXAtPosition(targetpoint: mod.Vector, vfx: any, rotation?: mod.Vector, scale?: mod.Vector) {


    const flareVFX = mod.SpawnObject(vfx, targetpoint, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));

    mod.EnableVFX(flareVFX, true)
}

export async function OnVehicleSpawned(eventVehicle: mod.Vehicle) {
    VehicleHandler.OnVehicleSpawned(eventVehicle)
}

type VehicleAssignment = {
    player: mod.Player;
    position: mod.Vector;
    vehicleSpawner: mod.VehicleSpawner;
    vehicle?: mod.Vehicle;
};

class VehicleHandler {

    static playerNeedingVehicle: VehicleAssignment[] = [];


    static RequestVehicle(playerProfile: PlayerProfile) {
        if (currentRace?.trackState == TrackState.starting || currentRace?.trackState == TrackState.running || currentRace?.trackState == TrackState.winnerFound || currentRace?.trackState == TrackState.over) {

            const currentCheckpoint = (playerProfile.checkpoint) % currentRace.checkPoints.length
            const checkPoint = currentRace.checkPoints[currentCheckpoint];
            if (!checkPoint) {
                return;
            }

            const spawnPosition = generateSpawnLine(checkPoint.checkpointStart, checkPoint.checkpointEnd, MapPlayers, checkPoint.flipdir ? "right" : "left")
            const targetSpawnPoint = spawnPosition[playerProfile.playerRacerNumber]


            const vehSpawner = mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, ConverVector3ToModVector(targetSpawnPoint.position), ConverVector3ToModVector(getLookAtRotation(targetSpawnPoint.position, targetSpawnPoint.forwardPosition)))


            console.log("Target Spawn point " + targetSpawnPoint.position.x + " " + targetSpawnPoint.position.y + " " + targetSpawnPoint.position.z)

            VehicleHandler.playerNeedingVehicle.push({ player: playerProfile.player, position: ConverVector3ToModVector(targetSpawnPoint.position), vehicleSpawner: vehSpawner })


            playerProfile.playerSpawnedVehSpawner = vehSpawner;

            mod.SetVehicleSpawnerVehicleType(vehSpawner, playerProfile.selectedVehicle)
            mod.ForceVehicleSpawnerSpawn(vehSpawner)
        }

    }

    static async OnVehicleSpawned(eventVehicle: mod.Vehicle) {

        console.log("OnVehicleSpawned")

        if (VehicleHandler.playerNeedingVehicle.length == 0) {
            return;
        }

        const vehiclePos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition)
        let closestDistance: number | null = null;
        let targetVehicleSpawner: VehicleAssignment | undefined;

        for (const veh of VehicleHandler.playerNeedingVehicle) {
            const distance = mod.DistanceBetween(vehiclePos, veh.position);
            console.log("Distance between vehicle and point: " + distance)
            if (distance <= 25 && (closestDistance === null || distance < closestDistance)) {
                closestDistance = distance;
                targetVehicleSpawner = veh;
            }
        }

        if (targetVehicleSpawner == undefined) {
            console.log("Could not find a vehicle close enough to the vehicle spawnpoint")
            return
        }

        const index = VehicleHandler.playerNeedingVehicle.indexOf(targetVehicleSpawner);
        if (index !== -1) {
            VehicleHandler.playerNeedingVehicle.splice(index, 1);
        }


        while (currentRace.IsPlayerInRace(targetVehicleSpawner.player) && !mod.GetSoldierState(targetVehicleSpawner.player, mod.SoldierStateBool.IsAlive)) {
            await mod.Wait(0.1)
        }


        const pprofile = PlayerProfile.get(targetVehicleSpawner.player)
        if (!pprofile) {
            return
        }


        pprofile.playerSpawnedVeh = eventVehicle;

        // If player disconected remove their vehicle we just spawned.
        if (!currentRace.IsPlayerInRace(targetVehicleSpawner.player)) {
            pprofile.DestroyVehicle()
            return
        }

        const spawnOffset = mod.Add(vehiclePos, mod.CreateVector(0, 10, 0))

        mod.Teleport(targetVehicleSpawner.player, spawnOffset, 0)

        await mod.Wait(0.5)
        mod.ForcePlayerToSeat(targetVehicleSpawner.player, eventVehicle, 0)


        console.log("Vehicle ready: Seating player")
    }
}

export function ConverVector3ToModVector(vector3: Vector3): mod.Vector {
    return mod.CreateVector(vector3.x, vector3.y, vector3.z)
}

interface SpawnPoint {
    position: Vector3;        // point on the line
    forwardPosition: Vector3; // 10 units to the left
}

function generateSpawnLine(
    start: Vector3,
    end: Vector3,
    count: number,
    direction: "left" | "right" = "left",
    distance: number = 10,
    up: Vector3 = { x: 0, y: 1, z: 0 }
): SpawnPoint[] {
    if (count < 2) {
        throw new Error("Count must be at least 2 to generate a line.");
    }

    const spawnPoints: SpawnPoint[] = [];

    // Forward vector along line
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const forward = { x: dx / len, y: dy / len, z: dz / len };

    // Compute left = up × forward (always "left", never flipped)
    const left = {
        x: up.y * forward.z - up.z * forward.y,
        y: up.z * forward.x - up.x * forward.z,
        z: up.x * forward.y - up.y * forward.x,
    };

    // Scale left vector to desired distance
    const sideScaled = { x: left.x * distance, y: left.y * distance, z: left.z * distance };

    // Step size
    const stepX = dx / (count - 1);
    const stepY = dy / (count - 1);
    const stepZ = dz / (count - 1);

    for (let i = 0; i < count; i++) {
        const position = {
            x: start.x + stepX * i,
            y: start.y + stepY * i,
            z: start.z + stepZ * i,
        };

        const forwardPosition = {
            x: position.x + sideScaled.x,
            y: position.y + sideScaled.y,
            z: position.z + sideScaled.z,
        };

        spawnPoints.push({ position, forwardPosition });
    }

    // Reverse array order if "right"
    if (direction === "right") {
        return spawnPoints.reverse();
    }

    return spawnPoints;
}

export async function OnPlayerLeaveGame(eventNumber: number) {
    console.log("Player left the game. Removing invalid players")
    currentRace?.PlayerLeftGame()
    PlayerProfile.removeInvalidPlayers()
}


export async function OnPlayerDeployed(player: mod.Player) {

    try {

        //Add remove weapons code
        mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon)
        mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon)
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne)
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo)
        mod.RemoveEquipment(player, mod.InventorySlots.ClassGadget)

    } catch (error) {

    }

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {

        if (currentRace?.trackState == TrackState.selected) {
            currentRace.AddPlayerToTrack(player)
            currentRace.StartCountdown();

        } else if (currentRace?.trackState == TrackState.running ||
            currentRace?.trackState == TrackState.winnerFound ||
            currentRace?.trackState == TrackState.over) {

            const playerprofile = PlayerProfile.get(player)

            if (!currentRace.IsPlayerInRace(player)) {
                currentRace.AddPlayerToTrack(player)
                playerprofile?.ScoreboardUI?.open()
                playerprofile?.InitRacer();
                playerprofile?.UpdateWorldIconPosition();
                playerprofile?.BoosterDisableUI?.Trigger()
                playerprofile?.RefreshWorldIcons()

                currentRace.playersInRace.forEach(playerProfile => {
                    playerProfile.ScoreboardUI?.update()
                })
                return
            }

            if (playerprofile) {
                VehicleHandler.RequestVehicle(playerprofile)
                playerprofile.BoosterDisableUI?.Trigger()
                playerprofile.RefreshWorldIcons()
            }

        }

    } else {

        if (currentRace?.trackState == TrackState.running || currentRace?.trackState == TrackState.winnerFound) {

            const position = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition)
            const closesVeh = GetUnoccupiedVehicleInRange(position)

            if (closesVeh) {
                mod.ForcePlayerToSeat(player, closesVeh, 0)
                TargetFirstPlayer(player)
            } else {
                //AiStingerAmmo(player)
            }


        } else {
            console.log("Debug Ai Spawned")

            mod.AIEnableShooting(player, false)
            mod.AIEnableTargeting(player, false)
            currentRace.AddPlayerToTrack(player)
            const playerprofile = PlayerProfile.get(player)
            if (playerprofile) {
                playerprofile.readyUp = true;
            }

        }
    }



}


async function TargetFirstPlayer(player: mod.Player) {
    while (mod.IsPlayerValid(player) && currentRace.trackState == TrackState.running) {

        mod.AISetTarget(player, currentRace.playersInRace[0].player)

        await mod.Wait(0.1);
        const inputduration = 5; //getRandomFloatInRange(0.1,2);
        mod.AIForceFire(player, inputduration);

        //mod.AIForceFire(player,10)

        await mod.Wait(5)
    }

}

function GetUnoccupiedVehicleInRange(pos: mod.Vector): mod.Vehicle | undefined {

    const allVeh = mod.AllVehicles();

    for (let index = 0; index < mod.CountOf(allVeh); index++) {
        const veh = mod.ValueInArray(allVeh, index)
        if (!mod.IsVehicleOccupied(veh)) {
            const vehPos = mod.GetVehicleState(veh, mod.VehicleStateVector.VehiclePosition);
            if (mod.DistanceBetween(pos, vehPos) <= 15) {
                return veh;
            }
        }
    }
    console.log("Could not find vehicle close enough.")
    return undefined
}

export async function OnPlayerDied(player: mod.Player) {

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {

        const playerProf = PlayerProfile.get(player);

        if (playerProf) {
            playerProf.DestroyVehicle()
            playerProf.BoosterDisableUI?.Trigger()
        }

    }
}

function generatePointsInACircle(
    center: Vector3,
    lookAt: Vector3,
    radius: number,
    segments: number
): Vector3[] {
    const positions: Vector3[] = [];

    // Compute forward direction vector
    const forward = normalizeVector(subtractVectors(lookAt, center));

    // Choose arbitrary up vector
    const worldUp = { x: 0, y: 1, z: 0 };

    // Compute right vector
    let right = crossProduct(worldUp, forward);
    if (length(right) < 0.0001) {
        // If forward is parallel to worldUp, use another up
        right = crossProduct({ x: 1, y: 0, z: 0 }, forward);
    }
    right = normalizeVector(right);

    // Compute actual up vector perpendicular to forward and right
    const up = normalizeVector(crossProduct(forward, right));

    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const point = {
            x: center.x + right.x * x + up.x * y,
            y: center.y + right.y * x + up.y * y,
            z: center.z + right.z * x + up.z * y,
        };

        positions.push(point);
    }

    return positions;
}

function subtractVectors(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function normalizeVector(v: Vector3): Vector3 {
    const len = length(v);
    return len === 0 ? { x: 0, y: 0, z: 0 } : { x: v.x / len, y: v.y / len, z: v.z / len };
}

function crossProduct(a: Vector3, b: Vector3): Vector3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

function length(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}


export async function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {

    const playerProfile = PlayerProfile.get(eventPlayer)

    if (!playerProfile) {
        return
    }

    playerProfile.VehicleShopUI?.OnButtonPressed(eventPlayer, eventUIWidget, eventUIButtonEvent)
}



function Lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}





// === acePursuitRawData.ts ===



const tracks: RaceTrack[] = [
    {
        trackId: "track_01",
        name: "Quad_Chaos",
        laps: 3,
        availableVehicles: [mod.VehicleList.Quadbike],
        gametype: GameType.race,
        checkPoints: [

        ]
    },
    {
        trackId: "track_02",
        name: "Air_Lap",
        laps: 1,
        availableVehicles: [mod.VehicleList.F22, mod.VehicleList.F16, mod.VehicleList.JAS39],
        gametype: GameType.race,
        checkPoints: [
            { id: 106, checkpointStart: { x: 224.177551269531, y: 185.776763916016, z: -25.1318969726563 }, checkpointEnd: { x: 88.1495590209961, y: 185.776763916016, z: 105.332855224609 }, position: { x: 547.106201171875, y: 183.570999145508, z: 453.183319091797 } },
            { id: 107, checkpointStart: { x: 224.177551269531, y: 185.776763916016, z: -25.1318969726563 }, checkpointEnd: { x: 88.1495590209961, y: 185.776763916016, z: 105.332855224609 }, position: { x: 883.77880859375, y: 201.873992919922, z: 898.134033203125 } },

            { id: 108, checkpointStart: { x: 1174.2579345, y: 187.2900, z: 1043.66088 }, checkpointEnd: { x: 1047.197265625, y: 186.30224609375, z: 1181.48742675781 }, position: { x: 1552.362, y: 201.8742, z: 1429.677 } },
            { id: 109, checkpointStart: { x: 1174.2579345, y: 187.2900, z: 1043.66088 }, checkpointEnd: { x: 1047.197265625, y: 186.30224609375, z: 1181.48742675781 }, position: { x: 2048.393, y: 208.4673, z: 1706.873 } },

            { id: 110, checkpointStart: { x: 2296.06323242188, y: 188.086486816406, z: 1665.53356933594 }, checkpointEnd: { x: 2205.1943359375, y: 187.098724365234, z: 1829.49523925781 }, position: { x: 2676.97, y: 208.4673, z: 1946.0 } },
            { id: 111, checkpointStart: { x: 2296.06323242188, y: 188.086486816406, z: 1665.53356933594 }, checkpointEnd: { x: 2205.1943359375, y: 187.098724365234, z: 1829.49523925781 }, position: { x: 3299.96630859375, y: 261.307495117188, z: 2330.958984375 } },

            { id: 112, checkpointStart: { x: 3409.69604492188, y: 187.067138671875, z: 2247.3193359375 }, checkpointEnd: { x: 3268.25463867188, y: 186.079376220703, z: 2370.34326171875 }, position: { x: 3939.844, y: 263.038, z: 2924.436 } },
            { id: 113, checkpointStart: { x: 3409.69604492188, y: 187.067138671875, z: 2247.3193359375 }, checkpointEnd: { x: 3268.25463867188, y: 186.079376220703, z: 2370.34326171875 }, position: { x: 4617.52392578125, y: 271.122009277344, z: 3677.669921875 } },
           
            { id: 114, checkpointStart: { x: 4671.20703125, y: 310.601776123047, z: 4259.2900390625 }, checkpointEnd:  { x: 4805.0439453125, y: 310.499969482422, z: 4372.10498046875 }, position: { x: 5288.721, y: 355.434, z: 3896.095 }, },
            { id: 115, checkpointStart: { x: 4671.20703125, y: 310.601776123047, z: 4259.2900390625 }, checkpointEnd:  { x: 4805.0439453125, y: 310.499969482422, z: 4372.10498046875 }, position: { x: 5466.977, y: 423.387, z: 3535.378 }, },

            { id: 116, checkpointStart: { x: 5552.3984375, y: 530.694274902344, z: 3811.77294921875 }, checkpointEnd: { x: 5708.0478515625, y: 529.706481933594, z: 3722.24780273438 }, position: { x: 5326.602, y: 557.992, z: 3181.616 } },
            { id: 117, checkpointStart: { x: 5552.3984375, y: 530.694274902344, z: 3811.77294921875 }, checkpointEnd: { x: 5708.0478515625, y: 529.706481933594, z: 3722.24780273438 }, position: { x: 4515.22607421875, y: 441.529144287109, z: 2739.50341796875 } },

            { id: 118, checkpointStart: { x: 4541.82080078125, y: 328.444671630859, z: 2850.97265625 }, checkpointEnd: { x: 4629.31396484375, y: 327.456909179688, z: 2685.18530273438 }, position: { x: 3970.04, y: 334.594, z: 2572.894 } },
            { id: 119, checkpointStart: { x: 4541.82080078125, y: 328.444671630859, z: 2850.97265625 }, checkpointEnd: { x: 4629.31396484375, y: 327.456909179688, z: 2685.18530273438 }, position: { x: 3342.115, y: 260.9633, z: 2219.49 } },

            { id: 120, checkpointStart: { x: 3309.59326171875, y: 187.919281005859, z: 2412.44750976563 }, checkpointEnd: { x: 3450.93359375, y: 186.931518554688, z: 2289.3076171875 }, position: { x: 2624.016, y: 293.6768, z: 2070.868 }, flipdir: true },
            { id: 121, checkpointStart: { x: 3309.59326171875, y: 187.919281005859, z: 2412.44750976563 }, checkpointEnd: { x: 3450.93359375, y: 186.931518554688, z: 2289.3076171875 }, position: { x: 2050.632, y: 311.7585, z: 1620.939 }, flipdir: true },

            { id: 1210, checkpointStart: { x: 2259.86279296875, y: 187.481216430664, z: 1861.27551269531 }, checkpointEnd: { x: 2349.51904296875, y: 186.493453979492, z: 1696.64758300781 }, position: { x: 1518.23, y: 323.8511, z: 1482.588 }, flipdir: true },
            { id: 122, checkpointStart: { x: 2259.86279296875, y: 187.481216430664, z: 1861.27551269531 }, checkpointEnd: { x: 2349.51904296875, y: 186.493453979492, z: 1696.64758300781 }, position: { x: 1042.26672363281, y: 292.134704589844, z: 854.870483398438 }, flipdir: true },

            { id: 123, checkpointStart: { x: 1088.71118164063, y: 186.349456787109, z: 1222.66943359375 }, checkpointEnd: { x: 1216.44152832031, y: 185.361694335938, z: 1085.46325683594 }, position: { x: 393.625457763672, y: 350.244506835938, z: 96.0521240234375 }, flipdir: true },

            { id: 1230, checkpointStart: { x: 127.68977355957, y: 185.05647277832, z: 148.481643676758 }, checkpointEnd: { x: 262.190673828125, y: 183.409637451172, z: 17.2779006958008 }, position: { x: -78.9294662475586, y: 213.880004882813, z: -173.546005249023 }, flipdir: true },
            { id: 124, checkpointStart: { x: 127.68977355957, y: 185.05647277832, z: 148.481643676758 }, checkpointEnd: { x: 262.190673828125, y: 183.409637451172, z: 17.2779006958008 }, position: { x: -530.65, y: 301.9926, z: -101.325 }, flipdir: true },
            { id: 125, checkpointStart: { x: 127.68977355957, y: 185.05647277832, z: 148.481643676758 }, checkpointEnd: { x: 262.190673828125, y: 183.409637451172, z: 17.2779006958008 }, position: { x: -1235.055, y: 251.483, z: -262.1271 }, flipdir: true },

            { id: 126, checkpointStart: { x: -2109.8779296875, y: 483.681701660156, z: -280.909484863281 }, checkpointEnd: { x: -2105.28930664063, y: 482.693939208984, z: -468.311492919922 }, position: { x: -2510.07, y: 675.4128, z: -367.911 } },
            { id: 127, checkpointStart: { x: -2109.8779296875, y: 483.681701660156, z: -280.909484863281 }, checkpointEnd: { x: -2105.28930664063, y: 482.693939208984, z: -468.311492919922 }, position: { x: -3051.823, y: 992.7201, z: -134.6379 } },
            { id: 1280, checkpointStart: { x: -2109.8779296875, y: 483.681701660156, z: -280.909484863281 }, checkpointEnd: { x: -2105.28930664063, y: 482.693939208984, z: -468.311492919922 }, position: { x: -3324.713, y: 924.931, z: 221.4012 } },

            { id: 128, checkpointStart: { x: -2947.99340820313, y: 739.220336914063, z: 93.411865234375 }, checkpointEnd: { x: -3132.34106445313, y: 738.232543945313, z: 59.4026794433594 }, position: { x: -3465.781, y: 875.6663, z: 683.3296 } },
            { id: 129, checkpointStart: { x: -2947.99340820313, y: 739.220336914063, z: 93.411865234375 }, checkpointEnd: { x: -3132.34106445313, y: 738.232543945313, z: 59.4026794433594 }, position: { x: -3273.344, y: 829.738, z: 973.0317 } },
            { id: 130, checkpointStart: { x: -2947.99340820313, y: 739.220336914063, z: 93.411865234375 }, checkpointEnd: { x: -3132.34106445313, y: 738.232543945313, z: 59.4026794433594 }, position: { x: -2918.56, y: 751.904, z: 941.331 } },

            { id: 1300, checkpointStart: { x: -2819.57739257813, y: 607.91748046875, z: 672.408569335938 }, checkpointEnd: { x: -2648.84423828125, y: 606.9296875, z: 749.808410644531 }, position: { x: -2617.48413085938, y: 633.155151367188, z: 378.069183349609 } },
            { id: 131, checkpointStart: { x: -2819.57739257813, y: 607.91748046875, z: 672.408569335938 }, checkpointEnd: { x: -2648.84423828125, y: 606.9296875, z: 749.808410644531 }, position: { x: -2477.86, y: 537.821, z: 174.285 } },

            { id: 132, checkpointStart: { x: -2157.56713867188, y: 482.034240722656, z: -155.647933959961 }, checkpointEnd: { x: -2166.33764648438, y: 481.046478271484, z: 31.6049041748047 }, position: { x: -1207.372, y: 354.4803, z: -96.10004 } },
            { id: 133, checkpointStart: { x: -2157.56713867188, y: 482.034240722656, z: -155.647933959961 }, checkpointEnd: { x: -2166.33764648438, y: 481.046478271484, z: 31.6049041748047 }, position: { x: -80.90897, y: 260.4618, z: 68.27824 } },

        ]
    }
];


// === UI_BenjiOvertake.ts ===


class HoH_BenjiOvertakeUI {

    #playerprofile: PlayerProfile;

    rootwidgets: mod.UIWidget[] = [];

    constructor(playerProfile: PlayerProfile) {
        this.#playerprofile = playerProfile;
        this.#Create();
    }

    Delete() {

        for (let index = 0; index < this.rootwidgets.length; index++) {
            const element = this.rootwidgets[index];
             mod.DeleteUIWidget(element)
        }

    }

    Close(){
           this.rootwidgets.forEach(rootwidget => {
            mod.SetUIWidgetVisible(rootwidget, false)
        });
    }

    #Create() {
        const coolahhuiname: string = "overtake_message_" + this.#playerprofile.playerProfileId;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 100, 0), mod.CreateVector(200, 40, 0), mod.UIAnchor.TopCenter, MakeMessage(mod.stringkeys.overtakenmessage), this.#playerprofile.player);
        const widget = mod.FindUIWidgetWithName(coolahhuiname);
        mod.SetUITextColor(widget, mod.CreateVector(0, 0, 0));
        mod.SetUITextSize(widget, 40);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, -100);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(0.678, 0.753, 0.800));
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);
        this.rootwidgets.push(widget)

        this.rootwidgets.push(this.CreateFadeLineUI(true))
        this.rootwidgets.push(this.CreateFadeLineUI(false))
    }


    CreateFadeLineUI(right: boolean): mod.UIWidget {
        const coolahhuiname: string = "overtake_message_line_" + right + "_" + this.#playerprofile.playerProfileId;
        let horizontalOffset: number = right ? 175 : -175;
        mod.AddUIContainer(coolahhuiname, mod.CreateVector(horizontalOffset, 100, 0), mod.CreateVector(150, 40, 0), mod.UIAnchor.TopCenter, this.#playerprofile.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname);
        mod.SetUIWidgetPadding(widget, 1);
        right ? mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientLeft) : mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientRight);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(0.678, 0.753, 0.800));
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }


    async Trigger() {

        if (this.FeedbackBeingShown) {
            return;
        }
        this.FeedbackBeingShown = true;


        mod.SetUIWidgetVisible(this.rootwidgets[0], true);
        mod.SetUIWidgetBgAlpha(this.rootwidgets[0], 1);
        mod.SetUITextAlpha(this.rootwidgets[0], 1);

        mod.SetUIWidgetVisible(this.rootwidgets[1], true);
        mod.SetUIWidgetVisible(this.rootwidgets[2], true);
        mod.SetUIWidgetBgAlpha(this.rootwidgets[1], 1);
        mod.SetUIWidgetBgAlpha(this.rootwidgets[2], 1);

        await mod.Wait(2.0);
        this.InterpFeedback();
        await mod.Wait(5.0);

        this.FeedbackBeingShown = false;
        mod.SetUIWidgetVisible(this.rootwidgets[0], false);
        mod.SetUIWidgetVisible(this.rootwidgets[1], false);
        mod.SetUIWidgetVisible(this.rootwidgets[2], false);
    }
    FeedbackBeingShown: boolean = false;
    FeedbackQueued: boolean = false;

    async InterpFeedback() {


        let currentLerpvalue: number = 0;
        let lerpIncrement: number = 0;
        while (currentLerpvalue < 1.0) {
            if (!this.FeedbackBeingShown) break;
            lerpIncrement = lerpIncrement + 0.1;
            currentLerpvalue = Lerp(currentLerpvalue, 1, lerpIncrement);
            mod.SetUIWidgetBgAlpha(this.rootwidgets[0], 1 - currentLerpvalue);
            mod.SetUITextAlpha(this.rootwidgets[0], 1 - currentLerpvalue);
            mod.SetUIWidgetBgAlpha(this.rootwidgets[1], 1 - currentLerpvalue);
            mod.SetUIWidgetBgAlpha(this.rootwidgets[2], 1 - currentLerpvalue);
            await mod.Wait(0.1);
        }

    }

}

// === UI_BoosterDisabled.ts ===


class HoH_BoosterDisabledUI {
    private currentRunId = 0;
    #playerprofile: PlayerProfile;
    private WidgetON = false;
    rootwidgets: mod.UIWidget[] = [];
    constructor(playerProfile: PlayerProfile) {
        this.#playerprofile = playerProfile;
        this.#Create();
    }
    Delete() {

        for (let index = 0; index < this.rootwidgets.length; index++) {
            const element = this.rootwidgets[index];
            mod.DeleteUIWidget(element)
        }

    }

    Close() {
        this.rootwidgets.forEach(rootwidget => {
            mod.SetUIWidgetVisible(rootwidget, false)
        });
    }

    widgetHeightPos = 120;
    widgetHorisontalPos = -170;

    #Create() {
        const coolahhuiname: string = "booster_disable_message_" + this.#playerprofile.playerProfileId;
        mod.AddUIText(coolahhuiname, mod.CreateVector(this.widgetHorisontalPos, this.widgetHeightPos, 0), mod.CreateVector(205, 36, 0), mod.UIAnchor.BottomCenter, MakeMessage(mod.stringkeys.boosterdisabled), this.#playerprofile.player);
        const widget = mod.FindUIWidgetWithName(coolahhuiname);
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 1));
        mod.SetUITextSize(widget, 14);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, -100);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(0.68, 0, 0));
        mod.SetUIWidgetBgAlpha(widget, 1.0);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI)
        mod.SetUIWidgetVisible(widget, false);
        this.rootwidgets.push(widget)

    }


    async Trigger() {

        if (!mod.IsPlayerValid(this.#playerprofile.player)) return;

        const isAlive = mod.GetSoldierState(
            this.#playerprofile.player,
            mod.SoldierStateBool.IsAlive
        );
        if (!isAlive) {
            mod.SetUIWidgetVisible(this.rootwidgets[0], false);
            return;
        }

        if (this.#playerprofile.boosterDisabled) {
            mod.SetUIWidgetVisible(this.rootwidgets[0], true);
        } else {
            mod.SetUIWidgetVisible(this.rootwidgets[0], false);
        }

    }

}

// === UI_EndingGameCountdown.ts ===



class HoH_UIEndingGameCountdown {
    #Player: PlayerProfile

    headerWidget: mod.UIWidget | undefined
    textWidget: mod.UIWidget | undefined

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf;

        const bfBlueColor = [0.678, 0.753, 0.800]
        const height = 35;
        const width = 240;
        this.headerWidget = ParseUI(
            {
                type: "Container",
                size: [width, height],
                position: [0, 155],
                name: "ending_countdown_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.TopCenter,
                bgFill: mod.UIBgFill.Blur,
                bgColor: [0.2, 0.2, 0.3],
                bgAlpha: 0.8,
                playerId: playerProf.player,
                visible: false,
                children: [
                    {
                        type: "Text",
                        name: "ending_countdown_text_" + this.#Player.playerProfileId,
                        size: [width, height],
                        position: [0, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.None,
                        textColor: bfBlueColor,
                        textAnchor: mod.UIAnchor.Center,
                        textLabel: MakeMessage(mod.stringkeys.gameending, 12),
                        textSize: 25
                    },
                ]
            }
        )
        this.textWidget = mod.FindUIWidgetWithName("ending_countdown_text_" + this.#Player.playerProfileId)
    }


    Delete() {
        this.headerWidget && mod.DeleteUIWidget(this.headerWidget)
       // this.textWidget && mod.DeleteUIWidget(this.textWidget)
    }


    Open(timeleft: number) {
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, true)
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(mod.stringkeys.gameending, timeleft))
    }


    update(timeleft: number) {
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(mod.stringkeys.gameending, timeleft))
    }

    async Close(delayclose: number = 0) {
        await mod.Wait(delayclose)
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, false)
    }
}


// === UI_FadeInBlackScreen.ts ===



class HoH_UIBlackScreen {
    #Player: PlayerProfile

    #black_screen_widget: mod.UIWidget | undefined;

    fadeinTime: number = 1;
    fadeOutTime: number = 1;

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf

        this.#black_screen_widget = ParseUI(
            {
                type: "Container",
                size: [2500, 2500],
                position: [0, 0],
                name: "fadeScreen_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: [0, 0, 0],
                bgAlpha: 0.0,
                playerId: playerProf.player
            }
        )
    }

    Close() {
        this.#black_screen_widget && mod.SetUIWidgetVisible(this.#black_screen_widget, false)
    }

    Delete() {
        this.#black_screen_widget && mod.DeleteUIWidget(this.#black_screen_widget)
    }

    async FadeIn() {

        if (this.#black_screen_widget) {

            this.#black_screen_widget && mod.SetUIWidgetVisible(this.#black_screen_widget, true)
            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 0);


            let time = 0;

            while (time < 1) {

                time += 0.1


                if (time > 1) {
                    time = 1;
                }

                mod.SetUIWidgetBgAlpha(this.#black_screen_widget, time)
                await mod.Wait(0.1)

            }

            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 1)

        }
    }

    async FadeOut() {

        if (this.#black_screen_widget) {

            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 1);

            let time = 1;

            while (time > 0) {

                time -= 0.1

                if (time < 0) {
                    time = 0;
                }

                mod.SetUIWidgetBgAlpha(this.#black_screen_widget, time)
                await mod.Wait(0.1)

            }

            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 0);
            this.#black_screen_widget && mod.SetUIWidgetVisible(this.#black_screen_widget, false)
        }
    }
}

// === UI_GlobalHelpers.ts ===



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

function __asModVector(param: number[] | mod.Vector) {
    if (Array.isArray(param))
        return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
    else
        return param;
}

function __asModMessage(param: string | mod.Message) {
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
        params.buttonColorHover = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('buttonAlphaHover'))
        params.buttonAlphaHover = 1;
    if (!params.hasOwnProperty('buttonColorFocused'))
        params.buttonColorFocused = mod.CreateVector(1, 1, 1);
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

function ParseUI(...params: any[]) {
    let widget: mod.UIWidget | undefined;
    for (let a = 0; a < params.length; a++) {
        widget = __addUIWidget(params[a] as UIParams);
    }
    return widget;
}

// === UI_PlacementHeader.ts ===



class HoH_UIPlacementHeader {
    #Player: PlayerProfile

    headerWidget: mod.UIWidget | undefined
    textWidget: mod.UIWidget | undefined

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf;

        const bfBlueColor = [0.678, 0.753, 0.800]
        const height = 100;
        const width = 500;
        this.headerWidget = ParseUI(
            {
                type: "Container",
                size: [width, height],
                position: [0, 50],
                name: "placement_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.TopCenter,
                bgFill: mod.UIBgFill.Blur,
                bgColor: [0.2, 0.2, 0.3],
                bgAlpha: 0.9,
                playerId: playerProf.player,
                visible: false,
                children: [
                    {
                        type: "Container",
                        name: "placement_line_right_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [width / 2, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Container",
                        name: "placement_line_left_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [-width / 2, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Text",
                        name: "placement_text" + this.#Player.playerProfileId,
                        size: [width, height],
                        position: [0, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.None,
                        textColor: bfBlueColor,
                        textAnchor: mod.UIAnchor.Center,
                        textLabel: MakeMessage(mod.stringkeys.header_placement, 0),
                        textSize: 45
                    },
                ]
            }
        )
        this.textWidget = mod.FindUIWidgetWithName("placement_text" + this.#Player.playerProfileId)
    }


    Delete() {
        this.headerWidget && mod.DeleteUIWidget(this.headerWidget)
        //this.textWidget && mod.DeleteUIWidget(this.textWidget)
    }

    Open(text: string, placement: number, scale: number) {
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, true)
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(text, placement))
        this.textWidget && mod.SetUITextSize(this.textWidget, scale)
    }

    update() {
    }

    async Close(delayclose: number = 0) {
        await mod.Wait(delayclose)
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, false)
    }

}

// === UI_Scoreboard.ts ===



class HoH_ScoreboardUI {

    #playerProfile: PlayerProfile;
    #CoreWidget: mod.UIWidget | undefined;

    #scoreboardPlacement_text: mod.UIWidget | undefined

    #ScoreboardplayerName: mod.UIWidget[] = []
    #ScoreboardPlacement: mod.UIWidget[] = []
    #ScoreboardTimeOne: mod.UIWidget[] = []
    #ScoreboardTimeTwo: mod.UIWidget[] = []

    constructor(playerprofile: PlayerProfile) {
        this.#playerProfile = playerprofile
        this.Create()
    }


    Delete() {
        this.#CoreWidget && mod.DeleteUIWidget(this.#CoreWidget)
    }


    update() {
        console.log("Update Scoreboard positions")

        this.#CoreWidget && mod.SetUIWidgetVisible(this.#CoreWidget, true)

        const playerPositionInRace = currentRace.playersInRace.indexOf(this.#playerProfile)

        this.#scoreboardPlacement_text && mod.SetUITextLabel(this.#scoreboardPlacement_text, MakeMessage(mod.stringkeys.position_in_race, playerPositionInRace + 1, currentRace.playersInRace.length))

        for (let index = 0; index < this.#ScoreboardplayerName.length; index++) {
            const playerInPos = this.indexExists(currentRace.playersInRace, index)


            if (playerInPos) {

                const playerProf = currentRace.playersInRace[index];
                const playerTime = playerProf.playerRaceTime;

                if (playerTime) {
                    const formatTime = this.FormatTime(playerTime - currentRace.raceTime)

                    mod.SetUITextLabel(this.#ScoreboardTimeOne[index], MakeMessage(mod.stringkeys.scoreboard_1_time_1, formatTime[0], formatTime[1]))
                    mod.SetUITextLabel(this.#ScoreboardTimeTwo[index], MakeMessage(mod.stringkeys.scoreboard_1_time_2, formatTime[2], formatTime[3], formatTime[4]))

                    mod.SetUIWidgetVisible(this.#ScoreboardTimeOne[index], true)
                    mod.SetUIWidgetVisible(this.#ScoreboardTimeTwo[index], true)
                } else {
                    mod.SetUIWidgetVisible(this.#ScoreboardTimeOne[index], false)
                    mod.SetUIWidgetVisible(this.#ScoreboardTimeTwo[index], false)
                }

                mod.SetUIWidgetVisible(this.#ScoreboardplayerName[index], true)
                mod.SetUIWidgetVisible(this.#ScoreboardPlacement[index], true)


                mod.SetUITextLabel(this.#ScoreboardplayerName[index], MakeMessage(mod.stringkeys.scoreboard_1_name, currentRace.playersInRace[index].player))


                if (currentRace.trackState == TrackState.selected) {
                    //Makes the players name green when ready
                    if (playerProf.readyUp) {
                        mod.SetUITextColor(this.#ScoreboardplayerName[index], mod.CreateVector(0.4196, 0.9098, 0.0745))
                        mod.SetUITextColor(this.#ScoreboardPlacement[index], mod.CreateVector(0.4196, 0.9098, 0.0745))
                        mod.SetUITextColor(this.#ScoreboardTimeOne[index], mod.CreateVector(0.4196, 0.9098, 0.0745))
                        mod.SetUITextColor(this.#ScoreboardTimeTwo[index], mod.CreateVector(0.4196, 0.9098, 0.0745))
                    } else {
                        mod.SetUITextColor(this.#ScoreboardplayerName[index], mod.CreateVector(0.678, 0.753, 0.800))
                        mod.SetUITextColor(this.#ScoreboardPlacement[index], mod.CreateVector(0.678, 0.753, 0.800))
                        mod.SetUITextColor(this.#ScoreboardTimeOne[index], mod.CreateVector(0.678, 0.753, 0.800))
                        mod.SetUITextColor(this.#ScoreboardTimeTwo[index], mod.CreateVector(0.678, 0.753, 0.800))
                    }

                } else if (index == playerPositionInRace) {
                    mod.SetUITextColor(this.#ScoreboardplayerName[index], mod.CreateVector(1, 1, 0))
                    mod.SetUITextColor(this.#ScoreboardPlacement[index], mod.CreateVector(1, 1, 0))
                    mod.SetUITextColor(this.#ScoreboardTimeOne[index], mod.CreateVector(1, 1, 0))
                    mod.SetUITextColor(this.#ScoreboardTimeTwo[index], mod.CreateVector(1, 1, 0))
                } else {
                    mod.SetUITextColor(this.#ScoreboardplayerName[index], mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUITextColor(this.#ScoreboardPlacement[index], mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUITextColor(this.#ScoreboardTimeOne[index], mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUITextColor(this.#ScoreboardTimeTwo[index], mod.CreateVector(0.678, 0.753, 0.800))
                }

            } else {

                mod.SetUIWidgetVisible(this.#ScoreboardplayerName[index], false)
                mod.SetUIWidgetVisible(this.#ScoreboardPlacement[index], false)
                mod.SetUIWidgetVisible(this.#ScoreboardTimeOne[index], false)
                mod.SetUIWidgetVisible(this.#ScoreboardTimeTwo[index], false)
            }

        }
    }

    indexExists<T>(array: T[], index: number): boolean {
        return index >= 0 && index < array.length;
    }

    FormatTime(time: number,): number[] {


        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const tenths = Math.floor((time % 1) * 10);

        const result: number[] = [];

        // Ensure minutes are always 2 digits
        result.push(Math.floor(minutes / 10));
        result.push(minutes % 10);

        // Ensure seconds are always 2 digits
        result.push(Math.floor(seconds / 10));
        result.push(seconds % 10);

        // Tenths is always 1 digit
        result.push(tenths);

        return result;
    }

    Create() {

        console.log("Creating Scoreboard UI")
        let children = []

        const ScoreboardplayerPlacement = `Scoreboard2Placement_text_${this.#playerProfile.playerProfileId}`

        const Scoreboardlaps = `Scoreboard2laps_text_${this.#playerProfile.playerProfileId}`

        children.push(
            {
                type: "Text",
                name: ScoreboardplayerPlacement,
                textLabel: MakeMessage(mod.stringkeys.position_in_race, 1, MapPlayers),
                position: [0, -180, 1],
                size: [170, 140, 0],
                textSize: 110,
                bgFill: mod.UIBgFill.Blur,
                textColor: [0.678, 0.753, 0.800],
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.TopLeft,
                visible: true
            }
        )

        for (let index = 0; index < MapPlayers; index++) {

            const ScoreboardplayerName = `Scoreboard2playerName${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardPlacement = `Scoreboard2Placement${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeOne = `Scoreboard2TimeOne${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeTwo = `Scoreboard2TimeTwo${index}text_${this.#playerProfile.playerProfileId}`

            const rowPadding = 30;
            const startY = -125
            const y = startY + index * rowPadding;

            const textBoxHeight = 30;

            const textSize = 20;
            const textNameSize = 15;
            const timeSize = 15;

            children.push(
                {
                    type: "Text",
                    name: ScoreboardPlacement,
                    textLabel: MakeMessage(mod.stringkeys.scoreboard_1_name, index + 1),
                    position: [-15, y, 1],
                    size: [30, textBoxHeight, 0],
                    textSize: textSize,
                    bgFill: mod.UIBgFill.Blur,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true
                },
                {
                    type: "Text",
                    name: ScoreboardplayerName,
                    textLabel: MakeMessage(mod.stringkeys.X),
                    position: [20, y, 1],
                    size: [200, textBoxHeight, 0],
                    textSize: textNameSize,
                    bgFill: mod.UIBgFill.Blur,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true
                },
                {
                    type: "Text",
                    name: ScoreboardTimeOne,
                    textLabel: MakeMessage(mod.stringkeys.X),
                    position: [160, y, 1],
                    size: [250, textBoxHeight, 0],
                    textSize: timeSize,
                    bgFill: mod.UIBgFill.None,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true

                },
                {
                    type: "Text",
                    name: ScoreboardTimeTwo,
                    textLabel: MakeMessage(mod.stringkeys.X),
                    position: [180, y, 1],
                    size: [250, textBoxHeight, 0],
                    textSize: timeSize,
                    bgFill: mod.UIBgFill.None,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true

                }
            )

        }

        const scoreboardContainerWidget = ParseUI({
            type: "Container",
            name: `scoreboard_Container_${this.#playerProfile.playerProfileId}`,
            position: [0, -200, 0],
            size: [250, 300, 0],
            anchor: mod.UIAnchor.CenterLeft,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.None,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#playerProfile.player,
            visible: false
        })


        this.#CoreWidget = scoreboardContainerWidget;
        this.#scoreboardPlacement_text = mod.FindUIWidgetWithName(ScoreboardplayerPlacement)

        for (let index = 0; index < MapPlayers; index++) {

            const ScoreboardPlacement = `Scoreboard2Placement${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardplayerName = `Scoreboard2playerName${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeOne = `Scoreboard2TimeOne${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeTwo = `Scoreboard2TimeTwo${index}text_${this.#playerProfile.playerProfileId}`

            this.#ScoreboardPlacement.push(mod.FindUIWidgetWithName(ScoreboardPlacement))
            this.#ScoreboardplayerName.push(mod.FindUIWidgetWithName(ScoreboardplayerName))
            this.#ScoreboardTimeOne.push(mod.FindUIWidgetWithName(ScoreboardTimeOne))
            this.#ScoreboardTimeTwo.push(mod.FindUIWidgetWithName(ScoreboardTimeTwo))
        }


        //Extra settings 
        this.#CoreWidget && mod.SetUIWidgetDepth(this.#CoreWidget, mod.UIDepth.BelowGameUI)
    }

    open() {
        if (this.#CoreWidget == undefined) {
            this.Create()
        }

        this.update()

        this.#CoreWidget && mod.SetUIWidgetVisible(this.#CoreWidget, true)
    }


    Close() {
        this.#CoreWidget && mod.SetUIWidgetVisible(this.#CoreWidget, false)
    }

}

// === UI_StartCountdown.ts ===



class HoH_UIStartCountdown {
    #Player: PlayerProfile

    headerWidget: mod.UIWidget | undefined
    textWidget: mod.UIWidget | undefined

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf;

        const bfBlueColor = [0.678, 0.753, 0.800]
        const height = 125;
        this.headerWidget = ParseUI(
            {
                type: "Container",
                size: [150, height],
                position: [0, 50],
                name: "start_countdown_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.TopCenter,
                bgFill: mod.UIBgFill.Blur,
                bgColor: [0.2, 0.2, 0.3],
                bgAlpha: 0.9,
                playerId: playerProf.player,
                visible: false,
                children: [
                    {
                        type: "Container",
                        name: "start_countdown_line_right_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [75, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Container",
                        name: "start_countdown_line_left_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [-75, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Text",
                        name: "start_countdown_text" + this.#Player.playerProfileId,
                        size: [100, height],
                        position: [0, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.None,
                        textColor: bfBlueColor,
                        textAnchor: mod.UIAnchor.Center,
                        textLabel: MakeMessage(mod.stringkeys.scoreboard_1_name),
                        textSize: 85
                    }
                ]
            }
        )
        this.textWidget = mod.FindUIWidgetWithName("start_countdown_text" + this.#Player.playerProfileId)
    }


    Delete() {
        this.headerWidget && mod.DeleteUIWidget(this.headerWidget)
        //this.textWidget && mod.DeleteUIWidget(this.textWidget)
    }

    Open(text: string, countdowntime: number) {
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, true)
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(text, countdowntime))
    }


    update(text: string, countdowntime: number) {
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(text, countdowntime))
    }

    async Close(delayclose: number = 0) {
        await mod.Wait(delayclose)
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, false)
    }

}

// === UI_VehicleSelect.ts ===



type HoH_ClickFunction = () => void;
type HoH_FocusFunction = (focusIn: boolean) => void;


const VehiclePositions = [
    { x: 217.841003417969, y: 227.279006958008, z: 558.077026367188 },
    { x: 242.748123168945, y: 228.753005981445, z: 563.011169433594 },
    { x: 268.551696777344, y: 228.162994384766, z: 568.041442871094 }
]

const playerVehicleSelectPositions = [
    [
        { x: 214.76530456543, y: 227.879440307617, z: 571.411010742188 },
        { x: 228.050430297852, y: 227.879440307617, z: 573.903076171875 }
    ],
    [
        { x: 241.145736694336, y: 227.879440307617, z: 577.202758789063 },
        { x: 254.34407043457, y: 227.879440307617, z: 580.119812011719 }
    ],
    [
        { x: 265.234405517578, y: 227.879440307617, z: 581.415283203125 },
        { x: 278.574584960938, y: 227.879440307617, z: 583.592895507813 }
    ]

]

class HoH_UIButtonHolder {

    playerProfile: PlayerProfile;

    button_id: string
    button_widget: mod.UIWidget

    button_text_id: string
    button_text_widget: mod.UIWidget

    select_text_id: string | undefined
    select_widget: mod.UIWidget | undefined

    click: HoH_ClickFunction;
    focus: HoH_FocusFunction;

    constructor(playerProfile: PlayerProfile, uniqueButtonName: string, uniqueTextName: string, uniqueSelectName?: string, clickFunction?: HoH_ClickFunction, focusFunction?: HoH_FocusFunction) {
        this.button_id = uniqueButtonName;
        this.button_widget = mod.FindUIWidgetWithName(uniqueButtonName);
        this.button_text_id = uniqueTextName;
        this.button_text_widget = mod.FindUIWidgetWithName(uniqueTextName);
        this.playerProfile = playerProfile;

        if (uniqueSelectName) {
            this.select_text_id = uniqueSelectName;
            this.select_widget = mod.FindUIWidgetWithName(uniqueSelectName)
        }

        if (focusFunction) {
            mod.EnableUIButtonEvent(this.button_widget, mod.UIButtonEvent.FocusIn, true)
            mod.EnableUIButtonEvent(this.button_widget, mod.UIButtonEvent.FocusOut, true)
        }

        this.focus = focusFunction?.bind(this) ?? this.defaultFocus;
        this.click = clickFunction?.bind(this) ?? this.defaultClick;
    }

    defaultClick() { console.log("default Click") }
    defaultFocus() { console.log("default focus") }

}

class HoH_UIVehicleSelect {

    #Left_Button_Holder: HoH_UIButtonHolder | undefined = undefined;
    #Right_Button_Holder: HoH_UIButtonHolder | undefined = undefined;

    #Readyup_Button_Holder: HoH_UIButtonHolder | undefined = undefined;

    #LEFT_BUTTON: string
    #LEFT_BUTTON_TEXT: string
    #LEFT_BUTTON_SELECTED: string

    #RIGHT_BUTTON: string
    #RIGHT_BUTTON_TEXT: string
    #RIGHT_BUTTON_SELECTED: string

    #RootWidgets: mod.UIWidget[] = []

    #PLAYERS_WAITING_TEXT: string;
    #players_ready_text_widget: mod.UIWidget | undefined;

    #PLAYERS_READY_COUNT_TEXT: string
    #players_ready_count_widget: mod.UIWidget | undefined;

    #CURRENT_SELECT_VEH_TEXT: string;
    #current_select_veh_Widget: mod.UIWidget | undefined;

    #READYUP_BUTTON: string
    #READYUP_BUTTON_TEXT: string
    #READYUP_BUTTON_SELECT: string

    #readyup_button_widget: mod.UIWidget | undefined;

    #playerProfile: PlayerProfile;

    UIOpen: boolean = false;

    selectVehNb: number = 0


    constructor(player: PlayerProfile) {
        this.#playerProfile = player;

        this.#LEFT_BUTTON = `left_veh_button_${this.#playerProfile.playerProfileId}`
        this.#LEFT_BUTTON_TEXT = `left_veh_button_text_${this.#playerProfile.playerProfileId}`
        this.#LEFT_BUTTON_SELECTED = `left_veh_button_selected_${this.#playerProfile.playerProfileId}`

        this.#RIGHT_BUTTON = `right_veh_button_${this.#playerProfile.playerProfileId}`
        this.#RIGHT_BUTTON_TEXT = `right_veh_button_text_${this.#playerProfile.playerProfileId}`
        this.#RIGHT_BUTTON_SELECTED = `right_veh_button_select_${this.#playerProfile.playerProfileId}`

        this.#READYUP_BUTTON = `readyup_veh_button_${this.#playerProfile.playerProfileId}`
        this.#READYUP_BUTTON_TEXT = `readyup_veh_button_text_${this.#playerProfile.playerProfileId}`
        this.#READYUP_BUTTON_SELECT = `readyup_veh_button_select_text_${this.#playerProfile.playerProfileId}`

        this.#PLAYERS_READY_COUNT_TEXT = `players_ready_count_text_${this.#playerProfile.playerProfileId}`
        this.#CURRENT_SELECT_VEH_TEXT = `current_select_veh_text_${this.#playerProfile.playerProfileId}`
        this.#PLAYERS_WAITING_TEXT = `players_waiting_text_${this.#playerProfile.playerProfileId}`

        this.selectVehNb = currentRace.availableVehicles.indexOf(this.#playerProfile.selectedVehicle)
    }

    UIUpdatePlayersReady() {
        const { ready, total } = currentRace.GetPlayersReady();
        this.#players_ready_count_widget && mod.SetUITextLabel(this.#players_ready_count_widget, MakeMessage(mod.stringkeys.readyplayers, ready, total))

        if (total < MinimumPlayerToStart) {
            this.#players_ready_text_widget && mod.SetUITextLabel(this.#players_ready_text_widget, MakeMessage(mod.stringkeys.waitingforplayersX, total, MapPlayers, MinimumPlayerToStart))

        }

        this.#players_ready_text_widget && mod.SetUITextLabel(this.#players_ready_text_widget, MakeMessage(mod.stringkeys.startsin, currentRace.readyupCountDown))


        currentRace.UpdateScoreboard()
    }

    EnableSwitchButtons(enabled: boolean) {
        this.#Left_Button_Holder && mod.SetUIButtonEnabled(this.#Left_Button_Holder.button_widget, enabled)
        this.#Right_Button_Holder && mod.SetUIButtonEnabled(this.#Right_Button_Holder.button_widget, enabled)

        if (enabled) {
            this.#Readyup_Button_Holder && mod.SetUIWidgetBgColor(this.#Readyup_Button_Holder.button_widget, mod.CreateVector(1, 1, 1))
            this.#Left_Button_Holder && mod.SetUIWidgetVisible(this.#Left_Button_Holder.button_widget, true)
            this.#Right_Button_Holder && mod.SetUIWidgetVisible(this.#Right_Button_Holder.button_widget, true)
        } else {
            this.#Readyup_Button_Holder && mod.SetUIWidgetBgColor(this.#Readyup_Button_Holder.button_widget, mod.CreateVector(0.4196, 0.9098, 0.0745))
            this.#Left_Button_Holder && mod.SetUIWidgetVisible(this.#Left_Button_Holder.button_widget, false)
            this.#Right_Button_Holder && mod.SetUIWidgetVisible(this.#Right_Button_Holder.button_widget, false)
        }
    }

    VehicleSelectIncrease() {
        if (this.selectVehNb > 0) {

            this.selectVehNb--;
            this.cameraTeleport();
            this.refresh();
        }
    }

    VehicleSelectDecrease() {
        if (this.selectVehNb < currentRace.availableVehicles.length - 1) {

            this.selectVehNb++;
            this.cameraTeleport()
            this.refresh();
        }
    }

    #create() {

        const { ready, total } = currentRace.GetPlayersReady();

        const bfBlueColor = [0.678, 0.753, 0.800]
        const buttonBgColor = [1, 1, 1]

        this.#RootWidgets.push(ParseUI({
            type: "Container",
            size: [500, 110],
            position: [0, 75],
            anchor: mod.UIAnchor.TopCenter,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0.2, 0.2, 0.3],
            bgAlpha: 0.9,
            playerId: this.#playerProfile.player,
            children: [{
                type: "Text",
                name: this.#PLAYERS_WAITING_TEXT,
                size: [500, 110],
                position: [0, -28],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.None,
                textColor: bfBlueColor,
                textAnchor: mod.UIAnchor.Center,
                textLabel: MakeMessage(mod.stringkeys.startsin, currentRace.readyupCountDown),
                textSize: 38
            },
            {
                type: "Text",
                name: this.#PLAYERS_READY_COUNT_TEXT,
                size: [250, 110],
                position: [0, 25],
                anchor: mod.UIAnchor.Center,
                textColor: bfBlueColor,
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                textLabel: MakeMessage(mod.stringkeys.readyplayers, ready, total),
                textSize: 24
            },
            {
                type: "Container",
                name: this.#PLAYERS_READY_COUNT_TEXT + "_left_side_line",
                size: [1, 110],
                position: [-252, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: bfBlueColor,
                bgAlpha: 1
            }, {
                type: "Container",
                name: this.#PLAYERS_READY_COUNT_TEXT + "_right_side_line",
                size: [1, 110],
                position: [251, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: bfBlueColor,
                bgAlpha: 1
            },
            {
                type: "Container",
                name: this.#PLAYERS_READY_COUNT_TEXT + "_middle_line",
                size: [425, 3],
                position: [0, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: bfBlueColor,
                bgAlpha: 1
            },
            ]
        }) as mod.UIWidget)


        this.#players_ready_text_widget = mod.FindUIWidgetWithName(this.#PLAYERS_WAITING_TEXT)
        this.#players_ready_count_widget = mod.FindUIWidgetWithName(this.#PLAYERS_READY_COUNT_TEXT)



        this.#RootWidgets.push(ParseUI({
            type: "Container",
            size: [500, 100],
            position: [0, 75],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.None,
            bgColor: mod.CreateVector(1, 1, 1),
            bgAlpha: 0.0,
            playerId: this.#playerProfile.player,
            children: [
                {
                    type: "Container",
                    name: this.#LEFT_BUTTON_SELECTED,
                    size: [60, 60],
                    position: [-150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.8,
                    visible: false
                },
                {
                    type: "Button",
                    name: this.#LEFT_BUTTON,
                    size: [50, 50],
                    position: [-150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Blur,
                    buttonColorHover: [1, 1, 1],
                    bgColor: [1, 1, 1],
                    bgAlpha: 1.0,
                }, {
                    type: "Text",
                    parent: this.#LEFT_BUTTON,
                    name: this.#LEFT_BUTTON_TEXT,
                    size: [50, 50],
                    position: [-150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.leftArrow),
                    textSize: 35,

                },


                {
                    type: "Container",
                    name: this.#READYUP_BUTTON_SELECT,
                    size: [240, 60],
                    position: [0, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.8,
                    visible: false
                },
                {
                    type: "Button",
                    name: this.#READYUP_BUTTON,
                    size: [230, 50],
                    position: [0, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Blur,
                    buttonColorHover: [1, 1, 1],
                    bgColor: [1, 1, 1],
                    bgAlpha: 1.0
                },
                {
                    type: "Text",
                    parent: this.#READYUP_BUTTON,
                    name: this.#READYUP_BUTTON_TEXT,
                    size: [230, 50],
                    position: [0, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.ready),
                    textSize: 25
                },

                {
                    type: "Container",
                    name: this.#RIGHT_BUTTON_SELECTED,
                    size: [60, 60],
                    position: [150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.8,
                    visible: false
                },
                {
                    type: "Button",
                    name: this.#RIGHT_BUTTON,
                    size: [50, 50],
                    position: [150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Blur,
                    buttonColorHover: [1, 1, 1],
                    bgColor: [1, 1, 1],
                    bgAlpha: 1.0
                }, {

                    type: "Text",
                    parent: this.#RIGHT_BUTTON,
                    name: this.#RIGHT_BUTTON_TEXT,
                    size: [50, 50],
                    position: [150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.rightArrow),
                    textSize: 35
                },

                {
                    type: "Container",
                    name: this.#CURRENT_SELECT_VEH_TEXT + "_line",
                    size: [300, 3],
                    position: [0, -35],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.5
                },
                {
                    type: "Text",
                    name: this.#CURRENT_SELECT_VEH_TEXT,
                    size: [350, 80],
                    position: [0, -70],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.selectVeh),
                    textSize: 60
                },
                {
                    type: "Text",
                    name: this.#CURRENT_SELECT_VEH_TEXT + "_chosen_veh",
                    size: [300, 50],
                    position: [0, -105],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.chosenvehicle),
                    textSize: 20
                }
            ]
        }) as mod.UIWidget)

        this.#Left_Button_Holder = new HoH_UIButtonHolder(
            this.#playerProfile,
            this.#LEFT_BUTTON,
            this.#LEFT_BUTTON_TEXT,
            this.#LEFT_BUTTON_SELECTED,
            function (this: HoH_UIButtonHolder) {
                this.playerProfile.VehicleShopUI?.VehicleSelectIncrease();
            },
            function (this: HoH_UIButtonHolder, focusIn: boolean) {
                if (focusIn) {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Solid)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.2, 0.2, 0.2))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, true)
                } else {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Blur)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(1, 1, 1))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, false)
                }
            }
        );

        this.#Right_Button_Holder = new HoH_UIButtonHolder(
            this.#playerProfile,
            this.#RIGHT_BUTTON,
            this.#RIGHT_BUTTON_TEXT,
            this.#RIGHT_BUTTON_SELECTED,
            function (this: HoH_UIButtonHolder) {
                this.playerProfile.VehicleShopUI?.VehicleSelectDecrease()

            },
            function (this: HoH_UIButtonHolder, focusIn: boolean) {
                if (focusIn) {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Solid)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.2, 0.2, 0.2))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, true)
                } else {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Blur)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(1, 1, 1))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, false)
                }
            }
        )

        this.#Readyup_Button_Holder = new HoH_UIButtonHolder(
            this.#playerProfile,
            this.#READYUP_BUTTON,
            this.#READYUP_BUTTON_TEXT,
            this.#READYUP_BUTTON_SELECT,
            function (this: HoH_UIButtonHolder) {
                if (this.playerProfile.readyUp) {
                    this.playerProfile.VehicleShopUI?.EnableSwitchButtons(false)

                } else {
                    this.playerProfile.VehicleShopUI?.EnableSwitchButtons(true)

                }
            },
            function (this: HoH_UIButtonHolder, focusIn: boolean) {


                if (focusIn) {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Solid)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.2, 0.2, 0.2))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, true)
                } else {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Blur)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(1, 1, 1))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, false)
                }
            }
        )

        this.#current_select_veh_Widget = mod.FindUIWidgetWithName(this.#CURRENT_SELECT_VEH_TEXT)



        // CatchupMechanic Information



        const PLAYER_CATCHUP_MECHANIC_TITLE = `players_catchup_mechanic_title_${this.#playerProfile.playerProfileId}`
        const PLAYER_CATCHUP_MECHANIC_DESC = `players_catchup_mechanic_desc_${this.#playerProfile.playerProfileId}`

        this.#RootWidgets.push(ParseUI({
            type: "Container",
            size: [500, 200],
            position: [50, 350],
            anchor: mod.UIAnchor.TopRight,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0.2, 0.2, 0.3],
            bgAlpha: 0.6,
            playerId: this.#playerProfile.player,
            children: [{
                type: "Text",
                name: PLAYER_CATCHUP_MECHANIC_TITLE,
                size: [500, 200],
                position: [0, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.None,
                textColor: bfBlueColor,
                textAnchor: mod.UIAnchor.TopLeft,
                textLabel: MakeMessage(mod.stringkeys.afterburnerExplainedTitle),
                textSize: 40
            },
            {
                type: "Text",
                name: PLAYER_CATCHUP_MECHANIC_DESC,
                size: [500, 200],
                position: [0, 20],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.None,
                textColor: bfBlueColor,
                textAnchor: mod.UIAnchor.CenterLeft,
                textLabel: MakeMessage(mod.stringkeys.afterburnerExplained),
                textSize: 30
            },
            ]
        }) as mod.UIWidget)

    }

    cameraTeleport() {

        let startPos = playerVehicleSelectPositions[this.selectVehNb][0]
        let endPod = playerVehicleSelectPositions[this.selectVehNb][1]

        const spawnPositions = generateSpawnLine(startPos, endPod, MapPlayers, "right")
        const spawnposition = spawnPositions[this.#playerProfile.playerRacerNumber].position

        const lookrotation = this.lookAtYaw(spawnposition, VehiclePositions[this.selectVehNb])
        mod.Teleport(this.#playerProfile.player, mod.CreateVector(spawnposition.x, spawnposition.y, spawnposition.z), lookrotation)

    }

    lookAtYaw(from: Vector3, to: Vector3): number {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        return Math.atan2(dx, dz); // radians
    }


    refresh() {

        this.#playerProfile.SetVehicle(currentRace.availableVehicles[this.selectVehNb])
        const vehicleEnumValue = currentRace.availableVehicles[this.selectVehNb];

        this.#current_select_veh_Widget && mod.SetUITextLabel(this.#current_select_veh_Widget, MakeMessage(this.getVehName(vehicleEnumValue)))
    }

    getVehName(veh: mod.VehicleList) {
        if (veh == mod.VehicleList.F22) {
            return mod.stringkeys.vehicle_1
        } else if (veh == mod.VehicleList.F16) {
            return mod.stringkeys.vehicle_2
        } else if (veh == mod.VehicleList.JAS39) {
            return mod.stringkeys.vehicle_3
        }
        return ""
    }

    async open() {
        if (!this.#players_ready_count_widget)
            this.#create();

        if (this.UIOpen == true) {
            return
        }

        this.UIOpen = true;

        this.#RootWidgets.forEach(Rootwidget => {
            mod.SetUIWidgetVisible(Rootwidget, true)
        });


        mod.EnableUIInputMode(true, this.#playerProfile.player)

        this.refresh()
        this.UIUpdatePlayersReady();
        this.cameraTeleport();
        await mod.Wait(1)
        this.cameraTeleport();
    }

    close() {
        if (this.UIOpen == false) {
            return
        }

        this.UIOpen = false;
        this.#RootWidgets.forEach(Rootwidget => {
            mod.SetUIWidgetVisible(Rootwidget, false)
        });

        mod.EnableUIInputMode(false, this.#playerProfile.player)
    }

    OnButtonPressed(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
        if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusIn)) {
            //console.log("FocusIn")
            this.buttonFocused(mod.GetUIWidgetName(eventUIWidget), true)
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusOut)) {
            //console.log("FocusOut ")
            this.buttonFocused(mod.GetUIWidgetName(eventUIWidget), false)
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) {
            // console.log("ButtonDown")
            this.buttonPressed(mod.GetUIWidgetName(eventUIWidget))
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) {
            // console.log("ButtonUp")
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverIn)) {
            // console.log("HoverIn")
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverOut)) {
            //console.log("HoverOut")
        }

    }

    buttonFocused(widgetName: string, focusIn: boolean = false) {
        if (widgetName == this.#LEFT_BUTTON && this.#Left_Button_Holder) {
            this.#Left_Button_Holder.focus(focusIn);
        } else if (widgetName == this.#RIGHT_BUTTON && this.#Right_Button_Holder) {
            this.#Right_Button_Holder.focus(focusIn);
        } else if (widgetName == this.#READYUP_BUTTON && this.#Readyup_Button_Holder) {
            this.#Readyup_Button_Holder.focus(focusIn);
        }
    }

    buttonPressed(widgetName: string) {

        if (widgetName == this.#LEFT_BUTTON) {

            this.#Left_Button_Holder?.click()


        } else if (widgetName == this.#READYUP_BUTTON) {

            if (!this.#playerProfile.readyUp) {
                this.#playerProfile.readyUp = true;

            } else {
                this.#playerProfile.readyUp = false;
            }

            this.#Readyup_Button_Holder?.click()

            currentRace.playersInRace.forEach(pp => {
                pp.VehicleShopUI?.UIUpdatePlayersReady()
            });

        } else if (widgetName == this.#RIGHT_BUTTON) {

            this.#Right_Button_Holder?.click()

        }
    }
}

// === UI_VersionNB.ts ===



class HoH_Version {

    VersionWidget: mod.UIWidget | undefined;

    constructor(playerProfile: PlayerProfile) {
        const bfBlueColor = [0.678, 0.753, 0.800]

        this.VersionWidget = ParseUI({
            type: "Container",
            size: [200, 25],
            position: [0, 0],
            anchor: mod.UIAnchor.BottomRight,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0.2, 0.2, 0.3],
            bgAlpha: 0.7,
            playerId: playerProfile.player,
            children: [{
                type: "Text",
                name: "game_version_" + playerProfile.playerProfileId,
                size: [200, 25],
                position: [0, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.None,
                textColor: bfBlueColor,
                textAnchor: mod.UIAnchor.Center,
                textLabel: MakeMessage(mod.stringkeys.modversion, VERSION[0], VERSION[1], VERSION[2]),
                textSize: 20
            }]
        })
    }

    Close() {
        this.VersionWidget && mod.SetUIWidgetVisible(this.VersionWidget, false)
    }

    Delete() {
        this.VersionWidget && mod.DeleteUIWidget(this.VersionWidget)
    }

}

