const MODULE_ID = 'character-actions-list-5e';
const MODULE_ABBREV = 'CAL5E';
var MySettings;
(function (MySettings) {
    MySettings["includeConsumables"] = "include-consumables";
    MySettings["includeOneMinuteSpells"] = "include-one-minute-spells";
    MySettings["includeSpellsWithEffects"] = "include-spells-with-effects";
    MySettings["injectCharacters"] = "inject-characters";
    MySettings["injectNPCs"] = "inject-npcs";
    MySettings["injectVehicles"] = "inject-vehicles";
    MySettings["limitActionsToCantrips"] = "limit-actions-to-cantrips";
})(MySettings || (MySettings = {}));
var MyFlags;
(function (MyFlags) {
    MyFlags["filterOverride"] = "filter-override";
})(MyFlags || (MyFlags = {}));
const TEMPLATES = {
    actionList: `modules/${MODULE_ID}/templates/actor-actions-list.hbs`,
};

function log(force, ...args) {
    //@ts-ignore
    const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_ID);
    if (shouldLog) {
        console.log(MODULE_ID, '|', ...args);
    }
}
function getActivationType(activationType) {
    switch (activationType) {
        case 'action':
        case 'bonus':
        case 'crew':
        case 'lair':
        case 'legendary':
        case 'reaction':
            return activationType;
        default:
            return 'other';
    }
}
function isActiveItem(activationType) {
    if (!activationType) {
        return false;
    }
    if (['minute', 'hour', 'day', 'none'].includes(activationType)) {
        return false;
    }
    return true;
}
function isItemInActionList(item) {
    // log(false, 'filtering item', {
    //   item,
    // });
    // check our override
    const override = item.getFlag(MODULE_ID, MyFlags.filterOverride);
    if (override !== undefined) {
        return override;
    }
    // check the old flags
    //@ts-ignore
    const isFavourite = item.flags?.favtab?.isFavourite; // favourite items tab
    //@ts-ignore
    const isFavorite = item.flags?.favtab?.isFavorite; // tidy 5e sheet
    if (isFavourite || isFavorite) {
        return true;
    }
    // perform normal filtering logic
    switch (item.type) {
        case 'weapon': {
            return item.system.equipped;
        }
        case 'equipment': {
            return item.system.equipped && isActiveItem(item.system.activation?.type);
        }
        case 'consumable': {
            return (!!getGame().settings.get(MODULE_ID, MySettings.includeConsumables) && isActiveItem(item.system.activation?.type));
        }
        case 'spell': {
            const limitToCantrips = getGame().settings.get(MODULE_ID, MySettings.limitActionsToCantrips);
            // only exclude spells which need to be prepared but aren't
            const notPrepared = item.system.preparation?.mode === 'prepared' && !item.system.preparation?.prepared;
            const isCantrip = item.system.level === 0;
            if (!isCantrip && (limitToCantrips || notPrepared)) {
                return false;
            }
            const isReaction = item.system.activation?.type === 'reaction';
            const isBonusAction = item.system.activation?.type === 'bonus';
            //ASSUMPTION: If the spell causes damage, it will have damageParts
            const isDamageDealer = item.system.damage?.parts?.length > 0;
            let shouldInclude = isReaction || isBonusAction || isDamageDealer;
            if (getGame().settings.get(MODULE_ID, MySettings.includeOneMinuteSpells)) {
                const isOneMinuter = item.system?.duration?.units === 'minute' && item.system?.duration?.value === 1;
                const isOneRounder = item.system?.duration?.units === 'round' && item.system?.duration?.value === 1;
                shouldInclude = shouldInclude || isOneMinuter || isOneRounder;
            }
            if (getGame().settings.get(MODULE_ID, MySettings.includeSpellsWithEffects)) {
                const hasEffects = !!item.effects.size;
                shouldInclude = shouldInclude || hasEffects;
            }
            return shouldInclude;
        }
        case 'feat': {
            return !!item.system.activation?.type;
        }
        default: {
            return false;
        }
    }
}
function getGame() {
    if (!(game instanceof Game)) {
        throw new Error('game is not initialized yet!');
    }
    return game;
}

const registerSettings = function () {
    // Register any custom module settings here
    getGame().settings.register(MODULE_ID, MySettings.limitActionsToCantrips, {
        name: `${MODULE_ABBREV}.settings.limitActionsToCantrips.Label`,
        default: false,
        type: Boolean,
        scope: 'client',
        config: true,
        hint: `${MODULE_ABBREV}.settings.limitActionsToCantrips.Hint`,
    });
    getGame().settings.register(MODULE_ID, MySettings.includeOneMinuteSpells, {
        name: `${MODULE_ABBREV}.settings.includeOneMinuteSpells.Label`,
        default: true,
        type: Boolean,
        scope: 'client',
        config: true,
        hint: `${MODULE_ABBREV}.settings.includeOneMinuteSpells.Hint`,
    });
    getGame().settings.register(MODULE_ID, MySettings.includeSpellsWithEffects, {
        name: `${MODULE_ABBREV}.settings.includeSpellsWithEffects.Label`,
        default: true,
        type: Boolean,
        scope: 'client',
        config: true,
        hint: `${MODULE_ABBREV}.settings.includeSpellsWithEffects.Hint`,
    });
    getGame().settings.register(MODULE_ID, MySettings.includeConsumables, {
        name: `${MODULE_ABBREV}.settings.includeConsumables.Label`,
        default: true,
        type: Boolean,
        scope: 'client',
        config: true,
        hint: `${MODULE_ABBREV}.settings.includeConsumables.Hint`,
    });
    getGame().settings.register(MODULE_ID, MySettings.injectCharacters, {
        name: `${MODULE_ABBREV}.settings.injectCharacters.Label`,
        default: true,
        type: Boolean,
        scope: 'client',
        config: true,
        hint: `${MODULE_ABBREV}.settings.injectCharacters.Hint`,
    });
    getGame().settings.register(MODULE_ID, MySettings.injectNPCs, {
        name: `${MODULE_ABBREV}.settings.injectNPCs.Label`,
        default: true,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `${MODULE_ABBREV}.settings.injectNPCs.Hint`,
    });
    getGame().settings.register(MODULE_ID, MySettings.injectVehicles, {
        name: `${MODULE_ABBREV}.settings.injectVehicles.Label`,
        default: true,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `${MODULE_ABBREV}.settings.injectVehicles.Hint`,
    });
};

var ItemTypeSortValues;
(function (ItemTypeSortValues) {
    ItemTypeSortValues[ItemTypeSortValues["weapon"] = 1] = "weapon";
    ItemTypeSortValues[ItemTypeSortValues["equipment"] = 2] = "equipment";
    ItemTypeSortValues[ItemTypeSortValues["feat"] = 3] = "feat";
    ItemTypeSortValues[ItemTypeSortValues["spell"] = 4] = "spell";
    ItemTypeSortValues[ItemTypeSortValues["consumable"] = 5] = "consumable";
    ItemTypeSortValues[ItemTypeSortValues["tool"] = 6] = "tool";
    ItemTypeSortValues[ItemTypeSortValues["backpack"] = 7] = "backpack";
    ItemTypeSortValues[ItemTypeSortValues["class"] = 8] = "class";
    ItemTypeSortValues[ItemTypeSortValues["loot"] = 9] = "loot";
})(ItemTypeSortValues || (ItemTypeSortValues = {}));
function getActorActionsData(actor) {
    const filteredItems = actor.items
        .filter(isItemInActionList)
        .sort((a, b) => {
        if (a.type !== b.type) {
            return ItemTypeSortValues[a.type] - ItemTypeSortValues[b.type];
        }
        if (a.type === 'spell' && b.type === 'spell') {
            return a.system.level - b.system.level;
        }
        return (a.sort || 0) - (b.sort || 0);
    })
        .map((item) => {
        if (item.labels) {
            //@ts-expect-error
            item.labels.type = getGame().i18n.localize(`ITEM.Type${item.type.titleCase()}`);
        }
        // removes any in-formula flavor text from the formula in the label
        //@ts-expect-error
        if (item.labels?.derivedDamage?.length) {
            //@ts-expect-error
            item.labels.derivedDamage = item.labels.derivedDamage.map(({ formula, ...rest }) => ({
                formula: formula?.replace(/\[.+?\]/, '') || '0',
                ...rest,
            }));
        }
        return item;
    });
    const actionsData = filteredItems.reduce((acc, item) => {
        try {
            log(false, 'digesting item', {
                item,
            });
            if (['backpack', 'tool'].includes(item.type)) {
                return acc;
            }
            //@ts-ignore
            const activationType = getActivationType(item.system.activation?.type);
            acc[activationType].add(item);
            return acc;
        }
        catch (e) {
            log(true, 'error trying to digest item', item.name, e);
            return acc;
        }
    }, {
        action: new Set(),
        bonus: new Set(),
        crew: new Set(),
        lair: new Set(),
        legendary: new Set(),
        reaction: new Set(),
        other: new Set(),
    });
    return actionsData;
}

function addFavoriteControls(app, html) {
    function createFavButton(filterOverride) {
        return `<a class="item-control item-action-filter-override ${filterOverride ? 'active' : ''}" title="${filterOverride
            ? getGame().i18n.localize(`${MODULE_ABBREV}.button.setOverrideFalse`)
            : getGame().i18n.localize(`${MODULE_ABBREV}.button.setOverrideTrue`)}">
      <i class="fas fa-fist-raised">
        <i class="fas fa-slash"></i>
        <i class="fas fa-plus"></i>
      </i>
      <span class="control-label">${filterOverride
            ? getGame().i18n.localize(`${MODULE_ABBREV}.button.setOverrideFalse`)
            : getGame().i18n.localize(`${MODULE_ABBREV}.button.setOverrideTrue`)}</span>
    </a>`;
    }
    // add button to toggle favourite of the item in their native tab
    if (app.options.editable) {
        // Handle Click on our action
        $(html).on('click', 'a.item-action-filter-override', (e) => {
            try {
                const closestItemLi = $(e.target).parents('[data-item-id]')[0]; // BRITTLE
                const itemId = closestItemLi.dataset.itemId;
                const relevantItem = itemId && app.object.items.get(itemId);
                if (!relevantItem) {
                    return;
                }
                const currentFilter = isItemInActionList(relevantItem);
                // set the flag to be the opposite of what it is now
                relevantItem.setFlag(MODULE_ID, MyFlags.filterOverride, !currentFilter);
                log(false, 'a.item-action-filter-override click registered', {
                    closestItemLi,
                    itemId,
                    relevantItem,
                    currentFilter,
                });
            }
            catch (e) {
                log(true, 'Error trying to set flag on item', e);
            }
        });
        // Add button to all item rows
        html.find('[data-item-id]').each((_index, element) => {
            const itemId = element.dataset.itemId;
            const relevantItem = itemId && app.object.items.get(itemId);
            if (!relevantItem) {
                return;
            }
            const currentFilter = isItemInActionList(relevantItem);
            // log(false, { itemId, currentFilter });
            $(element).find('.item-controls').append(createFavButton(currentFilter));
        });
    }
}

Handlebars.registerHelper(`${MODULE_ABBREV}-isEmpty`, (input) => {
    if (input instanceof Array) {
        return input.length < 1;
    }
    if (input instanceof Set) {
        return input.size < 1;
    }
    return isObjectEmpty(input);
});
Handlebars.registerHelper(`${MODULE_ABBREV}-isItemInActionList`, isItemInActionList);
/**
 * Add the Actions Tab to Sheet HTML. Returns early if the character-actions-dnd5e element already exists
 */
async function addActionsTab(app, html, data) {
    if (data instanceof Promise) {
        log(true, 'data was unexpectedly a Promise, you might be using an unsupported sheet');
        return;
    }
    const existingActionsList = $(html).find('.character-actions-dnd5e');
    // check if what is rendering this is an Application and if our Actions List exists within it already
    if ((!!app.appId && !!existingActionsList.length) || app.options.blockActionsTab) {
        return;
    }
    // Update the nav menu
    const actionsTabButton = $('<a class="item" data-tab="actions">' + getGame().i18n.localize(`DND5E.ActionPl`) + '</a>');
    const tabs = html.find('.tabs[data-group="primary"]');
    tabs.prepend(actionsTabButton);
    // Create the tab
    const sheetBody = html.find('.sheet-body');
    const actionsTab = $(`<div class="tab actions flexcol" data-group="primary" data-tab="actions"></div>`);
    sheetBody.prepend(actionsTab);
    // add the list to the tab
    const actionsTabHtml = $(await renderActionsList(app.actor));
    actionsTab.append(actionsTabHtml);
    // @ts-ignore
    actionsTabHtml.find('.item .item-name.rollable h4').click((event) => app._onItemSummary(event));
    // owner only listeners
    if (data.owner) {
        // @ts-ignore
        actionsTabHtml.find('.item .item-image').click((event) => app._onItemUse(event));
        // @ts-ignore
        actionsTabHtml.find('.item .item-recharge').click((event) => app._onItemRecharge(event));
    }
    else {
        actionsTabHtml.find('.rollable').each((i, el) => el.classList.remove('rollable'));
    }
}
const damageTypeIconMap = {
    acid: '<i class="fas fa-hand-holding-water"></i>',
    bludgeoning: '<i class="fas fa-gavel"></i>',
    cold: '<i class="fas fa-snowflake"></i>',
    fire: '<i class="fas fa-fire-alt"></i>',
    force: '<i class="fas fa-hat-wizard"></i>',
    lightning: '<i class="fas fa-bolt"></i>',
    necrotic: '<i class="fas fa-skull"></i>',
    piercing: '<i class="fas fa-thumbtack"></i>',
    poison: '<i class="fas fa-skull-crossbones"></i>',
    psychic: '<i class="fas fa-brain"></i>',
    radiant: '<i class="fas fa-sun"></i>',
    slashing: '<i class="fas fa-cut"></i>',
    thunder: '<i class="fas fa-wind"></i>',
    healing: '<i class="fas fa-heart"></i>',
    temphp: '<i class="fas fa-shield-alt"></i>',
};
/**
 * Renders the html of the actions list for the provided actor data
 */
async function renderActionsList(actorData, options) {
    const actionData = getActorActionsData(actorData);
    log(false, 'renderActionsList', {
        actorData,
        data: actionData,
    });
    return renderTemplate(`modules/${MODULE_ID}/templates/actor-actions-list.hbs`, {
        actionData,
        abilities: getGame().dnd5e.config.abilityAbbreviations,
        activationTypes: {
            ...getGame().dnd5e.config.abilityActivationTypes,
            other: getGame().i18n.localize(`DND5E.ActionOther`),
        },
        damageTypes: { ...getGame().dnd5e.config.damageTypes, ...getGame().dnd5e.config.healingTypes },
        damageTypeIconMap,
        rollIcon: options?.rollIcon,
        isOwner: actorData.isOwner,
    });
}
/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
    log(true, `Initializing ${MODULE_ID}`);
    // Register custom module settings
    registerSettings();
    // Preload Handlebars templates
    await loadTemplates(Object.values(flattenObject(TEMPLATES)));
    const characterActionsModuleData = getGame().modules.get(MODULE_ID);
    if (characterActionsModuleData) {
        characterActionsModuleData.api = {
            getActorActionsData,
            isItemInActionList,
            renderActionsList,
        };
    }
    globalThis[MODULE_ABBREV] = {
        renderActionsList: async function (...args) {
            log(false, {
                api: characterActionsModuleData?.api,
            });
            console.warn(MODULE_ID, '|', 'accessing the module api on globalThis is deprecated and will be removed in a future update, check if there is an update to your sheet module');
            return characterActionsModuleData?.api?.renderActionsList(...args);
        },
        isItemInActionList: function (...args) {
            console.warn(MODULE_ID, '|', 'accessing the module api on globalThis is deprecated and will be removed in a future update, check if there is an update to your sheet module');
            return characterActionsModuleData?.api?.isItemInActionList(...args);
        },
    };
    Hooks.call(`CharacterActions5eReady`, characterActionsModuleData?.api);
});
// default sheet injection if this hasn't yet been injected
Hooks.on('renderActorSheet5e', async (app, html, data) => {
    // short circut if the user has overwritten these settings
    switch (app.actor.type) {
        case 'npc':
            const injectNPCSheet = getGame().settings.get(MODULE_ID, MySettings.injectNPCs);
            if (!injectNPCSheet)
                return;
        case 'vehicle':
            const injectVehicleSheet = getGame().settings.get(MODULE_ID, MySettings.injectVehicles);
            if (!injectVehicleSheet)
                return;
        case 'character':
            const injectCharacterSheet = getGame().settings.get(MODULE_ID, MySettings.injectCharacters);
            if (!injectCharacterSheet)
                return;
    }
    log(false, 'default sheet open hook firing', {
        app,
        html,
        data,
    });
    const actionsList = $(html).find('.character-actions-dnd5e');
    log(false, 'actionsListExists', { actionsListExists: actionsList.length });
    if (!actionsList.length) {
        await addActionsTab(app, html, data);
    }
    addFavoriteControls(app, html);
});
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE_ID);
});
//# sourceMappingURL=foundryvtt-dnd5eCharacterActions.js.map
