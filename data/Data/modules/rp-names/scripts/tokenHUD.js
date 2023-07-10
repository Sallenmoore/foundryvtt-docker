import { rpShowNameCustomizationDialog } from "./dialog.js";
import {
	rpGenerateRandomName,
	rpGenerateCreatureDescription,
	rpIsNameUnique,
	rpSetTokenNameToGenerating,
	rpRestoreTokenName,
	rpValidatePatreonKey,
} from "./generateRandomName.js";
import {
	rpShowSavedNames,
	rpGetActorData,
	rpSelectRandomUnusedSavedName,
	rpCrossCheckNames,
} from "./actors.js";
import {
	rp,
	rpAddNestedValue,
	rpGetBiographyLocation,
	rpGetNestedProperty,
	rpGetLocalStorageItem,
	rpSetLocalStorageItem,
	rpCheckNameAndPromptDialog,
	rpGetDefaultOptions,
} from "./util.js";

const UNDO_ICON_HTML = `<div class="control-icon rp-names-undo"><i class="fas fa-undo"></i></div>`;
const REFRESH_ICON_HTML = `<div class="control-icon rp-names-refresh"><i class="fas fa-sync"></i></div>`;
const DESCRIPTION_ICON_HTML = `<div class="control-icon rp-names-description"><i class="fas fa-file-alt"></i></div>`;
const SAVED_NAMES_ICON_HTML = `<div class="control-icon rp-names-saved-names"><i class="fas fa-list"></i></div>`;

let rpOldTokenName = "";

/**
 * Displays the "Undo" button on the tokenHUD.
 * @param {TokenHUD} tokenHUD - The TokenHUD object.
 * @param {JQuery} html - The HTML content of the tokenHUD.
 */
const rpShowUndo = (tokenHUD, html) => {
	const rpUndoButton = $(UNDO_ICON_HTML);
	rpUndoButton.attr("title", game.i18n.localize("HUD.UNDO_NAME"));
	html.find(".col.right").append(rpUndoButton);

	rpUndoButton.on("click", (event) => {
		event.preventDefault();
		event.stopPropagation();

		const rpTokenDocument = tokenHUD.object;
		const rpParentActorName = rpTokenDocument.actor.name;

		rpTokenDocument.document.update({ name: rpParentActorName });
		tokenHUD.clear();
	});
};

/**
 * Adds a tokenHUD button to open the saved names form and let the user select a name.
 * @param {TokenHUD} tokenHUD - The TokenHUD object.
 * @param {JQuery} html - The HTML content of the tokenHUD.
 */
const rpChooseFromSavedNames = (tokenHUD, html) => {
	const rpSavedNamesButton = $(SAVED_NAMES_ICON_HTML);
	const rpActorData = rpGetActorData(tokenHUD.object.actor);
	const rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");
	const rpSavedConfigs = game.settings.get("rp-names", "rpSettingsName");
	const rpCustomCreature =
		rpSavedConfigs[rpActorData.rpCreature]?.rpCustomType || "";
	rpCrossCheckNames();
	const rpDefaultOptions = rpGetDefaultOptions(rpActorData);
	let rpSavedNamesCount = 0;
	for (const key in rpSavedNames) {
		if (
			(rpSavedNames[key].creature === rpActorData.rpCreature ||
				rpSavedNames[key].creature === rpCustomCreature) &&
			rpSavedNames[key].used === false &&
			rpSavedNames[key].nameFormat ===
				rpDefaultOptions[rpDefaultOptions.rpNamingMethod].rpNameFormat
		) {
			rpSavedNamesCount++;
		}
	}

	rp.dev(`Saved names available: ${rpSavedNamesCount}`);

	if (rpSavedNamesCount > 0) {
		rpSavedNamesButton
			.find("i.fas.fa-list")
			.append(`<div class="count-overlay">${rpSavedNamesCount}</div>`);
	} else {
		rpSavedNamesButton
			.find("i.fas.fa-list")
			.append(`<div class="count-overlay">0</div>`);
	}

	rpSavedNamesButton.attr("title", game.i18n.localize("HUD.SAVED_NAMES"));
	html.find(".col.right").append(rpSavedNamesButton);

	rpSavedNamesButton.on("mousedown", async (event) => {
		event.preventDefault();
		event.stopPropagation();

		const rpTokenDocument = tokenHUD.object.document;

		if (event.which === 3) {
			// Right-click
			rpShowSavedNames(
				[rpActorData.rpCreature, rpCustomCreature],
				rpTokenDocument
			);
			tokenHUD.clear();
		} else {
			// Left-click
			try {
				// Use rpSelectRandomUnusedSavedName to find a random unused saved name
				const randomName = await rpSelectRandomUnusedSavedName(
					rpActorData
				);
				if (randomName !== null && randomName !== undefined) {
					rpTokenDocument.update({ name: randomName });
				}
			} catch (error) {
				rp.error("Unable to select a random unused saved name.");
				rp.obj(error);
				// Handle the error here, perhaps by generating a new name or showing a user-friendly message
			} finally {
				tokenHUD.clear();
			}
		}
	});

	// Prevent the context menu from appearing on right-click
	rpSavedNamesButton.on("contextmenu", (event) => {
		event.preventDefault();
	});
};

/**
 * Displays the "Refresh" button on the tokenHUD.
 * @param {TokenHUD} tokenHUD - The TokenHUD object.
 * @param {JQuery} html - The HTML content of the tokenHUD.
 */
const rpShowRefresh = async (tokenHUD, html) => {
	const rpRefreshButton = $(REFRESH_ICON_HTML);
	const rpPatreonOk = await rpValidatePatreonKey();
	rpSetLocalStorageItem("patreon-ok", rpPatreonOk);
	if (typeof game !== "undefined")
		game.settings.set("rp-names", "rpSettingsPatreonOk", rpPatreonOk);
	const rpTokenDocument = tokenHUD.object.document;
	const rpActorData = rpGetActorData(rpTokenDocument.actor);

	if (rpPatreonOk) {
		rpRefreshButton.addClass("pulsate");
		rpRefreshButton
			.find("i.fas.fa-sync")
			.append('<div class="ai-overlay">AI</div>');
	}

	rpRefreshButton.attr("title", game.i18n.localize("HUD.REFRESH_NAME"));
	html.find(".col.right").append(rpRefreshButton);

	rpRefreshButton.on("mousedown", async (event) => {
		event.preventDefault();
		event.stopPropagation();

		if (
			/item pile/i.test(rpActorData.rpCreature) ||
			rpActorData.rpKind === "character" ||
			rpTokenDocument.isLinked ||
			rpActorData.rpKind === "undefined"
		) {
			rpRestoreTokenName(rpTokenDocument);
			rp.warn("Not a valid token type for name generation.");
			return;
		}

		let rpCustomOptions = {};
		let rpTemperature = game.settings.get(
			"rp-names",
			"rpSettingsTemperature"
		);

		if (event.which === 3) {
			// Right-click
			tokenHUD.clear();
			rpCustomOptions = await rpShowNameCustomizationDialog(rpActorData);
			if (rpCustomOptions === null) {
				rpRestoreTokenName(rpTokenDocument);
				rp.warn("Name customization dialog canceled.");
				return;
			}
		} else {
			tokenHUD.clear();
			rpCustomOptions = rpGetDefaultOptions(rpActorData);
		}

		let rpTokenName;
		let rpIsUnique = false;

		for (let rpAttempts = 0; rpAttempts < 5 && !rpIsUnique; rpAttempts++) {
			rpSetTokenNameToGenerating(rpTokenDocument);
			rpTokenName = await rpGenerateRandomName(
				rpActorData.rpKind,
				rpActorData.rpCreature,
				rpActorData.rpCreatureType,
				rpActorData.rpCreatureSubtype,
				rpCustomOptions,
				1,
				rpPatreonOk,
				rpTemperature
			);

			if (rpCustomOptions.rpNamingMethod === "rpNone") {
				rp.warn(
					"Naming Style set to 'None' in custom settings. Skipping name generation. To reenable name generation, change the naming style to something other than 'None' or delete the custom name setting in the module's settings."
				);
				rpRestoreTokenName(rpTokenDocument);
				return;
			}

			if (rpAttempts > 0) {
				rp.log(`Attempt #${rpAttempts + 1} to generate a unique name.`);
			}
			rpIsUnique =
				game.system.id === "dnd5e" ? rpIsNameUnique(rpTokenName) : true;

			if (rpTokenName && rpIsUnique) {
				rpTokenDocument.update({ name: rpTokenName });
			} else if (rpAttempts === 4) {
				rpRestoreTokenName(rpTokenDocument);
				rp.error(
					"Unable to generate a unique name after 5 attempts. Try again with different settings by right-clicking on the refresh button on the token HUD."
				);
			}
		}
	});

	// Prevent the context menu from appearing on right-click
	rpRefreshButton.on("contextmenu", (event) => {
		event.preventDefault();
	});
};

/**
 * Displays the "Description" button on the tokenHUD.
 * @param {TokenHUD} tokenHUD - The TokenHUD object.
 * @param {JQuery} html - The HTML content of the tokenHUD.
 */
const rpShowDescription = async (tokenHUD, html) => {
	const rpDescriptionButton = $(DESCRIPTION_ICON_HTML);
	const rpTokenDocument = tokenHUD.object.document;
	const rpActorData = rpGetActorData(rpTokenDocument.actor);
	const rpPatreonOk = await rpValidatePatreonKey();
	rpSetLocalStorageItem("patreon-ok", rpPatreonOk);

	let rpTokenBiographyLocation = rpGetBiographyLocation(game.system.id);
	let rpTokenBiography = rpGetNestedProperty(
		rpTokenDocument,
		rpTokenBiographyLocation
	);

	if (typeof game !== "undefined")
		game.settings.set("rp-names", "rpSettingsPatreonOk", rpPatreonOk);
	const rpSavedDescriptions = game.settings.get(
		"rp-names",
		"rpSettingsSavedDescriptions"
	);

	if (rpSavedDescriptions && rpSavedDescriptions[rpTokenDocument.name]) {
		rpDescriptionButton.addClass("highlight-border");
	}

	if (rpPatreonOk) {
		rpDescriptionButton.addClass("pulsate");
		rpDescriptionButton
			.find("i.fas.fa-file-alt")
			.append('<div class="ai-overlay">AI</div>');
	}

	rpDescriptionButton.attr(
		"title",
		game.i18n.localize("HUD.GENERATE_DESCRIPTION")
	);
	html.find(".col.left").append(rpDescriptionButton);

	rpDescriptionButton.on("mousedown", async (event) => {
		event.preventDefault();
		event.stopPropagation();

		const rpName = rpTokenDocument.name;
		const rpLanguage = game.settings.get(
			"rp-names",
			"rpSettingsLanguageDescription"
		);
		const rpTemperature = game.settings.get(
			"rp-names",
			"rpSettingsTemperature"
		);
		const rpDescriptionLength = game.settings.get(
			"rp-names",
			"rpSettingsCreatureDescriptionLength"
		);

		tokenHUD.clear();

		let rpShowInChat = game.settings.get(
			"rp-names",
			"rpSettingsShowDescriptionInChat"
		);
		let rpDescription;

		if (event.which === 3) {
			rpDescription = await rpGenerateCreatureDescription(
				rpName,
				rpActorData.rpCreature,
				rpLanguage,
				rpTemperature,
				rpDescriptionLength,
				rpPatreonOk
			);
		} else {
			// Poll the rpSavedDescriptions setting
			const rpSavedDescriptions = game.settings.get(
				"rp-names",
				"rpSettingsSavedDescriptions"
			);

			if (rpSavedDescriptions && rpSavedDescriptions[rpName]) {
				rpDescription = rpSavedDescriptions[rpName].description;
				rp.log("Loaded saved description from settings.");
			} else {
				rpDescription = await rpGenerateCreatureDescription(
					rpName,
					rpActorData.rpCreature,
					rpLanguage,
					rpTemperature,
					rpDescriptionLength,
					rpPatreonOk
				);
			}
		}

		if (rpDescription) {
			// Create a DOMParser and parse the rpTokenBiography string
			let parser = new DOMParser();
			let doc = parser.parseFromString(rpTokenBiography, "text/html");

			// Get all elements
			let allElements = doc.querySelectorAll("*");

			allElements.forEach((element) => {
				let classes = element.getAttribute("class");

				// If the element has classes and one of them starts with 'rp-description-', remove the element
				if (classes) {
					let classArray = classes.split(" ");
					if (
						classArray.some((c) => c.startsWith("rp-description-"))
					) {
						element.remove();
						rp.dev(
							"Removed description element from biography/notes."
						);
					}
				}
			});

			// Serialize the Document back to a string
			rpTokenBiography = new XMLSerializer().serializeToString(doc);

			// Your existing code continues here...
			let rpDescriptionBio = `<h2 class="rp-description-header">Description:</h2><p class="rp-description-body">${rpDescription}</p>${
				rpTokenBiography.length > 0 ? rpTokenBiography : ""
			}`;

			let rpPath = rpTokenBiographyLocation.startsWith("actorData.")
				? rpTokenBiographyLocation.slice("actorData.".length)
				: rpTokenBiographyLocation;

			// Make a deep copy of actorData from rpTokenDocument
			let rpActorDataCopy = JSON.parse(
				JSON.stringify(rpTokenDocument.actorData)
			);

			// Use the function to add the nested value
			rpAddNestedValue(rpActorDataCopy, rpPath, rpDescriptionBio);

			// Apply the changes to the actor data in the token document
			rpTokenDocument.update({ actorData: rpActorDataCopy });

			rp.log("Description successfully added to biography/notes.");

			if (rpShowInChat) {
				let chatData = {
					content: `<div style="border:2px solid #44BBDD; background-color: #88DDEE; padding: 10px; border-radius: 5px;">${rpDescription}</div>`,
					speaker: {
						actor: rpTokenDocument.actor,
						alias: rpName,
					},
				};

				chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
				chatData.whisper = [game.user.id]; // Self whisper, visible only to the GM

				ChatMessage.create(chatData);
				rp.log(
					`Description for ${rpName} successfully created and sent to chat, stored in Saved Descriptions setting, and saved to the token's biography or notes.`
				);
			} else {
				rp.log(
					`Description for ${rpName} successfully created and stored in Saved Descriptions setting and in the token's biography or notes.`
				);
			}
		}
	});

	// Prevent the context menu from appearing on right-click
	rpDescriptionButton.on("contextmenu", (event) => {
		event.preventDefault();
	});
};

export { rpShowUndo, rpShowRefresh, rpChooseFromSavedNames, rpShowDescription };
