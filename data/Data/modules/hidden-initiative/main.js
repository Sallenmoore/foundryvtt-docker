import { STATUS, InitiativeStatus, WithHiddenInitiative, } from "./HiddenInitiativeCombatTracker.js";
import { createRollInitiativeReplacement, createLegacyRollInitiativeReplacement, } from "./createRollInitiativeReplacement.js";
import { loc } from "./loc.js";
import { RollVisibility, MODULE_NAME, SettingName } from "./settings.js";
Hooks.on("init", () => {
    game.settings.register(MODULE_NAME, SettingName.RevealValues, {
        name: loc("Setting.RevealInitiative.Title"),
        hint: loc("Setting.RevealInitiative.Hint"),
        type: Boolean,
        config: true,
        default: true,
        scope: "world",
        onChange: (newValue) => {
            console.log(`[${MODULE_NAME}]: Initiative reveal setting changed to ${newValue}, re-rendering CombatTracker`);
            ui.combat.render();
        },
    });
    game.settings.register(MODULE_NAME, SettingName.NpcRoll, {
        name: loc("Setting.NpcRoll.Title"),
        hint: loc("Setting.NpcRoll.Description"),
        type: String,
        config: true,
        default: RollVisibility.GM,
        choices: {
            [RollVisibility.Default]: "Setting.RollType.Default",
            [RollVisibility.GM]: "Setting.RollType.GM",
            [RollVisibility.Open]: "Setting.RollType.Open",
        },
        scope: "world",
        onChange: (newValue) => {
            console.log(`[${MODULE_NAME}]: New NPC roll visibility: ${newValue}; re-rendering CombatTracker`);
            ui.combat.render();
        },
    });
    game.settings.register(MODULE_NAME, SettingName.PlayerRoll, {
        name: loc("Setting.PlayerRoll.Title"),
        hint: loc("Setting.PlayerRoll.Description"),
        type: String,
        config: true,
        default: RollVisibility.GM,
        choices: {
            [RollVisibility.Default]: "Setting.RollType.Default",
            [RollVisibility.GM]: "Setting.RollType.GM",
            [RollVisibility.Open]: "Setting.RollType.Open",
        },
        scope: "world",
        onChange: (newValue) => {
            console.log(`[${MODULE_NAME}]: New player roll visibility: ${newValue}; re-rendering CombatTracker`);
            ui.combat.render();
        },
    });
    CONFIG.ui.combat = WithHiddenInitiative(CONFIG.ui.combat);
});
const ROLL_SHIMMED = Symbol("RollShimmed");
const TURN_UPDATED_KEY = "hidden-initiative-repainted";
Hooks.on("renderCombatTracker", (tracker, html, data) => {
    const shimmedCombat = data.combat;
    if (data.combat && !shimmedCombat[ROLL_SHIMMED]) {
        shimmedCombat[ROLL_SHIMMED] = true;
        if (isNewerVersion(game.data.version, "0.7.1")) {
            const originalRollFn = data.combat.rollInitiative;
            data.combat.rollInitiative = createRollInitiativeReplacement(data.combat, originalRollFn);
        }
        else {
            const originalRollFn = data.combat.rollInitiative;
            data.combat.rollInitiative = createLegacyRollInitiativeReplacement(data.combat, originalRollFn);
        }
    }
    for (const t of data.turns) {
        if (t[STATUS] === InitiativeStatus.Unrolled && !t.owner) {
            const initiativeNode = html.find(`[data-combatant-id='${t._id}'] > div.token-initiative`);
            if (initiativeNode && !initiativeNode.data(TURN_UPDATED_KEY)) {
                initiativeNode.data(TURN_UPDATED_KEY, true).append('<span class="initiative">...</span>');
            }
        }
    }
});
Hooks.on("getHiddenInitiativeCombatTrackerEntryContext", (...args) => {
    if (!isNewerVersion(game.data.version, "0.8.5")) {
        Hooks.call("getCombatTrackerEntryContext", ...args);
    }
});
