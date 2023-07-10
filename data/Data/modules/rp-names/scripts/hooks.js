import { rpChat, rpDescMap } from "./foundry.js";
import {
	rpIsNameUnique,
	rpValidatePatreonKey,
	rpGenerateRandomName,
	rpSetTokenNameToGenerating,
	rpRestoreTokenName,
} from "./generateRandomName.js";
import {
	rpShowUndo,
	rpChooseFromSavedNames,
	rpShowRefresh,
	rpShowDescription,
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
	rpRemoveDescriptions,
	rpGetLocalStorageItem,
	rpSetLocalStorageItem,
	rpCheckNameAndPromptDialog,
	rpGetDefaultOptions,
	rpToTitleCase,
} from "./util.js";

let rpTokenProcessingQueue = [];
let rpIsProcessing = false;

/**
 * Validates Patreon key, saves the result to localStorage and game settings.
 *
 * @returns {Promise<boolean>} A promise that resolves to the Patreon validation result.
 */
const rpHandlePatreonValidation = async () => {
	const rpPatreonOk = await rpValidatePatreonKey();
	rpSetLocalStorageItem("patreon-ok", rpPatreonOk);
	if (typeof game !== "undefined")
		game.settings.set("rp-names", "rpSettingsPatreonOk", rpPatreonOk);
	return rpPatreonOk;
};

/**
 * This function is responsible for handling a given token.
 * It checks various settings and conditions to determine how the token should be handled.
 * If the conditions are met, it initiates the process to generate a new name for the token.
 * It then updates the token's name or restores it to its original name as necessary.
 */
const rpHandleToken = async (rpTokenDocument) => {
	const rpActorData = rpGetActorData(rpTokenDocument.actor);
	const rpAutoName = game.settings.get(
		"rp-names",
		"rpSettingsAutoNameNewTokens"
	);
	const rpContinue = await rpCheckNameAndPromptDialog(
		rpActorData.rpCreature,
		"n"
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
	} else if (!rpContinue) {
		rp.warn(
			`User declined to overwrite the proper name: ${rpActorData.rpCreature}`
		);
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

	// Moved name generation indicator to a place where it will always run if conditions are met
	if (rpActorData.rpKind === "npc") {
		rpSetTokenNameToGenerating(rpTokenDocument);
	}

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
			rpRestoreTokenName(rpTokenDocument);
			return;
		}

		const rpPatreonOk = await rpHandlePatreonValidation();
		let rpTokenName;
		let rpIsUnique = false;
		let rpTemperature = game.settings.get(
			"rp-names",
			"rpSettingsTemperature"
		);

		rpSetLocalStorageItem("patreon-ok", rpPatreonOk);
		if (typeof game !== "undefined")
			game.settings.set("rp-names", "rpSettingsPatreonOk", rpPatreonOk);

		for (let rpAttempts = 0; rpAttempts < 5 && !rpIsUnique; rpAttempts++) {
			rpTokenName = await rpGenerateRandomName(
				rpActorData.rpKind,
				rpActorData.rpCreature,
				rpActorData.rpCreatureType,
				rpActorData.rpCreatureSubtype,
				rpDefaultOptions,
				1,
				rpPatreonOk,
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
					rpPatreonOk,
					rpTemperature
				);
				rp.warn(
					"Unable to generate a unique name after 5 attempts. You may manually refresh the name with different settings by right-clicking on the refresh button on the token HUD."
				);
				rpTokenDocument.update({ name: rpTokenName });
				rpRestoreTokenName(rpTokenDocument);
			}
		}
	} catch (error) {
		rp.error("Error while processing token creation.");
		rp.obj(error);
		rpRestoreTokenName(rpTokenDocument);
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
		"Registered preUpdateToken hook for checking names for uniqueness and removing descriptions when a token's name is changed."
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
		if (rpUpdateData.hasOwnProperty("name")) {
			rpRemoveDescriptions(rpTokenDocument);
		}
	});
	rp.log(
		"Registered updateToken hook for checking names for uniqueness and removing descriptions when a token's name is changed."
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
 * - 'Show description': which will show a description for the token.
 */
const rpRegisterRenderTokenHUDHook = () => {
	Hooks.on("renderTokenHUD", (tokenHUD, html, app) => {
		if (game.user.isGM) {
			rpShowUndo(tokenHUD, html);
			rpChooseFromSavedNames(tokenHUD, html);
			rpShowRefresh(tokenHUD, html);
			rpShowDescription(tokenHUD, html);
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
	 * not valid or if a command is recognized but Patreon key validation fails, an error message is sent to the user.
	 *
	 * @async
	 * @hook chatMessage
	 * @param {ChatLog} log - The chat log.
	 * @param {string} rpMessageContent - The content of the chat message.
	 * @param {Object} rpData - The original message data.
	 *
	 * @returns {boolean} - It returns false to prevent the command from being sent as a chat message.
	 *
	 * @throws {Error} - Throws an error message to the user if the command arguments are invalid or Patreon key validation fails.
	 *
	 * Recognized commands:
	 *   !n or !name: Generates a random name for a creature.
	 *   !p or !place: Generates a random name for a place.
	 *   !d or !desc: Generates a description for a creature, place or object.
	 *   !g or !gpt: Queries ChatGPT for a response.
	 */
	Hooks.on("chatMessage", (log, rpMessageContent, rpData) => {
		// Split the messageContent into rpCommand and the rest
		let [rpCommand, ...args] = rpMessageContent.split(" ");

		const rpPatreonOk = game.settings.get(
			"rp-names",
			"rpSettingsPatreonOk"
		);

		const rpPatreonError = () => {
			const rpPatronMessage =
				"A valid Patreon key is required to use this feature. Please see <a href='https://www.patreon.com/RPGMTools' target=_blank>our Patreon page</a> for more information.";
			rpChat.sendError(rpPatronMessage);
			return false;
		};

		// Validate the arguments based on the command
		switch (rpCommand) {
			case "!help":
				rpChat.help();
				return false;
			case "!n":
			case "!name":
				if (!rpPatreonOk) {
					rpPatreonError();
					break;
				}
				if (args.length < 1) {
					rpChat.sendError(
						`<p><em>Generate a random name</em><br><br><b>Usage</b>:<br><br><b>!n</b> or <b>!name</b> + <b>subject to be named</b><br>Example: <b>!n deserted pirate ship</b><br>Example: <b>!n chubby kobold</b><br>Example: <b>!n female ice giant</b>`
					);
				} else {
					rp.warn(`rpSubject: ${args.join(" ")}`);
					rpChat.name(args.join(" "), rpData);
				}
				return false;
			case "!d":
			case "!desc":
				if (!rpPatreonOk) {
					rpPatreonError();
					break;
				}
				if (args.length < 3) {
					rpChat.sendError(
						`<p><em>Generates a description for a creature|place|object</em><br><br><b>Usage</b>:<br><br><b>!d</b> or <b>!desc</b> + <b>length of description</b> + <b>type of object</b> (one word) + <b>name of the object</b><br>Example: <b>!d brief sword Excalibur</b><br>Example: <b>!d long village Phandalin</b><br>Example: <b>!d longish goblin Grizznash the Unworthy</b>`
					);
				} else {
					let rpLength = args.shift();
					let rpType = args.shift();
					rp.warn(
						`\nrpLength: ${rpLength}\nrpType: ${rpType}\nrpSubject: ${args.join(
							" "
						)}`
					);
					rpChat.desc(rpLength, rpType, args.join(" "), rpData);
				}
				return false;
			case "!h":
			case "!home":
				if (!rpPatreonOk) {
					rpPatreonError();
					break;
				}
				if (args.length < 1) {
					rpChat.sendError(
						"<p><em>Generates a random homebrewed creature or item</em><br><br><b>Usage</b>:<br><br><b>!h</b> or <b>!home</b> + <b>description of the desired homebrew</b><br>Example: <b>!h variant wolf cr5</b><br>Example: <b>!h logging village near Neverwinter</b><br>Example: <b>!h two-handed mace for lvl 10 barbarian, path of the totem</b>"
					);
				} else {
					rp.warn(`rpPrompt: ${args.join(" ")}`);
					rpChat.home(args.join(" "), rpData);
				}
				return false;
			case "!g":
			case "!gpt":
				if (!rpPatreonOk) {
					rpPatreonError();
					break;
				}
				if (args.length < 1) {
					rpChat.sendError(
						`<em>Queries ChatGPT for a response</em><br><br><p><b>Usage</b>:<br><br><b>!g</b> or <b>!gpt</b> + <b>a ChatGPT request</b><br>Example: <b>!g A goblin walks into a bar and</b><br>Example: <b>!g CR for goblin chief</b>`
					);
				} else {
					rp.warn(`rpPrompt: ${args.join(" ")}`);
					rpChat.gpt(args.join(" "), rpData);
				}
				return false;
			case "!r":
			case "!reset":
				rpChat.resetHistory();
				return false;
			case "!chathistory":
				rpChat.showHistory();
				return false;
			case "!togglehistory":
				rpChat.toggleHistory();
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

		// Event listener for the create journal button
		html.find(".create-journal").click(async (ev) => {
			let messageId = $(ev.currentTarget).data("message-id");
			let rpSubject = rpToTitleCase($(ev.currentTarget).data("subject"));
			let rpDescId = $(ev.currentTarget).data("desc-id");
			let rpDesc = rpDescMap.get(rpDescId);
			let message = game.messages.get(messageId);
			if (message.user.id === game.user.id || game.user.isGM) {
				// Create a new journal entry
				JournalEntry.create({
					name: rpSubject,
					content: rpDesc,
				}).then((entry) => {
					// Open the journal entry
					entry.sheet.render(true);
					// Delete the message
					message.delete();
				});
			} else {
				ui.notifications.warn(
					"You can only create journal entries for your own messages or if you are GM!"
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
