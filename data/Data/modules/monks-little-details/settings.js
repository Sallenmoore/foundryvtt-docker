import { MonksLittleDetails, i18n } from "./monks-little-details.js";
import { UpdateImages } from "./apps/update-images.js"
import { EditEffects } from "./apps/edit-effects.js";

export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-little-details";

	const debouncedReload = foundry.utils.debounce(function () { window.location.reload(); }, 500);
	
	let sortstatus = {
		'none': i18n("MonksLittleDetails.sortstatus.none"),
		'rows': i18n("MonksLittleDetails.sortstatus.rows"),
		'columns': i18n("MonksLittleDetails.sortstatus.columns")
	};

	game.settings.registerMenu(modulename, 'update-images', {
		name: 'Update Images',
		label: i18n("MonksLittleDetails.update-images.name"),
		hint: 'Open a dialog to mass update compendium actor images',
		icon: 'fas fa-image',
		restricted: true,
		type: UpdateImages
	});

	game.settings.registerMenu(modulename, 'editEffects', {
		name: 'Edit Effects',
		label: 'Edit Effects',
		hint: 'Edit additional status effects',
		icon: 'fas fa-align-justify',
		restricted: true,
		type: EditEffects
	});

	//System changes
	game.settings.register(modulename, "swap-buttons", {
		name: i18n("MonksLittleDetails.swap-buttons.name"),
		hint: i18n("MonksLittleDetails.swap-buttons.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "alter-hud", {
		name: i18n("MonksLittleDetails.alter-hud.name"),
		hint: i18n("MonksLittleDetails.alter-hud.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("alter-hud"),
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "sort-by-columns", {
		name: i18n("MonksLittleDetails.sort-by-columns.name"),
		hint: i18n("MonksLittleDetails.sort-by-columns.hint"),
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "sort-statuses", {
		name: i18n("MonksLittleDetails.sort-statuses.name"),
		hint: i18n("MonksLittleDetails.sort-statuses.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("sort-statuses"),
		default: 'rows',
		type: String,
		choices: sortstatus,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "alter-hud-colour", {
		name: i18n("MonksLittleDetails.alter-hud-colour.name"),
		hint: i18n("MonksLittleDetails.alter-hud-colour.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("alter-hud"),
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "add-extra-statuses", {
		name: i18n("MonksLittleDetails.add-extra-statuses.name"),
		hint: i18n("MonksLittleDetails.add-extra-statuses.hint"),
		scope: "world",
		config: game.system.id != "pf2e",
		default: game.system.id == "dnd5e",
		type: Boolean,
	});
	game.settings.register(modulename, "change-invisible-image", {
		name: i18n("MonksLittleDetails.change-invisible-image.name"),
		hint: i18n("MonksLittleDetails.change-invisible-image.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("change-invisible-image"),
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "core-css-changes", {
		name: i18n("MonksLittleDetails.core-css-changes.name"),
		hint: i18n("MonksLittleDetails.core-css-changes.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "window-css-changes", {
		name: i18n("MonksLittleDetails.window-css-changes.name"),
		hint: i18n("MonksLittleDetails.window-css-changes.hint"),
		scope: "world",
		config: true,
		default: !game.modules.get("pf2e-dorako-ui")?.active,
		type: Boolean,
		onChange: (value) => {
			$('body').toggleClass("change-windows", value);
        }
	});
	game.settings.register(modulename, "compendium-additional", {
		name: i18n("MonksLittleDetails.compendium-additional.name"),
		hint: i18n("MonksLittleDetails.compendium-additional.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "compendium-shortcuts", {
		name: i18n("MonksLittleDetails.compendium-shortcuts.name"),
		hint: i18n("MonksLittleDetails.compendium-shortcuts.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "compendium-view-artwork", {
		name: game.i18n.localize("MonksLittleDetails.compendium-view-artwork.name"),
		hint: game.i18n.localize("MonksLittleDetails.compendium-view-artwork.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	//Added Features
	game.settings.register(modulename, "scene-palette", {
		name: i18n("MonksLittleDetails.scene-palette.name"),
		hint: i18n("MonksLittleDetails.scene-palette.hint"),
		scope: "world",
		config: true,
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "find-my-token", {
		name: i18n("MonksLittleDetails.find-my-token.name"),
		hint: i18n("MonksLittleDetails.find-my-token.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "show-notify", {
		name: i18n("MonksLittleDetails.show-notify.name"),
		hint: i18n("MonksLittleDetails.show-notify.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "move-pause", {
		name: i18n("MonksLittleDetails.move-pause.name"),
		hint: i18n("MonksLittleDetails.move-pause.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "open-actor", {
		name: i18n("MonksLittleDetails.open-actor.name"),
		hint: i18n("MonksLittleDetails.open-actor.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "reposition-collapse", {
		name: i18n("MonksLittleDetails.reposition-collapse.name"),
		hint: i18n("MonksLittleDetails.reposition-collapse.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	
	game.settings.register(modulename, "module-management-changes", {
		name: i18n("MonksLittleDetails.module-management-changes.name"),
		hint: i18n("MonksLittleDetails.module-management-changes.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "macro-tabs", {
		name: i18n("MonksLittleDetails.macro-tabs.name"),
		hint: i18n("MonksLittleDetails.macro-tabs.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	
	game.settings.register(modulename, "key-swap-tool", {
		name: i18n("MonksLittleDetails.key-swap-tool.name"),
		hint: i18n("MonksLittleDetails.key-swap-tool.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register(modulename, "show-warning", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});

	game.settings.register(modulename, "additional-effects", {
		scope: "world",
		config: false,
		default: game.system.id !== "pf2e" ? [
			{ "id": "charmed", "label": "MonksLittleDetails.StatusCharmed", "icon": "modules/monks-little-details/icons/smitten.svg" },
			{ "id": "exhausted", "label": "MonksLittleDetails.StatusExhausted", "icon": "modules/monks-little-details/icons/oppression.svg" },
			{ "id": "grappled", "label": "MonksLittleDetails.StatusGrappled", "icon": "modules/monks-little-details/icons/grab.svg" },
			{ "id": "incapacitated", "label": "MonksLittleDetails.StatusIncapacitated", "icon": "modules/monks-little-details/icons/internal-injury.svg" },
			{ "id": "petrified", "label": "MonksLittleDetails.StatusPetrified", "icon": "modules/monks-little-details/icons/stone-pile.svg" },
			{ "id": "hasted", "label": "MonksLittleDetails.StatusHasted", "icon": "modules/monks-little-details/icons/running-shoe.svg" },
			{ "id": "slowed", "label": "MonksLittleDetails.StatusSlowed", "icon": "modules/monks-little-details/icons/turtle.svg" },
			{ "id": "concentration", "label": "MonksLittleDetails.StatusConcentrating", "icon": "modules/monks-little-details/icons/beams-aura.svg" },
			{ "id": "rage", "label": "MonksLittleDetails.StatusRage", "icon": "modules/monks-little-details/icons/enrage.svg" },
			{ "id": "distracted", "label": "MonksLittleDetails.StatusDistracted", "icon": "modules/monks-little-details/icons/distraction.svg" },
			{ "id": "dodging", "label": "MonksLittleDetails.StatusDodging", "icon": "modules/monks-little-details/icons/dodging.svg" },
			{ "id": "disengage", "label": "MonksLittleDetails.StatusDisengage", "icon": "modules/monks-little-details/icons/journey.svg" },
			{ "id": "cover", "label": "MonksLittleDetails.StatusCover", "icon": "modules/monks-little-details/icons/push.svg" },
			{ "id": "turned", "label": "MonksLittleDetails.StatusTurned", "icon": "modules/monks-little-details/icons/turned.svg" },
		] : [],
		type: Array,
	});


	// Save these to transfer to the other modules
	game.settings.register(modulename, "show-combat-cr", {
		scope: "world",
		config: false,
		default: game.system.id != "pf2e",
		type: Boolean,
	});
	game.settings.register(modulename, "switch-combat-tab", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "hide-enemies", {
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, "hide-until-turn", {
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "prevent-initiative", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "popout-combat", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "opencombat", {
		scope: "world",
		config: false,
		default: "everyone",
		type: String
	});
	game.settings.register(modulename, "combat-position", {
		scope: "client",
		default: "bottomright",
		type: String,
		config: false
	});
	game.settings.register(modulename, "close-combat-when-done", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "prevent-token-removal", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "prevent-combat-spells", {
		scope: "world",
		config: false,
		default: true,
		type: String,
	});
	game.settings.register(modulename, "auto-defeated", {
		scope: "world",
		config: false,
		default: (game.system.id == 'D35E' || game.system.id == 'pf1' ? 'npc-negative' : 'npc-zero'),
		type: String,
	});
	game.settings.register(modulename, "invisible-dead", {
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "auto-reveal", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "auto-scroll", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "add-combat-bars", {
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "combat-bar-opacity", {
		scope: "world",
		config: false,
		default: 0.3,
		type: Number,
	});

	//Combat Turn
	game.settings.register(modulename, "shownextup", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "showcurrentup", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "large-print", {
		scope: "client",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "play-next-sound", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "play-turn-sound", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "play-round-sound", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "next-sound", {
		scope: "world",
		config: false,
		default: "modules/monks-combat-details/sounds/next.ogg",
		type: String,
	});
	game.settings.register(modulename, "turn-sound", {
		scope: "world",
		config: false,
		default: "modules/monks-combat-details/sounds/turn.ogg",
		type: String,
	});
	game.settings.register(modulename, "round-sound", {
		scope: "world",
		config: false,
		default: "modules/monks-combat-details/sounds/round.ogg",
		type: String,
	});
	game.settings.register(modulename, "volume", {
		scope: "client",
		config: false,
		default: 60,
		type: Number,
	});
	game.settings.register(modulename, "clear-targets", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "remember-previous", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "round-chatmessages", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "show-start", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});

	game.settings.register(modulename, "pan-to-combatant", {
		scope: "client",
		default: false,
		type: Boolean,
		config: false
	});

	game.settings.register(modulename, "select-combatant", {
		scope: "client",
		config: false,
		default: true,
		type: Boolean
	});

	game.settings.register(modulename, "hide-defeated", {
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	game.settings.register(modulename, "token-highlight-remove", {
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, "token-highlight-animate", {
		scope: "world",
		config: false,
		default: 100,
		type: Number,
	});
	game.settings.register(modulename, "token-highlight-picture", {
		scope: "world",
		config: false,
		default: "modules/monks-combat-marker/markers/marker02.webp",
		type: String,
	});
	game.settings.register(modulename, "token-highlight-picture-hostile", {
		scope: "world",
		config: false,
		default: "modules/monks-combat-marker/markers/marker01.webp",
		type: String,
	});
	game.settings.register(modulename, "token-highlight-scale", {
		scope: "world",
		config: false,
		default: 1.5,
		type: Number,
	});
	game.settings.register(modulename, "token-combat-animation", {
		scope: "world",
		default: 'clockwise',
		type: String,
		config: false
	});
	game.settings.register(modulename, "token-combat-animation-hostile", {
		scope: "world",
		default: 'clockwise',
		type: String,
		config: false
	});

	game.settings.register(modulename, "show-bloodsplat", {
		scope: "world",
		config: false,
		default: "true",
		type: String,
	});
	game.settings.register(modulename, "bloodsplat-colour", {
		scope: "world",
		config: false,
		default: '#FF0000',
		type: String,
	});
	game.settings.register(modulename, "bloodsplat-size", {
		scope: "world",
		config: false,
		default: 1,
		type: Number,
	});
	game.settings.register(modulename, "bloodsplat-opacity", {
		scope: "world",
		config: false,
		default: 0.2,
		type: Number,
	});
	game.settings.register(modulename, "treasure-chest", {
		scope: "world",
		config: false,
		default: "icons/svg/chest.svg",
		type: String,
	});
	game.settings.register(modulename, "treasure-chest-size", {
		scope: "world",
		config: false,
		default: 0.9,
		type: Number,
	});
};
