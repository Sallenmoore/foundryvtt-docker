import {
	rpGenerateRandomName,
	rpGenerateCreatureDescription,
} from "./generateRandomName.js";
import { rpLanguages } from "../json/languages.js";
import { rpGenres } from "../json/genres.js";
import { rpCustomTypes } from "../json/customTypes.js";
import {
	rp,
	rpToTitleCase,
	rpGetJson,
	rpGetLocalStorageItem,
	rpSetLocalStorageItem,
} from "./util.js";

/* GLOBAL CONSTANTS */

const rpPatreonKeyInput = document.getElementById("patreon-key");
const rpSettingsButton = document.getElementById("settings-button");
const rpFormContent = document.querySelector(".form-content");
const rpGenerateNamesButton = document.getElementById("generate-names");
const rpHeaderD20Image = document.getElementById("header-d20-image");
const rpHamburger = document.querySelector(".hamburger");
const rpNavDropdown = document.querySelector(".nav-dropdown");
const rpHeader = document.getElementById("RP");
const rpSpan = document.querySelector(".RP");

/* GLOBAL VARIABLES */

let rpCreatureValue = "";
let rpGenreValueProperAi = "";
let rpGenreValueAdjectiveAi = "";
let rpLanguageValueProperAi = "";
let rpLanguageValueAdjectiveAi = "";
let rpLanguageValueDescription = "";
let rpNameFormatValueProperAi = "";
let rpNameFormatValueAdjectiveAi = "";
let rpNameFormatValueProper = "";
let rpNameFormatValueAdjective = "";

/**
 * Populate the language select fields in the document. It adds options to the select
 * field with the language's name as the value and text.
 */
const rpPopulateLanguageSelect = () => {
	const languageSelectProperAi =
		document.getElementById("languages-properai");
	const languageSelectAdjectiveAi = document.getElementById(
		"languages-adjectiveai"
	);
	const languageSelectDescription = document.getElementById(
		"languages-description"
	);
	Object.entries(rpLanguages).forEach(([key, value]) => {
		const option = document.createElement("option");
		option.value = rpToTitleCase(value);
		option.textContent = rpToTitleCase(value);
		languageSelectProperAi.appendChild(option);
	});
	Object.entries(rpLanguages).forEach(([key, value]) => {
		const option = document.createElement("option");
		option.value = rpToTitleCase(value);
		option.textContent = rpToTitleCase(value);
		languageSelectAdjectiveAi.appendChild(option);
	});
	Object.entries(rpLanguages).forEach(([key, value]) => {
		const option = document.createElement("option");
		option.value = rpToTitleCase(value);
		option.textContent = rpToTitleCase(value);
		languageSelectDescription.appendChild(option);
	});
};

/**
 * Populate the genre select field in the document. It adds options to the select
 * field with the genre's name as the value and text.
 */
const rpPopulateGenreSelect = () => {
	const genreSelectProperAi = document.getElementById("genres-properai");
	const genreSelectAdjectiveAi =
		document.getElementById("genres-adjectiveai");
	rpGenres.forEach((genre) => {
		const option = document.createElement("option");
		option.value = rpToTitleCase(genre.value.replace(/_/g, " "));
		option.textContent = rpToTitleCase(genre.value.replace(/_/g, " "));
		genreSelectProperAi.appendChild(option);
	});
	rpGenres.forEach((genre) => {
		const option = document.createElement("option");
		option.value = rpToTitleCase(genre.value.replace(/_/g, " "));
		option.textContent = rpToTitleCase(genre.value.replace(/_/g, " "));
		genreSelectAdjectiveAi.appendChild(option);
	});
};

/**
 * Populate the creature select field in the document. It adds options to the select
 * field with the creature's name as the value and text.
 */
const rpPopulateCreatureSelect = () => {
	const creatureSelect = document.getElementById("creatures");
	Object.entries(rpCustomTypes).forEach(([key, value]) => {
		const option = document.createElement("option");
		option.value = rpToTitleCase(value);
		option.textContent = rpToTitleCase(value);
		creatureSelect.appendChild(option);
	});
};

/**
 * Update the value displayed next to the slider. It adds an event listener on the slider
 * input event to update the displayed value.
 * @param {string} sliderId - The id of the slider element.
 * @param {string} valueId - The id of the element displaying the slider's value.
 */
const rpUpdateSliderValue = (sliderId, valueId) => {
	const slider = document.getElementById(sliderId);
	const valueSpan = document.getElementById(valueId);
	valueSpan.textContent =
		sliderId === "temperature" && slider.value === "0"
			? "Dull"
			: sliderId === "temperature" && slider.value === "1.8"
			? "Ridiculous"
			: slider.value;
	slider.addEventListener("input", () => {
		valueSpan.textContent =
			sliderId === "temperature" && slider.value === "0"
				? "Dull"
				: sliderId === "temperature" && slider.value === "1.8"
				? "Ridiculous"
				: slider.value;
	});
};

/**
 * Returns an input object with default options and user-selected options for
 * generating a random name in a role-playing game (RPG).
 * @returns {object} An input object for generating a random RPG name.
 */
const rpGetRpGenerateRandomNameInput = () => {
	const rpOptions = {
		rpNamingMethod:
			document.getElementById("naming-method").value || "rpProperAi",
		rpProperAi: {
			rpGenre:
				document.getElementById("genre-select-properai").value ||
				"Fantasy",
			rpLanguage:
				document.getElementById("language-select-properai").value ||
				"Default",
			rpGender: document.getElementById("gender-properai").value || "Any",
			rpNameBase: "rpCustom",
			rpCustomNameBase:
				document.getElementById("creature-select").value || "Goblin",
			rpNameFormat:
				document.getElementById("name-format-select-properai").value ||
				"{firstName} '{nickname}' {surname}",
		},
		rpAdjectiveAi: {
			rpGenre:
				document.getElementById("genre-select-adjectiveai").value ||
				"Any",
			rpLanguage:
				document.getElementById("language-select-adjectiveai").value ||
				"Default",
			rpNameBase: "rpCustom",
			rpCustomNameBase:
				document.getElementById("creature-select").value || "Goblin",
			rpNameFormat:
				document.getElementById("name-format-select-adjectiveai")
					.value || "{adjective} {name}",
		},
		rpProper: {
			rpNameBase: "rpCustom",
			rpCustomNameBase:
				document.getElementById("creature-select").value || "Goblin",
			rpNameFormat:
				document.getElementById("name-format-select-proper").value ||
				"{firstName} {surname}",
		},
		rpAdjective: {
			rpNameBase: "rpCustom",
			rpCustomNameBase:
				document.getElementById("creature-select").value || "Goblin",
			rpNameFormat:
				document.getElementById("name-format-select-adjectiveai")
					.value || "{adjective} {name}",
		},
		rpNumbered: {
			rpNameBase: "rpCustom",
			rpCustomNameBase:
				document.getElementById("creature-select").value || "Goblin",
			rpNameFormat: "{name} {number}",
		},
		rpNone: {},
	};

	const input = {
		rpActorType: "npc",
		rpCreature:
			document.getElementById("creature-select").value || "Goblin",
		rpCreatureType:
			document.getElementById("creature-select").value || "Humanoid",
		rpCreatureSubtype:
			document.getElementById("creature-select").value || "Goblinoid",
		rpOptions,
		rpNumNames: parseInt(document.getElementById("quantity").value),
		rpTemperature: +document.getElementById("temperature").value,
	};

	rp.dev("Input:");
	rp.obj(input);
	return input;
};

/**
 * Returns an input object with default options and user-selected options for
 * generating a role-playing game (RPG) character description.
 * @param {string} rpName - The name of the RPG character.
 * @returns {object} An input object for generating a RPG character description.
 */
const rpGetRpGenerateDescriptionInput = (rpName) => {
	const rpOptions = {
		rpName: rpName || "Bob",
		rpCreature:
			document.getElementById("creature-select").value || "Goblin",
		rpLanguage:
			document.getElementById("language-select-description").value ||
			"Default",
		rpTemperature: +document.getElementById("temperature").value || 1.2,
		rpDescriptionLength:
			document.getElementById("description-length").value ||
			"medium-length",
	};

	const input = {
		rpOptions,
	};

	rp.dev("Input:");
	rp.obj(input);
	return input;
};

/**
 * Display the generated names in the names list. It creates new elements for each name
 * and adds them to the names list. It also adds event listeners to each name to generate
 * a description when clicked.
 * @param {string} namesString - A string containing all the generated names.
 */
const rpDisplayGeneratedNames = (namesString) => {
	if (namesString === "") {
		rpShowImage(true);
		return;
	}
	rpShowImage(false);

	const names = namesString.split(/\r\n|\n|\r|\n\r/).map((name) => {
		return name.replace(/^\s*(\d+\.|-|\*)\s*/, "");
	});
	const nameList = document.querySelector(".name-list");
	nameList.innerHTML = "";

	names.forEach((name, index) => {
		const listItem = document.createElement("li");
		const pill = document.createElement("button");
		const descriptionArea = document.createElement("textarea");

		const centerContainer = document.createElement("div");
		centerContainer.className = "center-container";

		pill.textContent = name;
		pill.className = "name-pill";
		listItem.appendChild(pill);

		centerContainer.appendChild(listItem);
		nameList.appendChild(centerContainer);

		descriptionArea.id = `description-area-${index}`;
		descriptionArea.className = "description-area";
		descriptionArea.style.display = "none";
		listItem.appendChild(descriptionArea);

		pill.addEventListener("click", async () => {
			rpStartJitter();
			try {
				const input = rpGetRpGenerateDescriptionInput(pill.textContent);
				const {
					rpName,
					rpCreature,
					rpLanguage,
					rpTemperature,
					rpDescriptionLength,
				} = input.rpOptions;
				const description = await rpGenerateCreatureDescription(
					rpName,
					rpCreature,
					rpLanguage,
					rpTemperature,
					rpDescriptionLength
				);
				descriptionArea.style.display = "block";
				descriptionArea.value = description;
				descriptionArea.style.height =
					descriptionArea.scrollHeight + "px";
			} catch (error) {
				rp.error("Failed to generate description.");
				rp.obj(error);
			}
			rpStopJitter();
		});
	});
	rpStopJitter();
};

/**
 * Show or hide the image in the document.
 * @param {boolean} show - Whether to show the image or not.
 */
const rpShowImage = (show) => {
	const imageContainer = document.getElementById("d20-image-container");
	const outputArea = document.getElementById("output-area");

	if (show) {
		imageContainer.style.display = "flex";
		outputArea.style.display = "none";
		rp.dev("Image hidden.");
	} else {
		imageContainer.style.display = "none";
		outputArea.style.display = "flex";
		rp.dev("Image shown.");
	}
};

/**
 * Save the values of the form fields to the local storage.
 */
const rpSaveFormValuesToLocalStorage = () => {
	const formElements = document.getElementById(
		"name-generator-form"
	).elements;
	for (const element of formElements) {
		if (element.name && element.type !== "submit") {
			const valueToSave =
				element.type === "checkbox" ? element.checked : element.value;
			localStorage.setItem(element.name, valueToSave);
		}
	}
	rp.log("Form values saved to local storage.");
	rp.obj(formElements);
};

/**
 * Load the values of the form fields from the local storage.
 */
const rpLoadFormValuesFromLocalStorage = () => {
	const formElements = document.getElementById(
		"name-generator-form"
	).elements;
	for (const element of formElements) {
		if (element.name && localStorage.getItem(element.name)) {
			const loadedValue = localStorage.getItem(element.name);
			if (element.type === "checkbox") {
				element.checked = loadedValue === "true";
			} else if (element.type === "number") {
				element.value = Number(loadedValue);
			} else {
				element.value = loadedValue;
			}
		}
	}
	document.getElementById("quantity-value").textContent =
		document.getElementById("quantity").value;
	document.getElementById("temperature-value").textContent =
		+document.getElementById("temperature").value === 0
			? "Dull"
			: +document.getElementById("temperature").value === 1.8
			? "Ridiculous"
			: +document.getElementById("temperature").value;
	rp.log("Form values loaded from local storage.");
};

/**
 * Return a random element from rpList.
 *
 * @param {Array} rpList - Array of role-play elements
 * @return {string} Randomly selected role-play element
 */
const rpGetRandomRp = (rpList) => {
	const rpWords = rpList[Math.floor(Math.random() * rpList.length)];
	rp.dev(`RP Words: ${rpWords}`);
	return rpWords;
};

/**
 * Add the jitter class to the d20 image.
 */
const rpStartJitter = () => {
	rpHeaderD20Image.classList.add("jitter");
	rp.dev("Commenced jitter.");
};

/**
 * Remove the jitter class from the d20 image.
 */
const rpStopJitter = () => {
	rpHeaderD20Image.classList.remove("jitter");
	rp.dev("Ended jitter.");
};

/**
 * Update role-play element every 5 seconds.
 */
const rpUpdateRp = async () => {
	const rpList = await rpGetJson("./json/rp.json");

	setInterval(async () => {
		rpSpan.classList.add("fade-out");
		await new Promise((resolve) => setTimeout(resolve, 2000));
		rpSpan.textContent = rpGetRandomRp(rpList);
		rpSpan.classList.remove("fade-out");
		rpSpan.classList.add("fade-in");
		await new Promise((resolve) => setTimeout(resolve, 2000));
		rpSpan.classList.remove("fade-in");
	}, 5000);
};

/**
 * Handles change of the selected naming method.
 *
 * Based on the selected naming method, shows and hides different settings elements on the page.
 * Also takes care of the display of Patreon key and API key fields based on the presence of these keys in the local storage.
 */
const rpHandleMethodChange = () => {
	let selectElement = document.getElementById("naming-method");

	// Hide all settings
	let properai = document.querySelectorAll(".properai-settings");
	let adjectiveai = document.querySelectorAll(".adjectiveai-settings");
	let proper = document.querySelectorAll(".proper-settings");
	let adjective = document.querySelectorAll(".adjective-settings");
	let patreonkey = document.querySelectorAll(".patreon-key");
	let apikey = document.querySelectorAll(".api-key");

	properai.forEach((el) => (el.style.display = "none"));
	adjectiveai.forEach((el) => (el.style.display = "none"));
	proper.forEach((el) => (el.style.display = "none"));
	adjective.forEach((el) => (el.style.display = "none"));

	// Show settings based on selected method
	switch (selectElement.value) {
		case "rpProperAi":
			properai.forEach((el) => (el.style.display = "block"));
			break;
		case "rpAdjectiveAi":
			adjectiveai.forEach((el) => (el.style.display = "block"));
			break;
		case "rpProper":
			proper.forEach((el) => (el.style.display = "block"));
			break;
		case "rpAdjective":
			adjective.forEach((el) => (el.style.display = "block"));
			break;
		default:
			break;
	}

	rp.dev(
		`Selected naming method: ${selectElement.value}. Visible form elements updated.`
	);
};

/**
 * Handle click event on the form, save form values to local storage,
 * start jitter animation, and generate names.
 *
 * @param {Event} e - Event object
 */
const rpHandleClickEvent = async (e) => {
	e.preventDefault();

	// Save form values to localStorage
	rpSaveFormValuesToLocalStorage();

	if (!rpFormContent.classList.contains("hidden")) {
		rpSettingsButton.click();
	}

	if (rpHeaderD20Image.style.display === "none") {
		rpHeaderD20Image.style.display = "block";
	}

	rpStartJitter();

	// Clear the current name list
	rpDisplayGeneratedNames("");

	const input = rpGetRpGenerateRandomNameInput();
	// Destructure the input object
	const {
		rpActorType,
		rpCreature,
		rpCreatureType,
		rpCreatureSubtype,
		rpOptions,
		rpNumNames,
		rpTemperature,
	} = input;

	// Call the rpGenerateRandomName function with the individual variables
	const names = await rpGenerateRandomName(
		rpActorType,
		rpCreature,
		rpCreatureType,
		rpCreatureSubtype,
		rpOptions,
		rpNumNames,
		rpTemperature
	);

	// Display the generated names
	rpDisplayGeneratedNames(names);
};

/**
 * Adjusts the width of the input field dynamically based on its content.
 *
 * This function creates a temporary hidden span with the same font as the input field,
 * then sets the input field's width based on the span's width, and finally removes the temporary span.
 *
 * @param {HTMLInputElement} input - The input field to be adjusted.
 */
const rpAdjustInputWidth = (input) => {
	// Create a temporary span with the input field's text value and same styles
	let temp = document.createElement("span");
	temp.style.font = window
		.getComputedStyle(input, null)
		.getPropertyValue("font");
	temp.style.visibility = "hidden";
	temp.style.whiteSpace = "pre";
	temp.innerText = input.value;
	document.body.appendChild(temp);

	// Adjust input field width based on the temporary span width
	input.style.width = temp.getBoundingClientRect().width + 45 + "px"; // 25px to account for the arrow in the datalist

	// Clean up: remove the temporary span
	document.body.removeChild(temp);
};

/**
 * Event listener that adds collapsible functionality to HTML elements
 * with the ".collapsible" class. The content to be collapsed/expanded
 * must be the next sibling element in the DOM.
 */
document.querySelectorAll(".collapsible").forEach((button) => {
	const content = button.nextElementSibling;
	content.style.display = "block";

	button.addEventListener("click", function () {
		this.classList.toggle("active");
		if (content.style.display === "block") {
			content.style.display = "none";
		} else {
			content.style.display = "block";
		}
	});
});

// Event listener for the generateNamesButton
rpGenerateNamesButton.addEventListener("click", rpHandleClickEvent);

// Event listener to toggle the navigation dropdown active state
rpHamburger.addEventListener("click", () => {
	rpNavDropdown.classList.toggle("active");
});

/**
 * Adding focus event listeners to select elements.
 * On focus, current value is saved and the input field is cleared.
 */
document
	.getElementById("creature-select")
	.addEventListener("focus", function () {
		// Save the current value
		rpCreatureValue = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("genre-select-properai")
	.addEventListener("focus", function () {
		// Save the current value
		rpGenreValueProperAi = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("genre-select-adjectiveai")
	.addEventListener("focus", function () {
		// Save the current value
		rpGenreValueAdjectiveAi = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("language-select-properai")
	.addEventListener("focus", function () {
		// Save the current value
		rpLanguageValueProperAi = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("language-select-adjectiveai")
	.addEventListener("focus", function () {
		// Save the current value
		rpLanguageValueAdjectiveAi = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("language-select-description")
	.addEventListener("focus", function () {
		// Save the current value
		rpLanguageValueDescription = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-properai")
	.addEventListener("focus", function () {
		// Save the current value
		rpNameFormatValueProperAi = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-adjectiveai")
	.addEventListener("focus", function () {
		// Save the current value
		rpNameFormatValueAdjectiveAi = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-proper")
	.addEventListener("focus", function () {
		// Save the current value
		rpNameFormatValueProper = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-adjective")
	.addEventListener("focus", function () {
		// Save the current value
		rpNameFormatValueAdjective = this.value;
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("creature-select")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("genre-select-properai")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("genre-select-adjectiveai")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("language-select-properai")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("language-select-adjectiveai")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("language-select-description")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-properai")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-adjectiveai")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-proper")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

document
	.getElementById("name-format-select-adjectiveai")
	.addEventListener("click", function () {
		// Clear the input value
		this.value = "";
		// Show the dropdown menu
		const event = new Event("input", { bubbles: true });
		this.dispatchEvent(event);
	});

/**
 * Adding blur event listeners to select elements.
 * On blur, if the current value is empty, restore the previous value.
 */
document
	.getElementById("creature-select")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpCreatureValue;
		}
	});

document
	.getElementById("genre-select-properai")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpGenreValueProperAi;
		}
	});

document
	.getElementById("genre-select-adjectiveai")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpGenreValueAdjectiveAi;
		}
	});

document
	.getElementById("language-select-properai")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpLanguageValueProperAi;
		}
	});

document
	.getElementById("language-select-adjectiveai")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpLanguageValueAdjectiveAi;
		}
	});

document
	.getElementById("language-select-description")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpLanguageValueDescription;
		}
	});

document
	.getElementById("name-format-select-properai")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpNameFormatValueProperAi;
		}
	});

document
	.getElementById("name-format-select-adjectiveai")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpNameFormatValueAdjectiveAi;
		}
	});

document
	.getElementById("name-format-select-proper")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpNameFormatValueProper;
		}
	});

document
	.getElementById("name-format-select-adjective")
	.addEventListener("blur", function () {
		// Restore the previous value if the input value has not changed
		if (this.value === "") {
			this.value = rpNameFormatValueAdjective;
		}
	});

/**
 * On DOM content loaded, the function sets up the initial state of the app
 * - Checks if certain values exist in localStorage, and if not, initializes them
 * - Loads form values from localStorage
 * - Adds event listeners for change in checkboxes and other inputs
 * - Checks if Patreon key exists and triggers blur event if it does
 * - Adds click event listener to the header image
 * - Updates RP, slider values, elements visibility
 * - Populates select elements with options
 * - Loads form values from localStorage again
 */
document.addEventListener("DOMContentLoaded", () => {
	rpLoadFormValuesFromLocalStorage();
	rpShowImage(true);

	// Adding event listeners to format inputs
	let formatInputs = [
		{
			input: document.querySelector("#name-format-select-properai"),
			requirements: ["{firstName}", "{nickname}", "{surname}", "{title}"],
			message:
				"At least one of {firstName}, {nickname}, {surname}, {title}",
		},
		{
			input: document.querySelector("#name-format-select-adjectiveai"),
			requirements: ["{adjective}", "{name}"],
			message: "Both {adjective} and {name}",
		},
		{
			input: document.querySelector("#name-format-select-proper"),
			requirements: ["{firstName}", "{surname}"],
			message: "At least one of {firstName}, {surname}",
		},
		{
			input: document.querySelector("#name-format-select-adjective"),
			requirements: ["{adjective}", "{name}"],
			message: "Both {adjective} and {name}",
		},
	];

	formatInputs.forEach((formatInput) => {
		let tooltip = document.createElement("div");
		tooltip.className = "tooltip";
		formatInput.input.parentNode.insertBefore(
			tooltip,
			formatInput.input.nextSibling
		);

		formatInput.input.addEventListener("blur", () => {
			let value = formatInput.input.value;
			let isValid = formatInput.requirements.some((requirement) =>
				value.includes(requirement)
			);

			if (!isValid) {
				tooltip.textContent =
					"Invalid format. " +
					formatInput.message +
					" must be included. You may include additional variables, punctuation, and spaces as desired.";
				tooltip.style.display = "block";
				rp.dev(tooltip.textContent);
			} else {
				tooltip.style.display = "none";
			}
		});
	});

	document
		.getElementById("naming-method")
		.addEventListener("change", (event) => {
			rpHandleMethodChange();
		});

	rpSettingsButton.addEventListener("click", function () {
		rpFormContent.classList.toggle("hidden");
	});

	if (rpPatreonKeyInput.value.trim() !== "") {
		rpPatreonKeyInput.dispatchEvent(new Event("blur"));
	}

	rpHeaderD20Image.addEventListener("click", function () {
		rpGenerateNamesButton.click();
	});

	const inputs = document.querySelectorAll('input[type="text"]');
	inputs.forEach((input) => {
		rpAdjustInputWidth(input);

		input.oninput = function () {
			rpAdjustInputWidth(this);
		};
	});

	rpUpdateRp();
	rpUpdateSliderValue("quantity", "quantity-value");
	rpUpdateSliderValue("temperature", "temperature-value");
	rpHandleMethodChange();
	rpPopulateLanguageSelect();
	rpPopulateGenreSelect();
	rpPopulateCreatureSelect();
});
