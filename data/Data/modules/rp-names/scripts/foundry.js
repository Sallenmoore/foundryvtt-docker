import { rpRegisterSettings } from "./registerSettings.js";
import {
	rpRegisterCreateTokenHook,
	rpRegisterRenderTokenHUDHook,
	rpRegisterGetActorDirectoryEntryContextHook,
	rpRegisterPreUpdateTokenHook,
	rpRegisterUpdateTokenHook,
	rpRegisterDeleteTokenHook,
	rpRegisterChatMessageHook,
	rpRegisterRenderSidebarTabHook,
	rpRegisterRenderChatMessageHook,
} from "./hooks.js";
import { rpCreateRpChat } from "./chat.js";
import { rp } from "./util.js";
import { rpLanguages } from "../json/languages.js";
import { rpGenres } from "../json/genres.js";
import { rpCustomTypes } from "../json/customTypes.js";

const rpVersion = "1.13.0.1";
const rpDescMap = new Map();

let rpChat;
let rpChatMessage;

/**
 * Initialize Handlebars by registering several helper functions.
 * @function
 */
const rpInitializeHandlebars = () => {
	/**
	 * Stringify a JSON object.
	 * @param {object} context - The JSON object to stringify.
	 * @returns {string} A string representation of the JSON object.
	 */
	Handlebars.registerHelper("rpStringify", function (context) {
		return JSON.stringify(context);
	});

	/**
	 * Format a configuration object for display.
	 * @param {object} config - The configuration object to format.
	 * @returns {Handlebars.SafeString} A Handlebars SafeString containing a formatted representation of the configuration object.
	 */
	Handlebars.registerHelper("rpFormatConfig", function (config) {
		// Transform entries into formatted definition list elements
		const rpEntries = Object.entries(config);
		const rpFormattedEntries = rpEntries
			.map(
				([key, value]) =>
					`<dt>${key}:</dt><dd>${value !== "" ? value : "Empty"}</dd>`
			)
			.join("");
		// Return a SafeString to prevent Handlebars from escaping the HTML
		return new Handlebars.SafeString(
			`<dl class="config-list">${rpFormattedEntries}</dl>`
		);
	});

	/**
	 * Format date strings.
	 * @param {string} date - The input date string.
	 * @returns {string} Formatted date in the 'YYYY-MM-DD' format.
	 */
	Handlebars.registerHelper("rpFormatDate", function (date) {
		const d = new Date(date);
		let month = "" + (d.getMonth() + 1);
		let day = "" + d.getDate();
		let year = d.getFullYear();

		if (month.length < 2) month = "0" + month;
		if (day.length < 2) day = "0" + day;

		return [year, month, day].join("-");
	});

	/**
	 * Load the list of languages from the JSON file.
	 * @returns {array} List of languages.
	 */
	Handlebars.registerHelper("rpGetLanguages", function () {
		return rpLanguages;
	});

	/**
	 * Load the list of genres from the JSON file.
	 * @returns {array} List of genres.
	 */
	Handlebars.registerHelper("rpGetGenres", function () {
		return rpGenres;
	});

	/**
	 * Load the list of creature types from the JSON file.
	 * @returns {array} List of creature types.
	 */
	Handlebars.registerHelper("rpGetCustomTypes", function () {
		return rpCustomTypes;
	});

	/**
	 * Compare two values for equality.
	 * @param {*} v1 - First value to compare.
	 * @param {*} v2 - Second value to compare.
	 * @returns {boolean} Returns true if the two values are equal, otherwise false.
	 */
	Handlebars.registerHelper("rpEq", (v1, v2) => v1 === v2);

	/**
	 * Drop values into the console log.
	 * @param {*} value - The value to log.
	 */
	Handlebars.registerHelper("rpConsoleLog", function (value) {
		rp.log("" + value);
	});

	/**
	 * Convert a string to title case.
	 * @param {string} str - The string to convert.
	 * @returns {string} The input string with the first letter capitalized, or an empty string if the input is not a string or is an empty string.
	 */
	Handlebars.registerHelper("rpUpperCaseFirst", function (str) {
		if (typeof str === "string" && str.length > 0) {
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
		return "";
	});

	/**
	 * Limit input values to a specified range.
	 * @param {number} value - The input value.
	 * @param {number} min - The minimum limit.
	 * @param {number} max - The maximum limit.
	 * @returns {number} The input value if it's within the specified range, or the closest limit if it's outside the range.
	 */
	Handlebars.registerHelper("rpLimitInputValue", function (value, min, max) {
		if (value < min) {
			return min;
		} else if (value > max) {
			return max;
		} else {
			return value;
		}
	});

	Handlebars.registerHelper("unless", function (conditional, options) {
		if (!conditional) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	});

	Handlebars.registerHelper("notEmpty", function (value) {
		return value && value !== "";
	});

	Handlebars.registerHelper("toUpperCase", function (str) {
		return str.toUpperCase();
	});

	Handlebars.registerHelper("configLocalize", function (key) {
		const configKey = `CONFIG.${key.toUpperCase()}`;
		return game.i18n.localize(configKey);
	});

	Handlebars.registerHelper("replace", function (str, pattern, replacement) {
		// Ensure that str is a string
		if (typeof str !== "string") {
			rp.warn(
				"Replace helper function: first argument must be a string."
			);
			return "";
		}

		return str.replace(new RegExp(pattern, "g"), replacement);
	});

	rp.log("Registered Handlebars helpers.");
};

rpInitializeHandlebars();

/**
 * Initialize the module when Foundry VTT initializes
 */
Hooks.once("init", () => {
	// Register the module settings
	rpRegisterSettings();

	// Get today's date and truncate time
	const today = new Date();
	const todayTruncated = today.toISOString().split("T")[0];
	// Get the date of the last free AI request and truncate time
	const freeAiRequestDate = game.settings.get(
		"rp-names",
		"rpSettingsFreeAiRequestDate"
	);
	const [year, month, day] = freeAiRequestDate.split("-");
	const freeAiRequestDateTruncated = new Date(year, month - 1, day);

	// If today's date is later than the date of the last free AI request, reset free daily AI requests
	if (
		todayTruncated > freeAiRequestDateTruncated.toISOString().split("T")[0]
	) {
		game.settings.set(
			"rp-names",
			"rpSettingsFreeAiRequestDate",
			todayTruncated
		);
		game.settings.set("rp-names", "rpSettingsFreeAiRequestsRemaining", 5);
		rp.log("Reset free daily AI requests.");
	}

	// Check if the panel has been shown before
	const rpShowPanel = game.settings.get("rp-names", "rpSettingsShowPanel");

	// If the panel has not been shown before, show it
	if (!rpShowPanel) {
		// Define the content and styling of the notification
		const html = `<p>Instructions for using this module.</p>`;
		const options = {
			permanent: false,
			style: `
                background-color: var(--bg1);
                color: var(--text1);
                border-color: var(--accent1);
            `,
		};
		// Display the notification
		ui.notifications.info(html, options);

		// Set the flag to indicate that the panel has been shown
		game.settings.set("rp-names", "rpSettingsShowPanel", true);
	}

	console.log(
		`%cRandom Procedural Names v${rpVersion}
________________________________________________
 ____  ____   ____ __  __  _              _     
|  _ \\|  _ \\ / ___|  \\/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\\/| || __/ _ \\ / _ \\| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \\__ \\
|_| \\_\\_|    \\____|_|  |_(_)__\\___/ \\___/|_|___/
________________________________________________`,
		"color: #7b4ed4; font-weight: bold;"
	);

	rpChat = rpCreateRpChat();
});

Hooks.on("ready", () => {
	game.socket.on("module.rp-names", (data) => {
		if (data.command.startsWith("!delete-card")) {
			let id = data.command.split(" ")[1];
			let msg = game.messages.get(id);
			if (msg.user.id === game.user.id || game.user.isGM) {
				msg.delete();
			}
		}
	});
});

rpRegisterCreateTokenHook();
rpRegisterRenderTokenHUDHook();
rpRegisterGetActorDirectoryEntryContextHook();
rpRegisterPreUpdateTokenHook();
rpRegisterUpdateTokenHook();
rpRegisterDeleteTokenHook();
rpRegisterChatMessageHook();
rpRegisterRenderSidebarTabHook();
rpRegisterRenderChatMessageHook();

//rp.log("Test log message");
//rp.warn("Test warning message");
//rp.error("Test error message");

export { rpChat, rpDescMap };
