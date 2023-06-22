import { MODULE_NAME, SettingName, RollVisibility } from "./settings.js";
export const UNKNOWN_MASK = "?";
export const REVEALED_MASK = "-";
function initiativeToInt(value) {
    if (!value) {
        return Number.MIN_SAFE_INTEGER;
    }
    else if (value === UNKNOWN_MASK) {
        return Number.MIN_SAFE_INTEGER + 1;
    }
    else {
        return Number(value);
    }
}
export var InitiativeStatus;
(function (InitiativeStatus) {
    InitiativeStatus[InitiativeStatus["Hidden"] = 0] = "Hidden";
    InitiativeStatus[InitiativeStatus["Masked"] = 1] = "Masked";
    InitiativeStatus[InitiativeStatus["Public"] = 2] = "Public";
    InitiativeStatus[InitiativeStatus["Unrolled"] = 3] = "Unrolled";
})(InitiativeStatus || (InitiativeStatus = {}));
export const SORT_KEY = Symbol("InitiativeSortKey");
export const TURN_INDEX = Symbol("TurnIndex");
export const STATUS = Symbol("InitiativeStatus");
export const WithHiddenInitiative = (BaseTracker) => {
    class HiddenInitiativeMixinClass extends BaseTracker {
        constructor(...args) {
            super(...args);
            this.getData = async () => {
                const baseData = await super.getData();
                const revealKnownInitiative = !!game.settings.get(MODULE_NAME, SettingName.RevealValues);
                const activeIndex = baseData.turns.findIndex((t) => t.active);
                const maskedTurns = baseData.turns.map((t, i) => {
                    if (!t.hasRolled) {
                        return Object.assign(Object.assign({}, t), { [STATUS]: InitiativeStatus.Unrolled, [SORT_KEY]: initiativeToInt(null), [TURN_INDEX]: i });
                    }
                    const initiativeUnknown = baseData.round === 0 || (baseData.round === 1 && i > activeIndex);
                    const shouldHidePlayers = game.settings.get(MODULE_NAME, SettingName.PlayerRoll) === RollVisibility.GM;
                    const shouldRevealNpcs = game.settings.get(MODULE_NAME, SettingName.NpcRoll) === RollVisibility.Open;
                    const isPlayerTurn = !!t.players && t.players.length > 0;
                    if ((!initiativeUnknown && revealKnownInitiative) ||
                        t.owner ||
                        (!shouldHidePlayers && isPlayerTurn) ||
                        (shouldRevealNpcs && !isPlayerTurn)) {
                        return Object.assign(Object.assign({}, t), { [STATUS]: InitiativeStatus.Public, [SORT_KEY]: initiativeToInt(t.initiative), [TURN_INDEX]: i });
                    }
                    return Object.assign(Object.assign({}, t), { initiative: initiativeUnknown ? UNKNOWN_MASK : REVEALED_MASK, [STATUS]: initiativeUnknown ? InitiativeStatus.Hidden : InitiativeStatus.Masked, [SORT_KEY]: initiativeToInt(initiativeUnknown ? UNKNOWN_MASK : t.initiative), [TURN_INDEX]: i });
                });
                maskedTurns.sort((a, b) => {
                    let cmp = b[SORT_KEY] - a[SORT_KEY];
                    if (cmp !== 0) {
                        return cmp;
                    }
                    if (a[STATUS] === InitiativeStatus.Hidden && b[STATUS] === InitiativeStatus.Hidden) {
                        cmp = (a.name || "").localeCompare(b.name || "");
                        if (cmp !== 0) {
                            return cmp;
                        }
                    }
                    return cmp !== 0 ? cmp : a[TURN_INDEX] - b[TURN_INDEX];
                });
                return Object.assign(Object.assign({}, baseData), { turns: maskedTurns });
            };
        }
    }
    const constructorName = isNewerVersion(game.data.version, "0.7.0")
        ? "HiddenInitiativeCombatTracker"
        : "CombatTracker";
    Object.defineProperty(HiddenInitiativeMixinClass.prototype.constructor, "name", { value: constructorName });
    return HiddenInitiativeMixinClass;
};
