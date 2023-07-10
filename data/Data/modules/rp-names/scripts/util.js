//import { rpChat } from "./foundry.js";

/**
 * Custom logging functions.
 */
const rp = {
	messageHistory: [],
	maxHistory: 10, // maximum number of messages to remember
	minInterval: 5000, // minimum interval between same messages in milliseconds

	log: function (message) {
		this._sendMessage(
			"log",
			message,
			"📚 rp-names | ",
			"color: #ad8cef; font-weight: bold;"
		);
	},
	warn: function (message) {
		this._sendMessage(
			"warn",
			message,
			"⚔️ rp-names | ",
			"color: #7b4ed4; font-weight: bold;"
		);
	},
	error: function (message) {
		//		rpChat.sendError(
		//			"Something went wrong. Please try again, or if the problem persists, check the console log for details and provide as much information as you can in the #troubleshooting channel on the RPGM.tools Discord server."
		//		);
		this._sendMessage(
			"error",
			message,
			"💀 rp-names | ",
			"color: #e93d98; font-weight: bold;"
		);
	},
	dev: function (message) {
		const rpFoundry = typeof game !== "undefined";
		const rpSettingsDevMode = rpFoundry
			? game.settings.get("rp-names", "rpSettingsDevMode")
			: localStorage.getItem("dev-mode");
		if (rpSettingsDevMode) {
			this._sendMessage(
				"log",
				message,
				"🧪 rp-names | ",
				"color: #ff0088; font-weight: bold;"
			);
		}
	},
	obj: function (obj) {
		const rpFoundry = typeof game !== "undefined";
		const rpSettingsDevMode = rpFoundry
			? game.settings.get("rp-names", "rpSettingsDevMode")
			: localStorage.getItem("dev-mode");
		if (rpSettingsDevMode) {
			this._sendObject(obj);
		}
	},
	_sendMessage: function (method, message, prefix, style) {
		const now = Date.now();
		const similarMessage = this.messageHistory.find(
			(msg) =>
				msg.message === message && now - msg.time < this.minInterval
		);
		if (!similarMessage) {
			console.log(`%c${prefix}${message}`, style);
			this._recordMessage(message);
		}
	},
	_sendObject: function (obj) {
		const now = Date.now();
		const objString = JSON.stringify(obj);
		const similarMessage = this.messageHistory.find(
			(msg) =>
				msg.message === objString && now - msg.time < this.minInterval
		);
		if (!similarMessage) {
			console.log(obj);
			this._recordMessage(objString);
		}
	},
	_recordMessage: function (message) {
		const now = Date.now();
		this.messageHistory.push({ message, time: now });
		// if messageHistory exceeds maxHistory, remove the oldest message
		if (this.messageHistory.length > this.maxHistory) {
			this.messageHistory.shift();
		}
	},
};

/**
 * Deletes a key from localStorage.
 *
 * @param {string} name - The name of the key to be deleted.
 */
const rpDeleteLocalStorageItem = (name) => {
	localStorage.removeItem(name);
	rp.dev(`Deleting key ${name} from localStorage.`);
};

/**
 * Deletes all keys from localStorage.
 */
const rpDeleteAllLocalStorageItems = () => {
	localStorage.clear();
	rp.dev("Deleting all keys from localStorage.");
};

/**
 * Checks whether the browser is online.
 *
 * @return {boolean} - true if the browser is online, false otherwise.
 */
const rpIsOnline = () => {
	rp.dev(`Browser is ${navigator.onLine ? "online" : "offline"}.`);
	return navigator.onLine;
};

/**
 * Fetches a JSON file and returns its content.
 *
 * @param {string} file - The path to the file.
 * @return {Object} - The JSON data from the file.
 */
const rpGetJson = async (file) => {
	let r = await fetch(file);
	let data = await r.json();
	return data;
};

/**
 * Returns a random number between min and max (inclusive).
 *
 * @param {number} min - The lower boundary for the generated random number.
 * @param {number} max - The upper boundary for the generated random number.
 * @return {number} - A random number between min and max.
 */
const rpRandBetween = (min, max) => {
	const rpRandomNumber = Math.floor(Math.random() * (max - min + 1) + min);
	return rpRandomNumber;
};

/**
 * Retrieves the value of a specified key from localStorage.
 *
 * @param {string} name - The name of the key.
 * @return {string} - The value of the key, or null if the key doesn't exist.
 */
const rpGetLocalStorageItem = (name) => {
	rp.dev(`Retrieving key ${name} from localStorage.`);
	return localStorage.getItem(name);
};

/**
 * Sets the value of a specified key in localStorage.
 *
 * @param {string} name - The name of the key.
 * @param {string} value - The value of the key.
 */
const rpSetLocalStorageItem = (name, value) => {
	rp.dev(`Setting key ${name} to ${value} in localStorage.`);
	localStorage.setItem(name, value);
};

/**
 * Generates a UUID.
 *
 * @return {string} - The generated UUID.
 */
const rpGenerateUUID = () => {
	const rpUUID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			let r = (Math.random() * 16) | 0,
				v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		}
	);
	rp.dev(`Generated UUID: ${rpUUID}.`);
	return rpUUID;
};

/**
 * Checks the status of the Patreon key and logs appropriate messages.
 */
const rpPatreonAlert = () => {
	let rpPatreonOk =
		typeof game !== "undefined"
			? game.settings.get("rp-names", "rpSettingsPatreonOk")
			: rpGetLocalStorageItem("patreon-ok");
	rpPatreonOk = parseInt(rpPatreonOk);
	switch (rpPatreonOk) {
		case 0:
			rp.warn(
				"No valid Patreon key found. Please consider supporting this and our other projects at https://www.patreon.com/RPGMTools for full AI access."
			);
			break;
		case 1:
			rp.log(
				"Patreon key validated. Thank you so much for your support!"
			);
			break;
		case 2:
			rp.log(
				"Patreon key validated in the last 7 days. Thank you so much for your support!"
			);
			break;
		case 3:
			rp.log(
				"Using free daily AI access. See https://www.patreon.com/RPGMTools to gain full AI access, if you have not already done so."
			);
			break;
		case 4:
			rp.log(
				"Using your own OpenAI API key.  Bypassing Patreon key validation."
			);
			break;
		default:
			rp.error(
				"There was an error checking your Patreon key. Please try again later."
			);
	}
};

/**
 * Combines parts of a name represented as a JSON array into a string.
 *
 * @param {Array} jsonArray - The array containing parts of a name.
 * @return {string} - The combined name.
 */
const rpCombineNameParts = (jsonArray) => {
	let jsonArrayAsString = "";
	for (let i = 0; i < jsonArray.length; i++) {
		let objectAsString = "";
		for (let key in jsonArray[i]) {
			if (key === "title") {
				objectAsString += ", " + jsonArray[i][key];
			} else {
				objectAsString += " " + jsonArray[i][key];
			}
		}
		// If the string begins with ", ", remove it
		if (objectAsString.startsWith(", ")) {
			objectAsString = objectAsString.substring(2);
		}
		jsonArrayAsString += objectAsString.trim() + "\n";
	}
	rp.dev(`Combined name: ${jsonArrayAsString.trim()}.`);
	return jsonArrayAsString.trim();
};

/**
 * Checks if the given name is a proper name using an AI function. If it is, it prompts the user with a dialog.
 * Depending on the action type, the dialog either asks to generate a description for the token or to generate a new name.
 * If the user selects "Always", the name is added to a whitelist in the game settings.
 * If the name is already in the whitelist, the function returns true without showing any dialogs.
 *
 * @async
 * @function rpCheckNameAndPromptDialog
 * @param {string} rpNameToCheck - The name to check and possibly add to the whitelist.
 * @param {string} rpActionType - The type of action to take if the name is a proper name. Expected 'd' or 'n'.
 * @returns {Promise<boolean>} - Resolves with true if the user wants to generate a description or a new name (or if the name is not a proper name or is already in the whitelist). Resolves with false if the user does not want to generate a description or a new name.
 * @throws {Error} When the action type is not 'd' or 'n'.
 */
const rpCheckNameAndPromptDialog = async (rpNameToCheck, rpActionType) => {
	let rpDialogTitle, rpDialogContent;

	if (rpActionType === "d") {
		rpDialogTitle = "Description Prompt";
		rpDialogContent = `${rpNameToCheck} could be a proper name. Do you want to generate a description for this token?`;
	} else if (rpActionType === "n") {
		rpDialogTitle = "New Name Prompt";
		rpDialogContent = `${rpNameToCheck} could be a proper name. Do you want to generate a new name?`;
	} else {
		throw new Error("Invalid action type. Expected 'd' or 'n'.");
	}

	if (typeof game !== "undefined") {
		// Get the list of whitelisted names
		let rpBlacklistNames = game.settings.get(
			"rp-names",
			"rpSettingsProperNameBlacklist"
		);
		rpBlacklistNames = rpBlacklistNames
			? rpBlacklistNames.replace(/, /g, ",").split(",")
			: [];

		let rpWhitelistNames = game.settings.get(
			"rp-names",
			"rpSettingsProperNameWhitelist"
		);
		rpWhitelistNames = rpWhitelistNames
			? rpWhitelistNames.replace(/, /g, ",").split(",")
			: [];

		// If the name is already in the blacklist, return false immediately
		if (rpBlacklistNames.includes(rpNameToCheck)) {
			return false;
		}

		// If the name is already in the whitelist, return true immediately
		if (rpWhitelistNames.includes(rpNameToCheck)) {
			return true;
		}

		const rpIsProperName = await rpCheckNameWithAi(rpNameToCheck);
		rp.dev(`${rpNameToCheck} could be a proper name?: ${rpIsProperName}`);

		// If the name is a proper name, ask the GM if they want to generate a new name.
		if (rpIsProperName === "Yes") {
			const rpWantAction = await new Promise((rpResolve, rpReject) => {
				new Dialog({
					title: rpDialogTitle,
					content: `<p>${rpDialogContent}</p>`,
					buttons: {
						yes: {
							icon: "<i class='fas fa-check'></i>",
							label: "Yes",
							callback: () => rpResolve(true),
						},
						no: {
							icon: "<i class='fas fa-times'></i>",
							label: "No",
							callback: () => rpResolve(false),
						},
						always: {
							icon: "<i class='fas fa-check'></i>",
							label: "Always",
							callback: () => {
								// If "Always" is clicked, add the name to the whitelist
								if (!rpWhitelistNames.includes(rpNameToCheck)) {
									rpWhitelistNames.push(rpNameToCheck);
									game.settings.set(
										"rp-names",
										"rpSettingsProperNameWhitelist",
										rpWhitelistNames.join(", ")
									);
								}
								rpResolve(true);
							},
						},
						never: {
							icon: "<i class='fas fa-times'></i>",
							label: "Never",
							callback: () => {
								// If "Never" is clicked, add the name to the blacklist
								let rpBlacklistNames = game.settings
									.get(
										"rp-names",
										"rpSettingsProperNameBlacklist"
									)
									.split(", ");
								if (!rpBlacklistNames.includes(rpNameToCheck)) {
									rpBlacklistNames.push(rpNameToCheck);
									game.settings.set(
										"rp-names",
										"rpSettingsProperNameBlacklist",
										rpBlacklistNames.join(", ")
									);
								}
								rpResolve(false);
							},
						},
					},
					default: "yes",
				}).render(true);
			});

			rp.dev(`Continue naming?: ${rpWantAction}`);

			// If the GM doesn't want a new name, abort the function.
			if (!rpWantAction) {
				return false;
			}
		}
	}
	return true;
};

/**
 * Checks whether a name is a proper name using AI.
 *
 * @param {string} rpFullName - A string containing a name to check.
 * @return {Promise<string>} - A promise that resolves with a string indicating whether the name is a proper name.
 */
const rpCheckNameWithAi = async (rpFullName) => {
	// Generate the GPT prompt.
	let rpPrompt = rpGenerateGptPrompt({
		model: "gpt-3.5-turbo", // Model name
		systemContent:
			"You are an AI trained on thousands of names, from real-world documents and countless works of literature of all genres. You can tell when a word or sequence of words represents a given name or nickname of a person, entity, or creature.", // System content
		userContent: `Given a string, use your extensive familiarity with how names work, determine if it could be considered a proper name. The word or words can be in any case, can contain one or more words, and can be real or fictional, including names you have not seen before. A proper name can be any actual name or nickname of a person or character. Is '${rpFullName.toLowerCase()}' a proper name? Either "Yes" or "No":`, // User content
		assistantContent: "", // Assistant content
		temperature: 0.6, // Temperature, lowered to make the model a bit more deterministic
		n: 1, // Number of responses to generate
		max_tokens: 5, // Maximum number of tokens
		stop: "", // Stop sequences, this will make the model to generate either 'Yes' or 'No'
		presence_penalty: 0, // Presence penalty
		frequency_penalty: 0, // Frequency penalty
	});

	// Call the Lambda function and get the response.
	let rpResponse = await rpCallLambdaFunction(rpPrompt);

	// Return only the 'Yes' or 'No' part of the response.
	return rpResponse.trim();
};

/**
 * Generates a payload for a GPT prompt.
 *
 * @param {Object} options - The configuration options for the GPT prompt.
 * @return {Object} - The generated GPT prompt payload.
 */
const rpGenerateGptPrompt = ({
	model = "gpt-3.5-turbo",
	systemContent = "You are The Brain.",
	userContent = "What we going to do tonight, Brain?",
	assistantContent = "Concise response:\n\n",
	temperature = 1,
	n = 1,
	max_tokens = 30,
	stop = "\n\n\n",
	presence_penalty = 0.2,
	frequency_penalty = 0.2,
} = {}) => {
	const apiKey =
		typeof game !== "undefined"
			? game.settings.get("rp-names", "rpSettingsApiKey")
			: "";
	return {
		model,
		messages: [
			{ role: "system", content: systemContent },
			{ role: "user", content: userContent },
			{ role: "assistant", content: assistantContent },
		],
		temperature,
		n,
		max_tokens,
		stop,
		presence_penalty,
		frequency_penalty,
		apiKey,
	};
};

/**
 * Calls an AWS Lambda function with a specified payload.
 *
 * @param {Object} rpPayload - The payload for the AWS Lambda function.
 * @return {Promise} - A promise that resolves with the response from the AWS Lambda function.
 */
const rpCallLambdaFunction = async (rpPayload) => {
	const rpUrl =
		"https://7r5j1szsn5.execute-api.us-west-1.amazonaws.com/gpt-35-turbo";

	const rpApiKey =
		typeof game !== "undefined"
			? game.settings.get("rp-names", "rpSettingsApiKey")
			: rpGetLocalStorageItem("api-key") || "";

	const rpFreeAiRequestsRemaining =
		typeof game !== "undefined"
			? game.settings.get("rp-names", "rpSettingsFreeAiRequestsRemaining")
			: rpGetLocalStorageItem("free-api-requests-remaining") || 0;

	try {
		rp.log(
			"Requesting AI-generated data. This can take up to a minute. It is normal to see errors and warnings during this time."
		);
		rpPatreonAlert();
		rp.dev("Payload:");
		rp.obj(rpPayload);

		// Start jitter animation
		rpStartJitter();

		const rpResponse = await fetch(rpUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(rpPayload),
		});
		if (typeof game !== "undefined") {
			game.settings.set(
				"rp-names",
				"rpSettingsFreeAiRequestsRemaining",
				Math.max(0, rpFreeAiRequestsRemaining - 1)
			);
		} else {
			rpSetLocalStorageItem(
				"free-api-requests-remaining",
				Math.max(0, rpFreeAiRequestsRemaining - 1)
			);
		}
		if (rpResponse.ok) {
			rp.log(
				`${rpFreeAiRequestsRemaining} free daily AI requests remaining.`
			);
			const rpData = await rpResponse.json();
			rp.dev("Response:");
			rp.obj(rpData);
			return rpData.message;
		} else {
			if (typeof game !== "undefined") {
				game.settings.set(
					"rp-names",
					"rpSettingsFreeAiRequestsRemaining",
					Math.min(5, rpFreeAiRequestsRemaining + 1)
				);
			} else {
				rpSetLocalStorageItem(
					"free-api-requests-remaining",
					Math.min(5, rpFreeAiRequestsRemaining + 1)
				);
			}
			throw new Error("Server responded with non-OK status");
		}
	} catch (error) {
		if (error.name === "TypeError") {
			throw new Error("Network Error");
		}
		throw error;
		rp.obj(error);
	} finally {
		// Stop jitter animation
		rpStopJitter();
	}
};

/**
 * Cleans up the response string and parses it into a JSON object.
 * @param {string} rpResponse - The response string to clean up and parse.
 * @returns {Object[]} - The parsed JSON object.
 */
const rpParseResponse = (rpResponse) => {
	// Extract content inside square brackets
	const rpRegex = /(\[.*\])/s;
	const rpMatch = rpResponse.match(rpRegex);
	let rpResponseArray = [];

	if (rpMatch) {
		try {
			const rpMatchedContent = rpMatch[0];

			// Clean up the string and parse it as JSON
			rpResponseArray = JSON.parse(
				rpMatchedContent
					.trim()
					.replace(/},\s*]/g, "}]") // Replace "}, ]" with "}]"
					.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // Quote keys
					.replace(/\\(?!n)/g, "") // Remove excess backslashes
			);
		} catch (error) {
			rp.error("Error parsing response");
			rp.obj(error);
			throw error; // re-throw the error
		}
	} else {
		rp.error("Unable to find valid JSON in response.");
	}

	rp.dev("Parsed response:");
	rp.obj(rpResponseArray);
	return rpResponseArray;
};

function rpBadWords() {
	if (Math.random() <= 0.95) {
		rp.dev("Blocked bad words.");
		return "Do not include any of the following adjectives: Effervescent, Ethereal, Ephemeral, Quixotic, Iridescent";
	} else {
		rp.dev("Did not block bad words.");
		return "";
	}
}

/**
 * Adds creature names to the 'rpSettingsSavedNames' setting.
 * @param {Array<Object>} creatureNames - An array of creature name objects.
 */
const rpAddCreatureNamesToSetting = (creatureNames) => {
	let rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");

	creatureNames.forEach((creatureName) => {
		rpSavedNames[creatureName.fullName] = creatureName; // Use fullName as key
	});

	game.settings.set("rp-names", "rpSettingsSavedNames", rpSavedNames);
	rp.dev(`Added ${creatureNames.length} creature names to saved names.`);
};

/**
 * Adds descriptions to the 'rpSavedDescriptions' setting.
 * @param {Object} descriptionObject - The description object to be added.
 */
const rpAddDescriptionsToSetting = (descriptionObject) => {
	let rpDescriptions = game.settings.get(
		"rp-names",
		"rpSettingsSavedDescriptions"
	);

	rpDescriptions[descriptionObject.name] = descriptionObject;

	game.settings.set(
		"rp-names",
		"rpSettingsSavedDescriptions",
		rpDescriptions
	);
	rp.dev(
		`Added ${descriptionObject.name} description to saved descriptions.`
	);
};

/**
 * Sets the 'used' property of a name object to true based on the provided full name.
 * @param {string} fullName - The full name of the name object to be updated.
 */
const rpSetUsedByName = async (fullName) => {
	const rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");
	if (fullName in rpSavedNames) {
		rpSavedNames[fullName].used = true;
		game.settings.set("rp-names", "rpSettingsSavedNames", rpSavedNames);
		rp.dev(`Set ${fullName} to used.`);
	}
};

/**
 * Sets the 'used' property of a name object to false based on the provided full name.
 * @param {string} fullName - The full name of the name object to be updated.
 */
const rpSetNotUsedByName = (fullName) => {
	const rpSavedNames = game.settings.get("rp-names", "rpSettingsSavedNames");
	if (rpSavedNames[fullName]) {
		rpSavedNames[fullName].used = false;
		game.settings.set("rp-names", "rpSettingsSavedNames", rpSavedNames);
		rp.dev(`Set ${fullName} to not used.`);
	} else {
		rp.warn(`No saved name found with fullName: ${fullName}`);
	}
};

/**
 * Converts a JSON object to HTML string.
 *
 * @param {object} json - The JSON object to convert.
 * @param {number} depth - The current depth level (default is 0).
 * @returns {string} The resulting HTML string.
 */
const rpJsonToHtml = (json, depth = 0) => {
	let html = "";

	// Iterate over each property in the object
	for (let key in json) {
		let value = json[key];

		// If the value is an object or array, recursively convert it
		if (typeof value === "object" && value !== null) {
			// Create a new section for nested objects or arrays
			html += `<div class='section level${depth}'>
                        <h2 class='heading level${depth}'>${key}</h2>`;
			html += jsonToHtml(value, depth + 1);
			html += `</div>`;
		} else {
			// Otherwise, just render the key-value pair
			html += `<div class='key-value level${depth}'>
                        <span class='key'>${key}: </span>
                        <span class='value'>${value}</span>
                    </div>`;
		}
	}

	// If we're at the root level (depth 0), wrap the whole thing in a container
	if (depth === 0) {
		html = `<div class='json-root'>${html}</div>`;
	}

	return html;
};

/**
 * Shuffles array in place using the Fisher-Yates (aka Knuth) Shuffle.
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} The shuffled array.
 */
const rpShuffle = (array) => {
	let currentIndex = array.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	rp.dev("Shuffled array:");
	rp.obj(array);
	return array;
};

/**
 * Safely retrieves a property from a nested object, returning a default value if the property doesn't exist.
 *
 * @param {Object} object - The object from which to retrieve the property.
 * @param {string} path - The path to the property in the object, e.g., 'property.subproperty.subsubproperty'.
 * @returns {(string|Object|Array)} The value of the property, or an empty string if the property does not exist.
 */
const rpGetOrNull = (object, path) => {
	const result = path.split(".").reduce((o, p) => {
		if (o === null || typeof o === "undefined") {
			return "";
		} else if (Array.isArray(o) && !isNaN(p)) {
			return o[Number(p)];
		} else {
			return o[p];
		}
	}, object);
	return result === {} || typeof result === "undefined" || result === null
		? ""
		: result;
};

function rpRemoveImgTags(input) {
	return input.replace(/<img.*?\/?>/gi, "");
}

/**
 * Retrieves the name of an item of a specific type from an array of items.
 *
 * @param {Array} items - The array of items.
 * @param {string} type - The type of item to retrieve.
 * @returns {string} The name of the item of the specified type, or an empty string if no item of that type exists.
 */
const rpGetItemName = (items, type) => {
	const item = items.find((item) => item.type === type);
	return item ? item.name : "";
};

/**
 * Format the size or alignment descriptors into their full representations.
 *
 * @param {string} input - The descriptor to be formatted.
 * @param {string} type - The type of descriptor to be formatted. Either 'size' or 'alignment'.
 * @returns {string} The formatted descriptor.
 */
const rpFormat = (rpInput, rpType) => {
	const rpSizeMapping = {
		tiny: "tiny",
		t: "tiny",
		small: "small",
		sm: "small",
		s: "small",
		medium: "medium",
		med: "medium",
		m: "medium",
		large: "large",
		lar: "large",
		lg: "large",
		l: "large",
		huge: "huge",
		hug: "huge",
		hg: "huge",
		h: "huge",
		gargantuan: "gargantuan",
		garg: "gargantuan",
		gar: "gargantuan",
		g: "gargantuan",
	};

	const rpAlignmentMapping = {
		lg: "lawful good",
		ln: "lawful neutral",
		le: "lawful evil",
		ng: "neutral good",
		nn: "true neutral",
		n: "true neutral",
		ne: "neutral evil",
		cg: "chaotic good",
		cn: "chaotic neutral",
		ce: "chaotic evil",
	};

	const rpMappings = { size: rpSizeMapping, alignment: rpAlignmentMapping };

	return rpMappings[rpType][rpInput.toLowerCase()] || rpInput;
};

/**
 * Converts a number to Roman numerals.
 *
 * @param {number} num - The number to convert. Should be between 1 and 100.
 * @returns {string} The Roman numeral representation of the number.
 */
const rpToRoman = (num) => {
	const rpRomanNumerals = {
		1: "I",
		4: "IV",
		5: "V",
		9: "IX",
		10: "X",
		40: "XL",
		50: "L",
		90: "XC",
		100: "C",
	};
	let rpStr = "";
	for (let i of Object.keys(rpRomanNumerals).reverse()) {
		while (num >= i) {
			rpStr += rpRomanNumerals[i];
			num -= i;
		}
	}
	return rpStr;
};

/**
 * Converts a number to a different format.
 *
 * @param {number} num - The number to convert. Should be between 1 and 100.
 * @returns {string} The number representation in a different format.
 */
const rpConvertNumber = (rpNum, rpNumberFormat) => {
	rpNumberFormat = rpNumberFormat || "number";

	if (rpNumberFormat === "roman") {
		return rpToRoman(rpNum);
	} else if (rpNumberFormat === "letter") {
		return rpToLetters(rpNum);
	} else {
		return rpNum;
	}
};

/**
 * Converts a number to a string of letters from A-Z, with AA-ZZ for numbers 27-52, and so on.
 *
 * This function recursively calculates the letter representation of a number. For example,
 * the number 1 returns 'A', 26 returns 'Z', 27 returns 'AA', and so on.
 *
 * @param {number} num - The number to convert. Should be a positive integer.
 * @returns {string} The letter representation of the number.
 */
const rpToLetters = (num) => {
	if (num <= 0) {
		return "";
	} else if (num <= 26) {
		return String.fromCharCode(64 + num); // Convert numbers 1-26 to letters A-Z
	} else {
		let remainder = num % 26;
		let quotient = Math.floor(num / 26);
		if (remainder === 0) {
			quotient--;
			remainder = 26;
		}
		return rpToLetters(quotient) + rpToLetters(remainder);
	}
};

/**
 * Escapes double quotes within a string.
 *
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
const rpEscapeDoubleQuotes = (str) => {
	return str.replace(/"/g, '\\"');
};

/**
 * Returns the path to the actor's biography in the game system's data structure.
 *
 * @param {string} rpSystem - The key for the game system (e.g., 'dnd5e', 'pf2e', 'wwn', 'swade', 'wfrp4e').
 *
 * @returns {string} The path to the actor's biography in the game system's data structure.
 * If the provided system is not recognized, it defaults to "actorData.system.details.biography.value".
 */
const rpGetBiographyLocation = (rpSystem) => {
	let rpSystems = {
		dnd5e: "actorData.system.details.biography.value",
		pf2e: "actorData.system.details.privateNotes",
		wwn: "actorData.system.details.biography",
		swade: "actorData.system.details.biography.value",
		wfrp4e: "actorData.system.details.biography.value",
	};

	return rpSystems[rpSystem]
		? rpSystems[rpSystem]
		: "actorData.system.details.biography.value";
};

/**
 * Adds a nested value to an object given a dot notation path.
 *
 * @param {Object} rpObject - The object to add the nested value to.
 * @param {string} rpPath - The dot notation path to the location to add the value.
 * @param {*} rpValue - The value to add.
 */
const rpAddNestedValue = (rpObject, rpPath, rpValue) => {
	const rpPathArray = rpPath.split(".");
	const rpLastKey = rpPathArray.pop();
	let rpCurrentObj = rpObject;

	for (const key of rpPathArray) {
		if (
			!rpCurrentObj.hasOwnProperty(key) ||
			typeof rpCurrentObj[key] !== "object"
		) {
			rpCurrentObj[key] = {};
		}
		rpCurrentObj = rpCurrentObj[key];
	}

	rpCurrentObj[rpLastKey] = rpValue;
};

/**
 * Gets a nested property from an object given a dot notation path.
 *
 * @param {Object} rpObj - The object to retrieve the nested property from.
 * @param {string} rpPath - The dot notation path to the property.
 * @returns {*} - The retrieved property.
 */
const rpGetNestedProperty = (rpObj, rpPath) => {
	let rpProperties = rpPath.split(".");
	let rpResult = rpObj;

	for (let rpProperty of rpProperties) {
		if (rpResult === undefined) return "";
		rpResult = rpResult[rpProperty];
	}

	return rpResult;
};

/**
 * Removes HTML elements with classes starting with 'rp-description-' from the biography of a token.
 *
 * @param {Object} rpTokenDocument - The token document object from which to remove HTML elements.
 *
 * @returns {void}
 *
 * @example
 * removeRpDescriptions(rpTokenDocument);
 *
 * Note: This function relies on the following external functions:
 * 1. rpGetBiographyLocation(game.system.id)
 * 2. rpGetNestedProperty(rpTokenDocument, rpTokenBiographyLocation)
 * 3. rpAddNestedValue(rpActorDataCopy, rpPath, rpTokenBiography)
 * Make sure these functions are defined and accessible within the scope of this function.
 */
const rpRemoveDescriptions = (rpTokenDocument) => {
	// Fetch biography location based on the game system
	let rpTokenBiographyLocation = rpGetBiographyLocation(game.system.id);
	let rpTokenBiography = rpGetNestedProperty(
		rpTokenDocument,
		rpTokenBiographyLocation
	);

	// Create a DOMParser and parse the rpTokenBiography string
	let parser = new DOMParser();
	let doc = parser.parseFromString(rpTokenBiography, "text/html");

	// Get all elements
	let allElements = doc.querySelectorAll("*");

	let descriptionRemoved = false;

	allElements.forEach((element) => {
		let classes = element.getAttribute("class");

		// If the element has classes and one of them starts with 'rp-description-', remove the element
		if (classes) {
			let classArray = classes.split(" ");
			if (classArray.some((c) => c.startsWith("rp-description-"))) {
				element.remove();
				descriptionRemoved = true;
			}
		}
	});

	// Serialize the Document back to a string
	rpTokenBiography = new XMLSerializer().serializeToString(doc);

	let rpPath = rpTokenBiographyLocation.startsWith("actorData.")
		? rpTokenBiographyLocation.slice("actorData.".length)
		: rpTokenBiographyLocation;

	// Make a deep copy of actorData from rpTokenDocument
	let rpActorDataCopy = JSON.parse(JSON.stringify(rpTokenDocument.actorData));

	// Use the function to add the nested value
	rpAddNestedValue(rpActorDataCopy, rpPath, rpTokenBiography);

	// Apply the changes to the actor data in the token document
	rpTokenDocument.update({ actorData: rpActorDataCopy });

	if (descriptionRemoved) {
		rp.log(
			"Removed custom description from token biography/notes because the token name was changed."
		);
	}
};

/**
 * Start the jitter animation on the d20 image.
 */
const rpStartJitter = () => {
	let rpHeaderD20Image = document.getElementById("header-d20-image");
	rpHeaderD20Image.style.display = "block"; // make it visible
	rpHeaderD20Image.classList.add("jitter");
	console.log("Commenced jitter.");
};

/**
 * Stop the jitter animation on the d20 image.
 */
const rpStopJitter = () => {
	let rpHeaderD20Image = document.getElementById("header-d20-image");
	rpHeaderD20Image.style.display = "none"; // hide it
	rpHeaderD20Image.classList.remove("jitter");
	console.log("Ended jitter.");
};

/**
 * Converts a string to title case, considering exceptions for specific words.
 *
 * @param {string} str - The string to be converted to title case.
 * @return {string} - The string in title case.
 */
const rpToTitleCase = (str) => {
	const lowercaseWords = [
		"a",
		"an",
		"the",
		"in",
		"on",
		"at",
		"to",
		"for",
		"and",
		"but",
		"or",
		"nor",
		"with",
		"by",
		"as",
		"of",
		"up",
		"off",
		"via",
		"out",
		"from",
		"into",
		"over",
		"through",
		"down",
		"onto",
		// Spanish lowercase words
		"un",
		"una",
		"unos",
		"unas",
		"el",
		"la",
		"los",
		"las",
		"en",
		"de",
		"del",
		"a",
		"con",
		"por",
		"para",
		"y",
		"o",
		// French lowercase words
		"un",
		"une",
		"des",
		"le",
		"la",
		"les",
		"en",
		"de",
		"à",
		"avec",
		"par",
		"pour",
		"et",
		"ou",
		// Portuguese lowercase words
		"um",
		"uma",
		"uns",
		"umas",
		"o",
		"a",
		"os",
		"as",
		"em",
		"de",
		"para",
		"e",
		"ou",
		"com",
		"por",
		// German lowercase words
		"ein",
		"eine",
		"einer",
		"eines",
		"einem",
		"einen",
		"die",
		"der",
		"das",
		"den",
		"dem",
		"des",
		"im",
		"in",
		"zu",
		"mit",
		"für",
		"und",
		"oder",
	];

	return str.replace(/\p{L}+/gu, function (word, index) {
		if (index === 0 || !lowercaseWords.includes(word.toLowerCase())) {
			return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
		} else {
			return word.toLowerCase();
		}
	});
};

/**
 * Get default options for name generation.
 *
 * @param {string} rpActorName - The name of the actor.
 * @param {string} rpCreatureType - The type of creature.
 * @param {string} rpCreatureSubtype - The subtype of creature.
 * @returns {object} - Default options object.
 */
const rpGetDefaultOptions = (rpActorData) => {
	const {
		rpActor,
		rpGameSystem,
		rpKind,
		rpCreature,
		rpType,
		rpClass,
		rpGender,
		rpCreatureType,
		rpCreatureSubtype,
		rpSize,
		rpBackground,
		rpBiographyPrivate,
		rpBiographyPublic,
		rpAlignment,
		rpDeity,
		rpLanguages,
		rpPrototypeName,
	} = rpActorData;

	let rpNameSettings = game.settings.get("rp-names", "rpSettingsName");

	rpNameSettings.default = {
		rpNamingMethod: game.settings.get("rp-names", "rpSettingsNamingMethod"),
		rpProperAi: {
			rpGenre: game.settings.get("rp-names", "rpSettingsGenreProperAi"),
			rpLanguage: game.settings.get(
				"rp-names",
				"rpSettingsLanguageProperAi"
			),
			rpGender: game.settings.get("rp-names", "rpSettingsGenderProperAi"),
			rpNameBase: game.settings.get(
				"rp-names",
				"rpSettingsNameBaseProperAi"
			),
			rpNameFormat: game.settings.get(
				"rp-names",
				"rpSettingsNameFormatProperAi"
			),
		},
		rpAdjectiveAi: {
			rpGenre: game.settings.get(
				"rp-names",
				"rpSettingsGenreAdjectiveAi"
			),
			rpLanguage: game.settings.get(
				"rp-names",
				"rpSettingsLanguageAdjectiveAi"
			),
			rpNameBase: game.settings.get(
				"rp-names",
				"rpSettingsNameBaseAdjectiveAi"
			),
			rpNameFormat: game.settings.get(
				"rp-names",
				"rpSettingsNameFormatAdjectiveAi"
			),
		},
		rpProper: {
			rpNameBase: game.settings.get(
				"rp-names",
				"rpSettingsNameBaseProper"
			),
			rpNameFormat: game.settings.get(
				"rp-names",
				"rpSettingsNameFormatProper"
			),
		},
		rpAdjective: {
			rpNameBase: game.settings.get(
				"rp-names",
				"rpSettingsNameBaseAdjective"
			),
			rpNameFormat: game.settings.get(
				"rp-names",
				"rpSettingsNameFormatAdjective"
			),
		},
		rpNumbered: {
			rpNameBase: game.settings.get(
				"rp-names",
				"rpSettingsNameBaseNumbered"
			),
			rpNumberFormat: game.settings.get(
				"rp-names",
				"rpSettingsNumberFormatNumbered"
			),
			rpNameFormat: game.settings.get(
				"rp-names",
				"rpSettingsNameFormatNumbered"
			),
		},
	};

	game.settings.set("rp-names", "rpSettingsName", rpNameSettings);

	rp.log(
		`Constructed default settings for ${rpCreature} by combining custom settings for the creature with default settings.`
	);
	rp.dev("Default Settings:");
	rp.obj(rpNameSettings.default);

	return {
		rpNamingMethod:
			rpNameSettings[rpCreature]?.rpNamingMethod ||
			rpNameSettings[rpCreatureSubtype]?.rpNamingMethod ||
			rpNameSettings[rpCreatureType]?.rpNamingMethod ||
			rpNameSettings.default.rpNamingMethod,
		rpProperAi: {
			rpGenre:
				rpNameSettings[rpCreature]?.rpProperAi?.rpGenre ||
				rpNameSettings[rpCreatureSubtype]?.rpProperAi?.rpGenre ||
				rpNameSettings[rpCreatureType]?.rpProperAi?.rpGenre ||
				rpNameSettings.default.rpProperAi.rpGenre,
			rpLanguage:
				rpNameSettings[rpCreature]?.rpProperAi?.rpLanguage ||
				rpNameSettings[rpCreatureSubtype]?.rpProperAi?.rpLanguage ||
				rpNameSettings[rpCreatureType]?.rpProperAi?.rpLanguage ||
				rpNameSettings.default.rpProperAi.rpLanguage,
			rpGender:
				rpNameSettings[rpCreature]?.rpProperAi?.rpGender ||
				rpNameSettings[rpCreatureSubtype]?.rpProperAi?.rpGender ||
				rpNameSettings[rpCreatureType]?.rpProperAi?.rpGender ||
				rpNameSettings.default.rpProperAi.rpGender,
			rpNameBase:
				rpNameSettings[rpCreature]?.rpProperAi?.rpNameBase ||
				rpNameSettings[rpCreatureSubtype]?.rpProperAi?.rpNameBase ||
				rpNameSettings[rpCreatureType]?.rpProperAi?.rpNameBase ||
				rpNameSettings.default.rpProperAi.rpNameBase,
			rpNameFormat:
				rpNameSettings[rpCreature]?.rpProperAi?.rpNameFormat ||
				rpNameSettings[rpCreatureSubtype]?.rpProperAi?.rpNameFormat ||
				rpNameSettings[rpCreatureType]?.rpProperAi?.rpNameFormat ||
				rpNameSettings.default.rpProperAi.rpNameFormat,
		},
		rpAdjectiveAi: {
			rpGenre:
				rpNameSettings[rpCreature]?.rpAdjectiveAi?.rpGenre ||
				rpNameSettings[rpCreatureSubtype]?.rpAdjectiveAi?.rpGenre ||
				rpNameSettings[rpCreatureType]?.rpAdjectiveAi?.rpGenre ||
				rpNameSettings.default.rpAdjectiveAi.rpGenre,
			rpLanguage:
				rpNameSettings[rpCreature]?.rpAdjectiveAi?.rpLanguage ||
				rpNameSettings[rpCreatureSubtype]?.rpAdjectiveAi?.rpLanguage ||
				rpNameSettings[rpCreatureType]?.rpAdjectiveAi?.rpLanguage ||
				rpNameSettings.default.rpAdjectiveAi.rpLanguage,
			rpNameBase:
				rpNameSettings[rpCreature]?.rpAdjectiveAi?.rpNameBase ||
				rpNameSettings[rpCreatureSubtype]?.rpAdjectiveAi?.rpNameBase ||
				rpNameSettings[rpCreatureType]?.rpAdjectiveAi?.rpNameBase ||
				rpNameSettings.default.rpAdjectiveAi.rpNameBase,
			rpNameFormat:
				rpNameSettings[rpCreature]?.rpAdjectiveAi?.rpNameFormat ||
				rpNameSettings[rpCreatureSubtype]?.rpAdjectiveAi
					?.rpNameFormat ||
				rpNameSettings[rpCreatureType]?.rpAdjectiveAi?.rpNameFormat ||
				rpNameSettings.default.rpAdjectiveAi.rpNameFormat,
		},
		rpProper: {
			rpNameBase:
				rpNameSettings[rpCreature]?.rpProper?.rpNameBase ||
				rpNameSettings[rpCreatureSubtype]?.rpProper?.rpNameBase ||
				rpNameSettings[rpCreatureType]?.rpProper?.rpNameBase ||
				rpNameSettings.default.rpProper.rpNameBase,
			rpNameFormat:
				rpNameSettings[rpCreature]?.rpProper?.rpNameFormat ||
				rpNameSettings[rpCreatureSubtype]?.rpProper?.rpNameFormat ||
				rpNameSettings[rpCreatureType]?.rpProper?.rpNameFormat ||
				rpNameSettings.default.rpProper.rpNameFormat,
		},
		rpAdjective: {
			rpNameBase:
				rpNameSettings[rpCreature]?.rpAdjective?.rpNameBase ||
				rpNameSettings[rpCreatureSubtype]?.rpAdjective?.rpNameBase ||
				rpNameSettings[rpCreatureType]?.rpAdjective?.rpNameBase ||
				rpNameSettings.default.rpAdjective.rpNameBase,
			rpNameFormat:
				rpNameSettings[rpCreature]?.rpAdjective?.rpNameFormat ||
				rpNameSettings[rpCreatureSubtype]?.rpAdjective?.rpNameFormat ||
				rpNameSettings[rpCreatureType]?.rpAdjective?.rpNameFormat ||
				rpNameSettings.default.rpAdjective.rpNameFormat,
		},
		rpNumbered: {
			rpNameBase:
				rpNameSettings[rpCreature]?.rpNumbered?.rpNameBase ||
				rpNameSettings[rpCreatureSubtype]?.rpNumbered?.rpNameBase ||
				rpNameSettings[rpCreatureType]?.rpNumbered?.rpNameBase ||
				rpNameSettings.default.rpNumbered.rpNameBase,
			rpNumberFormat:
				rpNameSettings[rpCreature]?.rpNumbered?.rpNumberFormat ||
				rpNameSettings[rpCreatureSubtype]?.rpNumbered?.rpNumberFormat ||
				rpNameSettings[rpCreatureType]?.rpNumbered?.rpNumberFormat ||
				rpNameSettings.default.rpNumbered.rpNumberFormat,
			rpNameFormat:
				rpNameSettings[rpCreature]?.rpNumbered?.rpNameFormat ||
				rpNameSettings[rpCreatureSubtype]?.rpNumbered?.rpNameFormat ||
				rpNameSettings[rpCreatureType]?.rpNumbered?.rpNameFormat ||
				rpNameSettings.default.rpNumbered.rpNameFormat,
		},
		rpNone: {},
	};
};

export {
	rp,
	rpGetLocalStorageItem,
	rpSetLocalStorageItem,
	rpGenerateUUID,
	rpToTitleCase,
	rpCombineNameParts,
	rpGenerateGptPrompt,
	rpCallLambdaFunction,
	rpParseResponse,
	rpDeleteLocalStorageItem,
	rpDeleteAllLocalStorageItems,
	rpIsOnline,
	rpGetJson,
	rpRandBetween,
	rpAddCreatureNamesToSetting,
	rpAddDescriptionsToSetting,
	rpSetUsedByName,
	rpSetNotUsedByName,
	rpPatreonAlert,
	rpJsonToHtml,
	rpShuffle,
	rpGetOrNull,
	rpGetItemName,
	rpFormat,
	rpToRoman,
	rpEscapeDoubleQuotes,
	rpBadWords,
	rpAddNestedValue,
	rpGetBiographyLocation,
	rpGetNestedProperty,
	rpConvertNumber,
	rpRemoveDescriptions,
	rpCheckNameWithAi,
	rpCheckNameAndPromptDialog,
	rpGetDefaultOptions,
	rpStartJitter,
	rpStopJitter,
	rpRemoveImgTags,
};
