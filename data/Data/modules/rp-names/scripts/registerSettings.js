import { rpLanguages } from "../json/languages.js";
import { rpGenres } from "../json/genres.js";
import { rpCrossCheckNames } from "./actors.js";
import { rp } from "./util.js";

/**
 * Creates a debounced function that delays invoking the provided function until after 'wait' milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @function
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function.
 */
const debounce = (func, wait) => {
	let timeout;
	return (...args) => {
		const context = this;
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(context, args), wait);
	};
};

/**
 * Function to register game settings.
 *
 * @function
 */
const rpRegisterSettings = () => {
	if (typeof game === "undefined" || !game) {
		return;
	}

	const rpRegister = (key, options) =>
		game.settings.register("rp-names", key, options);

	const rpRegisterSettingsMenu = (key, options) =>
		game.settings.registerMenu("rp-names", key, options);

	const rpLanguageChoices = rpLanguages.reduce((rpObj, rpLang) => {
		rpObj[rpLang] = rpLang;
		return rpObj;
	}, {});

	const today = new Date();
	const todayTruncated = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate()
	);

	let rpDefaultGenre;

	switch (game.system.id) {
		case "wwn":
			rpDefaultGenre = "Futuristic";
			break;
		case "CoC7":
			rpDefaultGenre = "Lovecraftian";
			break;
		case "cyberpunk-red-core":
		case "shadowrun5e":
		case "shadowrun6":
			rpDefaultGenre = "Cyberpunk";
			break;
		case "swnr":
			rpDefaultGenre = "Futuristic";
			break;
		case "t2k4e":
			rpDefaultGenre = "Modern";
			break;
		default:
			rpDefaultGenre = "Fantasy";
	}

	rpRegisterSettingsMenu("rpSettingsNameMenu", {
		name: game.i18n.localize("CONFIG.SAVED_CONFIGURATIONS"),
		label: game.i18n.localize("CONFIG.SAVED_CONFIGURATIONS"),
		hint: game.i18n.localize("CONFIG.SAVED_CONFIGURATIONS_HINT"),
		icon: "fas fa-table",
		type: RPSavedConfigurationsForm,
		restricted: true,
	});

	rpRegisterSettingsMenu("rpSettingsSavedNamesMenu", {
		name: game.i18n.localize("CONFIG.SAVED_NAMES"),
		label: game.i18n.localize("CONFIG.SAVED_NAMES"),
		hint: game.i18n.localize("CONFIG.SAVED_NAMES_HINT"),
		icon: "fas fa-table",
		type: RPSavedNamesForm,
		restricted: true,
	});

	// Add text field for Patreon subscriber key
	rpRegister("rpSettingsPatreonKey", {
		name: game.i18n.localize("CONFIG.PATREON_KEY"),
		hint: game.i18n.localize("CONFIG.PATREON_KEY_HINT"),
		scope: "world",
		config: true,
		default: "",
		type: String,
		restricted: true,
	});

	// Add a select setting for which model to use: Offline or Online
	rpRegister("rpSettingsNamingMethod", {
		name: game.i18n.localize("CONFIG.NAMING_METHOD"),
		hint: game.i18n.localize("CONFIG.NAMING_METHOD_HINT"),
		scope: "world",
		config: true,
		default: "rpProperAi",
		type: String,
		choices: {
			rpProperAi: game.i18n.localize(
				"CONFIG.NAMING_METHOD_CHOICES.PROPER_AI"
			),
			rpAdjectiveAi: game.i18n.localize(
				"CONFIG.NAMING_METHOD_CHOICES.ADJECTIVE_AI"
			),
			rpProper: game.i18n.localize("CONFIG.NAMING_METHOD_CHOICES.PROPER"),
			rpAdjective: game.i18n.localize(
				"CONFIG.NAMING_METHOD_CHOICES.ADJECTIVE"
			),
			rpNumbered: game.i18n.localize(
				"CONFIG.NAMING_METHOD_CHOICES.NUMBERED"
			),
		},
		restricted: true,
	});

	rpRegister("rpSettingsGenreProperAi", {
		name: game.i18n.localize("CONFIG.GENRE_PROPER_AI"),
		hint: game.i18n.localize("CONFIG.GENRE_PROPER_AI_HINT"),
		scope: "world",
		config: true,
		default: rpDefaultGenre,
		type: String,
		restricted: true,
		choices: rpGenres.reduce((rpObj, rpGenre) => {
			rpObj[rpGenre.value] = game.i18n.localize(rpGenre.label);
			return rpObj;
		}, {}),
	});

	rpRegister("rpSettingsLanguageProperAi", {
		name: game.i18n.localize("CONFIG.LANGUAGE_PROPER_AI"),
		hint: game.i18n.localize("CONFIG.LANGUAGE_PROPER_AI_HINT"),
		scope: "world",
		config: true,
		default: "Default",
		type: String,
		restricted: true,
		choices: rpLanguageChoices,
	});

	rpRegister("rpSettingsGenderProperAi", {
		name: game.i18n.localize("CONFIG.GENDER_PROPER_AI"),
		hint: game.i18n.localize("CONFIG.GENDER_PROPER_AI_HINT"),
		scope: "world",
		config: true,
		default: "Any Gender",
		type: String,
		restricted: true,
		choices: {
			"any gender": game.i18n.localize("CONFIG.GENDER_CHOICES.ANY"),
			male: game.i18n.localize("CONFIG.GENDER_CHOICES.MALE"),
			female: game.i18n.localize("CONFIG.GENDER_CHOICES.FEMALE"),
			nonbinary: game.i18n.localize("CONFIG.GENDER_CHOICES.NONBINARY"),
		},
	});

	rpRegister("rpSettingsNameBaseProperAi", {
		name: game.i18n.localize("CONFIG.NAME_BASE_PROPER_AI"),
		hint: game.i18n.localize("CONFIG.NAME_BASE_PROPER_AI_HINT"),
		scope: "world",
		config: true,
		default: "rpCreature",
		type: String,
		restricted: true,
		choices: {
			rpCreature: game.i18n.localize("CONFIG.NAME_BASE_CHOICES.CREATURE"),
			rpCreatureType: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_TYPE"
			),
			rpCreatureSubtype: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_SUBTYPE"
			),
		},
	});

	rpRegister("rpSettingsNameFormatProperAi", {
		name: game.i18n.localize("CONFIG.NAME_FORMAT_PROPER_AI"),
		hint: game.i18n.localize("CONFIG.NAME_FORMAT_PROPER_AI_HINT"),
		scope: "world",
		config: true,
		default: "{firstName}",
		type: String,
		restricted: true,
		choices: {
			"{firstName} '{nickname}' {surname}":
				"{firstName} '{nickname}' {surname}",
			"{firstName} {surname}, {title}": "{firstName} {surname}, {title}",
			"'{nickname}' {firstName} {surname}":
				"'{nickname}' {firstName} {surname}",
			"{firstName} {surname}": "{firstName} {surname}",
			"'{nickname}' {surname}": "'{nickname}' {surname}",
			"{nickname}": "{nickname}",
			"{firstName}": "{firstName}",
			"{surname}": "{surname}",
		},
	});

	rpRegister("rpSettingsGenreAdjectiveAi", {
		name: game.i18n.localize("CONFIG.GENRE_ADJECTIVE_AI"),
		hint: game.i18n.localize("CONFIG.GENRE_ADJECTIVE_AI_HINT"),
		scope: "world",
		config: true,
		default: rpDefaultGenre,
		type: String,
		restricted: true,
		choices: rpGenres.reduce((rpObj, rpGenre) => {
			rpObj[rpGenre.value] = game.i18n.localize(rpGenre.label);
			return rpObj;
		}, {}),
	});

	rpRegister("rpSettingsLanguageAdjectiveAi", {
		name: game.i18n.localize("CONFIG.LANGUAGE_ADJECTIVE_AI"),
		hint: game.i18n.localize("CONFIG.LANGUAGE_ADJECTIVE_AI_HINT"),
		scope: "world",
		config: true,
		default: "Default",
		type: String,
		restricted: true,
		choices: rpLanguageChoices,
	});

	rpRegister("rpSettingsNameBaseAdjectiveAi", {
		name: game.i18n.localize("CONFIG.NAME_BASE_ADJECTIVE_AI"),
		hint: game.i18n.localize("CONFIG.NAME_BASE_ADJECTIVE_AI_HINT"),
		scope: "world",
		config: true,
		default: "rpCreature",
		type: String,
		restricted: true,
		choices: {
			rpCreature: game.i18n.localize("CONFIG.NAME_BASE_CHOICES.CREATURE"),
			rpCreatureType: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_TYPE"
			),
			rpCreatureSubtype: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_SUBTYPE"
			),
		},
	});

	rpRegister("rpSettingsNameFormatAdjectiveAi", {
		name: game.i18n.localize("CONFIG.NAME_FORMAT_ADJECTIVE_AI"),
		hint: game.i18n.localize("CONFIG.NAME_FORMAT_ADJECTIVE_AI_HINT"),
		scope: "world",
		config: true,
		default: "{adjective} {name}",
		type: String,
		restricted: true,
		choices: {
			"{adjective} {name}": "{adjective} {name}",
			"{name} {adjective}": "{name} {adjective}",
			"Very {adjective} {name}": "Very {adjective} {name}",
		},
	});

	rpRegister("rpSettingsNameBaseProper", {
		name: game.i18n.localize("CONFIG.NAME_BASE_PROPER"),
		hint: game.i18n.localize("CONFIG.NAME_BASE_PROPER_HINT"),
		scope: "world",
		config: true,
		default: "rpCreature",
		type: String,
		restricted: true,
		choices: {
			rpCreature: game.i18n.localize("CONFIG.NAME_BASE_CHOICES.CREATURE"),
			rpCreatureType: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_TYPE"
			),
			rpCreatureSubtype: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_SUBTYPE"
			),
		},
	});

	rpRegister("rpSettingsNameFormatProper", {
		name: game.i18n.localize("CONFIG.NAME_FORMAT_PROPER"),
		hint: game.i18n.localize("CONFIG.NAME_FORMAT_PROPER_HINT"),
		scope: "world",
		config: true,
		default: "{firstName} {surname}",
		type: String,
		restricted: true,
		choices: {
			"{firstName} {surname}": "{firstName} {surname}",
			"{firstName}": "{firstName}",
			"{surname}": "{surname}",
			"Little {firstName}": "Little {firstName}",
		},
	});

	rpRegister("rpSettingsNameBaseAdjective", {
		name: game.i18n.localize("CONFIG.NAME_BASE_ADJECTIVE"),
		hint: game.i18n.localize("CONFIG.NAME_BASE_ADJECTIVE_HINT"),
		scope: "world",
		config: true,
		default: "rpCreature",
		type: String,
		restricted: true,
		choices: {
			rpCreature: game.i18n.localize("CONFIG.NAME_BASE_CHOICES.CREATURE"),
			rpCreatureType: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_TYPE"
			),
			rpCreatureSubtype: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_SUBTYPE"
			),
		},
	});

	rpRegister("rpSettingsNameFormatAdjective", {
		name: game.i18n.localize("CONFIG.NAME_FORMAT_ADJECTIVE"),
		hint: game.i18n.localize("CONFIG.NAME_FORMAT_ADJECTIVE_HINT"),
		scope: "world",
		config: true,
		default: "{adjective} {name}",
		type: String,
		restricted: true,
		choices: {
			"{adjective} {name}": "{adjective} {name}",
			"{name} {adjective}": "{name} {adjective}",
			"Very {adjective} {name}": "Very {adjective} {name}",
		},
	});

	rpRegister("rpSettingsNameBaseNumbered", {
		name: game.i18n.localize("CONFIG.NAME_BASE_NUMBERED"),
		hint: game.i18n.localize("CONFIG.NAME_BASE_NUMBERED_HINT"),
		scope: "world",
		config: true,
		default: "rpCreature",
		type: String,
		restricted: true,
		choices: {
			rpCreature: game.i18n.localize("CONFIG.NAME_BASE_CHOICES.CREATURE"),
			rpCreatureType: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_TYPE"
			),
			rpCreatureSubtype: game.i18n.localize(
				"CONFIG.NAME_BASE_CHOICES.CREATURE_SUBTYPE"
			),
		},
	});

	rpRegister("rpSettingsNumberFormatNumbered", {
		name: game.i18n.localize("CONFIG.NUMBER_FORMAT_NUMBERED"),
		hint: game.i18n.localize("CONFIG.NUMBER_FORMAT_NUMBERED_HINT"),
		scope: "world",
		config: true,
		default: "number",
		type: String,
		restricted: true,
		choices: {
			number: game.i18n.localize("CONFIG.NUMBER_FORMAT_CHOICES.NUMBER"),
			roman: game.i18n.localize("CONFIG.NUMBER_FORMAT_CHOICES.ROMAN"),
			letter: game.i18n.localize("CONFIG.NUMBER_FORMAT_CHOICES.LETTER"),
		},
	});

	rpRegister("rpSettingsNameFormatNumbered", {
		name: game.i18n.localize("CONFIG.NAME_FORMAT_NUMBERED"),
		hint: game.i18n.localize("CONFIG.NAME_FORMAT_NUMBERED_HINT"),
		scope: "world",
		config: true,
		default: "{name} {number}",
		type: String,
		restricted: true,
		choices: {
			"{name} {number}": "{name} {number}",
			"{name} ({number})": "{name} ({number})",
			"{name} [{number}]": "{name} [{number}]",
			"{name} - {number}": "{name} - {number}",
			"{name} #{number}": "{name} #{number}",
		},
	});

	rpRegister("rpSettingsAutoNameNewTokens", {
		name: game.i18n.localize("CONFIG.AUTO_NAME_NEW_TOKENS"),
		hint: game.i18n.localize("CONFIG.AUTO_NAME_NEW_TOKENS_HINT"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		restricted: true,
	});

	rpRegister("rpSettingsUseSavedNamesFirst", {
		name: game.i18n.localize("CONFIG.USE_SAVED_NAMES_FIRST"),
		hint: game.i18n.localize("CONFIG.USE_SAVED_NAMES_FIRST_HINT"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		restricted: true,
	});

	rpRegister("rpSettingsTemperature", {
		name: game.i18n.localize("CONFIG.TEMPERATURE"),
		hint: game.i18n.localize("CONFIG.TEMPERATURE_HINT"),
		scope: "world",
		config: true,
		default: 1,
		type: Number,
		range: {
			min: 0,
			max: 1.8,
			step: 0.1,
		},
		restricted: true,
	});

	rpRegister("rpSettingsApiKey", {
		name: game.i18n.localize("CONFIG.USER_API_KEY"),
		hint: game.i18n.localize("CONFIG.USER_API_KEY_HINT"),
		scope: "world",
		config: true,
		default: "",
		type: String,
		restricted: true,
	});

	rpRegister("rpSettingsDevMode", {
		name: game.i18n.localize("CONFIG.DEVELOPER_MODE"),
		hint: game.i18n.localize("CONFIG.DEVELOPER_MODE_HINT"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		restricted: true,
	});

	rpRegister("rpSettingsName", {
		name: "Name Settings",
		scope: "world",
		config: false,
		type: Object,
		default: {},
		restricted: true,
	});

	rpRegister("rpSettingsSavedNames", {
		name: "Saved Names",
		scope: "world",
		config: false,
		type: Object,
		default: {},
		restricted: true,
	});

	rpRegister("rpSettingsShowPanel", {
		name: "Show Splash Screen",
		scope: "client",
		config: false,
		type: Boolean,
		default: true,
		restricted: true,
	});

	rpRegister("rpSettingsTogglePromptHistory", {
		name: "Toggle Prompt History",
		scope: "client",
		config: false,
		type: Boolean,
		default: false,
		restricted: true,
	});

	rpRegister("rpSettingsClientId", {
		name: "Client ID",
		scope: "client",
		config: false,
		type: String,
		default: "",
		restricted: true,
	});

	rp.log("Registered settings");
};

/**
 * Class representing the form application for saved configurations.
 * Extends the basic FormApplication.
 */
class RPSavedConfigurationsForm extends FormApplication {
	/**
	 * Create a new RPSavedConfigurationsForm instance.
	 * @param {Object} object - The source object for the form.
	 * @param {Object} [options={}] - Form options.
	 */
	constructor(object, options = {}) {
		super(object, options);
	}

	/**
	 * Default options for this form.
	 * @returns {Object} The default options.
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "saved-configurations",
			title: game.i18n.localize("CONFIG.SAVED_CONFIGURATIONS"),
			template:
				"modules/rp-names/templates/saved-configurations-form.html",
			classes: ["saved-configurations-window"],
			width: "75%",
			height: "auto",
			resizable: true,
		});
	}

	/**
	 * Gather data for the form.
	 * @returns {Object} The form data.
	 */
	getData() {
		const rpSavedConfigurations = game.settings.get(
			"rp-names",
			"rpSettingsName"
		);
		return { rpSavedConfigurations };
	}

	/**
	 * Activate form listeners.
	 * @param {jQuery} html - The HTML object.
	 */
	activateListeners(html) {
		super.activateListeners(html);

		html.find("form").on("submit", function (e) {
			e.preventDefault();
			return this.submit({ preventClose });
		});
		html.find(".delete-config").click((ev) => {
			const key = $(ev.currentTarget).data("key");
			const rpSavedConfigurations = game.settings.get(
				"rp-names",
				"rpSettingsName"
			);
			delete rpSavedConfigurations[key];
			game.settings.set(
				"rp-names",
				"rpSettingsName",
				rpSavedConfigurations
			);
			setTimeout(() => this.render(true), 0);
		});
	}

	/**
	 * Render the form.
	 * @param {boolean} force - Force rendering.
	 * @param {Object} [options={}] - Form options.
	 * @returns {Promise} A promise that resolves when rendering is complete.
	 */
	async render(force, options = {}) {
		const rpSavedConfigurations = game.settings.get(
			"rp-names",
			"rpSettingsName"
		);
		if (force && Object.keys(rpSavedConfigurations).length === 0) {
			return this.close();
		}
		return super.render(force, options);
	}

	/**
	 * Update object.
	 * @param {Event} event - The event object.
	 * @param {Object} formData - The form data.
	 */
	async _updateObject(event, formData) {
		// This method is intentionally left blank
	}

	/**
	 * Handle form submission.
	 * @param {Event} event - The event object.
	 * @param {Object} [options={}] - Form options.
	 */
	async _onSubmit(event, options = {}) {
		options.preventClose = true;
		await super._onSubmit(event, options);
	}
}

/**
 * Class representing the form application for saved names.
 * Extends the basic FormApplication.
 */
class RPSavedNamesForm extends FormApplication {
	/**
	 * Create a new RPSavedNamesForm instance.
	 * @param {Object} [object={}] - The source object for the form.
	 * @param {Object} [options={}] - Form options.
	 */
	constructor(object = {}, options = {}) {
		super(object, options);
		this.searchValue = "";
		this.searchField = null;
		this.creatures = object.creature || [];
		// Add the new methods to the constructor
		this._onFieldEdit = this._onFieldEdit.bind(this);
		this._onToggleUsed = this._onToggleUsed.bind(this);
		this.debouncedRender = debounce(this.render.bind(this), 300);
		this.tokenDocument = options.token;
	}

	/**
	 * Default options for this form.
	 * @returns {Object} The default options.
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "saved-names",
			title: game.i18n.localize("CONFIG.SAVED_NAMES"),
			template: "modules/rp-names/templates/saved-names-form.html",
			classes: ["saved-names-window"],
			width: "90%",
			height: "auto",
			resizable: true,
		});
	}

	/**
	 * Gather data for the form.
	 * @returns {Object} The form data.
	 */
	getData() {
		rpCrossCheckNames();
		let searchTerm = "";
		if (this.form) {
			this.searchValue = searchTerm =
				$(this.form).find("#search-names").val()?.toLowerCase() || "";
		}
		const allNames = game.settings.get("rp-names", "rpSettingsSavedNames");
		const filteredNames = {};

		for (const key in allNames) {
			const name = allNames[key];
			if (
				Object.entries(name)
					.filter(
						([field]) => field !== "date" && field !== "nameFormat"
					) // Ignore the Date field
					.some(([_, value]) =>
						(value || "")
							.toString()
							.toLowerCase()
							.includes(searchTerm)
					)
			) {
				if (
					!this.creatures.length ||
					(this.creatures.includes(name.creature) &&
						name.used === false)
				) {
					filteredNames[key] = name;
				}
			}
		}

		const isEmpty = Object.keys(filteredNames).length === 0;

		return {
			rpSavedNames: filteredNames,
			showApplyColumn: this.tokenDocument != null, // Show Apply column if tokenId is not null
			isEmpty: isEmpty,
		};
	}

	/**
	 * Activate form listeners.
	 * @param {jQuery} html - The HTML object.
	 */
	activateListeners(html) {
		super.activateListeners(html);

		html.find("form").on("submit", function (e) {
			e.preventDefault();
			return this.submit({ preventClose });
		});

		// This is for editable fields
		html.find(".editable").each((_, field) => {
			field.addEventListener("blur", this._onFieldEdit.bind(this));
		});

		html.find(".delete-name").click((ev) => {
			const key = $(ev.currentTarget).data("key");
			const rpSavedNames = game.settings.get(
				"rp-names",
				"rpSettingsSavedNames"
			);
			delete rpSavedNames[key];
			game.settings.set("rp-names", "rpSettingsSavedNames", rpSavedNames);
			setTimeout(() => this.render(true), 0);
		});

		html.find(".apply-name").click((ev) => {
			const key = $(ev.currentTarget).data("key");
			const rpSavedNames = game.settings.get(
				"rp-names",
				"rpSettingsSavedNames"
			);
			const rpNameToApply = rpSavedNames[key].fullName;

			// Ensure we have a tokenId and the token exists in the scene
			if (
				this.tokenDocument &&
				game.scenes.viewed.tokens.has(this.tokenDocument.id)
			) {
				this.tokenDocument.update({ name: rpNameToApply });
				// Close the form
				this.close();
			}
		});

		// Add this line
		html.find(".edit-field").blur(this._onFieldEdit);

		html.find("#delete-all-names").click((ev) =>
			this._confirmDeleteAll(ev)
		);

		this.searchField = html.find("#search-names");
		this.searchField.val(this.searchValue); // Restore search field contents
		this.searchField.focus().val(this.searchField.val()); // Set focus at the end of contents

		this.searchField.on("input", this.debouncedRender);

		// Add the following code to handle the Escape key press
		this.searchField.on("keydown", (event) => {
			if (event.key === "Escape") {
				this.searchField.val(""); // Clear the search field
				this.searchValue = ""; // Update the search value property
				this.debouncedRender(); // Trigger a render without delay
				event.preventDefault(); // Prevent other keydown events from triggering
			}
		});
	}

	/**
	 * Render the form.
	 * @param {boolean} force - Force rendering.
	 * @param {Object} [options={}] - Form options.
	 * @returns {Promise} A promise that resolves when rendering is complete.
	 */
	async render(force, options = {}) {
		const data = this.getData();
		if (data.isEmpty) {
			return this.close();
		}

		return super.render(force, options);
	}

	/**
	 * Handle field edit event.
	 * @param {Event} event - The event object.
	 */
	async _onFieldEdit(event) {
		const target = event.target;
		const key = target.dataset.key;
		const field = target.dataset.field;
		let newValue = target.textContent;

		newValue = newValue.trim().replace(/[^\p{L}\p{P}\p{Emoji}\s]/gu, "");

		const rpSavedNames = game.settings.get(
			"rp-names",
			"rpSettingsSavedNames"
		);
		if (rpSavedNames[key]) {
			const oldValue = rpSavedNames[key][field];
			rpSavedNames[key][field] = newValue;

			if (
				[
					"first_name",
					"nickname",
					"surname",
					"title",
					"adjective",
				].includes(field)
			) {
				rpSavedNames[key].fullName = rpSavedNames[key].fullName.replace(
					oldValue,
					newValue
				);
			}

			await game.settings.set(
				"rp-names",
				"rpSettingsSavedNames",
				rpSavedNames
			);
			setTimeout(() => this.render(true), 0);
		}
	}

	/**
	 * Handle toggle used event.
	 * @param {Event} event - The event object.
	 */
	async _onToggleUsed(event) {
		const key = $(event.currentTarget).data("key");
		const rpSavedNames = game.settings.get(
			"rp-names",
			"rpSettingsSavedNames"
		);
		rpSavedNames[key].used = !rpSavedNames[key].used;
		await game.settings.set(
			"rp-names",
			"rpSettingsSavedNames",
			rpSavedNames
		);
		setTimeout(() => this.render(true), 0);
	}

	/**
	 * Confirm deletion of all entries.
	 * @param {Event} event - The event object.
	 */
	async _confirmDeleteAll(event) {
		const searchTerm = this.searchField.val()?.toLowerCase() || "";
		const filteredNames = this.getData().rpSavedNames;
		const rpSavedNames = game.settings.get(
			"rp-names",
			"rpSettingsSavedNames"
		);

		// Prevent deletion if there are no records in the current view
		if (Object.keys(filteredNames).length === 0) {
			return;
		}

		const confirmation = await Dialog.confirm({
			title: game.i18n.localize("CONFIG.DELETE_ALL_NAMES_TITLE"),
			content: `<p>${game.i18n.localize(
				"CONFIG.DELETE_ALL_NAMES_TEXT"
			)}</p>`,
		});
		if (confirmation) {
			if (searchTerm !== "" && Object.keys(filteredNames).length > 0) {
				for (const key in filteredNames) {
					delete rpSavedNames[key];
				}
				await game.settings.set(
					"rp-names",
					"rpSettingsSavedNames",
					rpSavedNames
				);
			} else {
				await game.settings.set("rp-names", "rpSettingsSavedNames", {});
			}
			this.searchField.val(""); // Clear the search field
			this.searchValue = ""; // Update the search value property
			// Close the window if there are no saved names remaining
			if (Object.keys(rpSavedNames).length === 0) {
				this.close();
			} else {
				setTimeout(() => this.render(true), 0);
			}
		}
	}

	/**
	 * Update object.
	 * @param {Event} event - The event object.
	 * @param {Object} formData - The form data.
	 */
	async _updateObject(event, formData) {
		// This method is intentionally left blank
	}

	/**
	 * Handle form submission.
	 * @param {Event} event - The event object.
	 * @param {Object} [options={}] - Form options.
	 */
	async _onSubmit(event, options = {}) {
		options.preventClose = true;
		await super._onSubmit(event, options);
	}
}

export { rpRegisterSettings, RPSavedNamesForm };
