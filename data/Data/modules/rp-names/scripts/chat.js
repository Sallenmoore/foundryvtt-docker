import { rpDescMap } from "./foundry.js";
import {
	rp,
	rpCallLambdaFunction,
	rpGetLocalStorageItem,
	rpToTitleCase,
	rpGenerateUUID,
	rpRemoveImgTags,
} from "./util.js";

const rpCreateRpChat = () => {
	const rpIsFoundry = typeof game !== "undefined";
	const MAX_HISTORY_CHARACTERS = 5000; // Adjust this value as needed.
	let rpHistory = [];

	function extractAIContentFromString(str) {
		let parser = new DOMParser();
		let doc = parser.parseFromString(str, "text/html");
		let aiContentDiv = doc.querySelector(".ai-content");

		return aiContentDiv ? aiContentDiv.innerHTML : null;
	}

	async function rpChatHelp() {
		let countdown = 60;
		let rpChatData = {
			content: `<div class="ai-content" style="border:2px solid blue; background-color: #CCCCFF; padding: 10px; border-radius: 5px;">
				<h2>RP Names Chat Help</h2>
				<p>Chat commands:</p>
				<ul>
					<li><b>!help</b> - Show this help message</li>
					<li>
						<b>!n</b> or <b>!name</b> + subject to be named - Generate a random name
						<div style="background-color: black; padding: 5px;">
						<code style="color: #00FF00;">!n deserted pirate ship</code><br />
						<code style="color: #00FF00;">!n chubby kobold</code><br />
						<code style="color: #00FF00;">!n female ice giant</code><br />
						</div>
						<p>Select a token and click "Assign to Token" to assign the name to the token and delete the chat card.</p>
						<!--p>Double-click the card to copy the name to the clipboard.</p-->
					</li>
					<li>
						<b>!d</b> or <b>!desc</b> + length of description + type of object (one word) + name of the object - Generate a description
						<div style="background-color: black; padding: 5px;">
						<code style="color: #00FF00;">!d brief sword Excalibur</code><br />
						<code style="color: #00FF00;">!d long village Phandalin</code><br />
						<code style="color: #00FF00;">!d longish goblin Grizznash the Unworthy</code><br />
						</div>
						<p>Click "Create Journal" to create a journal entry with the description and delete the chat card.</p>
						<!--p>Double-click the card to copy the description to the clipboard.</p-->
					</li>
					<li>
						<b>!h</b> or <b>!home</b> + description of the desired homebrew - Generate a random homebrewed creature or item
						<div style="background-color: black; padding: 5px;">
						<code style="color: #00FF00;">!h variant wolf cr5</code><br />
						<code style="color: #00FF00;">!h logging village near Neverwinter</code><br />
						<code style="color: #00FF00;">!h two-handed mace for lvl 10 barbarian, path of the totem</code><br />
						</div>
						<p>Click "Create Journal" to create a journal entry with the homebrew and delete the chat card.</p>
						<!--p>Double-click the card to copy the homebrew description to the clipboard.</p-->
					</li>
					<li>
						<b>!g</b> or <b>!gpt</b> + a ChatGPT request - Query ChatGPT for a response
						<div style="background-color: black; padding: 5px;">
						<code style="color: #00FF00;">!g A goblin walks into a bar and</code><br />
						<code style="color: #00FF00;">!g CR for goblin chief</code><br />
						</div>
					</li>
					<li><b>!r</b> or <b>!reset</b> - Reset the chat history</li>
					<li><b>!chathistory</b> - Show the chat history</li>
					<li><b>!togglehistory</b> - Toggle chat history (default is off)</li>
				</ul>
				<p>See the <a href="https://gitlab.com/rpgm-tools/rp-names/-/blob/main/INSTRUCTIONS.md" target="_blank">Quickstart Guide</a> for help with the non-chat aspects of the module.</p>
			</div>
			<!--p>Double-click this card to copy it to the clipboard.</p-->`,
		};

		const rpCopyText = extractAIContentFromString(rpChatData.content);

		let rpChatMessage = await ChatMessage.create(rpChatData);

		await rpChatMessage.setFlag("rp-names", "rpCopyText", rpCopyText);

		// Now that we have the chatMessage, we can create the buttons with the right id
		const rpDeleteButton = `<button style="background-color: #CCCCFF; color: black; border: 1px solid blue; padding: 2; cursor: pointer; width: auto; line-height: 1;" class="delete-card" data-message-id="${rpChatMessage._id}">Delete</button>`;
		const rpButtonGroup = `<br><div style="text-align: center;">${rpDeleteButton}</div>`;

		// Add the buttons to the chatMessage
		await rpChatMessage.update({
			content: `${rpChatMessage.content}${rpButtonGroup}`,
		});
		const rpChatContent = rpChatMessage.content;
		const timer = setInterval(async () => {
			countdown--;
			if (game.messages.has(rpChatMessage.id)) {
				if (countdown < 0) {
					clearInterval(timer);
					await rpChatMessage.delete();
				} else {
					await rpChatMessage.update({
						content: `${rpChatContent}<p>Seconds to message autodelete: ${countdown}</p>`,
					});
					ui.chat.scrollBottom(); // Scroll chat to bottom
				}
			} else {
				clearInterval(timer); // If the message no longer exists, stop the interval
			}
		}, 1000);
	}

	async function rpSendError(rpErrorMessage) {
		if (rpIsFoundry) {
			let countdown = 20;
			let rpHelpText = "";

			if (rpErrorMessage.includes("Usage")) {
				rpHelpText = "<p><b>!help</b> for help with chat commands.</p>";
			}

			let rpChatData = {
				content: `<div class="rp-names error" style="border:2px solid red; background-color: #FFCCCC; padding: 10px; border-radius: 5px;">${rpErrorMessage}</div>`,
				type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
				whisper: [game.user.id], // Whisper to the user
			};

			const rpChatContent = rpChatData.content;
			const rpChatMessage = await ChatMessage.create(rpChatData);
			const timer = setInterval(async () => {
				countdown--;
				if (game.messages.has(rpChatMessage.id)) {
					if (countdown < 0) {
						clearInterval(timer);
						await rpChatMessage.delete();
					} else {
						await rpChatMessage.update({
							content: `${rpChatContent}<p>Seconds to message autodelete: ${countdown}</p>`,
						});
						ui.chat.scrollBottom(); // Scroll chat to bottom
					}
				} else {
					clearInterval(timer); // If the message no longer exists, stop the interval
				}
			}, 1000);
		} else {
			// TODO: Add web app code
		}
	}

	async function rpAddToHistory(rpRole, rpContent) {
		// Ensure rpContent is a string
		if (typeof rpContent !== "string") {
			rpContent = JSON.stringify(rpContent);
			rpContent = rpContent.replace('\\"', "'");
		}

		// Create the new message object
		let rpMessage = {
			role: rpRole,
			content: rpContent,
		};

		// Add the new message to the end of the history.
		rpHistory.push(rpMessage);

		// Calculate total character count considering both 'role' and 'content' properties.
		let rpTotalCharacters = rpHistory.reduce(
			(rpSum, rpEntry) =>
				rpSum + rpEntry.role.length + rpEntry.content.length,
			0
		);

		// Find the index of the first non-system message
		let rpFirstNonSystemIndex = rpHistory.findIndex(
			(rpEntry) => rpEntry.role !== "system"
		);

		// While the total character count of the history is too large,
		// remove the oldest non-system entries.
		while (
			rpTotalCharacters > MAX_HISTORY_CHARACTERS &&
			rpFirstNonSystemIndex !== -1
		) {
			const rpOldestNonSystemEntry = rpHistory.splice(
				rpFirstNonSystemIndex,
				1
			)[0]; // Remove the oldest non-system message
			rpTotalCharacters -=
				rpOldestNonSystemEntry.role.length +
				rpOldestNonSystemEntry.content.length;

			// Update the index of the first non-system message
			rpFirstNonSystemIndex = rpHistory.findIndex(
				(rpEntry) => rpEntry.role !== "system"
			);
		}
	}

	async function rpResetHistory() {
		let countdown = 20;
		rpHistory = [];
		if (rpIsFoundry) {
			let rpChatData = {
				content: `<div style="border:2px solid blue; background-color: #CCCCFF; padding: 10px; border-radius: 5px;">History has been reset.</div><b>!help</b> for help with chat commands.`,
				type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
				whisper: [game.user.id], // Whisper to the user
			};

			const rpChatContent = rpChatData.content;
			const rpChatMessage = await ChatMessage.create(rpChatData);

			const timer = setInterval(async () => {
				countdown--;
				if (game.messages.has(rpChatMessage.id)) {
					if (countdown < 0) {
						clearInterval(timer);
						await rpChatMessage.delete();
					} else {
						await rpChatMessage.update({
							content: `${rpChatContent}<p>Seconds to message autodelete: ${countdown}</p>`,
						});
						ui.chat.scrollBottom(); // Scroll chat to bottom
					}
				} else {
					clearInterval(timer); // If the message no longer exists, stop the interval
				}
			}, 1000);
		}
	}

	async function rpShowHistory() {
		let countdown = 20;
		if (rpIsFoundry) {
			let rpChatData = {
				content: `<div style="border:2px solid blue; background-color: #CCCCFF; padding: 10px; border-radius: 5px;">${JSON.stringify(
					rpHistory
				)}</div><b>!help</b> for help with chat commands.`,
				type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
				whisper: [game.user.id], // Whisper to the user
			};

			const rpChatContent = rpChatData.content;
			const rpChatMessage = await ChatMessage.create(rpChatData);

			const timer = setInterval(async () => {
				countdown--;
				if (game.messages.has(rpChatMessage.id)) {
					if (countdown < 0) {
						clearInterval(timer);
						await rpChatMessage.delete();
					} else {
						await rpChatMessage.update({
							content: `${rpChatContent}<p>Seconds to message autodelete: ${countdown}</p>`,
						});
						ui.chat.scrollBottom(); // Scroll chat to bottom
					}
				} else {
					clearInterval(timer); // If the message no longer exists, stop the interval
				}
			}, 1000);
		} else {
			// TODO: Add web app code
		}
	}

	async function rpToggleHistory() {
		let countdown = 20;
		if (rpIsFoundry) {
			game.settings.set(
				"rp-names",
				"rpSettingsTogglePromptHistory",
				!game.settings.get("rp-names", "rpSettingsTogglePromptHistory")
			);
			let rpChatData = {
				content: `<div style="border:2px solid blue; background-color: #CCCCFF; padding: 10px; border-radius: 5px;">Prompt history (alpha test) is now ${
					game.settings.get(
						"rp-names",
						"rpSettingsTogglePromptHistory"
					)
						? "enabled"
						: "disabled"
				}.</div><b>!help</b> for help with chat commands.`,
				type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
				whisper: [game.user.id], // Whisper to the user
			};

			const rpChatContent = rpChatData.content;
			const rpChatMessage = await ChatMessage.create(rpChatData);

			const timer = setInterval(async () => {
				countdown--;
				if (game.messages.has(rpChatMessage.id)) {
					if (countdown < 0) {
						clearInterval(timer);
						await rpChatMessage.delete();
					} else {
						await rpChatMessage.update({
							content: `${rpChatContent}<p>Seconds to message autodelete: ${countdown}</p>`,
						});
						ui.chat.scrollBottom(); // Scroll chat to bottom
					}
				} else {
					clearInterval(timer); // If the message no longer exists, stop the interval
				}
			}, 1000);
		} else {
			// TODO: Add web app code
		}
	}

	async function rpGenerateName(rpSubject, rpMessageData) {
		const rpMessages = [
			{
				role: "system",
				content:
					"You are an expert at generating rich, unique, and often uncommon names for people, creatures, places, and objects in TTRPGs.",
			},
			{
				role: "user",
				content: `Generate a random name and nothing more with the following parameters: {subject: "${rpSubject}", genre: "${
					this.genre
				}", ${
					this.language !== "Default"
						? 'language: "' + this.language + '", '
						: ""
				}system: "${this.system}"}`,
			},
			{ role: "assistant", content: "Name: " },
		];

		// Update rpHistory based on rpMessages
		if (rpHistory.length === 0) {
			rpHistory = rpMessages
				.filter((message) => ["system", "user"].includes(message.role))
				.map((message) => ({
					role: message.role,
					content: message.content,
				}));
		} else if (rpMessages[0].content === rpHistory[0].content) {
			const rpUserMessage = { role: "user", content: rpSubject };
			rpAddToHistory("user", rpUserMessage.content);
		} else {
			rpHistory = rpMessages;
		}

		const rpPayload = {
			model: "gpt-3.5-turbo",
			messages: rpHistory,
			temperature: 1.5,
			n: 1,
			max_tokens: 20,
			stop: "\n\n\n",
			presence_penalty: 0.2,
			frequency_penalty: 0.2,
		};

		let rpName = await rpCallLambdaFunction(rpPayload);
		// convert rpNames to JavaScript array from string and assign the 10th element to rpName
		if (rpName) {
			rpName = rpName.replace(/"/g, "");
			if (rpIsFoundry) {
				const rpChatName = `<h3>${rpToTitleCase(
					rpSubject
				)} Name:</h3><p>${rpName}</p>`;
				let rpChatData = {
					content: `<div style="border:2px solid #44BBDD; background-color: #CCEEFF; padding: 10px; border-radius: 5px;">${rpChatName}</div>
					<!--p>Double-click this card to copy the name to the clipboard.</p-->
					<p><b>!help</b> for help with chat commands.</p>`,
				};

				// If the command was whispered or the sender is the GM, send as a whisper
				if (rpMessageData.whisper || game.user.isGM) {
					rpChatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
					rpChatData.whisper = [game.user.id]; // Self whisper
				}

				const rpCopyText = rpName;

				let rpChatMessage = await ChatMessage.create(rpChatData);

				await rpChatMessage.setFlag(
					"rp-names",
					"rpCopyText",
					rpCopyText
				);

				// Now that we have the chatMessage, we can create the buttons with the right id
				const rpAssignButton = `<button style="background-color: #CCEEFF; color: black; border: 1px solid #44BBDD; padding: 2; margin-right: 5px; cursor: pointer; width: auto; line-height: 1;" class="assign-name" data-message-id="${rpChatMessage._id}" data-name="${rpName}">Assign to Token</button>`;
				const rpDeleteButton = `<button style="background-color: #CCEEFF; color: black; border: 1px solid #44BBDD; padding: 2; cursor: pointer; width: auto; line-height: 1;" class="delete-card" data-message-id="${rpChatMessage._id}">Delete</button>`;
				const rpButtonGroup = `<div style="text-align: center;">${rpAssignButton}${rpDeleteButton}</div>`;

				// Add the buttons to the chatMessage
				await rpChatMessage.update({
					content: `${rpChatMessage.content}${rpButtonGroup}`,
				});

				ui.chat.scrollBottom(); // Scroll chat to bottom
				rpAddToHistory("assistant", rpName);
			} else {
				// TODO: Add web app code
			}
		}
	}

	async function rpGenerateDescription(
		rpLength,
		rpType,
		rpSubject,
		rpMessageData
	) {
		const rpMessages = [
			{
				role: "system",
				content:
					"Provide your response using HTML with CSS to add structure with a tasteful combination of lists, headings, emphasis, and any other elements that can help make your answer look good.  Colors of text or backgrounds will remain unchanged.  Simple unformatted paragraphs will always be avoided.  The container that this code will go into has a fixed width of 249px.",
			},
			{
				role: "system",
				content:
					"You are GM for TTRPGs and you are an expert at creating rich visual descriptions of people, creatures, places, and objects that fit perfectly into the world.  You know that providing sensory details is the key to creating a vivid description.  You know that the more senses you can engage, the more immersive the description will be, but you also know not to make it overly flowery.  If you are describing a person and the sex is not clear from the name, assign the one that makes the most sense.  If an actual name is not provided, you assign a name yourself.",
			},
			{
				role: "user",
				content: `Generate a ${rpLength} description with the following parameters: {subject: "${rpSubject}", type: "${rpType}", genre: "${
					this.genre
				}", ${
					this.language !== "Default"
						? 'language: "' + this.language + '", '
						: ""
				}system: "${this.system}"}`,
			},
			{ role: "assistant", content: "Description: " },
		];

		// Update rpHistory based on rpMessages
		if (rpHistory.length === 0) {
			rpHistory = rpMessages
				.filter((message) => ["system", "user"].includes(message.role))
				.map((message) => ({
					role: message.role,
					content: message.content,
				}));
		} else if (rpMessages[0].content === rpHistory[0].content) {
			const rpUserMessage = {
				role: "user",
				content: rpLength + " " + rpType + " " + rpSubject,
			};
			rpAddToHistory("user", rpUserMessage.content);
		} else {
			rpHistory = rpMessages;
		}

		const rpPayload = {
			model: "gpt-3.5-turbo",
			messages: rpHistory,
			temperature: 1.2,
			n: 1,
			max_tokens: 2500,
			stop: "\n\n\n",
			presence_penalty: 0.2,
			frequency_penalty: 0.2,
		};

		let rpDesc = rpRemoveImgTags(await rpCallLambdaFunction(rpPayload));
		// convert rpNames to JavaScript array from string and assign the 10th element to rpName
		if (rpDesc) {
			if (rpIsFoundry) {
				const rpChatDesc = `<h3>${rpToTitleCase(
					rpSubject
				)}:</h3><p>${rpDesc}</p>`;
				let rpChatData = {
					content: `<div class="ai-content" style="border:2px solid #88DDBB; background-color: #CCFFEE; padding: 10px; border-radius: 5px;">${rpChatDesc}</div>
					<!--p>Double-click this card to copy the description to the clipboard.</p-->
					<p><b>!help</b> for help with chat commands.</p>`,
				};

				// If the command was whispered or the sender is the GM, send as a whisper
				if (rpMessageData.whisper || game.user.isGM) {
					rpChatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
					rpChatData.whisper = [game.user.id]; // Self whisper
				}

				const rpCopyText = extractAIContentFromString(
					rpChatData.content
				);

				let rpChatMessage = await ChatMessage.create(rpChatData);

				await rpChatMessage.setFlag(
					"rp-names",
					"rpCopyText",
					rpCopyText
				);

				let rpDescID = rpGenerateUUID();

				rpDescMap.set(rpDescID, rpDesc);

				const rpJournalButton = `<button style="background-color: #CCFFEE; color: black; border: 1px solid #88DDBB; padding: 2; margin-right: 5px; cursor: pointer; width: auto; line-height: 1;" class="create-journal" data-message-id="${rpChatMessage._id}" data-subject="${rpSubject}" data-desc-id="${rpDescID}">Create Journal</button>`;
				const rpDeleteButton = `<button style="background-color: #CCFFEE; color: black; border: 1px solid #88DDBB; padding: 2; cursor: pointer; width: auto; line-height: 1;" class="delete-card" data-message-id="${rpChatMessage._id}">Delete</button>`;
				const rpButtonGroup = `<div style="text-align: center;">${rpJournalButton}${rpDeleteButton}</div>`;

				await rpChatMessage.update({
					content: `${rpChatMessage.content}${rpButtonGroup}`,
				});

				const rpStrippedRpChatDesc = rpDesc;

				ui.chat.scrollBottom(); // Scroll chat to bottom

				rpAddToHistory("assistant", rpStrippedRpChatDesc);
			} else {
				// TODO: Add web app code
			}
		}
	}

	async function rpGptPrompt(rpPrompt, rpMessageData) {
		const rpMessages = [
			{
				role: "system",
				content:
					"Provide your response using HTML with CSS to add structure with a tasteful combination of lists, headings, emphasis, and any other elements that can help make your answer look good.  Colors of text or backgrounds will remain unchanged.  Simple unformatted paragraphs will always be avoided.  The container that this code will go into has a fixed width of 249px.  You know that images are not supported, including links to images.",
			},
			{
				role: "system",
				content: `You know everything there is to know about TTRPGs (especially ${this.system}) and will answer any question, respond to every prompt, and complete every statement pertaining to any TTRPG.  When a prompt is provided and the system is not specified, it is ${this.system}.`,
			},
			{
				role: "user",
				content: rpPrompt,
			},
			{ role: "assistant", content: `<h1>${rpPrompt}:</h1>` },
		];

		// Update rpHistory based on rpMessages
		if (rpHistory.length === 0) {
			rpHistory = rpMessages
				.filter((message) => ["system", "user"].includes(message.role))
				.map((message) => ({
					role: message.role,
					content: message.content,
				}));
		} else if (rpMessages[0].content === rpHistory[0].content) {
			const rpUserMessage = { role: "user", content: rpPrompt };
			rpAddToHistory("user", rpUserMessage.content);
		} else {
			rpHistory = rpMessages;
		}

		const rpPayload = {
			model: "gpt-3.5-turbo",
			messages: rpHistory,
			temperature: 0.3,
			n: 1,
			max_tokens: 2500,
			stop: "\n\n\n",
			presence_penalty: 0.1,
			frequency_penalty: 0.1,
		};

		let rpResponse = rpRemoveImgTags(await rpCallLambdaFunction(rpPayload));
		// convert rpNames to JavaScript array from string and assign the 10th element to rpName
		if (rpResponse) {
			if (rpIsFoundry) {
				const rpChatResponse = `<p><b>${rpPrompt}</b>:</p><p>${rpResponse}</p>`;
				let rpChatData = {
					content: `<div style="border:2px solid #BB88DD; background-color: #DDCCEE; padding: 10px; border-radius: 5px;">${rpChatResponse}</div>
					<!--p>Double-click this card to share it in public chat.</p-->
					<p><b>!help</b> for help with chat commands.</p>`,
				};

				// If the command was whispered or the sender is the GM, send as a whisper
				if (rpMessageData.whisper || game.user.isGM) {
					rpChatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
					rpChatData.whisper = [game.user.id]; // Self whisper
				}

				const rpCopyText = extractAIContentFromString(
					rpChatData.content
				);

				let rpChatMessage = await ChatMessage.create(rpChatData);

				await rpChatMessage.setFlag(
					"rp-names",
					"rpCopyText",
					rpCopyText
				);

				// Now that we have the chatMessage, we can create the buttons with the right id
				const rpDeleteButton = `<button style="background-color: #DDCCEE; color: black; border: 1px solid BB88DD; padding: 2; cursor: pointer; width: auto; line-height: 1;" class="delete-card" data-message-id="${rpChatMessage._id}">Delete</button>`;
				const rpButtonGroup = `<br><div style="text-align: center;">${rpDeleteButton}</div>`;

				// Add the buttons to the chatMessage
				await rpChatMessage.update({
					content: `${rpChatMessage.content}${rpButtonGroup}`,
				});

				ui.chat.scrollBottom(); // Scroll chat to bottom

				const rpStrippedRpChatResponse = rpResponse;
				rpAddToHistory("assistant", rpStrippedRpChatResponse);
			} else {
				// TODO: Add web app code
			}
		}
	}

	async function rpHomebrew(rpPrompt, rpMessageData) {
		const rpMessages = [
			{
				role: "system",
				content:
					"Provide your response using HTML with CSS to add structure with a tasteful combination of lists, headings, emphasis, and any other elements that can help make your answer look good.  Colors of text or backgrounds will remain unchanged.  Simple unformatted paragraphs will always be avoided.  The container that this code will go into has a fixed width of 249px.",
			},
			{
				role: "system",
				content: `You are a GM who knows everything there is to know about TTRPGs (especially ${this.system}) and you invent and describe balanced homebrew creatures, items, places, etc. that are powerful enough to be interesting, but are not over-powered.  When a prompt is provided and the system is not specified, it is ${this.system}.  If you are describing a person and the sex is not clear from the name, assign the one that makes the most sense.  If an actual name is not provided, you assign a name yourself.`,
			},
			{
				role: "user",
				content: `Generate the following, giving it a proper name, if one is not specified, as well as a description. Do not repeat the parameters back:\n\n{request: "${rpPrompt}", genre: "${
					this.genre
				}", ${
					this.language !== "Default"
						? 'language: "' + this.language + '", '
						: ""
				}system: "${this.system}"}`,
			},
			{ role: "assistant", content: `<h1>${rpPrompt}:</h1>` },
		];

		// Update rpHistory based on rpMessages
		if (rpHistory.length === 0) {
			rpHistory = rpMessages
				.filter((message) => ["system", "user"].includes(message.role))
				.map((message) => ({
					role: message.role,
					content: message.content,
				}));
		} else if (rpMessages[0].content === rpHistory[0].content) {
			const rpUserMessage = { role: "user", content: rpPrompt };
			rpAddToHistory("user", rpUserMessage.content);
		} else {
			rpHistory = rpMessages;
		}

		const rpPayload = {
			model: "gpt-3.5-turbo",
			messages: rpHistory,
			temperature: 1.2,
			n: 1,
			max_tokens: 1000,
			stop: "\n\n\n",
			presence_penalty: 0.2,
			frequency_penalty: 0.2,
		};

		let rpResponse = rpRemoveImgTags(await rpCallLambdaFunction(rpPayload));
		if (rpResponse) {
			if (rpIsFoundry) {
				const rpChatResponse = `<h1>${rpPrompt}:</h1><p>${rpResponse}</p>`;
				let rpChatData = {
					content: `<div class="ai-content" style="border:2px solid #DDAA44; background-color: #EECC88; padding: 10px; border-radius: 5px;">${rpChatResponse}</div>
					<!--p>Double-click this card to copy the homebrew description to the clipboard.</p-->
					<p><b>!help</b> for help with chat commands.</p>`,
				};

				// If the command was whispered or the sender is the GM, send as a whisper
				if (rpMessageData.whisper || game.user.isGM) {
					rpChatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
					rpChatData.whisper = [game.user.id]; // Self whisper
				}

				const rpCopyText = extractAIContentFromString(
					rpChatData.content
				);

				let rpChatMessage = await ChatMessage.create(rpChatData);

				await rpChatMessage.setFlag(
					"rp-names",
					"rpCopyText",
					rpCopyText
				);

				let rpHomeID = rpGenerateUUID();

				rpDescMap.set(rpHomeID, rpResponse);

				const rpJournalButton = `<button style="background-color: #EECC88; color: black; border: 1px solid #DDAA44; padding: 2; margin-right: 5px; cursor: pointer; width: auto; line-height: 1;" class="create-journal" data-message-id="${rpChatMessage._id}" data-subject="${rpPrompt}" data-desc-id="${rpHomeID}">Create Journal</button>`;
				const rpDeleteButton = `<button style="background-color: #EECC88; color: black; border: 1px solid #DDAA44; padding: 2; cursor: pointer; width: auto; line-height: 1;" class="delete-card" data-message-id="${rpChatMessage._id}">Delete</button>`;
				const rpButtonGroup = `<div style="text-align: center;">${rpJournalButton}${rpDeleteButton}</div>`;

				await rpChatMessage.update({
					content: `${rpChatMessage.content}${rpButtonGroup}`,
				});

				ui.chat.scrollBottom(); // Scroll chat to bottom

				const rpStrippedRpChatResponse = rpResponse;
				rpAddToHistory("assistant", rpStrippedRpChatResponse);
			} else {
				// TODO: Add web app code
			}
		}
	}

	const rpReturnValues = {
		isFoundry: rpIsFoundry,
		genre: rpIsFoundry
			? game.settings.get("rp-names", "rpSettingsGenreProperAi")
			: rpGetLocalStorageItem("genre-select-properai") || "Fantasy",
		language: rpIsFoundry
			? game.settings.get("rp-names", "rpSettingsLanguageProperAi")
			: rpGetLocalStorageItem("language-select-properai") || "Default",
		system: rpIsFoundry
			? game.system.id
			: rpGetLocalStorageItem("system-select") || "D&D5e",
		help: rpChatHelp,
		sendError: rpSendError,
		name: rpGenerateName,
		desc: rpGenerateDescription,
		gpt: rpGptPrompt,
		home: rpHomebrew,
		addToHistory: rpAddToHistory,
		resetHistory: rpResetHistory,
		showHistory: rpShowHistory,
		toggleHistory: rpToggleHistory,
		history: rpHistory,
	};

	return rpReturnValues;
};

export { rpCreateRpChat };
