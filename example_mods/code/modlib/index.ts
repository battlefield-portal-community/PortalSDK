// export * from './store';

export function Concat(s1: string, s2: string) {
    return s1 + s2;
}

export function And(...rest: boolean[]): boolean {
    for (let i = 0; i < rest.length; i++) {
        const cond = rest[i];
        if (!cond) return false;
    }
    return true;
}

type ConditionFunction = () => boolean;

export function AndFn(...rest: ConditionFunction[]): boolean {
    for (let i = 0; i < rest.length; i++) {
        const condFn = rest[i];
        if (!condFn()) return false;
    }
    return true;
}

export function getPlayerId(player: mod.Player): number {
    return mod.GetObjId(player);
}

export function getTeamId(team: mod.Team): number {
    return mod.GetObjId(team);
}

export function ConvertArray(array: mod.Array): any[] {
    let v = [];
    let n = mod.CountOf(array);
    for (let i = 0; i < n; i++) {
        let currentElement = mod.ValueInArray(array, i);
        v.push(currentElement);
    }
    return v;
}

export function FilteredArray(array: mod.Array, cond: (currentElement: any) => boolean): mod.Array {
    const arr = ConvertArray(array);
    let v = mod.EmptyArray();
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let currentElement = arr[i];
        if (cond(currentElement)) mod.AppendToArray(v, currentElement);
    }
    return v;
}

export function IndexOfFirstTrue(array: mod.Array, cond: (element: any, arg: any) => boolean, arg: any = null): number {
    const arr = ConvertArray(array);
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let currentArrayElement = arr[i];
        if (cond(currentArrayElement, arg)) return i;
    }
    return -1;
}

export function IfThenElse<T>(condition: boolean, ifTrue: () => T, ifFalse: () => T) {
    if (condition) return ifTrue();
    else return ifFalse();
}

export function IsTrueForAll(array: mod.Array, condition: (element: any, arg: any) => boolean, arg: any = null) {
    const arr = ConvertArray(array);
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let currentArrayElement = arr[i];
        if (!condition(currentArrayElement, arg)) return false;
    }
    return true;
}

export function IsTrueForAny(array: mod.Array, condition: (element: any, arg: any) => boolean, arg: any = null) {
    const arr = ConvertArray(array);
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let currentArrayElement = arr[i];
        if (condition(currentArrayElement, arg)) return true;
    }
    return false;
}

export function SortedArray(array: any[], compare: (a: any, b: any) => number) {
    let v1 = array.slice();
    v1.sort(compare);
    let v2 = [];
    for (let e of v1) v2.push(e);
    return v2;
}

export function Equals(a: any, b: any) {
    if (a == null || b == null) debugger;
    return mod.Equals(a, b);
}

export async function WaitUntil(delay: number, cond: () => boolean) {
    // complete rush hack. this will likely wait way too long and other problems.
    let deltaCount = 10;
    let deltaWait = delay / deltaCount;
    for (let t = 0; t < deltaCount; t++) {
        if (!cond()) break;
        await mod.Wait(deltaWait);
    }
}

export class ConditionState {
    lastState: boolean;

    constructor() {
        this.lastState = false;
    }

    update(newState: boolean): boolean {
        // if the new state is false then reset last state and don't trigger action
        if (!newState) {
            this.lastState = false;
            return false;
        }
        // if last state was already true then don't trigger
        if (this.lastState) return false;
        // if the state just transitioned to true then trigger
        this.lastState = true;
        return true;
    }
}

class Conditions {
    constructor() {
        this.conditionStates = [];
    }

    conditionStates: ConditionState[];

    getConditionState(n: number): ConditionState {
        while (n >= this.conditionStates.length) {
            this.conditionStates.push(new ConditionState());
        }
        return this.conditionStates[n];
    }
}

let playerConditions: Conditions[] = [];
let teamConditions: Conditions[] = [];
let capturePointConditions: Conditions[] = [];
let mcomConditions: Conditions[] = [];
let vehicleConditions: Conditions[] = [];
let globalConditions: Conditions = new Conditions();

function getObjectCondition(id: number, objectConditions: Conditions[], n: number) {
    while (id >= objectConditions.length) {
        objectConditions.push(new Conditions());
    }
    let conditions = objectConditions[id];
    return conditions.getConditionState(n);
}

export function getPlayerCondition(obj: mod.Player, n: number) {
    let id = getPlayerId(obj);
    while (id >= playerConditions.length) {
        playerConditions.push(new Conditions());
    }
    let conditions = playerConditions[id];
    return conditions.getConditionState(n);
}

export function getTeamCondition(team: mod.Team, n: number) {
    let id = getTeamId(team);
    while (id >= teamConditions.length) {
        teamConditions.push(new Conditions());
    }
    let conditions = teamConditions[id];
    return conditions.getConditionState(n);
}

export function getCapturePointCondition(obj: mod.CapturePoint, n: number) {
    let id = mod.GetObjId(obj);
    return getObjectCondition(id, capturePointConditions, n);
}

export function getMCOMCondition(obj: mod.MCOM, n: number) {
    let id = mod.GetObjId(obj);
    return getObjectCondition(id, mcomConditions, n);
}

export function getVehicleCondition(obj: mod.Vehicle, n: number) {
    let id = mod.GetObjId(obj);
    return getObjectCondition(id, vehicleConditions, n);
}

export function getGlobalCondition(n: number) {
    return globalConditions.getConditionState(n);
}

export function getPlayersInTeam(team: mod.Team) {
    const allPlayers = mod.AllPlayers();
    const n = mod.CountOf(allPlayers);
    let teamMembers = [];

    for (let i = 0; i < n; i++) {
        let player = mod.ValueInArray(allPlayers, i) as mod.Player;
        if (mod.GetTeam(player) == team) {
            teamMembers.push(player);
        }
    }
    return teamMembers;
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

function __asModVector(param: number[] | mod.Vector) {
    if (Array.isArray(param)) return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
    else return param;
}

function __asModMessage(param: string | mod.Message) {
    if (typeof param === 'string') return mod.Message(param);
    return param;
}

function __fillInDefaultArgs(params: UIParams) {
    if (!params.hasOwnProperty('name')) params.name = '';
    if (!params.hasOwnProperty('position')) params.position = mod.CreateVector(0, 0, 0);
    if (!params.hasOwnProperty('size')) params.size = mod.CreateVector(100, 100, 0);
    if (!params.hasOwnProperty('anchor')) params.anchor = mod.UIAnchor.TopLeft;
    if (!params.hasOwnProperty('parent')) params.parent = mod.GetUIRoot();
    if (!params.hasOwnProperty('visible')) params.visible = true;
    if (!params.hasOwnProperty('padding')) params.padding = params.type == 'Container' ? 0 : 8;
    if (!params.hasOwnProperty('bgColor')) params.bgColor = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('bgAlpha')) params.bgAlpha = 0.5;
    if (!params.hasOwnProperty('bgFill')) params.bgFill = mod.UIBgFill.Solid;
}

function __setNameAndGetWidget(uniqueName: any, params: any) {
    let widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
    mod.SetUIWidgetName(widget, params.name);
    return widget;
}

const __cUniqueName = '----uniquename----';

function __addUIContainer(params: UIParams) {
    __fillInDefaultArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIContainer(
            __cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            restrict
        );
    } else {
        mod.AddUIContainer(
            __cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill
        );
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
    if (!params.hasOwnProperty('textLabel')) params.textLabel = '';
    if (!params.hasOwnProperty('textSize')) params.textSize = 0;
    if (!params.hasOwnProperty('textColor')) params.textColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('textAlpha')) params.textAlpha = 1;
    if (!params.hasOwnProperty('textAnchor')) params.textAnchor = mod.UIAnchor.CenterLeft;
}

function __addUIText(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultTextArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIText(
            __cUniqueName,
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
            restrict
        );
    } else {
        mod.AddUIText(
            __cUniqueName,
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
            params.textAnchor
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultImageArgs(params: any) {
    if (!params.hasOwnProperty('imageType')) params.imageType = mod.UIImageType.None;
    if (!params.hasOwnProperty('imageColor')) params.imageColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('imageAlpha')) params.imageAlpha = 1;
}

function __addUIImage(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultImageArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIImage(
            __cUniqueName,
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
            restrict
        );
    } else {
        mod.AddUIImage(
            __cUniqueName,
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
            params.imageAlpha
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultArg(params: any, argName: any, defaultValue: any) {
    if (!params.hasOwnProperty(argName)) params[argName] = defaultValue;
}

function __fillInDefaultButtonArgs(params: any) {
    if (!params.hasOwnProperty('buttonEnabled')) params.buttonEnabled = true;
    if (!params.hasOwnProperty('buttonColorBase')) params.buttonColorBase = mod.CreateVector(0.7, 0.7, 0.7);
    if (!params.hasOwnProperty('buttonAlphaBase')) params.buttonAlphaBase = 1;
    if (!params.hasOwnProperty('buttonColorDisabled')) params.buttonColorDisabled = mod.CreateVector(0.2, 0.2, 0.2);
    if (!params.hasOwnProperty('buttonAlphaDisabled')) params.buttonAlphaDisabled = 0.5;
    if (!params.hasOwnProperty('buttonColorPressed')) params.buttonColorPressed = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('buttonAlphaPressed')) params.buttonAlphaPressed = 1;
    if (!params.hasOwnProperty('buttonColorHover')) params.buttonColorHover = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('buttonAlphaHover')) params.buttonAlphaHover = 1;
    if (!params.hasOwnProperty('buttonColorFocused')) params.buttonColorFocused = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('buttonAlphaFocused')) params.buttonAlphaFocused = 1;
}

function __addUIButton(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultButtonArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIButton(
            __cUniqueName,
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
            __asModVector(params.buttonColorBase),
            params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled),
            params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed),
            params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover),
            params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused),
            params.buttonAlphaFocused,
            restrict
        );
    } else {
        mod.AddUIButton(
            __cUniqueName,
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
            __asModVector(params.buttonColorBase),
            params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled),
            params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed),
            params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover),
            params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused),
            params.buttonAlphaFocused
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __addUIWidget(params: UIParams) {
    if (params == null) return undefined;
    if (params.type == 'Container') return __addUIContainer(params);
    else if (params.type == 'Text') return __addUIText(params);
    else if (params.type == 'Image') return __addUIImage(params);
    else if (params.type == 'Button') return __addUIButton(params);
    return undefined;
}

export function ParseUI(...params: any[]) {
    let widget: mod.UIWidget | undefined;
    for (let a = 0; a < params.length; a++) {
        widget = __addUIWidget(params[a] as UIParams);
    }
    return widget;
}

export function DisplayCustomNotificationMessage(msg: mod.Message, custom: mod.CustomNotificationSlots, duration: number, target?: mod.Player | mod.Team) {
    const CreateHeader = async (widgetId: string, msg: mod.Message, targetPlayer: mod.Player, slot: number) => {
        mod.AddUIText(
            widgetId,
            mod.CreateVector(50, 250 + slot * (40 + 5), 0),
            mod.CreateVector(250, 60, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            true,
            8,
            mod.CreateVector(1, 1, 1),
            1,
            mod.UIBgFill.Blur,
            msg,
            30,
            mod.CreateVector(1, 1, 1),
            1,
            mod.UIAnchor.Center,
            targetPlayer
        );
        if (duration > 0) {
            await mod.Wait(duration);
            mod.DeleteUIWidget(mod.FindUIWidgetWithName(widgetId));
        }
    };
    const CreateSubText = async (widgetId: string, msg: mod.Message, targetPlayer: mod.Player, slot: number) => {
        mod.AddUIText(
            widgetId,
            mod.CreateVector(85, 270 + slot * (40 + 3), 0),
            mod.CreateVector(125, 40, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            true,
            8,
            mod.CreateVector(1, 1, 1),
            1,
            mod.UIBgFill.Blur,
            msg,
            20,
            mod.CreateVector(1, 1, 1),
            1,
            mod.UIAnchor.Center,
            targetPlayer
        );
        if (duration > 0) {
            await mod.Wait(duration);
            mod.DeleteUIWidget(mod.FindUIWidgetWithName(widgetId));
        }
    };
    const createNotificationFunction = custom < 1 ? CreateHeader : CreateSubText;

    if (target) {
        // if target is player, fill message in their slot
        if (mod.IsType(target, mod.Types.Player)) {
            const widgetId = custom + String(target);
            createNotificationFunction(widgetId, msg, target as mod.Player, custom);
        }
        // if target is team, fill message in slot for all players on team
        else if (mod.IsType(target, mod.Types.Team)) {
            const teamMates = getPlayersInTeam(target as mod.Team);
            teamMates.forEach((player) => {
                const widgetId = custom + String(player);
                createNotificationFunction(widgetId, msg, player, custom);
            });
        }
    } else {
        const allPlayers = mod.AllPlayers();
        const n = mod.CountOf(allPlayers);
        for (let i = 0; i < n; i++) {
            let player = mod.ValueInArray(allPlayers, i) as mod.Player;
            const widgetId = custom + String(player);
            createNotificationFunction(widgetId, msg, player, custom);
        }
    }
}

export function ShowEventGameModeMessage(event: mod.Message, target?: mod.Player | mod.Team) {
    //TODO: restore these once DisplayGameModeMessage is fixed
    // if (target) {
    //     mod.DisplayGameModeMessage(event, target as mod.Player );
    // } else{
    //     mod.DisplayGameModeMessage(event);
    // }

    const MakeShiftDisplayGameModeMessage = async (message: mod.Message, target?: mod.Player | mod.Team) => {
        const widgetId = 'GameModeMessage';
        if (target) {
            mod.AddUIText(
                widgetId,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(2500, 80, 0),
                mod.UIAnchor.TopCenter,
                mod.GetUIRoot(),
                true,
                8,
                mod.CreateVector(1, 1, 1),
                1,
                mod.UIBgFill.Blur,
                message,
                30,
                mod.CreateVector(1, 1, 1),
                1,
                mod.UIAnchor.Center,
                target as mod.Player
            );
        } else {
            mod.AddUIText(
                widgetId,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(2500, 80, 0),
                mod.UIAnchor.TopCenter,
                mod.GetUIRoot(),
                true,
                8,
                mod.CreateVector(1, 1, 1),
                1,
                mod.UIBgFill.Blur,
                message,
                30,
                mod.CreateVector(1, 1, 1),
                1,
                mod.UIAnchor.Center
            );
        }

        await mod.Wait(6);
        mod.DeleteUIWidget(mod.FindUIWidgetWithName(widgetId));
    };

    if (target) {
        MakeShiftDisplayGameModeMessage(event, target as mod.Player);
    } else {
        MakeShiftDisplayGameModeMessage(event);
    }
}

export function ShowHighlightedGameModeMessage(event: mod.Message, target?: mod.Player | mod.Team) {
    if (target) {
        mod.DisplayHighlightedWorldLogMessage(event, target as mod.Player);
    } else {
        mod.DisplayHighlightedWorldLogMessage(event);
    }
}

export function ShowNotificationMessage(msg: mod.Message, target?: mod.Player | mod.Team) {
    if (target) {
        mod.DisplayNotificationMessage(msg, target as mod.Player);
    } else {
        mod.DisplayNotificationMessage(msg);
    }
}

export function ClearAllCustomNotificationMessages(target: mod.Player) {
    try {
        ClearCustomNotificationMessage(mod.CustomNotificationSlots.HeaderText, target);
    } catch {}
    try {
        ClearCustomNotificationMessage(mod.CustomNotificationSlots.MessageText1, target);
    } catch {}
    try {
        ClearCustomNotificationMessage(mod.CustomNotificationSlots.MessageText2, target);
    } catch {}
    try {
        ClearCustomNotificationMessage(mod.CustomNotificationSlots.MessageText3, target);
    } catch {}
    try {
        ClearCustomNotificationMessage(mod.CustomNotificationSlots.MessageText4, target);
    } catch {}
}

export function ClearCustomNotificationMessage(custom: mod.CustomNotificationSlots, target?: mod.Player | mod.Team) {
    try {
        if (target) {
            // if target is player, just delete message in their slot
            if (mod.IsType(target, mod.Types.Player)) {
                mod.DeleteUIWidget(mod.FindUIWidgetWithName(custom + String(target as mod.Player)));
            }
            // if target is team, delete message in slot for all players on team
            else if (mod.IsType(target, mod.Types.Team)) {
                const teamMembers = getPlayersInTeam(target as mod.Team);
                for (let i = 0; i < teamMembers.length; i++) {
                    let player = teamMembers[i];
                    mod.DeleteUIWidget(mod.FindUIWidgetWithName(custom + String(player)));
                }
            }
        } else {
            // if no target, delete for all players
            const allPlayers = mod.AllPlayers();
            const n = mod.CountOf(allPlayers);
            for (let i = 0; i < n; i++) {
                let player = mod.ValueInArray(allPlayers, i) as mod.Player;
                mod.DeleteUIWidget(mod.FindUIWidgetWithName(custom + String(player)));
            }
        }
    } catch {
        console.error('Could not clear custom message for specified target(s)');
    }
}
