import { rpShowNameCustomizationDialog } from "./dialog.js";
import {
	rpGenerateRandomName,
	rpValidatePatreonKey,
	rpIsNameUnique,
} from "./generateRandomName.js";
import {
	RPSavedNamesForm,
	RPSavedDescriptionsForm,
} from "./registerSettings.js";
import {
	rp,
	rpSetUsedByName,
	rpGetOrNull,
	rpGetItemName,
	rpFormat,
	rpGetLocalStorageItem,
	rpSetLocalStorageItem,
	rpGetDefaultOptions,
} from "./util.js";

/**
 * Function that finds an object by its type and returns the name of that object.
 *
 * @param {Array} rpArray - The array to be searched.
 * @param {string} rpType - The type of the object to be found.
 * @returns {(string|"")} The name of the found object or empty string if no object is found.
 */
const rpFindNameByType = (rpArray, rpType) => {
	const rpItem = rpArray.find((item) => item.type === rpType);
	return rpItem ? rpItem.name : "";
};

/**
 * Retrieves detailed actor data.
 *
 * @param {Object} rpActor - The actor object.
 * @returns {Object} An object containing detailed actor data.
 */
const rpGetActorData = (rpActor) => {
	const rpGameSystem = game.system.id;

	let rpActorData = {
		rpActor: rpActor,
		rpGameSystem: rpGameSystem,
		rpKind: "",
		rpCreature: "",
		rpType: "",
		rpClass: "",
		rpGender: "",
		rpCreatureType: "",
		rpCreatureSubtype: "",
		rpSize: "",
		rpBackground: "",
		rpBiographyPrivate: "",
		rpBiographyPublic: "",
		rpAlignment: "",
		rpDeity: "",
		rpLanguages: [],
		rpPrototypeName: "",
	};

	const rpSystems = {
		dnd5e: () => {
			const isNPC = rpActor.type !== "character";
			return {
				rpKind: isNPC ? "npc" : "character",
				rpCreature: rpActor.name,
				rpType: rpActor.type,
				rpClass: rpGetItemName(rpActor.items, "class"),
				rpCreatureType:
					rpGetOrNull(rpActor, "system.details.race") ||
					rpGetOrNull(rpActor, "system.details.type.custom") ||
					rpGetOrNull(rpActor, "system.details.type.value"),
				rpCreatureSubtype: isNPC
					? rpGetOrNull(rpActor, "system.details.type.subtype")
					: rpGetOrNull(rpActor, "system.details.race"),
				rpSize: rpFormat(rpGetOrNull(rpActor, "system.traits.size"), "size"),
				rpBackground: isNPC
					? rpGetOrNull(rpActor, "system.details.background")
					: rpGetItemName(rpActor.items, "background"),
				rpBiographyPrivate: rpGetOrNull(
					rpActor,
					"system.details.biography.value"
				),
				rpBiographyPublic: rpGetOrNull(
					rpActor,
					"system.details.biography.public"
				),
				rpAlignment: rpFormat(
					rpGetOrNull(rpActor, "system.details.alignment"),
					"alignment"
				),
				rpLanguages: rpGetOrNull(rpActor, "system.traits.languages.value"),
				rpPrototypeName: rpGetOrNull(rpActor, "prototypeToken.name"),
			};
		},
		pf2e: () => {
			const isNPC = rpActor.type !== "character";
			return {
				rpKind: isNPC ? "npc" : "character",
				rpCreature: rpActor.name,
				rpType: rpActor.type,
				rpClass: rpGetItemName(rpActor.items, "class"),
				rpGender: rpGetOrNull(rpActor, "system.details.gender"),
				rpCreatureType:
					rpGetOrNull(rpActor, "system.details.creatureType") ||
					rpGetItemName(rpActor.items, "ancestry") ||
					rpGetOrNull(rpActor, "system.details.nationality") ||
					rpGetOrNull(rpActor, "system.traits.value.0").toLowerCase(),
				rpCreatureSubtype:
					rpGetItemName(rpActor.items, "heritage") ||
					(rpGetOrNull(rpActor, "system.traits.value.0") !==
					rpGetOrNull(rpActor, "system.details.creatureType")
						? rpGetOrNull(rpActor, "system.traits.value.0")
						: rpGetOrNull(rpActor, "system.traits.value.1")) ||
					rpGetOrNull(rpActor, "system.details.ethnicity") ||
					rpGetOrNull(rpActor, "system.details.creatureType") ||
					rpActor.name,
				rpSize: rpFormat(
					rpGetOrNull(rpActor, "system.traits.size.value"),
					"size"
				),
				rpBackground: rpGetItemName(rpActor.items, "background"),
				rpBiographyPrivate: rpGetOrNull(rpActor, "system.details.privateNotes"),
				rpBiographyPublic:
					rpGetOrNull(rpActor, "system.details.blurb") ||
					rpGetOrNull(rpActor, "system.details.publicNotes"),
				rpAlignment: rpFormat(
					rpGetOrNull(rpActor, "system.details.alignment.value"),
					"alignment"
				),
				rpDeity: rpGetOrNull(rpActor, "system.details.deity.value"),
				rpLanguages: rpGetOrNull(rpActor, "system.traits.languages.value"),
				rpPrototypeName: isNPC
					? rpActor.name
					: rpGetOrNull(rpActor, "prototypeToken.name"),
			};
		},
		wwn: () => {
			const isNPC = rpActor.type !== "character";
			return {
				rpKind: isNPC ? "npc" : "character",
				rpCreature: isNPC
					? rpGetOrNull(rpActor, "prototypeToken.name")
					: rpActor.name,
				rpType: rpActor.type,
				rpClass: isNPC
					? rpGetOrNull(rpActor, "system.classes.effort1.name")
					: rpGetOrNull(rpActor, "system.details.class"),
				rpCreatureType: isNPC
					? rpGetOrNull(rpActor, "prototypeToken.name")
					: rpActor.name,
				rpBackground: rpGetOrNull(rpActor, "system.details.background"),
				rpBiographyPrivate: rpGetOrNull(rpActor, "system.details.biography"),
				rpAlignment: rpFormat(
					rpGetOrNull(rpActor, "system.details.alignment"),
					"alignment"
				),
				rpLanguages: rpGetOrNull(rpActor, "system.languages"),
				rpPrototypeName: rpGetOrNull(rpActor, "prototypeToken.name"),
			};
		},
		swade: () => {
			const isNPC = rpActor.type !== "character";
			return {
				rpKind: isNPC ? "npc" : "character",
				rpCreature: rpActor.name,
				rpType: rpActor.type,
				rpClass: rpGetOrNull(rpActor, "system.details.archetype"),
				rpCreatureType: rpGetOrNull(rpActor, "system.details.species.name"),
				rpBiographyPrivate: rpGetOrNull(
					rpActor,
					"system.details.biography.value"
				),
				rpPrototypeName: rpGetOrNull(rpActor, "prototypeToken.name"),
			};
		},
		wfrp4e: () => {
			const isNPC = rpActor.type !== "character";
			return {
				rpKind: isNPC ? "npc" : "character",
				rpCreature: rpActor.name,
				rpType: rpActor.type,
				rpClass: rpGetOrNull(rpActor, "system.details.class.value"),
				rpGender: rpGetOrNull(rpActor, "system.details.gender.value"),
				rpCreatureType:
					rpGetOrNull(rpActor, "system.details.species.value") || rpActor.name,
				rpCreatureSubtype: rpGetOrNull(
					rpActor,
					"system.details.species.subspecies"
				),
				rpSize: rpFormat(
					rpGetOrNull(rpActor, "system.details.size.value"),
					"size"
				),
				rpBackground: rpGetOrNull(rpActor, "system.details.career.value"),
				rpBiographyPrivate: rpGetOrNull(
					rpActor,
					"system.details.gmnotes.value"
				),
				rpBiographyPublic: rpGetOrNull(
					rpActor,
					"system.details.biography.value"
				),
				rpDeity: rpGetOrNull(rpActor, "system.details.god.value"),
				rpPrototypeName: rpGetOrNull(rpActor, "prototypeToken.name"),
			};
		},
	};

	let rpSystemSpecificData = {};

	// If the game system is one of the known systems, retrieve the system-specific data
	if (rpSystems[rpGameSystem]) {
		rpSystemSpecificData = rpSystems[rpGameSystem]();
	}
	// If the game system is unknown, try to fill in the data based on dnd5e and pf2e patterns
	else {
		const dnd5eData = rpSystems["dnd5e"]();
		const pf2eData = rpSystems["pf2e"]();
		const wfrp4eData = rpSystems["wfrp4e"]();
		const swadeData = rpSystems["swade"]();
		const wwnData = rpSystems["wwn"]();

		// Merge all keys from the different game system data objects
		let allKeys = [
			...Object.keys(dnd5eData),
			...Object.keys(pf2eData),
			...Object.keys(wfrp4eData),
			...Object.keys(swadeData),
			...Object.keys(wwnData),
		];

		// Use Set to eliminate duplicate keys
		allKeys = [...new Set(allKeys)];

		allKeys.forEach((key) => {
			// Try dnd5e data first, if not, try pf2e data
			rpSystemSpecificData[key] =
				dnd5eData[key] ??
				pf2eData[key] ??
				wfrp4eData[key] ??
				swadeData[key] ??
				wwnData[key];
		});
	}

	// Ensure rpCreatureType is not null, undefined, or an empty string
	if (!rpSystemSpecificData.rpCreatureType) {
		rpSystemSpecificData.rpCreatureType =
			rpSystemSpecificData.rpCreatureSubtype || rpSystemSpecificData.rpCreature;
	}

	rp.log(`Gathered actor data for ${rpGameSystem} actor: ${rpActor.name}.`);
	rp.dev("Actor Data and System Data:");
	rp.obj(rpActorData);
	rp.obj(rpSystemSpecificData);

	return { ...rpActorData, ...rpSystemSpecificData };
};

/**
 * Displays the saved names form for a specific creature.
 *
 * @param {string[]} creatures - An array of creatures for which to display saved names.
 * @param {Token} token - The Foundry VTT token object.
 */
const rpShowSavedNames = (creatures, token) => {
	const rpSavedNamesForm = new RPSavedNamesForm(
		{
			creature: creatures,
		},
		{
			token: token,
		}
	);

	// Delay rendering of the form to allow the UI to update
	setTimeout(() => rpSavedNamesForm.render(true), 0);
};

/**
 * Displays the saved descriptions form for a specific token.
 *
 * @param {Token} token - The Foundry VTT token object.
 */
const rpShowSavedDescriptions = (token) => {
	const rpSavedDescriptionsForm = new RPSavedDescriptionsForm(
		{
			token: token,
		},
		{}
	);

	// Delay rendering of the form to allow the UI to update
	setTimeout(() => rpSavedDescriptionsForm.render(true), 0);
};

/**
 * Generates names for a specific actor, displaying the saved names form for its creature type.
 *
 * @param {Actor} actor - The Foundry VTT actor object.
 */
const rpGenerateNamesForActor = async (rpActor) => {
	const rpActorData = rpGetActorData(rpActor);

	// Show name customization dialog and get options
	const rpCustomOptions = await rpShowNameCustomizationDialog(rpActorData);
	if (rpCustomOptions === null) {
		return;
	}

	// Validate Patreon key
	const rpPatreonOk = await rpValidatePatreonKey();
	rpSetLocalStorageItem("patreon-ok", rpPatreonOk);
	if (typeof game !== "undefined") {
		game.settings.set("rp-names", "rpSettingsPatreonOk", rpPatreonOk);
	}

	// Generate a random name
	await rpGenerateRandomName(
		rpActorData.rpKind,
		rpActorData.rpCreature,
		rpActorData.rpCreatureType,
		rpActorData.rpCreatureSubtype,
		rpCustomOptions,
		10,
		rpPatreonOk,
		game.settings.get("rp-names", "rpSettingsTemperature")
	);

	// Show saved names
	rpShowSavedNames([rpActorData.rpCreature]);
	rp.log(`Generated 10 new names for ${rpActor.name}.`);
};

/**
 * Checks if a name is in the saved names list.
 * @param {string} rpName - The name to check.
 * @returns {boolean} - True if the name is in the list, false otherwise.
 */
const rpIsSavedName = (rpName) => {
	const rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");
	return Object.values(rpSavedNames).some(
		(rpSavedName) => rpSavedName.fullName === rpName
	);
};

/**
 * Selects a random name from the list of saved names that has not been used yet.
 * @param {ActorData} rpActorData - The ActorData object.
 * @returns {string|null} A random unused name, or null if there are no available names.
 */
const rpSelectRandomUnusedSavedName = async (rpActorData) => {
	return new Promise((resolve, reject) => {
		const rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");
		const rpSavedConfigs = game.settings.get("rp-names", "rpSettingsName");
		const rpCustomCreature =
			rpSavedConfigs[rpActorData.rpCreature]?.rpCustomType || "";
		const rpDefaultOptions = rpGetDefaultOptions(rpActorData);

		let rpAvailableNames = [];
		rpCrossCheckNames();
		for (const key in rpSavedNames) {
			if (
				(rpSavedNames[key].creature === rpActorData.rpCreature ||
					rpSavedNames[key].creature === rpCustomCreature) &&
				!rpSavedNames[key].used &&
				key !== rpActorData.rpCreature &&
				rpIsNameUnique(key) &&
				rpSavedNames[key].nameFormat ===
					rpDefaultOptions[rpDefaultOptions.rpNamingMethod].rpNameFormat
			) {
				rpAvailableNames.push(key);
			}
		}

		if (rpAvailableNames.length > 0) {
			const name =
				rpAvailableNames[Math.floor(Math.random() * rpAvailableNames.length)];
			rpSetUsedByName(name);
			resolve(name);
		} else {
			rp.warn("No available names in saved names.");
			reject("No name found");
		}
	});
};

/**
 * Cross-checks all rpSavedNames with the names of all tokens on the canvas.
 * Updates the used property of each rpSavedName based on the result.
 */
const rpCrossCheckNames = () => {
	// Get all existing token names
	const rpExistingTokenNames = canvas.tokens.placeables.map((t) => t.name);

	// Get saved names
	let rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");

	// Iterate over each saved name
	for (let rpSavedName in rpSavedNames) {
		// Check if name exists in current tokens on the canvas
		if (rpExistingTokenNames.includes(rpSavedName)) {
			// If name exists, mark as used
			rpSavedNames[rpSavedName].used = true;
		} else {
			// If name doesn't exist, mark as unused
			rpSavedNames[rpSavedName].used = false;
		}
	}

	// Save updated rpSavedNames back to game settings
	game.settings.set("rp-names", "rpSettingsSavedNames", rpSavedNames);
};

export {
	rpShowSavedNames,
	rpGenerateNamesForActor,
	rpShowSavedDescriptions,
	rpFindNameByType,
	rpGetActorData,
	rpIsSavedName,
	rpSelectRandomUnusedSavedName,
	rpCrossCheckNames,
};
