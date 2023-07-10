import { RPCustomSettingsDialog } from "./hooks.js";
import { rp, rpGetDefaultOptions } from "./util.js";

/**
 * Show a name customization dialog and return the selected options as a Promise.
 *
 * @param {string} rpCreature - The name of the actor.
 * @param {string} rpCreatureType - The type of creature.
 * @param {string} rpCreatureSubtype - The subtype of creature.
 * @param {object} rpInitialValues - Space to back up the values before closing and re-opening the dialog.
 * @returns {Promise<object|null>} - Promise that resolves to an options object or null.
 */
const rpShowNameCustomizationDialog = async (rpActorData) => {
	const rpTemplatePath = "modules/rp-names/templates/customization-dialog.hbs";
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

	const rpSaveTypeVariables = {
		rpCreature,
		rpCreatureType,
		rpCreatureSubtype,
	};
	await loadTemplates([rpTemplatePath]);

	const rpDefaultOptions = rpGetDefaultOptions(rpActorData);
	const html = await renderTemplate(rpTemplatePath, {
		rpLocalize: game.i18n.localize,
		rpCreature,
		rpCreatureType,
		rpCreatureSubtype,
		rpDefaultOptions,
	});

	return new Promise((resolve) => {
		const rpDialog = new RPCustomSettingsDialog({
			title: `${game.i18n.localize(
				"CONFIG.CUSTOM_DIALOG_TITLE"
			)} - ${rpCreature}`,
			content: html,
			height: "auto",
			buttons: {
				cancel: {
					label: game.i18n.localize("CONFIG.CUSTOM_DIALOG_CANCEL"),
					callback: () => {
						rp.log("Canceled name customization.");
						resolve(null);
					},
				},
				submit: {
					label: game.i18n.localize("CONFIG.CUSTOM_DIALOG_GENERATE"),
					callback: (html) => {
						const rpCustomOptions = rpGetComponentOptions(html);
						rpSaveCustomOptions(
							rpCustomOptions,
							html.find('select[name="rpSaveType"]').val(),
							rpSaveTypeVariables
						);
						resolve(rpCustomOptions);
					},
				},
			},
		});

		rpDialog.render(true);
	});
};

/**
 * Retrieves the selected customization options from the dialog form.
 *
 * @param {object} html - The HTML content of the dialog form.
 * @param {string} rpCustomNameFormat - The custom format for the name.
 * @returns {object} - The selected customization options.
 */
const rpGetComponentOptions = (html, rpCustomNameFormat, rpComponentsOrder) => {
	const rpNamingMethod = html.find('select[name="rpNamingMethod"]').val();
	const rpGenre =
		html.find(`input[name="rpGenre${rpNamingMethod}"]`).val() ?? "";
	const rpLanguage =
		html.find(`input[name="rpLanguage${rpNamingMethod}"]`).val() ?? "";
	const rpGender =
		html.find(`input[name="rpGender${rpNamingMethod}"]`).val() ?? "";
	const rpNameBase =
		html.find(`select[name="rpNameBase${rpNamingMethod}"]`).val() ?? "";
	const rpCustomNameBase =
		html.find(`input[name="rpCustomType${rpNamingMethod}"]`).val() ?? "";
	const rpNumberFormat =
		html.find(`input[name="rpNumberFormat${rpNamingMethod}"]`).val() ?? "";
	const rpNameFormat =
		html.find(`input[name="rpNameFormat${rpNamingMethod}"]`).val() ?? "";

	let rpMethodOptions = {
		rpNamingMethod: rpNamingMethod,
	};

	rpMethodOptions[rpNamingMethod] = {}; // Initialize as an empty object

	if (rpGenre) {
		rpMethodOptions[rpNamingMethod].rpGenre = rpGenre;
	}

	if (rpLanguage) {
		rpMethodOptions[rpNamingMethod].rpLanguage = rpLanguage;
	}

	if (rpGender) {
		rpMethodOptions[rpNamingMethod].rpGender = rpGender;
	}

	if (rpNameBase === "rpCustom" && !rpCustomNameBase) {
		rpMethodOptions[rpNamingMethod].rpNameBase = "rpCreature";
		rpMethodOptions[rpNamingMethod].rpCustomNameBase = rpCustomNameBase;
	} else if (rpNameBase) {
		rpMethodOptions[rpNamingMethod].rpNameBase = rpNameBase;
		rpMethodOptions[rpNamingMethod].rpCustomNameBase = rpCustomNameBase;
	}

	if (rpNumberFormat) {
		rpMethodOptions[rpNamingMethod].rpNumberFormat = rpNumberFormat;
	}

	if (rpNameFormat) {
		rpMethodOptions[rpNamingMethod].rpNameFormat = rpNameFormat;
	}

	rp.dev("Form options:");
	rp.obj(rpMethodOptions);

	return rpMethodOptions;
};

/**
 * Saves the selected customization options for the specified type.
 *
 * @param {object} rpCustomOptions - The selected customization options.
 * @param {string} rpSaveType - The type of creature to save the options for.
 * @param {object} rpSaveTypeVariables - An object mapping save types to their respective variables.
 */
const rpSaveCustomOptions = (
	rpCustomOptions,
	rpSaveType,
	rpSaveTypeVariables
) => {
	const rpActualSaveType = rpSaveTypeVariables[rpSaveType];
	if (rpSaveType !== "rpNoSave") {
		const rpNameSettings = game.settings.get("rp-names", "rpSettingsName");
		if (!rpActualSaveType) {
			rp.warn(
				`Invalid save type: ${rpSaveType}. The value is empty. No configuration will be saved.`
			);
		} else {
			rpNameSettings[rpActualSaveType] = rpCustomOptions;
			game.settings.set("rp-names", "rpSettingsName", rpNameSettings);
			rp.log(`Custom options saved for ${rpActualSaveType}`);
		}
	}
};

export { rpShowNameCustomizationDialog };
