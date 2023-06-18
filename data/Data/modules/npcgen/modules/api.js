import { classesJSON, languagesJSON, namesJSON, personalityTraitsJSON, plotHooksJSON, professionsJSON, racesJSON, sexJSON, listJSON } from "../npc-gen.js";
import NPCGenerator from "./applications/NPCGenerator.js";
import defaultOptions from "../data/defaultApiOptions.js";

/**
 * @param {number} [amount=1]
 * @param {defaultOptions} [options={}]
 */
export default async function generateNPC(amount = 1, options = defaultOptions, fillDefault = false) {
  if (options.createFoolishNumber !== true && amount > 64) {
    ui.notifications.warn(game.i18n.localize("npcGen.uiError"));
    throw new Error(game.i18n.localize("npcGen.consoleError"));
  }

  let confirmed = false;

  await Dialog.confirm({
    title: game.i18n.localize("npcGen.areYouSure"),
    content: `<p>${game.i18n.localize("npcGen.amountToGen").replace("%n", amount)}</p>`,
    yes: () => {
      confirmed = true;
    },
    defaultYes: false,
  });

  if (!confirmed) return;

  if (fillDefault) {
    Object.keys(defaultOptions).forEach((key) => {
      if (key in options === false) options[key] = defaultOptions[key];
    });
  }
  let actors = [];

  for (let i = 1; i < amount + 1; i++) {
    let generator = new NPCGenerator({
      classesJSON: classesJSON,
      languagesJSON: languagesJSON,
      namesJSON: namesJSON,
      personalityTraitsJSON: personalityTraitsJSON,
      plotHooksJSON: plotHooksJSON,
      professionsJSON: professionsJSON,
      racesJSON: racesJSON,
      sexJSON: sexJSON,
      listJSON: listJSON,
    });

    await generator.generateNPC(options);
    const actorData = await generator._apiSave();
    generator.close();
    actors.push(actorData);
  }

  console.log(actors);

  return await CONFIG.Actor.documentClass.create(actors);
}
