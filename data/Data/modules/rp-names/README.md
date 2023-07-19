# Random Procedural Names (rp-names) for Foundry VTT

**Current version: 1.15.0**

Automatically assign lore-friendly, procedurally-generated names to your tokens with the Random Procedural Names (rp-names) module for Foundry VTT!

> **Note:** _Unlimited use of AI features is available to Patreon Supporters_

---

## Features

**Foundry VTT**:

-   Token HUD buttons for resetting and refreshing names
-   Localization support for multiple languages
-   Save custom options for actor name, creature type, or creature subtype
-   Save generated names for later retrieval and editing

**Premium Features (Available to Patreon Supporters)**:

-   Supports multiple options, such as including surnames, nicknames, and titles
-   Automatically generates immersive names for non-player characters (NPCs) across various genres
-   Numerous language options for name outputs
-   Offline and online model options for name generation, as well as adjective-only mode, which describes the creature with a random adjective
-   Failover to offline model in case the online AI model is unable to produce a name
-   Caching of names to reduce API calls

> _If you enjoy this tool and would like to support its development, please consider becoming a patron at [https://www.patreon.com/RPGMTools](https://www.patreon.com/RPGMTools)_

![AI Demonstration](./img/foundry/create-token.gif)

Visit the following links for images of:

-   [Settings Pane](./img/foundry/settings-pane.jpg)
-   [Custom Settings Pane](./img/foundry/custom.jpg)
-   [Token HUD Icons](./img/foundry/token-hud.jpg)
-   [Saved Configurations](./img/foundry/saved-configs.jpg)
-   [Saved Names](./img/foundry/saved-names.jpg)

---

## Name Generation Process

See the [Quickstart Guide](./INSTRUCTIONS.md) for a quick but thorough overview of the module's features and settings and how to use them.

-   **Proper (AI):** The module uses a generative artificial, or simulated intelligence via an API to generate random names based on various options such as actor type, creature type, creature subtype, gender, language, genre, and other customizable settings, such as the inclusion of nicknames or titles and the rearranging of the parts of the name. Names can also be delivered in numerous different languages, both real and made up.

-   **Adjective (AI):** This mode appends an adjective to the creature name to just differentiate tokens (and perhaps offer interesting roleplay opportunities) This ensures extreme diversity and creativity that can breathe life into your campaign.

-   **Proper (Simple):** This mode uses tables of first and last names pertaining to several fantasy creatures to generate fantasy-styled names based on options, such as actor name (e.g. Goblin), creature type (e.g. Humanoid), or creature subtype (e.g. Goblinoid). This ensures varied names across different creature types. Names are limited to random gender names with mostly a fantasy style, delivered in English. Names are assigned to tokens automatically and can be re-rolled.

-   **Adjective (Simple):** This mode describes the creature with a random adjective, using a static table of adjectives. This is useful for quickly generating a large number of tokens with unique and interesting names.

-   **Numbered (Simple):** This mode generates a numbered name, such as "Goblin 1", "Goblin 2", etc. This is useful for quickly generating a large number of tokens with unique names.

---

## Genres

Fantasy, Sci-Fi, Western, Futuristic, Alien, Pirate, Steampunk, Vampire, Biblical, Colonial, Victorian, Gothic, Anime, Prehistoric, Silly, Meme Culture, Hippie, Nerdy, Hipster, Scientific, Punny, Modern -- you can also specify your own genre!

## Languages Supported

-   **Real Languages**: Albanian, Arabic, Bengali, Bulgarian, Chinese, Cockney, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Irish, Italian, Japanese, Korean, Latvian, Lithuanian, Malay, Maltese, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swedish, Thai, Turkish, Vietnamese, Welsh, Yiddish, Zulu

-   **Fictional and Man-Made Languages (Your mileage may vary)**: Pig Latin, Wingdings, Klingon, Esperanto, Elvish, Dothraki, Sindarin, Quenya, Lojban, Na'vi, Interlingua, Ido, Volapük, Laadan, Toki Pona, Aurebesh, Dovahzul, Uruk, Newspeak, Nadsat, Kilrathi, Kryptonian, Barsoomian, Gallifreyan, Gunganese, High Valyrian, Huttese, Jawaese, Mando'a, Old Tongue, Parseltongue, R'lyehian

-   **Add your own languages and see what the AI comes up with!**

---

## Installation

1. In Foundry VTT, go to the Setup menu, then click "Add-on Modules" and "Install Module". Search for "Random Procedural Names" and click "Install".
2. Alternatively, paste the URL to the module.json file into the "Manifest URL" field in the Install Module screen of Foundry: `https://gitlab.com/rpgm-tools/rp-names/-/raw/main/module.json`
3. As a last resort, you can download the zip file from the [module's GitLab repository](https://gitlab.com/rpgm-tools/rp-names/-/archive/main/rp-names-main.zip), extract the contents to the `modules` folder in your Foundry VTT data directory, and enable the RP-Names module in your world's module management settings.

---

## Systems Supported

The Foundry module has been tested and is compatible with the following systems, thought should work with many others:

-   Dungeons & Dragons 5e
-   Pathfinder 2e
-   Worlds Without Number
-   SWADE
-   Warhammer Fantasy RolePlay 4e
-   Dungeons & Dragons 4e
-   Dungeons & Dragons 3.5e
-   Call of Cthulhu 7e
-   Shadowrun 5e
-   Twilight: 2000 4e
-   Crucible (coming soon!)

---

## Usage

Depending on settings configuration, with this module, you can:

-   Automatically generate names for NPCs when tokens are created.
-   Right-click an NPC token on the canvas to revert the name, generate a new one, assign a name from your saved names, or generate a description for the creature.
-   Configure custom settings on the fly by _right-clicking_ the token to get the tokenHUD, then _right-clicking_ the refresh button.

---

## More Images

-   **Foundry Module**:

    -   [Image 1](./img/foundry/offline-orcs.jpg)
    -   [Image 2](./img/foundry/standard-succubi.jpg)
    -   [Image 3](./img/foundry/adjectives-driders.jpg)
    -   [Image 4](./img/foundry/adjectives-driders-copy.gif)

---

## Known Issues

-   AI's ability to produce names in languages other than English is limited. Please let us know if you have any suggestions.

---

## Incompatibilities

-   This module may be incompatible with modules that modify the name of tokens, such as NameForge, Token Mold, and All Goblins Have Names (outdated).
-   Issues with Inventory+ have been reported. Please let us know if you have any suggestions.
-   Incompatible with Drag Upload. Please let us know if you have any suggestions.

---

## Reporting Issues and Feature Requests

Please report any issues or request new features on the [module's GitLab issues page](https://gitlab.com/rpgm-tools/rp-names/-/issues).
Include as much information as you can about your configuration. Suggestions are welcome.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

-   Thank you to the Foundry VTT community for all the wonderful ideas and enthusiasm.
