// Import race, first names, and last names data from json files
import { rpAdjectives } from "../json/adjectives.js";
import rpFirstNamesData from "../json/firstNames.js";
import rpLastNamesData from "../json/lastNames.js";
import rpRacesData from "../json/races.js";
import {
	rp,
	rpToTitleCase,
	rpCombineNameParts,
	rpGenerateGptPrompt,
	rpCallLambdaFunction,
	rpAddCreatureNamesToSetting,
	rpParseResponse,
	rpBadWords,
	rpConvertNumber,
	rpRandBetween,
} from "./util.js";

/* GLOBAL CONSTANTS */

// Define the number of backup names to cache
const CACHE_AMT = 5;

/* GLOBAL VARIABLES */

// Initialize a variable to store the last run information for adjective names
let lastAdjRun = {
	rpCreature: "",
	rpLanguage: "",
};

// Initialize an array to store backup names
let rpBackupNamesStd = [];

// Initialize an array to store backup names
let rpSaveNamesStd = {};

// Initialize a variable to store the last run information for standard names
let lastStdRun = {
	rpCreature: "",
	rpGenre: "",
	rpLanguage: "",
	rpGender: "",
};

// Initialize a variable to store the old token name
let rpOldTokenName = "";

// Initialize arrays to store backup names and previous run information
let rpBackupNamesAdj = [];

// Initialize arrays to store backup names and previous run information
let rpSaveNamesAdj = {};

// Initialize an array for a queue of calls to the Lambda function
let rpCallQueue = [];

// Initialize a boolean to track whether the queue is being processed
let rpIsProcessingQueue = false;

// Initialize a variable to store the last time the Lambda function was called
let rpLastApiCallTime = 0;

/**
 * Checks if a name is unique among existing token names.
 *
 * @param {string} rpTokenName - The name to check for uniqueness.
 * @returns {boolean} - Returns true if the name is unique, false otherwise.
 */
const rpIsNameUnique = (rpTokenName) => {
	// Warn if a non-string value is passed
	if (typeof rpTokenName !== "string") {
		rp.warn(
			`Non-string value passed to rpIsNameUnique: ${typeof rpTokenName}`
		);

		return false;
	}

	// Get all existing token names
	const rpExistingTokenNames = canvas.tokens.placeables.map((t) => t.name);

	// Check if rpTokenName is similar to any existing name
	for (const name of rpExistingTokenNames) {
		const similarity = name.localeCompare(rpTokenName, undefined, {
			sensitivity: "variant",
		});
		// If the name is already in use, log the information and return false
		if (similarity === 0) {
			rp.warn(
				`Name already in use: ${rpTokenName}. Looking for a different name.`
			);
			return false;
		}
	}

	// If the name is unique, return true
	return true;
};

/**
 * Asynchronously generates a specific number of random adjective names in the specified language and creature type.
 *
 * @async
 * @function rpGenerateAdjectiveNames
 * @param {number} rpNumNames - The number of names to generate.
 * @param {string} rpLanguage - The language in which the names should be generated.
 * @param {number} rpTemperature - A float that determines the randomness of the generation. Higher values result in more randomness.
 * @param {string} rpCreature - The creature type to be used in name generation.
 *
 * @returns {Promise<string>} A promise that resolves to a string containing the randomly generated names.
 *
 * @throws {Error} Throws an error if the adjective response object from the AI model is empty or not an array.
 *
 * The function uses an AI model (gpt-3.5-turbo) to generate the random names. It includes a retry mechanism
 * that attempts the generation process up to three times in case of failure. If all attempts fail, the function
 * falls back to an offline method to generate the names.
 */
const rpGenerateAdjectiveNames = async (
	rpNumNames, // Number of names to generate
	rpGenre, // Genre of the names
	rpLanguage, // Language of the names
	rpNameFormat, // Format of the names
	rpTemperature, // Determines randomness of generation
	rpCreature, // Creature type to be used in name generation
	rpOptions // Options for the generation process
) => {
	// Define model for generating adjectives
	const adjModel = "gpt-3.5-turbo";

	let rpAdjectiveLetterCountString = "";

	const rpNumNamesWithCache =
		rpNumNames + CACHE_AMT > 10 ? 10 : rpNumNames + CACHE_AMT;

	for (let i = 0; i < rpNumNamesWithCache; i++) {
		rpAdjectiveLetterCountString +=
			rpRandBetween(2, 8) + rpRandBetween(2, 8);

		if (i !== rpNumNamesWithCache - 1) {
			rpAdjectiveLetterCountString += ", ";
		}
	}

	rp.dev(`Adjective letter count string: ${rpAdjectiveLetterCountString}`);

	// Define system content that sets the prompt for the AI model
	const adjSystemContent =
		'You know every single adjective there is, and can provide them at will when requested. Your responses come as perfect arrays of JSON objects, and nothing else, using the following pattern:\n\n[{"adjective":"word_with_first_letter_count"},]';

	rp.dev(`Adjective system content:\n${adjSystemContent}`);

	// Generate user content based on provided parameters
	let adjUserContent = `Generate ${rpNumNamesWithCache} completely random, occasionally uncommon adjectives${
		rpLanguage === "Default" || rpLanguage === "English"
			? ""
			: " in " + rpLanguage
	}. Choose adjectives with the following letter counts: [${rpAdjectiveLetterCountString}]. ${rpBadWords()}`;

	// Perform replacements on adjUserContent to set the appropriate request
	adjUserContent = adjUserContent.replace(
		/Random/g,
		"a completely random language, either real or made up"
	);
	adjUserContent = adjUserContent.replace(
		/in Emoji/g,
		"represented by a string of emoji"
	);

	rp.dev(`Adjective user content:\n${adjUserContent}`);

	// Initialize assistant content
	let adjAssistantContent = "Adjectives JSON Object Array:\n\n";

	// Set parameters for AI model
	const adjTemperature = rpTemperature || 1.2;
	const adjN = 1;
	const adjMaxTokens = 1000;
	const adjStop = "\n\n\n";
	const adjPresencePenalty = 0;
	const adjFrequencyPenalty = 0;

	// Build custom values object for the prompt generation
	const adjCustomValues = {
		model: adjModel,
		messages: [
			{ role: "system", content: adjSystemContent },
			{ role: "user", content: adjUserContent },
			{ role: "assistant", content: adjAssistantContent },
		],
		temperature: adjTemperature,
		n: adjN,
		max_tokens: adjMaxTokens,
		stop: adjStop,
		presence_penalty: adjPresencePenalty,
		frequency_penalty: adjFrequencyPenalty,
	};

	// Generate payload for the API request
	const adjPayload = rpGenerateGptPrompt(adjCustomValues);

	// Initialize the response object
	let adjResponseArray = [{ adjective: "Random Adjectives" }];

	// Initialize flag to indicate success of the operation
	let success = false;
	// Initialize a counter for retry attempts
	let attempts = 0;

	// Retry up to 3 times if operation fails
	while (!success && attempts < 3) {
		try {
			// Initialize used names array and subset string
			let usedNames = [];
			let rpAdjectiveNamesSubset = "";

			// Check if the last run parameters match the current ones
			if (
				lastAdjRun.rpCreature === rpCreature &&
				lastAdjRun.rpLanguage === rpLanguage
			) {
				// Save each value of rpAdjectiveNamesArray to rpSaveNamesAdj along with rpCreature and rpLanguage
				rpSaveNamesAdj = {
					rpCreature: rpCreature,
					rpLanguage: rpLanguage,
					rpOptions: JSON.stringify(rpOptions),
					rpNamesArray: rpBackupNamesAdj,
				};

				// If we have enough names in the backup, we reuse them
				if (rpBackupNamesAdj.length >= rpNumNames) {
					// Extract the required number of names and remove them from the backup
					usedNames = rpBackupNamesAdj.splice(0, rpNumNames);
					rpBackupNamesAdj = rpBackupNamesAdj.filter(
						(name) => !usedNames.includes(name)
					);

					// Log the count of remaining backup names
					rp.log(
						"Excess names cached for later use: " +
							rpBackupNamesAdj.length
					);

					// Combine the selected names into a single string
					rpAdjectiveNamesSubset = usedNames.join("\n");

					success = true;
				} else {
					// If not enough matching names, update rpNumNames to fetch remaining names
					rpNumNames -= rpBackupNamesAdj.length;

					// Remove used names from rpBackupNamesAdj
					usedNames = rpBackupNamesAdj.splice(
						0,
						rpBackupNamesAdj.length
					);
					rpBackupNamesAdj = [];
				}
			} else {
				rpBackupNamesAdj = [];
			}

			// If no success in the previous block, try fetching new names
			if (!success) {
				// Call the AI model to get a response
				const adjResponse = await rpCallLambdaFunction(adjPayload);

				adjResponseArray = rpParseResponse(adjResponse);

				// if adjResponseArray is empty or is not an array, throw a warning and go back to calling the Lambda function
				if (
					!Array.isArray(adjResponseArray) ||
					!adjResponseArray.length
				) {
					throw new Error(
						"Adjective response object is empty or not an array."
					);
				}

				// Combine the creature name with each adjective
				let rpAdjectiveNamesString = rpToTitleCase(
					adjResponseArray
						.filter((adjObj) => adjObj.adjective.length <= 20)
						.map((adjObj) =>
							rpOptions.rpAdjectiveAi.rpNameFormat
								.replace("{adjective}", adjObj.adjective)
								.replace("{name}", rpCreature)
						)
						.join("\n")
				);

				// Check if in a Foundry VTT environment
				if (typeof game !== "undefined") {
					// If so, split the names string into an array
					const rpAdjectiveNamesArray =
						rpAdjectiveNamesString.split("\n");
					const rpUniqueAdjectiveNamesArray = [];

					// Loop through the names array
					for (let i = 0; i < rpAdjectiveNamesArray.length; i++) {
						// If the name is unique, add it to the unique names array
						if (rpIsNameUnique(rpAdjectiveNamesArray[i])) {
							rpUniqueAdjectiveNamesArray.push(
								rpAdjectiveNamesArray[i]
							);
						} else {
							rp.warn(
								`${rpAdjectiveNamesArray[i]} already exists on the canvas. Retrying.`
							);
						}
					}

					// Convert the unique names array back into a string
					rpAdjectiveNamesString =
						rpUniqueAdjectiveNamesArray.join("\n");

					// Save each value of rpAdjectiveNamesArray to rpSaveNamesAdj along with rpCreature and rpLanguage
					rpSaveNamesAdj = {
						rpCreature: rpCreature,
						rpLanguage: rpLanguage,
						rpOptions: JSON.stringify(rpOptions),
						rpNamesArray: rpAdjectiveNamesArray,
					};
				}

				let rpAdjectiveNamesSubset = "";

				// If there are more names generated than needed, randomly select the required number
				if (rpAdjectiveNamesString.split("\n").length > rpNumNames) {
					const rpAdjectiveNamesArray =
						rpAdjectiveNamesString.split("\n");
					const rpRandomAdjectiveNamesArray = [];

					// Select random names from the array until we reach the required number
					for (let i = 0; i < rpNumNames; i++) {
						const rpRandomIndex = Math.floor(
							Math.random() * rpAdjectiveNamesArray.length
						);
						rpRandomAdjectiveNamesArray.push(
							rpAdjectiveNamesArray[rpRandomIndex]
						);
						rpAdjectiveNamesArray.splice(rpRandomIndex, 1);
					}

					// Convert the random names array into a string
					rpAdjectiveNamesSubset =
						rpRandomAdjectiveNamesArray.join("\n") ||
						rpAdjectiveNamesString;
				} else {
					// If we have fewer names than required, use all of them
					rpAdjectiveNamesSubset = rpAdjectiveNamesString;
				}

				// Check if the subset string is not empty
				if (rpAdjectiveNamesSubset.trim() !== "") {
					// If not empty, mark the operation as successful
					success = true;
				} else {
					// If empty, increment the attempts counter
					attempts++;
				}

				// Add any names not included in the subset to the backup
				const rpAdjectiveNamesArray =
					rpAdjectiveNamesString.split("\n");
				for (let i = 0; i < rpAdjectiveNamesArray.length; i++) {
					if (
						!rpAdjectiveNamesSubset.includes(
							rpAdjectiveNamesArray[i]
						) &&
						!rpBackupNamesAdj.includes(rpAdjectiveNamesArray[i])
					) {
						rpBackupNamesAdj.push(rpAdjectiveNamesArray[i]);
					}
				}

				// Log the count of remaining backup names
				rp.log(
					"Excess names saved for later use: ",
					rpBackupNamesAdj.length > 0
						? rpBackupNamesAdj.length
						: "None. Next run will fetch more names."
				);

				// Update the last run parameters with the current creature and language
				lastAdjRun = {
					rpCreature: rpCreature,
					rpLanguage: rpLanguage,
				};

				// Combine previously used names with the newly generated ones
				rpAdjectiveNamesSubset = usedNames
					.concat(rpAdjectiveNamesSubset.split("\n"))
					.join("\n");

				// Indicate that the operation was successful
				success = true;

				if (typeof game !== "undefined") {
					let rpCreatureNames =
						rpGenerateAdjectiveAiCreatureNameObject(rpSaveNamesAdj);
					rpAddCreatureNamesToSetting(rpCreatureNames);
				}

				// Return the combined list of names
				return rpAdjectiveNamesSubset;
			}

			if (typeof game !== "undefined") {
				let rpCreatureNames =
					rpGenerateAdjectiveAiCreatureNameObject(rpSaveNamesAdj);
				rpAddCreatureNamesToSetting(rpCreatureNames);
			}

			// If successful, return the list of generated names
			return rpAdjectiveNamesSubset;
		} catch (error) {
			// Log a warning if the API returns invalid JSON
			rp.warn(
				"Adjective Error: JSON returned from API is invalid. Retrying."
			);
			rp.obj(error);

			// Increment the attempts counter if an error is caught
			attempts++;
		}
	}

	// If the operation was unsuccessful after all attempts, generate names offline
	if (!success) {
		rp.error(
			"AI failed to produce adjectives with current settings after three tries. Alter some parameters and try again."
		);

		return rpGenerateRandomNameAdjective(
			rpCreature,
			"",
			"",
			rpOptions,
			rpNumNames
		);
	}
};

/**
 * Generates an array of creature name objects from input.rpNamesArray.
 * Each object represents an adjective creature name.
 *
 * @param {object} input - An object containing properties for rpNamesArray, rpCreature, and rpLanguage.
 * @return {object[]} - An array of creature name objects.
 */
const rpGenerateAdjectiveAiCreatureNameObject = (input) => {
	// Get today's date and truncate the time.
	let today = new Date();
	let todayTruncated = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate()
	);

	// Initialize an array to store the creature name objects.
	let rpCreatureNameObjects = [];

	// For each full name in input.rpNamesArray, create a creature name object.
	input.rpNamesArray.forEach((fullName) => {
		let rpCreatureNameObject = {
			date: todayTruncated,
			creature: input.rpCreature || "",
			genre: "",
			language: input.rpLanguage || "",
			gender: "",
			fullName: fullName || "",
			first_name: "",
			nickname: "",
			surname: "",
			title: "",
			adjective: fullName.replace(input.rpCreature, "").trim() || "",
			nameFormat:
				JSON.parse(input.rpOptions).rpAdjectiveAi.rpNameFormat || "",
			used: false,
		};

		rpCreatureNameObjects.push(rpCreatureNameObject);
	});
	rpSaveNamesAdj = {};

	rp.dev("Creature Name Objects:");
	rp.obj(rpCreatureNameObjects);

	return rpCreatureNameObjects;
};

/**
 * Asynchronously generates random names using GPT-3.5-turbo.
 *
 * @async
 * @param {number} rpNumNames - Number of names to generate.
 * @param {string} rpLanguage - Language of the names.
 * @param {string} rpGenre - Genre of the names.
 * @param {string} rpGender - Gender of the names.
 * @param {string} rpNameFormat - Format of the names.
 * @param {number} rpTemperature - Determines randomness of generation.
 * @param {string} rpCreature - Creature type to be used in name generation.
 * @returns {Promise<string>} Returns a promise which resolves to a string of generated names or throws an error if failed to generate names.
 *
 * @throws Will throw an error if failed to generate names after 3 attempts.
 */
const rpGenerateStandardNames = async (
	rpNumNames, // Number of names to generate
	rpGenre, // Genre of the names
	rpLanguage, // Language of the names
	rpGender, // Gender of the names
	rpNameFormat, // Format of the names
	rpTemperature, // Determines randomness of generation
	rpCreature, // Creature type to be used in name generation
	rpOptions // Options for the name generation
) => {
	// Define model for generating names
	const stdModel = "gpt-3.5-turbo";

	// Define system content that sets the prompt for the AI model
	const stdSystemContent = `You are a GM for TTRPGs who generates random, engaging names for characters, NPCs, and monsters, based on several different prompt cues provided by the user in a JSON object. If included, first and last names are appropriate for the rpCreature type and nicknames and suffix titles are randomly generated and imply some interesting trait, behavior, ability, or habit of the individual. Your responses come as an array of JSON objects with the following keys and perfect syntax: [{${rpNameFormat
		.replace(", ", ",")
		.replace(" ", ",")
		.replace("{firstName}", '"first_name":"<first name>"')
		.replace("{surname}", '"surname":"<last name>"')
		.replace("'{nickname}'", '"nickname":"<nickname>"')
		.replace("{title}", '"title":"<title>"')}},]`;

	rp.dev("Standard System Content:\n", stdSystemContent);

	// Generate user content based on provided parameters
	let stdUserContent = `Generate ${
		rpNumNames + CACHE_AMT > 10 ? 10 : rpNumNames + CACHE_AMT
	} completely random names following these cues:`;
	stdUserContent += `{"language":"${
		rpLanguage === "Random" ? "Any language, real or made-up" : rpLanguage
	}","name_style_or_flavor":"${rpGenre}","name_gender":"${rpGender}","creature_type":"${rpCreature}","name_components":"${rpNameFormat
		.replace("firstName", "first_name")
		.replace("'nickname'", "nickname")}"}`;

	rp.dev("Standard User Content:\n", stdUserContent);

	// Initialize assistant content
	let stdAssistantContent = "Names JSON Object Array:\n\n";

	// Set parameters for AI model
	const stdTemperature = rpTemperature || 1.2;
	const stdN = 1;
	const stdMaxTokens = 1000;
	const stdStop = "\n\n\n";
	const stdPresencePenalty = 0.2;
	const stdFrequencyPenalty = 0.2;

	// Build custom values object for the prompt generation
	const stdCustomValues = {
		model: stdModel,
		messages: [
			{ role: "system", content: stdSystemContent },
			{ role: "user", content: stdUserContent },
			{ role: "assistant", content: stdAssistantContent },
		],
		temperature: stdTemperature,
		n: stdN,
		max_tokens: stdMaxTokens,
		stop: stdStop,
		presence_penalty: stdPresencePenalty,
		frequency_penalty: stdFrequencyPenalty,
	};

	// Generate payload for the API request
	const stdPayload = rpGenerateGptPrompt(stdCustomValues);

	// Initialize the response object
	let stdResponseArray = [];

	// Initialize flag to indicate success of the operation
	let success = false;

	// Initialize a counter for retry attempts
	let attempts = 0;

	// Retry up to 3 times if operation fails
	while (!success && attempts < 3) {
		try {
			// Initialize used names array and subset string
			let usedNames = [];
			let rpStandardNamesSubset = "";
			let stdResponseSubset = [];

			// Check if the last run parameters match the current ones
			if (
				lastStdRun.rpCreature === rpCreature &&
				lastStdRun.rpGenre === rpGenre &&
				lastStdRun.rpLanguage === rpLanguage &&
				lastStdRun.rpGender === rpGender &&
				lastStdRun.rpNameFormat === rpNameFormat
			) {
				// Save stdResponseArray to rpSaveNamesStd along with rpCreature, rpLanguage, rpGenre, rpGender, and rpNameFormat
				rpSaveNamesStd = {
					rpCreature: rpCreature,
					rpGenre: rpGenre,
					rpLanguage: rpLanguage,
					rpGender: rpGender,
					rpNameFormat: rpNameFormat,
					rpOptions: JSON.stringify(rpOptions),
					rpNames: rpBackupNamesStd,
				};

				// If we have enough names in the backup, we reuse them
				if (rpBackupNamesStd.length >= rpNumNames) {
					// Extract the required number of names and remove them from the backup
					usedNames = rpBackupNamesStd.splice(0, rpNumNames);
					rpBackupNamesStd = rpBackupNamesStd.filter((name) => {
						return !usedNames.some((usedName) => {
							// Compare the values of properties instead of using JSON.stringify
							return Object.keys(usedName).every(
								(key) => usedName[key] === name[key]
							);
						});
					});
					// Log the count of remaining backup names
					rp.log(
						"Excess names cached for later use: " +
							rpBackupNamesStd.length
					);
					// Combine the selected names into a single string
					rpStandardNamesSubset = rpCombineNameParts(usedNames);
					success = true;
				} else {
					// If not enough matching names, update rpNumNames to fetch remaining names
					rpNumNames -= rpBackupNamesStd.length;
					// Remove used names from rpBackupNamesStd
					usedNames = rpBackupNamesStd.splice(
						0,
						rpBackupNamesStd.length
					);
					rpBackupNamesStd = [];
				}
			} else {
				rpBackupNamesStd = [];
			}
			// If no success in the previous block, try fetching new names
			if (!success) {
				// Call the AI model to get a response
				const stdResponse = await rpCallLambdaFunction(stdPayload);

				stdResponseArray = rpParseResponse(stdResponse);
				stdResponseArray = stdResponseArray.filter((obj) => {
					// Check each key in the object
					for (let key in obj) {
						// If the string value is too short or too long, omit the object
						if (
							typeof obj[key] === "string" &&
							(obj[key].length < 3 ||
								obj[key].length > 20 ||
								obj[key].value === "null")
						) {
							return false;
						}
					}

					// If no problematic string values were found, keep the object
					return true;
				});

				// if stdResponseArray is empty or is not an array, throw a warning and go back to calling the Lambda function
				if (
					!Array.isArray(stdResponseArray) ||
					!stdResponseArray.length
				) {
					throw new Error(
						"Standard response object is empty or not an array."
					);
				}
				// Combine the creature name with each adjective
				let rpStandardNamesString =
					rpCombineNameParts(stdResponseArray);
				// Check if in a Foundry VTT environment
				if (typeof game !== "undefined") {
					// Save stdResponseArray to rpSaveNamesStd along with rpCreature, rpLanguage, rpGenre, rpGender, and rpNameFormat
					rpSaveNamesStd = {
						rpCreature: rpCreature,
						rpGenre: rpGenre,
						rpLanguage: rpLanguage,
						rpGender: rpGender,
						rpNameFormat: rpNameFormat,
						rpOptions: JSON.stringify(rpOptions),
						rpNames: stdResponseArray,
					};

					// If so, split the names string into an array
					const rpStandardNamesArray =
						rpStandardNamesString.split("\n");
					const rpUniqueStandardNamesArray = [];
					const rpUniqueStdResponseArray = [];
					// Loop through the names array
					for (let i = 0; i < rpStandardNamesArray.length; i++) {
						// If the name is unique, add it to the unique names array
						if (rpIsNameUnique(rpStandardNamesArray[i])) {
							rpUniqueStandardNamesArray.push(
								rpStandardNamesArray[i]
							);
							rpUniqueStdResponseArray.push(stdResponseArray[i]);
						} else {
							rp.log(
								`${rpTokenName} already exists on the canvas. Retrying.`
							);
						}
					}
					// Convert the unique names array back into a string
					rpStandardNamesString =
						rpUniqueStandardNamesArray.join("\n");
					// Replace stdResponseArray with rpUniqueStdResponseArray
					stdResponseArray = rpUniqueStdResponseArray;
				}
				// If there are more names generated than needed, randomly select the required number
				if (stdResponseArray.length > rpNumNames) {
					const rpRandomStdResponseArray = [];
					// Select random names from the array until we reach the required number
					for (let i = 0; i < rpNumNames; i++) {
						const rpRandomIndex = Math.floor(
							Math.random() * stdResponseArray.length
						);
						rpRandomStdResponseArray.push(
							stdResponseArray[rpRandomIndex]
						);
						stdResponseArray.splice(rpRandomIndex, 1);
					}
					// Convert the random names array into a string
					stdResponseSubset = rpRandomStdResponseArray;
				} else {
					// If we have fewer names than required, use all of them
					stdResponseSubset = stdResponseArray;
				}
				// Check if the subset string is not empty
				if (stdResponseSubset !== []) {
					// If not empty, mark the operation as successful
					success = true;
				} else {
					// If empty, increment the attempts counter
					attempts++;
				}
				// Add any names not included in the subset to the backup
				const rpBackupNamesStdSet = new Set(
					rpBackupNamesStd.map(JSON.stringify)
				);
				const stdResponseSubsetSet = new Set(
					stdResponseSubset.map(JSON.stringify)
				);
				for (let i = 0; i < stdResponseArray.length; i++) {
					const objectAsString = JSON.stringify(stdResponseArray[i]);
					if (
						!stdResponseSubsetSet.has(objectAsString) &&
						!rpBackupNamesStdSet.has(objectAsString)
					) {
						rpBackupNamesStd.push(stdResponseArray[i]);
					}
				}
				// Log the count of remaining backup names
				rp.log(
					"Excess names saved for later use: ",
					rpBackupNamesStd.length > 0
						? rpBackupNamesStd.length
						: "None. Next run will fetch more names."
				);
				// Update the last run parameters with the current creature and language
				lastStdRun = {
					rpCreature: rpCreature,
					rpGenre: rpGenre,
					rpLanguage: rpLanguage,
					rpGender: rpGender,
					rpNameFormat: rpNameFormat,
				};
				// Combine previously used names with the newly generated ones
				stdResponseSubset = usedNames.concat(stdResponseSubset);
				// Apply the name formatting to stdResponseSubset and assign the string to rpStandardNamesSubset
				rpStandardNamesSubset = rpCombineNameParts(stdResponseSubset);
				// Indicate that the operation was successful
				success = true;

				if (typeof game !== "undefined") {
					let rpCreatureNames =
						rpGenerateProperAiCreatureNameObject(rpSaveNamesStd);
					rpAddCreatureNamesToSetting(rpCreatureNames);
				}

				// Return the combined list of names
				return rpStandardNamesSubset;
			}

			if (typeof game !== "undefined") {
				let rpCreatureNames =
					rpGenerateProperAiCreatureNameObject(rpSaveNamesStd);
				rpAddCreatureNamesToSetting(rpCreatureNames);
			}

			// If successful, return the list of generated names
			return rpStandardNamesSubset;
		} catch (error) {
			// Log a warning if the API returns invalid JSON
			rp.warn(
				"Standard Error: JSON returned from API is invalid. Retrying."
			);
			rp.obj(error);

			// Increment the attempts counter if an error is caught
			attempts++;
		}
	}

	// If the operation was unsuccessful after all attempts, generate names offline
	if (!success) {
		rp.error(
			"AI failed to create names with the current settings after three tries. Alter some of the parameters and try again."
		);

		return rpGenerateRandomNameProper(
			rpCreature,
			"",
			"",
			{ rpNameBase: "rpCreature" },
			rpNumNames
		);
	}
};

/**
 * Generates an array of creature name objects from input.rpNames.
 * Each object represents a standard creature name.
 *
 * @param {object} input - An object containing properties for rpNames, rpNameFormat, rpCreature, rpLanguage, rpGenre, and rpGender.
 * @return {object[]} - An array of creature name objects.
 */
const rpGenerateProperAiCreatureNameObject = (input) => {
	// Get today's date and truncate the time.
	let today = new Date();
	let todayTruncated = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate()
	);

	// Initialize an array to store the creature name objects.
	let rpCreatureNameObjects = [];

	// For each name in input.rpNames, create a creature name object.
	input.rpNames.forEach((nameParts) => {
		let fullName = input.rpNameFormat
			.replace("{firstName}", nameParts.first_name)
			.replace("'{nickname}'", nameParts.nickname)
			.replace("{nickname}", nameParts.nickname)
			.replace("{surname}", nameParts.surname)
			.replace("{title}", nameParts.title);

		let rpCreatureNameObject = {
			date: todayTruncated,
			creature: input.rpCreature || "",
			genre: input.rpGenre || "",
			language: input.rpLanguage || "",
			gender: input.rpGender || "",
			fullName: fullName || "",
			first_name: nameParts.first_name || "",
			nickname: nameParts.nickname || "",
			surname: nameParts.surname || "",
			title: nameParts.title || "",
			adjective: "",
			nameFormat:
				JSON.parse(input.rpOptions).rpProperAi.rpNameFormat || "",
			used: false,
		};

		rpCreatureNameObjects.push(rpCreatureNameObject);
	});
	rpSaveNamesStd = {};

	rp.dev("Creature Name Objects:");
	rp.obj(rpCreatureNameObjects);

	return rpCreatureNameObjects;
};

/**
 * Asynchronously processes the requests queue for generating random names.
 * The function takes no parameters. It uses global variables to manage the queue, processing each request in the queue one at a time.
 *
 * @async
 * @function rpProcessQueue
 * @returns {Promise<void>} A promise that resolves when the queue processing is complete. If the queue is empty, it simply logs a message and resolves immediately.
 *
 * @throws {Error} Any errors thrown by the `rpGenerateRandomNameOnline` function will be passed up and can be caught by the caller of `rpProcessQueue`.
 *
 * After processing each request, the function waits 400 milliseconds before moving on to the next one.
 * This rate limiting is designed to prevent overloading the underlying AI model with too many concurrent requests.
 */
const rpProcessQueue = async () => {
	if (rpCallQueue.length === 0) {
		rpIsProcessingQueue = false;
		rp.log("AI request queue complete!");

		return;
	}

	rpIsProcessingQueue = true;
	if (rpIsProcessingQueue) {
		rp.log(`Processing queue. Items remaining: ${rpCallQueue.length}`);
	}
	const call = rpCallQueue.shift();
	const {
		rpActorType,
		rpCreature,
		rpCreatureType,
		rpCreatureSubtype,
		rpOptions,
		rpNumNames,
		rpTemperature,
		resolve,
		reject,
	} = call;

	try {
		if (rpOptions.rpNamingMethod === "rpProperAi") {
			const rpResult = await rpGenerateRandomNameProperAi(
				rpActorType,
				rpCreature,
				rpCreatureType,
				rpCreatureSubtype,
				rpOptions,
				rpNumNames,
				rpTemperature
			);
			resolve(rpResult);
		} else if (rpOptions.rpNamingMethod === "rpAdjectiveAi") {
			const rpResult = await rpGenerateRandomNameAdjectiveAi(
				rpActorType,
				rpCreature,
				rpCreatureType,
				rpCreatureSubtype,
				rpOptions,
				rpNumNames,
				rpTemperature
			);
			resolve(rpResult);
		}
	} catch (error) {
		rp.error("Error generating name:");
		rp.obj(error);
		reject(error);
	}

	setTimeout(rpProcessQueue, 400);
};

/**
 * Asynchronously generates a random name based on the provided parameters.
 * If online model is selected, adds the request to a queue for processing.
 * If offline model is selected, it generates the name offline.
 *
 * @async
 * @function rpGenerateRandomName
 * @param {string} rpActorType - The type of actor for whom the name is being generated.
 * @param {string} rpCreature - The base name of the actor.
 * @param {string} rpCreatureType - The type of creature for which the name is being generated.
 * @param {string} rpCreatureSubtype - The subtype of creature for which the name is being generated.
 * @param {Object} rpOptions - An object containing the options for name generation. This includes the model to be used (online/offline).
 * @param {number} [rpNumNames=1] - The number of names to be generated. Defaults to 1.
 * @param {number} [rpTemperature=1.2] - A float that determines the randomness of the generation. Higher values result in more randomness. Defaults to 1.2.
 *
 * @returns {Promise<string|undefined>} A promise that resolves to a string containing the randomly generated names. If the model is set to 'None', it returns undefined.
 *
 * This function uses either an online or an offline AI model for name generation, based on the provided options.
 */
const rpGenerateRandomName = async (
	rpActorType = "npc",
	rpCreature,
	rpCreatureType = rpCreature,
	rpCreatureSubtype = rpCreature,
	rpOptions = {},
	rpNumNames = 1,
	rpTemperature = 1.2
) => {
	if (rpCreature === undefined) return;
	if (!rpCreatureType) rpCreatureType = rpCreature;
	if (!rpCreatureSubtype) rpCreatureSubtype = rpCreature;
	if (typeof game !== "undefined" && rpTemperature === undefined) {
		// If it's not defined, use the value from the Foundry setting call
		rpTemperature = game.settings.get("rp-names", "rpSettingsTemperature");
	}

	const rpNamingMethod = rpOptions.rpNamingMethod;

	if (rpNamingMethod === "rpNone") {
		rp.dev("No name generation method selected. Aborting name generation.");
		return;
	}

	const rpOnline =
		rpNamingMethod === "rpProperAi" || rpNamingMethod === "rpAdjectiveAi";

	if (rpOnline) {
		return new Promise((resolve, reject) => {
			rpCallQueue.push({
				rpActorType,
				rpCreature,
				rpCreatureType,
				rpCreatureSubtype,
				rpOptions,
				rpNumNames,
				rpTemperature,
				resolve,
				reject,
			});

			if (!rpIsProcessingQueue) {
				rpProcessQueue();
			}
		});
	}

	switch (rpNamingMethod) {
		case "rpProper":
			return await rpGenerateRandomNameProper(
				rpCreature,
				rpCreatureType,
				rpCreatureSubtype,
				rpOptions,
				rpNumNames
			);
			break;
		case "rpAdjective":
			return await rpGenerateRandomNameAdjective(
				rpCreature,
				rpCreatureType,
				rpCreatureSubtype,
				rpOptions,
				rpNumNames
			);
			break;
		case "rpNumbered":
			return await rpGenerateRandomNameNumbered(
				rpCreature,
				rpCreatureType,
				rpCreatureSubtype,
				rpOptions,
				rpNumNames
			);
			break;
	}
};

/**
 * Generates a random name using the Proper AI naming generation method.
 *
 * This function generates a random name by making an API call to the Proper AI service.
 * It applies a delay between calls to avoid overloading the API. The function is specific to NPC and monster actors.
 *
 * @param {string} rpActorType - The type of the actor.
 * @param {string} rpCreature - The creature name.
 * @param {string} rpCreatureType - The creature type.
 * @param {string} rpCreatureSubtype - The creature subtype.
 * @param {object} rpOptions - The options object.
 * @param {number} rpNumNames - The number of names to generate.
 * @param {number} rpTemperature - The "temperature" parameter for the API call.
 * @returns {Promise<string>} A Promise that resolves to a string of generated names.
 * @async
 */
const rpGenerateRandomNameProperAi = async (
	rpActorType,
	rpCreature,
	rpCreatureType,
	rpCreatureSubtype,
	rpOptions,
	rpNumNames,
	rpTemperature
) => {
	rp.log(
		"Using Proper AI name generation. Sometimes you will see several errors or warnings in the console before the AI returns something usable."
	);
	let rpPrompt;

	if (
		(rpActorType === "npc" || rpActorType === "monster") &&
		rpCreatureType !== ""
	) {
		const {
			rpGenre,
			rpLanguage,
			rpGender,
			rpNameBase,
			rpCustomNameBase,
			rpNameFormat,
		} = rpOptions.rpProperAi;
		const rpNameBaseValue =
			rpNameBase === "rpCustom"
				? rpCustomNameBase
				: rpNameBase === "rpCreature"
				? rpCreature
				: rpNameBase === "rpCreatureSubtype"
				? rpCreatureSubtype
				: rpNameBase === "rpCreatureType"
				? rpCreatureType
				: "creature";
		const rpCurrentTime = new Date().getTime();
		const rpTimeSinceLastCall = rpCurrentTime - rpLastApiCallTime;
		const rpDelay = 2000;
		return new Promise(async (resolve, reject) => {
			if (rpTimeSinceLastCall < rpDelay) {
				setTimeout(async () => {
					try {
						const rpStandardNamesString =
							await rpGenerateStandardNames(
								rpNumNames,
								rpGenre,
								rpLanguage,
								rpGender,
								rpNameFormat,
								rpTemperature,
								rpNameBaseValue,
								rpOptions
							);
						resolve(rpStandardNamesString);
					} catch (error) {
						rp.error("Error making API request:");
						rp.obj(error);
					}
				}, rpDelay - rpTimeSinceLastCall);
			} else {
				try {
					const rpStandardNamesString = await rpGenerateStandardNames(
						rpNumNames,
						rpGenre,
						rpLanguage,
						rpGender,
						rpNameFormat,
						rpTemperature,
						rpNameBaseValue,
						rpOptions
					);
					resolve(rpStandardNamesString);
				} catch (error) {
					rp.error("Error making API request:");
					rp.obj(error);
				}
			}
		});
	} else {
		rp.dev(
			`Not an NPC or monster actor. Aborting name generation.\nrpActorType: ${rpActorType}\nrpCreatureType: ${rpCreatureType}`
		);
		return null;
	}
};

/**
 * Generates a random name using the Adjective AI naming generation method.
 *
 * This function generates a random name by making an API call to the Adjective AI service.
 * It applies a delay between calls to avoid overloading the API. The function is specific to NPC and monster actors.
 *
 * @param {string} rpActorType - The type of the actor.
 * @param {string} rpCreature - The creature name.
 * @param {string} rpCreatureType - The creature type.
 * @param {string} rpCreatureSubtype - The creature subtype.
 * @param {object} rpOptions - The options object.
 * @param {number} rpNumNames - The number of names to generate.
 * @param {number} rpTemperature - The "temperature" parameter for the API call.
 * @returns {Promise<string>} A Promise that resolves to a string of generated names.
 * @async
 */
const rpGenerateRandomNameAdjectiveAi = async (
	rpActorType,
	rpCreature,
	rpCreatureType,
	rpCreatureSubtype,
	rpOptions,
	rpNumNames,
	rpTemperature
) => {
	rp.log(
		"Using Adjective AI name generation. Keep in mind that the AI sometimes mistakenly provides words that are not adjectives."
	);
	let rpPrompt;

	if (
		(rpActorType === "npc" || rpActorType === "monster") &&
		rpCreatureType !== ""
	) {
		const {
			rpGenre,
			rpLanguage,
			rpNameBase,
			rpCustomNameBase,
			rpNameFormat,
		} = rpOptions.rpAdjectiveAi;
		const rpNameBaseValue =
			rpNameBase === "rpCustom"
				? rpCustomNameBase
				: rpNameBase === "rpCreature"
				? rpCreature
				: rpNameBase === "rpCreatureSubtype"
				? rpCreatureSubtype
				: rpNameBase === "rpCreatureType"
				? rpCreatureType
				: "creature";
		const rpCurrentTime = new Date().getTime();
		const rpTimeSinceLastCall = rpCurrentTime - rpLastApiCallTime;
		const rpDelay = 2000;
		return new Promise(async (resolve, reject) => {
			if (rpTimeSinceLastCall < rpDelay) {
				setTimeout(async () => {
					try {
						const rpAdjectiveNamesString =
							await rpGenerateAdjectiveNames(
								rpNumNames,
								rpGenre,
								rpLanguage,
								rpNameFormat,
								rpTemperature,
								rpNameBaseValue,
								rpOptions
							);
						resolve(rpAdjectiveNamesString);
					} catch (error) {
						rp.error("Error making API request:");
						rp.obj(error);
					}
				}, rpDelay - rpTimeSinceLastCall);
			} else {
				try {
					const rpAdjectiveNamesString =
						await rpGenerateAdjectiveNames(
							rpNumNames,
							rpGenre,
							rpLanguage,
							rpNameFormat,
							rpTemperature,
							rpNameBaseValue,
							rpOptions
						);
					resolve(rpAdjectiveNamesString);
				} catch (error) {
					rp.error("Error making API request:");
					rp.obj(error);
				}
			}
		});
	} else {
		rp.dev(
			`Not an NPC or monster actor. Aborting name generation.\nrpActorType: ${rpActorType}\nrpCreatureType: ${rpCreatureType}`
		);
		return null;
	}
};

/**
 * Helper function to get a unique name from an array.
 *
 * @param {Array} candidates - Array of candidate names.
 * @param {Set} uniqueNames - Set of unique names.
 * @returns {string} A unique name.
 */
const rpGetRandomUniqueName = (candidates, uniqueNames) => {
	let randomName;
	do {
		randomName = candidates[Math.floor(Math.random() * candidates.length)];
	} while (uniqueNames.has(randomName));
	uniqueNames.add(randomName);
	return randomName;
};

/**
 * Generates a random name using the Proper (Simple) naming generation method.
 *
 * This function generates a random name by applying a combination of factors like the creature, creature type, and subtype.
 * It applies a validation to ensure that the number of requested names does not exceed the number of available unique names.
 * The function builds the name based on the name format and returns the generated names as a string.
 *
 * @param {string} rpCreature - The creature name.
 * @param {string} rpCreatureType - The creature type.
 * @param {string} rpCreatureSubtype - The creature subtype.
 * @param {object} rpOptions - The options object.
 * @param {number} rpNumNames - The number of names to generate.
 * @returns {Promise<string>} A Promise that resolves to a string of generated names.
 * @throws {Error} Throws an error when the number of requested names exceeds the number of available unique names.
 * @async
 */
const rpGenerateRandomNameProper = async (
	rpCreature,
	rpCreatureType,
	rpCreatureSubtype,
	rpOptions,
	rpNumNames
) => {
	rp.log(
		"Using Proper (Simple) name generation. This method does not use AI."
	);

	const rpRaceData = rpRacesData.Races.find(
		(rpRace) =>
			rpRace.Race === rpOptions.rpProper.rpCustomType ||
			rpRace.Race === rpCreature ||
			rpRace.Race === rpCreatureSubtype ||
			rpRace.Race === rpCreatureType
	);

	if (!rpRaceData) {
		rp.log("Race not found. Using all available names as the pool.");
		rp.dev(
			`\nCustom Type: ${rpOptions.rpProper.rpCustomType}\nCreature: ${rpCreature}\nCreature Subtype: ${rpCreatureSubtype}\nCreature Type: ${rpCreatureType}`
		);
	}

	let rpFirstNameCandidates = [];
	let rpLastNameCandidates = [];

	if (rpRaceData) {
		const conditions = [
			rpOptions.rpProper.rpCustomType,
			rpCreature,
			rpRaceData.Type1,
			rpRaceData.Type2,
			rpCreatureSubtype,
			rpCreatureType,
		];
		for (const condition of conditions) {
			const filteredFirstNames = rpFirstNamesData.FirstNames.filter(
				(rpName) =>
					rpName.Race === condition || rpName.Type === condition
			);
			rpFirstNameCandidates =
				rpFirstNameCandidates.concat(filteredFirstNames);
			//			if (rpFirstNameCandidates.length >= 50) {
			//				break;
			//			}
		}
		for (const condition of conditions) {
			const filteredLastNames = rpLastNamesData.LastNames.filter(
				(rpName) =>
					rpName.Race === condition || rpName.Type === condition
			);
			rpLastNameCandidates =
				rpLastNameCandidates.concat(filteredLastNames);
			//			if (rpLastNameCandidates.length >= 50) {
			//				break;
			//			}
		}
		rp.dev("Using filtered names.");
		rp.dev(`First Name Candidates: ${rpFirstNameCandidates.length}`);
		rp.dev(`Surame Candidates: ${rpLastNameCandidates.length}`);
	} else {
		rpFirstNameCandidates = rpFirstNamesData.FirstNames;
		rpLastNameCandidates = rpLastNamesData.LastNames;
		rp.dev("Using unfiltered names.");
		rp.dev(`First Name Candidates: ${rpFirstNameCandidates.length}`);
		rp.dev(`Surame Candidates: ${rpLastNameCandidates.length}`);
	}

	if (rpNumNames > rpFirstNameCandidates.length) {
		throw new Error(
			"The number of requested names exceeds the number of unique names available."
		);
	}

	let rpGeneratedNames = "";
	const uniqueFirstNames = new Set();
	const uniqueLastNames = new Set();

	for (let i = 0; i < rpNumNames; i++) {
		let rpRandomFirstName = rpGetRandomUniqueName(
			rpFirstNameCandidates,
			uniqueFirstNames
		).FirstName;

		if (!rpOptions.rpProper.rpNameFormat.includes("{surname}")) {
			rpGeneratedNames += rpRandomFirstName;
		} else {
			if (rpLastNameCandidates.length === 0) {
				rp.log(
					"No surames found for this creature type, using only first name."
				);
				rpGeneratedNames += rpRandomFirstName;
			} else {
				let rpRandomLastName = rpGetRandomUniqueName(
					rpLastNameCandidates,
					uniqueLastNames
				).LastName;
				rpGeneratedNames += rpOptions.rpProper.rpNameFormat
					.replace("{firstName}", rpRandomFirstName)
					.replace("{surname}", rpRandomLastName);
			}
		}
		if (i < rpNumNames - 1) {
			rpGeneratedNames += "\n";
		}
	}

	return rpGeneratedNames;
};

/**
 * Generates a random name using the Adjective (Simple) naming generation method.
 *
 * This function generates a random name by applying a combination of factors like the creature, creature type, and subtype.
 * It applies a validation to ensure that the number of requested names does not exceed the number of available unique names.
 * The function builds the name based on the name format and returns the generated names as a string.
 *
 * @param {string} rpCreature - The creature name.
 * @param {string} rpCreatureType - The creature type.
 * @param {string} rpCreatureSubtype - The creature subtype.
 * @param {object} rpOptions - The options object.
 * @param {number} rpNumNames - The number of names to generate.
 * @returns {Promise<string>} A Promise that resolves to a string of generated names.
 * @throws {Error} Throws an error when the number of requested names exceeds the number of available unique names.
 * @async
 */
const rpGenerateRandomNameAdjective = async (
	rpCreature,
	rpCreatureType,
	rpCreatureSubtype,
	rpOptions,
	rpNumNames
) => {
	rp.log("Using Adjective (Simple) name generation.");

	let rpGeneratedNames = "";
	let rpNameBase;

	if (rpOptions.rpAdjective.rpNameBase === "rpCustom") {
		rpNameBase = rpOptions.rpAdjective.rpCustomNameBase;
	} else if (rpOptions.rpAdjective.rpNameBase === "rpCreatureSubtype") {
		rpNameBase = rpCreatureSubtype;
	} else if (rpOptions.rpAdjective.rpNameBase === "rpCreatureType") {
		rpNameBase = rpCreatureType;
	} else {
		rpNameBase = rpCreature;
	}

	for (let i = 0; i < rpNumNames; i++) {
		let rpRandomAdjective =
			rpAdjectives[Math.floor(Math.random() * rpAdjectives.length)];

		rpGeneratedNames += rpOptions.rpAdjective.rpNameFormat
			.replace("{adjective}", rpRandomAdjective)
			.replace("{name}", rpNameBase);

		if (i < rpNumNames - 1) {
			rpGeneratedNames += "\n";
		}
	}

	return rpGeneratedNames;
};

/**
 * Generates a name using the Numbered (Simple) method.
 *
 * Check name against existing token names to ensure uniqueness.
 * If not unique iterate to the next number and try again.
 *
 * @param {string} rpCreature - The creature name.
 * @param {string} rpCreatureType - The creature type.
 * @param {string} rpCreatureSubtype - The creature subtype.
 * @param {object} rpOptions - The options object.
 * @param {number} rpNumNames - The number of names to generate.
 * @returns {string} - The generated names.
 * @async
 * @function rpGenerateRandomNameNumbered
 *
 */
const rpGenerateRandomNameNumbered = async (
	rpCreature,
	rpCreatureType,
	rpCreatureSubtype,
	rpOptions,
	rpNumNames
) => {
	rp.log(
		`Using Numbered (Simple) name generation. Number format selected: ${rpOptions.rpNumbered.rpNumberFormat}`
	);

	let rpGeneratedNames = "";
	let rpNumber = 1;
	let rpNameBase;

	if (rpOptions.rpNumbered.rpNameBase === "rpCustom") {
		rpNameBase = rpOptions.rpNumbered.rpCustomNameBase;
	} else if (rpOptions.rpNumbered.rpNameBase === "rpCreatureSubtype") {
		rpNameBase = rpCreatureSubtype;
	} else if (rpOptions.rpNumbered.rpNameBase === "rpCreatureType") {
		rpNameBase = rpCreatureType;
	} else {
		rpNameBase = rpCreature;
	}

	for (let i = 0; i < rpNumNames; i++) {
		let rpNumberString = rpConvertNumber(
			rpNumber,
			rpOptions.rpNumbered.rpNumberFormat
		);
		let rpTokenName = rpOptions.rpNumbered.rpNameFormat
			.replace("{name}", rpNameBase)
			.replace("{number}", rpNumberString);

		while (!rpIsNameUnique(rpTokenName)) {
			rpNumber++;
			rpNumberString = rpConvertNumber(
				rpNumber,
				rpOptions.rpNumbered.rpNumberFormat
			);
			rpTokenName = rpOptions.rpNumbered.rpNameFormat
				.replace("{name}", rpNameBase)
				.replace("{number}", rpNumberString);
		}

		rpGeneratedNames += rpTokenName;

		if (i < rpNumNames - 1) {
			rpGeneratedNames += "\n";
		}

		// Increment the rpNumber for the next name
		rpNumber++;
	}

	return rpGeneratedNames;
};

export { rpGenerateRandomName, rpIsNameUnique };
