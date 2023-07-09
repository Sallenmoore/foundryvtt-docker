# Change Log

## Middle Kingdom - v10 -> main branch

### 2.6.0 - February 26, 2022
- [FEATURE] (amir-arad) Added support for Old School Essentials (ose) and for quantities within objects. (PR #46 Thanks!)
- [BUGFIX] (Lupestro) GM escalation is now only invoked for the named light source on the intended game system. The only implemented example of this to date is token creation/deletion for Dancing Lights on dnd5e. (Behavior when aliasing the name of one of these _in the same game system_ to be used for something else is undefined.) (Issue #40)

### 2.5.0 - February 18, 2023
- [FEATURE] (Unomagan) Added light sources for Starfinder

### 2.4.0 - January 2, 2023
- [FEATURE] (Aymeeric) Updated French translation (now at 100%)

### 2.3.0 - December 10, 2022
- [FEATURE] (Lupestro) Now supporting Dungeon Crawl Classics. Many thanks to marcusadmortati for supplying the data and testing. 

### 2.2.2 - December 9, 2022
- [BUGFIX] (MrPrimate) Didn't load light sources properly if Foundry was not at root of site. (Thanks MrPrimate for the PR!)

### 2.2.1 - December 8, 2022
- [BUGFIX] (Lupestro) Fixed URLs in manifest to point to /main/ not /v10/. (Thanks ckdragons for heads-up.)

### 2.2.0 - December 6, 2022
- [FEATURE] (Lupestro) Updated README for clarity in creating user settings. (Issue #27 - many participants)
- [FEATURE] (Lupestro) Improved and simplified source JSON syntax with defaults for most fields. (Issue #27 - many participants)
  * This change shouldn't invalidate any existing light source JSON files.
- [FEATURE] (Lupestro) Introduced aliases to JSON to give new names to light sources defined elsewhere.
  * Using this in a very simple custom JSON will make this module more useful to those who play in a non-English language.
- [FEATURE] (Lupestro) Provided aliases for dnd5e light sources that should provide smoother integration with ddb-importer. (Issues raised by MrPrimate and emmoth)
- [FEATURE] (Lupestro) Improved name and description of options for consuming torches, candles, etc. to avoid confusion. (In response to comments by vgeirnaert)

I'm looking at loading localized language JSON files for the out-of-the-box sources on startup in a future release. This will need the actual (i.e. matching letter-by-letter) light source names used in various games when played in different languages. Contact me if you play with light sources in another language and you're interested in helping out.

### 2.1.4 - December 4, 2022
  - [BUGFIX] (Lupestro) DnD5e Bullseye Lantern had wrong dim/bright ranges due to copy/paste error. (Issue reported by Fragmenri. Thanks!)
  - [BUGFIX] (Lupestro) Bullseye lanterns in all systems that had 53 degree radius, now have 57 degree radius.
     * 53 degrees is technically correct for a cone (n units wide at center distance n, per rules).
     * 57 degrees (1 radian) would be correct for a (spherical) sector of radius n and arc length n.
     * Foundry projects light radially, so you get a spherical sector, regardless of the game rules.
     * Using 57 degrees is the fairest solution available within Foundry's constraints.
       * The extra beam width compensates for what you lose in the corners that radial light won't reach.
     * You can always reduce it back to 53 degrees with a custom JSON, of course, if you feel strongly about it.

### 2.1.3 - October 8, 2022
  - [BUGFIX] (Lupestro) Corrected issue (found by vkdolea) where user-supplied sources for new systems weren't processing properly.
  - [BUGFIX] (Lupestro) Now pulling non-dim/bright light properties for the light source configured in settings from the prototype token. (Issue reported by Jensenator360)
  - [BUGFIX] (Lupestro) Fixed the translation files for several languages.

### 2.1.2 - September 14, 2022
  - [BUGFIX] (Lupestro) Fixed image used for dancing lights
  - [BUGFIX] (Lupestro) Reset precedence order to user-supplied light sources first, then the source in config settings, then module-provided defaults based on game rules.

### 2.1.1 - September 6, 2022
  - [BUGFIX] (Lupestro) Fixed issue where unlinked tokens were adjusting inventory on source token.
  - [BUGFIX] (Lupestro) Fixed designation of which stock light sources are consumable in GURPS
  - [BUGFIX] (Lupestro) Adjusted manifest to use strings for minimumCoreVersion and compatibility values.
  
### 2.1.0 - July 24, 2022
  - [BUGFIX] (Lupestro) Context menu wasn't opening in HUD after exhausting a source - had to reopen HUD.
  - [BUGFIX] (Lupestro) Making Dancing Lights respond to configured settings.
  - [FEATURE] (ToGreedy) German translation. 

### 2.0.0 - July 23, 2022
   - [BREAKING] (Lupestro) This release supports v10 of Foundry, and not v0.7, v0.8, or v9.
   - [FEATURE] (Lupestro) Now supports selection among a variety of light sources on right-click menu from torch button - a long time coming, I know.
     * Bullseye Lantern has cone beam on token facing.
     * Hooded Lantern toggles on-dim-off on click.
     * Candle and Torch consume inventory, indicate when exhausted.
     * Limitations:
       * Aside from existing Dancing Lights behavior in dnd5e, light sources remain carried by the actor 
       * One actor may have only one light source active per scene at a time. 
       * No support for setting a light source down and stepping away. 
       * We probably won't get too deep into spells beyond the two cantrips we support  
         - The PHB only lists 7 other spells with explicit light effects
         - All the spells except Continual Flame and Daylight have other effects - weapon, damage, etc - that you'd want a more sophisticated module to deliver.
         - We could offer the Produce Flame cantrip as a half-sized Light cantrip without its thrown weapon effect, but would that be satisfying?
         - Anything that consumes spell slots (including Continual Flame and Daylight) should probably be invoked as a normal spell rather than a light source anyway.
   - [FEATURE] (Lupestro) Now supports specific light sources for a modest variety of systems, with extensibility to override settings or add light sources through a JSON file.
   - [INTERNAL] (Lupestro) Separated concerns into multiple js files and a CSS file
      * The additional UI and the more complex state finally made it necessary.
      * Separate root, hud, token, settings, light sources, topologies, and socket comms are much easier to follow.
      * This will make planned future work much easier as well.
      * The mere thimbleful of HTML needed is fine sitting in the top of the hud.js for now.

## Intermediate period - master -> v9 branch

### 1.4.4 - March 19, 2022
  - [BUGFIX] (Lupestro) Dancing Lights now work better for players - sends entire create / remove cycle to GM when users lack permissions on tokens.
### 1.4.3 - December 17, 2021
  - [CLEANUP] (Lupestro) Bumped official compatibility to Foundry 9, after testing with final test version. No code change.
### 1.4.2 - October 31, 2021 
  - [FEATURE] (Lupestro) Now works in Foundry 9, but still works in Foundry 7 and 8.
  - [BUGFIX] (Lupestro) Function in Foundry 7 is restored - it had broken in restructuring.
  - [INTERNAL] (Lupestro) Established test foundation - explicit cases, worlds, automation, fluid dev->test. 
### 1.4.1 - October 23, 2021 
  - [BUGFIX] (Lupestro) Fixed bug in restructuring that broke features for non-DnD5e.
### 1.4.0 - October 23, 2021
  - [BUGFIX] (C-S-McFarland) Fix for bug when you have torch and light spell.
  - [INTERNAL] (Lupestro) Major restructuring with cleanup of race conditions.
### 1.3.2 - June 29, 2021 
  - [FEATURE] (Lupestro, zarmstrong, lozalojo) Spanish updates and URL in module.json
### 1.3.1 - June 29, 2021 
  - [FEATURE] (Lupestro) Updated zh-tw translation from zeteticl and pt-br translation from rinnocenti to 100% of strings. Thanks y'all!
### 1.3.0 - June 25, 2021 
  - [FEATURE] (Lupestro) Incorporated pending Taiwan Chinese and Brazilian Portuguese translations from zeteticl and rinnocenti.
### 1.2.1 - June 11, 2021 
  - [CLEANUP] (Lupestro) Cleaned up console logging noise I had created
### 1.2.0 - June 10, 2021 - 
  - [FEATURE] (Lupestro) Updated for 0.8.6, but ensured it still functions in 0.7.x.

## Old Kingdom - master branch

Everything from here down has needed to be pieced together from unearthed inscriptions (the GIT history.)

* 1.1.4 - October 21, 2020 - (Stephen Hurd) Marked as 0.7.5 compatible.
* 1.1.3 - October 18, 2020 - (Stephen Hurd) Fix spelling.
* 1.1.2 - October 18, 2020 - (Stephen Hurd) Fix JSON syntax.
* 1.1.1 - October 18, 2020 - (Stephen Hurd) Name adjustment.
* 1.1.0 - October 18, 2020 - (Jose E Lozano) Add Spanish, 
                             (Stephen Hurd) Fix bright/dim radius of Dancing Lights.
* 1.0.9 - May 28, 2020 - (Stephen Hurd) Marked as 0.6.0 compatible.
* 1.0.8 - May 19, 2020 - (Aymeric DeMoura) Add French, Marked as 0.5.8 compatible.
* 1.0.7 - April 29, 2020 - (Stephen Hurd) Add Chinese, fix torch inventory usage.
* 1.0.6 - April 18, 2020 - (Stephen Hurd) Fix dancing lights removal.
* 1.0.5 - April 18, 2020 - (Stephen Hurd) Remove socket code for dancing lights removal.
* 1.0.4 - April 18, 2020 - (Stephen Hurd) Update to mark as 0.5.4 compatible.
* 1.0.3 - April 15, 2020 - (MtnTiger) - Updated with API changes.
* 1.0.2 - January 22, 2020 - (Stephen Hurd) Update for 0.4.4.
* 1.0.1 - November 26, 2019 - (Stephen Hurd) - Use await on all promises.
* 1.0.0 - November 25, 2019 - (Stephen Hurd) - Add support for Dancing Lights.

