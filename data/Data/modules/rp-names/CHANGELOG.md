# Changelog

All notable changes to the "Random Procedural Names" module will be documented in this file.

## Important Notes

-   [Web App Version](https://rpgm.tools/rp-names.html)
-   The first name created for any creature type will take longer than subsequent names, as the AI model retrieves extra names to cache. This process repeats every 4 names, as the cache is expended, or when generating a name for a different type of creature or using different settings.
-   Due to the unpredictability of artificial intelligence, responses may not come back in a usable format, so the module will automatically retry the request up to 5 times before giving up and returning a generic name.

[Coming Soon](https://gitlab.com/rpgm-tools/rp-names/-/blob/main/FUTUREPLANS.md)

## [1.13.0.1] - 2023-07-09

### Added

-

### Fixed

-   (Web App) Hotfix for a bug that prevented the web app from loading

## [1.13.0] - 2023-07-08

### Added

-   (Foundry) Added universal status indicators while generating AI content
-   (Foundry) Buttons on some chat messages to remove chat cards after use
-   (Foundry) Audodelete some chat messages after a short delay
-   (Foundry) Create journal items for homebrewed items, creatures, places, etc. from the chat commands
-   (Foundry) Allow naming selected tokens when using the chat commands (attach to token button)
-   (Foundry) Added option to never rename tokens for certain actors with proper names

### Fixed

-   (Foundry) Minor bug fixes

## [1.12.2] - 2023-07-07

### Added

-   (Foundry) Tested with the following systems (better integration is in the works, but it has the basics):
    -   D&D 4e
    -   D&D 3.5e
    -   Call of Cthulhu 7e
    -   Shadowrun 5e
    -   Twilight: 2000 4e
    -   Stars Without Number: Revised

### Fixed

-   (Foundry) Updated module.json to no longer exclude systems that are not explicitly supported

## [1.12.1] - 2023-07-05

### Added

-   (Foundry | Web App) Added several images to the Quickstart Guide

### Fixed

-   (Foundry) Fixed another chat bug that was causing players to see an error about no Patreon key when they typed anything in chat. Thank you, Stella!

## [1.12.0] - 2023-07-05

### Added

-   (Foundry) Rudimentary chat command history
-   (Foundry) Improved instructions for the chat commands

### Fixed

-   (Foundry) Critical bug that prevented other chat-related modules from working properly

## [1.11.1] - 2023-07-04

### Added

-   (Foundry) Added a [Quickstart Guide](./INSTRUCTIONS.md)

### Fixed

-   (Web App) Fixed a bug that broke the web app

## [1.11.0] - 2023-07-02

### Added

-   (Foundry) Added chat commands (These are available for supporters, as they require the use of AI):
    -   Generate a random name - experiment with anything you can think of
        -   **!n** or **!name** + **subject to be named**
            -   Example: **!n deserted pirate ship**
            -   Example: **!n chubby kobold**
            -   Example: **!n female ice giant**
    -   Generates a description for a creature|place|object - please be sure to specify the length and type of object in a single word (no spaces)
        -   **!d** or **!desc** + **length of description** (one word, or hyphenated) + **type of object** (one word, or hyphenated) + **name of the object**
            -   Example: **!d brief sword Excalibur**
            -   Example: **!d long village Phandalin**
            -   Example: **!d longish goblin Grizznash the Unworthy**
    -   Generates a random homebrewed creature|item|place|race|shop - this is so versatile, but remember, AI is not yet perfect
        -   **!h** or **!home** + **description of the desired homebrew**
            -   Example: **!h variant wolf cr5**
            -   Example: **!h logging village near Neverwinter**
            -   Example: **!h two-handed mace for lvl 10 barbarian, path of the totem**
    -   Queries ChatGPT for a response - ChatGPT built into Foundry. I know, others have done it, but hopefully not as well as I plan to. It is targeted to TTRPG topics, and focused on whatever system you are using
        -   **!g** or **!gpt** + **a ChatGPT request**
            -   Example: **!g A goblin walks into a bar and**
            -   Example: **!g What should a player roll to convince a peasant that he or she is actually the monarch?**
            -   Example: **!g CR for goblin chief**
-   (Foundry) Added whitelist for the proper name recognition, in case you want to repeatedly use actors that are being flagged, to keep the alert from showing after the first time
-   (Foundry) Added a colored container to the description chat messages to match the chat command styles

### Fixed

-   (Foundry) Fixed a bug that caused the alert to show every time a user simply right-clicked a token of an actor with a proper name (thanks, daHeadRat!)

## [1.10.0] - 2023-06-30

### Added

-   (Foundry) Added redundancy to the pf2e actor data logic to be sure that creature type is never empty
-   (Foundry) Added substitution for missing creature type in any system
-   (Foundry) Generated descriptions will now appear in the Biography or Notes section of the unlinked token actor sheet (specific location differs by system)
-   (Foundry) Descriptions are removed if the name changes
-   (Foundry) Roman numeral names (Goblin I, Goblin II, etc.)
-   (Foundry) Letter names (Goblin A, Goblin B, etc.)
-   (Foundry) AI attempts to recognize proper names and prompt the user whether they want to leave the name as is or replace it with a generated name (so as to not rename a name NPC)
-   (Web App) Spruced up the form to be simpler and more intuitive
-   (Web App) Added controls for Description Language and Description Length
-   (Web App) Added a field for users to use their own OpenAI API key
-   (Web App) Added instructions and validation for name format
-   (Web App) Made text fields dynamically resize with text entry
-   (Foundry | Web App) Simplified how name formats work and made them more customizable (e.g. Goblin (III), Kobold \[C\], Rupert 'Ghost Face' Stantler, etc.)
-   (Foundry | Web App) Added more logging to keep users informed of what's happening behind the scenes
-   (Foundry | Web App) Added dev mode logging to help with troubleshooting

### Fixed

-   (Foundry) Massive code cleanup again, this time focusing on the name generation default settings and custom settings
-   (Foundry | Web App) Tweaks to AI adjective generation process to try to get more original adjectives

## [1.9.0.2b] - 2023-06-17

### Added

-   (Foundry) Added support for SWADE and WFRP4e

### Fixed

-   (Foundry) Improved compatibility with all systems
-   (Foundry) Cleaned up stored actor data

## [1.8.0b] - 2023-06-07

### Added

-   (Foundry | Web App) Added the ability to reverse first and last names in the offline name generator
-   (Foundry) Added some responsiveness to the custom settings form
-   (Foundry) Added ability to randomly assign an existing saved name to a token, and moved the "Select from Saved Names" function to right-click
-   (Foundry) Added a setting to determine whether new tokens draw from existing saved names first or always generate new ones
-   (Foundry) Made headings in saved preferences sticky

### Fixed

-   (Foundry | Web App) Major code cleanup and optimization
-   (Foundry | Web App) Fixed a bug that was referencing a variable that no longer exists
-   (Foundry | Web App) Fixed some errors with the offline name generator that could have caused it to fail or give unexpected results
-   (Foundry | Web App) Fixed a bug that prevented some custom options from being saved
-   (Foundry) Fixed some issues with basing a creature's name off of a custom creature type
-   (Foundry) Made the flair on the AI-related tokenHUD icons less siezure-inducing
-   (Foundry) Added queueing for token naming to prevent multiple requests from being sent at once, which was causing some duplicate names
-   (Foundry) The system now carefully checks all saved names vs. existing names on the canvas to keep the `used` flag up to date
-   (Foundry) Tool will now give a generic creature type of "creature" if the creature type is not defined in the actor data

## [1.7.2b] - 2023-05-30

### Added

-   (Foundry) Added media to the module.json file to display images in the Foundry VTT module browser

### Fixed

-   (Foundry | Web App) Rewrote the README.md file to be more poignant and less cluttered

## [1.7.1b] - 2023-05-30

### Added

-   (Foundry) Right-clicking the Generate Description tokenHUD icon now displays the saved description for the token's name in chat for everyone, or generates a new one and displays it if one does not already exist
-   (Foundry) Implemented the option to use one's own OpenAI API key instead of the mine
-   (Foundry) Added some flair to the tokenHUD icons to indicate the presence of saved names and descriptions and to call out the availability of AI functionality

### Fixed

-   (Foundry | Web App) Refreshed images to reflect current look and feel
-   (Foundry | Web App) Replaced generic "Not Specified" language with "Default" to specify that it will simply use the system's default language
-   (Foundry | Web App) Cleaned up code again and added more JSDoc comments
-   (Foundry | Web App) Made rp-names console logs easier to find 🐲🦄👿
-   (Foundry | Web App) Further simplified the validation of Patreon keys
-   (Foundry) Added in some missing localization strings
-   (Foundry) Fixed a bug that occasionally caused token names to be stuck on "Generating..." when using the Generate Name tokenHUD icon
-   (Foundry) Fixed generating descriptions for PCs to use the character's race, heritage, or class (depending on system) instead of the parent actor's name for the creature type
-   (Foundry) Improvements under the hood to actor data collection
-   (Foundry) Fixed a bug that caused generated descriptions sent to chat to always be public
-   (Foundry) Limited the description length setting to fixed options for simplicity

## [1.6.0b] - 2023-05-28

### Added

-   (Foundry) Added options for storing names and descriptions
-   (Foundry) Generate backup names by right-clicking actor names in the sidebar
-   (Foundry) View available saved names by right-clicking actor names in the sidebar
-   (Foundry) New tokenHUD icon to assign a saved name to a token
-   (Foundry) Generate Description tokenHUD icon now opens saved descriptions if a description already exists for the name
-   (Foundry) Validated compatibility with Foundry V11
-   (Foundry) Generated creature descriptions are now whispered to the GM only
-   (Foundry) Added a setting to disable automatic naming of tokens on creation
-   (Foundry) Added support for the Worlds Without Number system and hopefully improved compatibility with other systems
-   (Foundry) Colorized the tokenHUD icons
-   (Foundry) Colorized forms
-   (Foundry) Deleting the last saved configuration, name, or description now closes the window
-   (Web App) Moved from cookies to localStorage for storing settings

### Fixed

-   (Foundry) Names no longer changed to "Generating..." for linked tokens
-   (Foundry) Fixed a bug that would cause erratic behavior when deleting stored names and descriptions
-   (Foundry) Regenerate button in saved descriptions can now send a request to the AI to generate a new description
-   (Web App) Fixed form values not being saved

## [1.5.2b] - 2023-05-18

### Fixed

-   Baked in 5 free API calls per day for users without a Patreon key
-   Severely reduced number of API calls made to check for a valid Patreon key

## [1.5.1b] - 2023-05-15

### Fixed

-   Reduced pre-cache to 3 names to speed up initial name generation
-   Replaced old images in readme and web app

## [1.5.0b] - 2023-05-15

### Added

-   (Foundry | Web App) Added caching of names to prevent duplicates and to reduce API calls
-   (Foundry | Web App) Now iterates 5 times to try to produce a unique name instead of 3
-   (Foundry) Added new tokenHUD icon to generate an AI description for the selected token based on its name and creature type and display it in the chat
-   (Web App) Click on generated names to create an AI description of the creature based on its name and creature type
-   (Foundry) Added setting to designate the length of the generated description
-   (Foundry) Added setting to determine whether the generated description should be displayed in the chat
-   (Foundry | Web App) Added visual cues to indicate that generation is in progress

### Fixed

-   (Foundry | Web App) Switched to a faster, smarter AI model that produces better names
-   (Foundry | Web App) Huge improvements to the adjective name generator to provide more randomized and interesting names with fewer failures
-   (Foundry | Web App) Fixed a bug that caused the offline model to always fall back on the entire list of names instead of limiting them to relevant names based on the creature type
-   (Foundry | Web App) Improved the name format settings to be more flexible and to allow for more options
-   (Foundry | Web App) Vastly improved AI promts to provide more interesting and varied names
-   (Foundry | Web App) Improved deliverability of AI responses by requesting JSON data instead of plain text and automatically retrying if the response is not JSON
-   (Foundry | Web App) Far fewer API calls are made to check for a valid Patreon key now

## [1.1.0b] - 2023-04-30

### Added

-   Option to generate names by appending an adjective to the actor name via AI

## [1.0.12b] - 2023-04-27

### Fixed

-   Improved creature list import for custom creature types

## [1.0.11b] - 2023-04-27

### Added

-   Added Open Graph metadata to make links to the web app look better when shared on social media

### Fixed

-   Improved styles on the web app

## [1.0.10b] - 2023-04-26

### Fixed

-   Fixed error in duplicate name check on PF2e and possibly other systems. Thank you, Frost, for your help in identifying this situation!

## [1.0.9b] - 2023-04-26

### Fixed

-   Misconfiguration in the module.json corrected

## [1.0.8b] - 2023-04-26

### Fixed

-   Actually fixed the service worker so it clears old versions of itself from client browsers

## [1.0.4b] - 2023-04-26

### Fixed

-   Made a change to the service worker for the PWA to make sure it always fetches the latest files from the server, unless no Internet connection is available, in which case it will use the cached files
-   Corrected some file references in service worker

## [1.0.2b] - 2023-04-26

### Fixed

-   Adjusted styles/layout in web app
-   Fixed a bug that made the hamburger menu unclickable on the main home page
-   Tiny tweaks to trimming of returned names to prevent punctuation from appearing at the end of names

## [1.0.1b] - 2023-04-25

### Fixed

-   Minute tweaks to the web app

## [1.0.0b] - 2023-04-24

### Added

-   Created a web app version of the name generator, with full PWA support
-   Revised API function to enable multiple names to be generated at once for future functionality

### Fixed

-   Removed stylesheet from module.json due to conflicts
-   Modified the rpGenerateRandomName function to be compatible with the external web tool
-   Improved the AI prompts

## [0.9.2b] - 2023-04-23

### Added

-   Built out much of the form

## [0.9.0b] - 2023-04-23

### Added

-   Merged Foundry module with proto web app for synergy

## [0.8.4b] - 2023-04-22

### Added

-   Added option to disable generation of names for specific types of creatures

## [0.8.3b] - 2023-04-22

### Fixed

-   Fixed a bug that ignored % chance of nickname and title on custom options
-   Cleaned up console logging

## [0.8.2a] - 2023-04-22

### Fixed

-   Fixed a bug that prevented the custom type from being saved to the custom settings for a creature
-   Fixed a bug that resulted in offline-generated names to include a surname when the surname option was unchecked

## [0.8.0a] - 2023-04-21

### Added

-   Linked tokens will not get their names changed when created
-   Language now defaults to "Not Specified" and user can also select "Not Specified" in the settings and refresh dialog, causing the name to be generated in the language most appropriate for the creature
-   Added a check for repeat names when generating a new name, so that the name will be regenerated if it is too similar to an existing name on the canvas

### Fixed

-   Names should now always appear in Title Case
-   Added a queue for AI name generation to prevent congestion in the API when one copies and pastes a large number of tokens
-   Fixed a bug where saved custom settings would not pre-populate subsequent custom settings dialogs

## [0.7.5a] - 2023-04-20

### Fixed

-   Made lists of genres, creatureTypes, and languages more manageable by separating them into files
-   Renamed variables and functions to avoid conflicts with other modules
-   Truly activated the Patreon key validation
-   Fixed a bug when using the [Item Piles module](https://github.com/fantasycalendar/FoundryVTT-ItemPiles) that resulted in errors when creating a pile on the canvas and when refreshing a token's name

## [0.7.0] - 2023-04-18

### Added

-   Added PF2e support and potentially other systems. Please let me know if you have any issues with other systems.

## [0.6.0] - 2023-04-18

### Added

-   Validation for Patreon key
-   Created offline model
-   Added new option to select offline or online model
-   Added failover in case the online AI model is unable to produce a name, so the offline model can kick in
-   New output languages: Emoji, Emoticons, Pig Latin, and Wingdings
-   New genres: Pirate, Steampunk, Vampire, and Biblical

### Fixed

-   Cleaned up name customization options
-   Added indicators to premium features

## [0.5.5] - 2023-04-18

### Added

-   Added beginning of premium content restrictions
-   Added beginning of offline model
-   Added Guarani as an output language

### Fixed

-   No longer requires two clicks to open the token HUD after undo or refresh function

## [0.5.4] - 2023-04-17

### Added

-   Added more languages still
-   Saved options now populate as the default values in the custom options dialog when refreshing a name

## [0.5.2] - 2023-04-17

### Added

-   Added way more real and made-up language options for name outputs

## [0.5.0] - 2023-04-17

### Added

-   Save custom options for actor name, creature type, or creature subtype
-   Added numerous language options for name outputs

### Fixed

-   Refresh token HUD button now uses default options with left-click or customize options with right-click
-   Improved layout of custom settings sheet

## [0.4.1] - 2023-04-16

### Added

-   Added additional genres: Punny

### Fixed

-   Names of selections in Refresh dialog
-   Localization of prompts
-   Even cleaner code arrangement

## [0.4.0] - 2023-04-16

### Added

-   Modernized JavaScript for es6 standards

## [0.3.5] - 2023-04-15

### Added

-   Separated JavaScript functions into individual files

## [0.3.2] - 2023-04-15

### Added

-   Added additional genres: Hippie, Hipster, Meme Culture, Nerdy, Scientific

## [0.3.1] - 2023-04-15

### Fixed

-   Added missing Genre options from refresh sheet

## [0.3.0] - 2023-04-15

### Added

-   Added module settings to configure defaults for many variables
-   Added additional genres: Alien, Colonial, Gothic, Anime, Prehistoric, Silly
-   Added setting for custom arrangement of name components
-   Added publicly-accessible API calls

## [0.2.1] - 2023-04-14

### Added

-   Massive code cleanup and detailed comments added

## [0.2.0] - 2023-04-14

### Added

-   Finished implementing refresh button
-   Added more genres: Sci-Fi, Western, Victorian, Futuristic, Modern
-   GPT prompts optimized
-   Initial bug testing

## [0.1.6] - 2023-04-13

### Added

-   Added customization for the refresh option to allow designating the following for the new name: gender, surname inclusion, title inclusion, choice of classification (WIP)

## [0.1.5] - 2023-04-13

### Added

-   Added Token HUD button to undo custom name (reverts to name of originating actor)
-   Added Token HUD button to refresh the name, causing a new name to be generated and assigned to the token

## [0.1.3] - 2023-04-12

### Added

-   Added localization for German

## [0.1.2] - 2023-04-12

### Added

-   Added localizations for Spanish, Portuguese, and French

### Removed

-   Temporarily removed token HUD buttons until they are fully implemented

## [0.1.0] - 2023-04-12

### Added

-   Initial release of the Random Procedural Names (RP-Names) module for Foundry VTT.
-   Automatic fantasy name generation for non-player characters (NPCs) when tokens are created.
-   Token HUD buttons for GMs to undo or refresh names.
-   Support for creature types and creature subtypes.
-   Optional inclusion of surnames, nicknames, and titles in generated names.
