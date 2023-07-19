import { rpChat, rpDescMap } from "./foundry.js";
import { rpIsNameUnique, rpGenerateRandomName } from "./generateRandomName.js";
import {
	rpShowUndo,
	rpChooseFromSavedNames,
	rpShowRefresh,
} from "./tokenHUD.js";
import {
	rpShowSavedNames,
	rpGenerateNamesForActor,
	rpGetActorData,
	rpSelectRandomUnusedSavedName,
	rpCrossCheckNames,
} from "./actors.js";
import {
	rp,
	rpGetDefaultOptions,
	rpToTitleCase,
} from "./util.js";

let rpTokenProcessingQueue = [];
let rpIsProcessing = false;

/**
 * This function is responsible for handling a given token.
 * It checks various settings and conditions to determine how the token should be handled.
 * If the conditions are met, it initiates the process to generate a new name for the token.
 * It then updates the token's name.
 */
const rpHandleToken = async (rpTokenDocument) => {
	const rpActorData = rpGetActorData(rpTokenDocument.actor);
	const rpAutoName = game.settings.get(
		"rp-names",
		"rpSettingsAutoNameNewTokens"
	);

	// Consolidate all early return conditions at the start
	if (
		!rpAutoName ||
		rpTokenDocument.isLinked ||
		rpActorData.rpKind === "character" ||
		/item pile/i.test(rpActorData.rpCreature)
	) {
		rp.warn("Not a valid token type for name generation.");
		return;
	}

	const rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");
	// rpCustomType from rpSavedConfigurations where key is rpActorData.rpCreature
	const rpSavedConfigs = game.settings.get("rp-names", "rpSettingsName");
	const rpCustomCreature =
		rpSavedConfigs[rpActorData.rpCreature]?.rpCustomType || "";
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

	const rpUseSavedNamesFirst = game.settings.get(
		"rp-names",
		"rpSettingsUseSavedNamesFirst"
	);

	// Check if we should use a saved name first
	if (rpUseSavedNamesFirst && rpSavedNamesCount > 0) {
		try {
			const rpSavedName = await rpSelectRandomUnusedSavedName(
				rpActorData
			);
			if (rpSavedName && rpIsNameUnique(rpSavedName)) {
				rp.dev(
					`Token name changed from ${rpTokenDocument.name} to ${rpSavedName}`
				);
				rpTokenDocument.update({ name: rpSavedName });
				return;
			}
		} catch (error) {
			rp.error("An error occurred while renaming the token.");
			rp.obj(error);
		}
	}

	try {
		if (rpDefaultOptions.rpNamingMethod === "rpNone") {
			rp.error(
				"Naming Style set to 'None' in custom settings. Skipping name generation. To reenable name generation, change the model to something other than 'None' or delete the custom name setting in the module's settings."
			);
			return;
		}

		let rpTokenName;
		let rpIsUnique = false;
		let rpTemperature = game.settings.get(
			"rp-names",
			"rpSettingsTemperature"
		);

		for (let rpAttempts = 0; rpAttempts < 5 && !rpIsUnique; rpAttempts++) {
			rpTokenName = await rpGenerateRandomName(
				rpActorData.rpKind,
				rpActorData.rpCreature,
				rpActorData.rpCreatureType,
				rpActorData.rpCreatureSubtype,
				rpDefaultOptions,
				1,
				rpTemperature
			);
			if (rpAttempts > 0) {
				rp.log(`Attempt #${rpAttempts + 1} to generate a unique name.`);
			}
			rpIsUnique =
				game.system.id === "dnd5e" ? rpIsNameUnique(rpTokenName) : true;

			// If a name was generated and it's unique, update the token with the new name
			if (rpTokenName && rpIsUnique) {
				rpTokenDocument.update({ name: rpTokenName });
			} else if (rpAttempts === 4) {
				// Create a copy of rpDefaultOptions with 'rpNamingMethod' forced to 'rpNamesAdjective'
				const rpOfflineDefaultOptions = {
					...rpDefaultOptions,
					rpNamingMethod: "rpAdjective",
				};
				rpTokenName = await rpGenerateRandomName(
					rpActorData.rpKind,
					rpActorData.rpCreature,
					rpActorData.rpCreatureType,
					rpActorData.rpCreatureSubtype,
					rpOfflineDefaultOptions,
					1,
					rpTemperature
				);
				rp.warn(
					"Unable to generate a unique name after 5 attempts. You may manually refresh the name with different settings by right-clicking on the refresh button on the token HUD."
				);
				rpTokenDocument.update({ name: rpTokenName });
			}
		}
	} catch (error) {
		rp.error("Error while processing token creation.");
		rp.obj(error);
	}
};

/**
 * Processes the next token in the queue.
 * If the queue is empty, it sets the processing flag to false.
 */
const rpProcessNextToken = async () => {
	if (rpTokenProcessingQueue.length === 0) {
		rpIsProcessing = false;
		rp.log("Token processing queue complete.");
		return;
	}

	rpIsProcessing = true;
	const rpNextToken = rpTokenProcessingQueue.shift();
	await rpHandleToken(rpNextToken);

	// Add a small delay before processing the next token
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Ensure that the next token is processed only after the current one is done
	await rpProcessNextToken();
};

/**
 * Adds a token to the processing queue.
 * If the queue is not currently being processed, it starts processing.
 *
 * @param {Token} rpTokenDocument - The token to add to the processing queue.
 */
const rpAddToQueue = (rpTokenDocument) => {
	rpTokenProcessingQueue.push(rpTokenDocument);
	rp.dev("Token added to processing queue.");
	if (!rpIsProcessing) {
		rpProcessNextToken();
	}
};

/**
 * Registers a hook that fires when a new token is created.
 * When the hook fires, it adds the token to the processing queue.
 */
const rpRegisterCreateTokenHook = () => {
	Hooks.on("createToken", async (rpTokenDocument, rpData) => {
		// Add the new token to the processing queue
		rpAddToQueue(rpTokenDocument);
	});
	rp.log(
		"Registered createToken hook for naming tokens when they are first added to the canvas."
	);
};

/**
 * Register a context menu hook that fires when an Actor is right-clicked in the Actor Directory.
 * This function adds two options to the context menu: 'Show Available Names' and 'Generate New Names'.
 * The 'Show Available Names' option will show the names available for the Actor.
 * The 'Generate New Names' option will generate new names for the Actor.
 * These options are only available if the user is a GM.
 */
const rpRegisterGetActorDirectoryEntryContextHook = async () => {
	Hooks.on("getActorDirectoryEntryContext", async (html, options) => {
		options.push({
			name: game.i18n.localize("CONTEXT.SHOW_AVAILABLE_NAMES"),
			icon: '<i class="fas fa-signature"></i>',
			condition: () => {
				return game.user.isGM;
			},
			callback: (li) => {
				const docId = $(li).attr("data-document-id")
					? $(li).attr("data-document-id")
					: $(li).attr("data-actor-id")
					? $(li).attr("data-actor-id")
					: $(li).attr("data-entity-id");
				if (docId) {
					const rpActor = game.actors.get(docId);
					rpShowSavedNames(rpActor.name);
				}
			},
		});
	});

	Hooks.on("getActorDirectoryEntryContext", (html, options) => {
		options.push({
			name: game.i18n.localize("CONTEXT.GENERATE_NEW_NAMES"),
			icon: '<i class="fas fa-dice-d20"></i>',
			condition: () => {
				return game.user.isGM;
			},
			callback: (li) => {
				const docId = $(li).attr("data-document-id")
					? $(li).attr("data-document-id")
					: $(li).attr("data-actor-id")
					? $(li).attr("data-actor-id")
					: $(li).attr("data-entity-id");
				if (docId) {
					const rpActor = game.actors.get(docId);
					rpGenerateNamesForActor(rpActor);
				}
			},
		});
	});
	rp.log(
		"Registered getActorDirectoryEntryContext hook for showing available names and generating new names."
	);
};

/**
 * Hook that triggers after a token has been updated.
 * This hook will invoke the cross-check function to ensure the "used" status of names is accurate.
 *
 * @param {Token} rpTokenDocument - The updated token object.
 * @param {object} rpUpdateData - An object of the fields to update on the token.
 */
const rpRegisterPreUpdateTokenHook = async () => {
	Hooks.on("preUpdateToken", async (rpTokenDocument, rpUpdateData) => {
		if (rpUpdateData.hasOwnProperty("name")) {
			rp.log(
				`Token name changed from ${rpTokenDocument.name} to ${rpUpdateData.name}.`
			);
		}
	});
	rp.log(
		"Registered preUpdateToken hook for checking names for uniqueness when a token's name is changed."
	);
};

/**
 * Hook that triggers after a token has been updated.
 * This hook will invoke the cross-check function to ensure the "used" status of names is accurate.
 *
 * @param {Token} rpTokenDocument - The updated token object.
 * @param {object} rpUpdateData - An object of the fields to update on the token.
 */
const rpRegisterUpdateTokenHook = async () => {
	Hooks.on("updateToken", async (rpTokenDocument, rpUpdateData) => {
		rpCrossCheckNames();
	});
	rp.log(
		"Registered updateToken hook for checking names for uniqueness when a token's name is changed."
	);
};

/**
 * Hook that triggers after a token has been deleted.
 * This hook will invoke the cross-check function to ensure the "used" status of names is accurate.
 *
 * @param {Token} rpTokenDocument - The deleted token object.
 * @param {object} rpTokenData - The initial data of the deleted token.
 * @param {Options} rpOptions - The options passed to the delete operation.
 * @param {string} rpUserId - The id of the user who initiated the delete action.
 */
const rpRegisterDeleteTokenHook = async () => {
	Hooks.on(
		"deleteToken",
		async (rpTokenDocument, rpTokenData, rpOptions, rpUserId) => {
			rpCrossCheckNames();
			rp.log(`Deleted token ${rpTokenDocument.name}.`);
		}
	);
	rp.log(
		"Registered deleteToken hook for checking names for uniqueness when a token is deleted from the canvas."
	);
};

/**
 * Register a hook that fires when the Token HUD is rendered.
 * This function will add several controls to the Token HUD if the user is a GM, such as:
 * - 'Undo': which will undo the last name change.
 * - 'Choose from saved names': which will allow the GM to choose a name from a list of saved names.
 * - 'Refresh': which will generate a new name for the token.
 */
const rpRegisterRenderTokenHUDHook = () => {
	Hooks.on("renderTokenHUD", (tokenHUD, html, app) => {
		if (game.user.isGM) {
			rpShowUndo(tokenHUD, html);
			rpChooseFromSavedNames(tokenHUD, html);
			rpShowRefresh(tokenHUD, html);
		}
	});
	rp.log(
		"Registered renderTokenHUD hook for showing the new token HUD buttons."
	);
};

const rpRegisterChatMessageHook = async () => {
	/**
	 * This hook runs when a chat message is being processed. It checks if the message content starts with
	 * one of the recognized commands. If a command is recognized, the arguments for that command are validated.
	 * If the arguments are valid, the corresponding function for the command is called. If the arguments are
	 * not valid, an error message is sent to the user.
	 *
	 * @async
	 * @hook chatMessage
	 * @param {ChatLog} log - The chat log.
	 * @param {string} rpMessageContent - The content of the chat message.
	 * @param {Object} rpData - The original message data.
	 *
	 * @returns {boolean} - It returns false to prevent the command from being sent as a chat message.
	 *
	 * @throws {Error} - Throws an error message to the user if the command arguments are invalid.
	 *
	 * Recognized commands:
	 *   !n or !name: Generates a random name for a creature.
	 */
	Hooks.on("chatMessage", (log, rpMessageContent, rpData) => {
		// Split the messageContent into rpCommand and the rest
		let [rpCommand, ...args] = rpMessageContent.split(" ");

		// Validate the arguments based on the command
		switch (rpCommand) {
			case "!n":
			case "!name":
				if (args.length < 1) {
					rpChat.sendError(
						`<p><em>Generate a random name</em><br><br><b>Usage</b>:<br><br><b>!n</b> or <b>!name</b> + <b>subject to be named</b><br>Example: <b>!n deserted pirate ship</b><br>Example: <b>!n chubby kobold</b><br>Example: <b>!n female ice giant</b>`
					);
				} else {
					rp.warn(`rpSubject: ${args.join(" ")}`);
					rpChat.name(args.join(" "), rpData);
				}
				return false;
		}
	});
};

const rpRegisterRenderSidebarTabHook = () => {
	Hooks.once("renderSidebarTab", async (app, html) => {
		let img = document.createElement("img");
		img.id = "header-d20-image";
		img.src = "./modules/rp-names/img/d20.webp";
		img.alt = "Processing AI Request";
		img.style.display = "none";
		img.style.border = "none";
		img.style.width = "50%";
		img.style.position = "absolute";
		img.style.right = "100%";
		img.style.top = "0";

		// Append the image to the sidebar
		html[0].closest("#sidebar").appendChild(img);
	});
};

const rpRegisterRenderChatMessageHook = () => {
	Hooks.on("renderChatMessage", (chatItem, html, msg) => {
		// Event listener for the delete button
		html.find(".delete-card").click((ev) => {
			let messageId = $(ev.currentTarget).data("message-id");
			let message = game.messages.get(messageId);
			if (message.user.id === game.user.id || game.user.isGM) {
				message.delete();
			} else {
				ui.notifications.warn(
					"You can only delete your own messages or if you are GM!"
				);
			}
		});

		// Event listener for the assign name button
		html.find(".assign-name").click((ev) => {
			let messageId = $(ev.currentTarget).data("message-id");
			let rpName = $(ev.currentTarget).data("name");
			let message = game.messages.get(messageId);
			if (message.user.id === game.user.id || game.user.isGM) {
				let tokens = canvas.tokens.controlled;
				if (tokens.length === 0) {
					ui.notifications.warn("No token is selected!");
				} else if (tokens.length > 1) {
					ui.notifications.warn("Multiple tokens are selected!");
				} else {
					// Set name of the token
					tokens[0].document.update({ name: rpName });
					// Delete the message
					message.delete();
				}
			} else {
				ui.notifications.warn(
					"You can only assign names to your own tokens or if you are GM!"
				);
			}
		});
	});
};

/**
 * A class that extends the Dialog class of the Foundry VTT software.
 * This class handles the custom settings dialog of the application.
 * It activates listeners on various HTML elements of the dialog and adjusts the visibility of some elements based on the user's choices.
 */
class RPCustomSettingsDialog extends Dialog {
	constructor(dialogData = {}, options = {}) {
		super(dialogData, options);
	}

	activateListeners(html) {
		super.activateListeners(html);

		const rpNamingMethodSelect = html.find("select[name='rpNamingMethod']");
		const rpNamingMethodSelectValue = rpNamingMethodSelect.val();

		switch (rpNamingMethodSelectValue) {
			case "rpProperAi":
				html.find("#proper-ai").show();
				html.find("#adjective-ai").hide();
				html.find("#proper").hide();
				html.find("#adjective").hide();
				html.find("#numbered").hide();
				break;
			case "rpAdjectiveAi":
				html.find("#proper-ai").hide();
				html.find("#adjective-ai").show();
				html.find("#proper").hide();
				html.find("#adjective").hide();
				html.find("#numbered").hide();
				break;
			case "rpProper":
				html.find("#proper-ai").hide();
				html.find("#adjective-ai").hide();
				html.find("#proper").show();
				html.find("#adjective").hide();
				html.find("#numbered").hide();
				break;
			case "rpAdjective":
				html.find("#proper-ai").hide();
				html.find("#adjective-ai").hide();
				html.find("#proper").hide();
				html.find("#adjective").show();
				html.find("#numbered").hide();
				break;
			case "rpNumbered":
				html.find("#proper-ai").hide();
				html.find("#adjective-ai").hide();
				html.find("#proper").hide();
				html.find("#adjective").hide();
				html.find("#numbered").show();
				break;
			default:
				html.find("#proper-ai").hide();
				html.find("#adjective-ai").hide();
				html.find("#proper").hide();
				html.find("#adjective").hide();
				html.find("#numbered").hide();
		}

		rp.dev(
			`Unhid form elements for ${rpNamingMethodSelectValue} and hid the rest.`
		);

		rpNamingMethodSelect.change(function () {
			const rpNamingMethodSelectValue = $(this).val();
			switch (rpNamingMethodSelectValue) {
				case "rpProperAi":
					html.find("#proper-ai").show();
					html.find("#adjective-ai").hide();
					html.find("#proper").hide();
					html.find("#adjective").hide();
					html.find("#numbered").hide();
					break;
				case "rpAdjectiveAi":
					html.find("#proper-ai").hide();
					html.find("#adjective-ai").show();
					html.find("#proper").hide();
					html.find("#adjective").hide();
					html.find("#numbered").hide();
					break;
				case "rpProper":
					html.find("#proper-ai").hide();
					html.find("#adjective-ai").hide();
					html.find("#proper").show();
					html.find("#adjective").hide();
					html.find("#numbered").hide();
					break;
				case "rpAdjective":
					html.find("#proper-ai").hide();
					html.find("#adjective-ai").hide();
					html.find("#proper").hide();
					html.find("#adjective").show();
					html.find("#numbered").hide();
					break;
				case "rpNumbered":
					html.find("#proper-ai").hide();
					html.find("#adjective-ai").hide();
					html.find("#proper").hide();
					html.find("#adjective").hide();
					html.find("#numbered").show();
					break;
				default:
					html.find("#proper-ai").hide();
					html.find("#adjective-ai").hide();
					html.find("#proper").hide();
					html.find("#adjective").hide();
					html.find("#numbered").hide();
			}

			rp.dev(
				`Unhid form elements for ${rpNamingMethodSelectValue} and hid the rest.`
			);
		});
	}
}

export {
	rpRegisterCreateTokenHook,
	rpRegisterRenderTokenHUDHook,
	rpRegisterGetActorDirectoryEntryContextHook,
	rpRegisterPreUpdateTokenHook,
	rpRegisterUpdateTokenHook,
	rpRegisterDeleteTokenHook,
	rpRegisterChatMessageHook,
	rpRegisterRenderSidebarTabHook,
	rpRegisterRenderChatMessageHook,
	RPCustomSettingsDialog,
};
