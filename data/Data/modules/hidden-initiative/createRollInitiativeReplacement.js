import { MODULE_NAME, SettingName, RollVisibility } from "./settings.js";
function getRollMode(setting) {
    switch (setting) {
        case RollVisibility.GM:
            return "gmroll";
        case RollVisibility.Open:
            return "roll";
        default:
            return undefined;
    }
}
function getCombatantById(id) {
    var _a;
    if (typeof ((_a = this.combatants) === null || _a === void 0 ? void 0 : _a.get) === "function") {
        return this.combatants.get(id);
    }
    else {
        return this.getCombatant(id);
    }
}
function partitionRolls(ids) {
    const npcIds = [];
    const playerIds = [];
    const idArr = typeof ids === "string" ? [ids] : ids;
    for (const id of idArr) {
        const combatant = getCombatantById.call(this, id);
        if (combatant) {
            if (combatant.players && combatant.players.length > 0) {
                playerIds.push(id);
            }
            else {
                npcIds.push(id);
            }
        }
    }
    return { npcIds, playerIds };
}
export function createLegacyRollInitiativeReplacement(combat, originalFn) {
    async function rollInitiative(ids, formula = null, options = {}) {
        if (options.rollMode) {
            await originalFn.call(this, ids, formula, options);
            return this;
        }
        const { npcIds, playerIds } = partitionRolls.call(this, ids);
        if (npcIds.length > 0) {
            let npcSetting = game.settings.get(MODULE_NAME, SettingName.NpcRoll);
            npcSetting = typeof npcSetting === "string" ? npcSetting : RollVisibility.Default;
            await originalFn.call(this, npcIds, formula, Object.assign(Object.assign({}, options), { rollMode: getRollMode(npcSetting) }));
        }
        if (playerIds.length > 0) {
            let playerSetting = game.settings.get(MODULE_NAME, SettingName.PlayerRoll);
            playerSetting = typeof playerSetting === "string" ? playerSetting : RollVisibility.Default;
            await originalFn.call(this, playerIds, formula, Object.assign(Object.assign({}, options), { rollMode: getRollMode(playerSetting) }));
        }
        return this;
    }
    return rollInitiative.bind(combat);
}
export function createRollInitiativeReplacement(combat, originalFn) {
    async function rollInitiative(ids, options = {}) {
        var _a;
        if ((_a = options.messageOptions) === null || _a === void 0 ? void 0 : _a.rollMode) {
            await originalFn.call(this, ids, options);
            return this;
        }
        const { npcIds, playerIds } = partitionRolls.call(this, ids);
        if (npcIds.length > 0) {
            let npcSetting = game.settings.get(MODULE_NAME, SettingName.NpcRoll);
            npcSetting = typeof npcSetting === "string" ? npcSetting : RollVisibility.Default;
            await originalFn.call(this, npcIds, Object.assign(Object.assign({}, options), { messageOptions: Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.messageOptions), { rollMode: getRollMode(npcSetting) }) }));
        }
        if (playerIds.length > 0) {
            let playerSetting = game.settings.get(MODULE_NAME, SettingName.PlayerRoll);
            playerSetting = typeof playerSetting === "string" ? playerSetting : RollVisibility.Default;
            await originalFn.call(this, playerIds, Object.assign(Object.assign({}, options), { messageOptions: Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.messageOptions), { rollMode: getRollMode(playerSetting) }) }));
        }
        return this;
    }
    return rollInitiative.bind(combat);
}
