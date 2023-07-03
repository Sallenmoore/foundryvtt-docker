import { MySettings, MODULE_ID } from "./constants.js";
import { getGame } from "./helpers.js";
export const registerSettings = function () {
    CONFIG[MODULE_ID] = { debug: false };
    // Register any custom module settings here
    getGame().settings.register(MODULE_ID, MySettings.expandedLimited, {
        name: 'CB5ES.settings.expandedLimited.Label',
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: 'CB5ES.settings.expandedLimited.Hint',
    });
    getGame().settings.register(MODULE_ID, MySettings.displayPassivePerception, {
        name: 'CB5ES.settings.displayPassives.prc.Label',
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
    });
    getGame().settings.register(MODULE_ID, MySettings.displayPassiveInsight, {
        name: 'CB5ES.settings.displayPassives.ins.Label',
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
    });
    getGame().settings.register(MODULE_ID, MySettings.displayPassiveInvestigation, {
        name: 'CB5ES.settings.displayPassives.inv.Label',
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
    });
    getGame().settings.register(MODULE_ID, MySettings.displayPassiveStealth, {
        name: 'CB5ES.settings.displayPassives.ste.Label',
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
    });
};
