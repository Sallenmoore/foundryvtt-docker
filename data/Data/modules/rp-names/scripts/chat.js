import { rpDescMap } from "./foundry.js";
import {
	rp,
	rpCallLambdaFunction,
	rpGetLocalStorageItem,
	rpToTitleCase,
	rpGenerateUUID,
	rpRemoveImgTags,
	rpGetClientId,
} from "./util.js";

const rpCreateRpChat = () => {
	const rpIsFoundry = typeof game !== "undefined";

	const rpApiKey =
		typeof game !== "undefined"
			? game.settings.get("rp-names", "rpSettingsApiKey")
			: rpGetLocalStorageItem("api-key") || "";

	const rpPatreonKey =
		typeof game !== "undefined"
			? game.settings.get("rp-names", "rpSettingsPatreonKey")
			: rpGetLocalStorageItem("patreon-key") || "";

	const rpClientId =
		typeof game !== "undefined"
			? game.settings.get("rp-names", "rpSettingsClientId")
			: rpGetClientId() || "";

	function extractAIContentFromString(str) {
		let parser = new DOMParser();
		let doc = parser.parseFromString(str, "text/html");
		let aiContentDiv = doc.querySelector(".ai-content");

		return aiContentDiv ? aiContentDiv.innerHTML : null;
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

		const rpPayload = {
			model: "gpt-3.5-turbo",
			messages: rpMessages,
			temperature: 1.5,
			n: 1,
			max_tokens: 10,
			stop: "\n\n\n",
			presence_penalty: 0.2,
			frequency_penalty: 0.2,
			apiKey: rpApiKey,
			patreonKey: rpPatreonKey,
			clientId: rpClientId,
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
		name: rpGenerateName,
	};

	return rpReturnValues;
};

export { rpCreateRpChat };
