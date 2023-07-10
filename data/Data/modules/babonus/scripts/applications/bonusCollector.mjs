import {BabonusTypes} from "./dataModel.mjs";
import {AURA_TARGETS, MODULE, SETTINGS} from "../constants.mjs";

/**
 * A helper class that collects and then hangs onto the bonuses for one particular
 * roll. The bonuses are filtered here only with regards to:
 * - aura blockers, aura range, aura disposition
 * - the hidden state of tokens
 * - the hidden state of measured templates
 * - item exclusivity (babonus being item-only)
 * - item attunement/equipped state (isSuppressed)
 * - effects being unavailable
 */
export class BonusCollector {
  // The type of bonuses being collected.
  type = null;
  babonusClass = null;
  bonuses = [];

  // The item performing the roll, if any.
  item = null;

  // The actor performing the roll or owning the item performing the roll.
  actor = null;

  /**
   * The token document of the actor performing the roll, and any related
   * properties, such as its disposition and the grid spaces that it occupies.
   */
  token = null;
  disposition = null;
  elevation = null;
  tokenCenters = null;

  templates = [];
  tokens = [];

  /** The collected bonuses. */
  actorBonuses = [];
  tokenBonuses = [];
  tokenBonusesWithout = [];
  templateBonuses = [];

  constructor(data) {
    // Set up type and class.
    this.type = data.type;
    this.babonusClass = BabonusTypes[this.type];

    // Set up item and actor.
    if (data.object instanceof Item) {
      this.item = data.object;
      this.actor = data.object.actor;
    } else {
      this.actor = data.object;
    }

    // Set up canvas elements.
    this.token = this.actor.token ?? this.actor.getActiveTokens(false, true)[0];
    if (this.token) {
      this.disposition = this.token.disposition;
      this.elevation = this.token.elevation;
      this.tokenCenters = this.constructor._collectTokenCenters(this.token);

      // Find all templates and all other tokens.
      this.templates = canvas.scene.templates;
      this.tokens = canvas.scene.tokens.filter(t => {
        if (!t.actor) return false;
        if (t.actor.type === "group") return false;
        return t !== this.token;
      });
    }

    this.bonuses = this._collectBonuses();
  }

  /**
   * A method that can be called at any point to retrieve the bonuses hung on to.
   * This returns a collection of uuids mapping to bonuses due to ids not necessarily changing.
   * @returns {Collection<Babonus>}     The collection of bonuses.
   */
  returnBonuses() {
    if (game.settings.get(MODULE, SETTINGS.AURA)) this._drawAuras();
    return new foundry.utils.Collection([...this.actorBonuses, ...this.tokenBonuses, ...this.templateBonuses].map(b => [b.uuid, b]));
  }

  /**
   * *******************************************************************
   *
   *
   *                          COLLECTION METHODS
   *
   *
   *
   * *******************************************************************
   */

  /**
   * Main collection method that calls the below collectors for self, all tokens, and all templates.
   * This method also ensures that overlapping templates from one item do not apply twice.
   */
  _collectBonuses() {
    // Clear the arrays.
    this.actorBonuses = [];
    this.tokenBonuses = [];
    this.tokenBonusesWithout = [];
    this.templateBonuses = [];

    this.actorBonuses = this._collectFromSelf();
    for (const token of this.tokens) this.tokenBonuses.push(...this._collectFromToken(token));

    // Special consideration for templates; allow overlapping without stacking the same bonus.
    const _templateBonuses = [];
    for (const template of this.templates) {
      _templateBonuses.push(...this._collectFromTemplate(template));
    }
    this.templateBonuses.push(...new foundry.utils.Collection(_templateBonuses.map(b => [`${b.item.uuid}.Babonus.${b.id}`, b])));
  }

  /**
   * Get all bonuses that originate from yourself.
   * @returns {Babonus[]}     The array of bonuses.
   */
  _collectFromSelf() {

    // A filter for discarding blocked or suppressed auras, template auras, and auras that do not affect self.
    const validSelfAura = (bab) => {
      const isBlockedAura = bab.isTokenAura && (bab.isAuraBlocked || !bab.aura.self);
      return !isBlockedAura && !bab.isTemplateAura;
    }

    const actor = this._collectFromDocument(this.actor, [validSelfAura]);
    const items = this.actor.items.reduce((acc, item) => acc.concat(this._collectFromDocument(item, [validSelfAura])), []);
    const effects = this.actor.effects.reduce((acc, effect) => acc.concat(this._collectFromDocument(effect, [validSelfAura])), []);
    return [...actor, ...items, ...effects];
  }

  /**
   * Get all bonuses that originate from another token on the scene.
   * @param {TokenDocument} token     The token.
   * @returns {Babonus[]}             The array of bonuses.
   */
  _collectFromToken(token) {
    if (token.hidden) return [];

    // A filter for discarding blocked or suppressed auras and template auras.
    const validTokenAura = (bab) => {
      const isBlockedAura = bab.isTokenAura && bab.isAuraBlocked;
      return !isBlockedAura && !bab.isTemplateAura;
    }

    // A filter for discarding auras that do not have a long enough radius.
    const rangeChecker = (bab) => {
      if (!bab.isTokenAura) return false;
      const validTargeting = this._matchTokenDisposition(token, bab);
      if (!validTargeting) return false;
      return this._tokenWithinAura(token, bab);
    }

    const actor = this._collectFromDocument(token.actor, [validTokenAura, rangeChecker]);
    const items = token.actor.items.reduce((acc, item) => {
      return acc.concat(this._collectFromDocument(item, [validTokenAura, rangeChecker]));
    }, []);
    const effects = token.actor.appliedEffects.reduce((acc, effect) => {
      return acc.concat(this._collectFromDocument(effect, [validTokenAura, rangeChecker]));
    }, []);
    return [...actor, ...items, ...effects];
  }

  /**
   * Get all bonuses that originate from templates the rolling token is standing on.
   * @param {MeasuredTemplateDocument} template     The template.
   * @returns {Babonus[]}                           The array of bonuses.
   */
  _collectFromTemplate(template) {
    if (template.hidden) return [];
    if (!this._tokenWithinTemplate(template.object)) return [];

    // A filter for discarding template auras that are blocked or do not affect self (if they are your own).
    const templateAuraChecker = (bab) => {
      if (bab.isAuraBlocked) return false;
      const isOwn = this.token.actor === bab.actor;
      if (isOwn) return bab.aura.self;
      return this._matchTemplateDisposition(template, bab);
    }

    const templates = this._collectFromDocument(template, [templateAuraChecker]);
    return templates;
  }

  /**
   * General collection method that all other collection methods call in some fashion.
   * Gets an array of babonuses from that document.
   * @param {Document} document         The token, actor, item, effect, or template.
   * @param {Function[]} filterings     An array of additional functions used to filter.
   * @returns {Babonus[]}               An array of babonuses of the right type.
   */
  _collectFromDocument(document, filterings = []) {
    // Immediately return an empty array if we are attempting to fetch bonuses from something invalid.
    if (document instanceof ActiveEffect) {
      if (!document.modifiesActor) return [];
    }

    const flags = document.flags.babonus?.bonuses ?? {};
    const bonuses = Object.entries(flags).reduce((acc, [id, data]) => {
      if (this.type !== data.type) return acc;
      if (!foundry.data.validators.isValidId(id)) return acc;
      try {
        const bab = new this.babonusClass(data, {parent: document});
        if (!this._generalFilter(bab)) return acc;
        for (const func of filterings) {
          if (!func(bab)) return acc;
        }
        acc.push(bab);
      } catch (err) {
        console.warn(err);
      }
      return acc;
    }, []);
    return bonuses;
  }

  /**
   * Some general filters that apply no matter where the babonus is located.
   * @param {Babonus} bonus     A babonus to evaluate.
   * @returns {boolean}         Whether it should immediately be discarded.
   */
  _generalFilter(bonus) {
    if (!bonus.enabled) return false;

    // Stuff that applies only if the bonus is on an item.
    if (bonus.parent instanceof Item) {
      if (bonus.isSuppressed) return false;
      if (bonus.isExclusive && (this.item?.uuid !== bonus.parent.uuid)) return false;
    }

    // Stuff that applies only if the bonus is on an effect.
    else if (bonus.parent instanceof ActiveEffect) {}

    // Stuff that applies only if the bonus is on a template.
    else if (bonus.parent instanceof MeasuredTemplateDocument) {
      const item = bonus.item;
      if (!item || bonus.isSuppressed) return false;
    }

    return true;
  }

  /**
   * *******************************************************************
   *
   *
   *                           UTILITY FUNCTIONS
   *
   *
   *
   * *******************************************************************
   */

  /**
   * Get the centers of all grid spaces that overlap with a token document.
   * @param {TokenDocument} tokenDoc      The token document on the scene.
   * @returns {object[]}                  An array of xy coordinates.
   */
  static _collectTokenCenters(tokenDoc) {
    const {width, height, x, y} = tokenDoc;
    const grid = canvas.scene.grid.size;
    const halfGrid = grid / 2;

    if (width <= 1 && height <= 1) return [tokenDoc.object.center];

    const centers = [];
    for (let a = 0; a < width; a++) {
      for (let b = 0; b < height; b++) {
        centers.push({
          x: x + a * grid + halfGrid,
          y: y + b * grid + halfGrid
        });
      }
    }
    return centers;
  }

  /**
   * Given a token and an aura's 'descriptive' radius, returns the area of effect of
   * the aura, as a circle. This is given that measuring is done from the edge of a
   * token, and not from its center.
   * @param {TokenDocument} token     The token whose actor has the aura.
   * @param {number} range            The range of the aura, usually in feet.
   * @returns {PIXI}                  The capture area of the aura.
   */
  _createCaptureArea(token, range) {
    const center = token.object.center;
    const tokenRadius = Math.abs(token.x - center.x);
    const pixels = range * canvas.dimensions.distancePixels + tokenRadius;
    return new PIXI.Circle(center.x, center.y, pixels);
  }

  /**
   * Get whether the rolling token is within a certain number of feet from another given token.
   * @param {TokenDocument} token     The token whose actor has the aura.
   * @param {Babonus} bonus           The bonus with the aura and range, usually in feet.
   * @returns {boolean}               Whether the rolling token is within range.
   */
  _tokenWithinAura(token, bonus) {
    // TODO: option to use gridspace setting.
    // TODO: calculate euclidean vertical distance.
    const data = bonus.getRollData({deterministic: true});
    const range = dnd5e.utils.simplifyBonus(bonus.aura.range, data);
    if (range === -1) return true;
    const verticalDistance = Math.abs(token.elevation - this.elevation);
    if (verticalDistance > range) return false;
    const circle = this._createCaptureArea(token, range);
    const within = this.tokenCenters.some(({x, y}) => circle.contains(x, y));
    if (!within) this.tokenBonusesWithout.push(bonus);
    return within;
  }

  /**
   * Get whether the rolling token has any grid center within a given template.
   * @param {MeasuredTemplate} template     A measured template placeable.
   * @returns {boolean}                     Whether the rolling token is contained.
   */
  _tokenWithinTemplate(template) {
    const {shape, x: tx, y: ty} = template;
    return this.tokenCenters.some(({x, y}) => shape.contains(x - tx, y - ty));
  }

  /**
   * Get whether an aura can target the rolling actor's token depending on its targeting.
   * @param {TokenDocument} token     The token on whom the aura was found.
   * @param {Babonus} bonus           The babonus with the aura.
   * @returns {boolean}               Whether the bonus can apply.
   */
  _matchTokenDisposition(token, bonus) {
    const tisp = token.disposition;
    const bisp = bonus.aura.disposition;
    return this._matchDisposition(tisp, bisp);
  }

  /**
   * Get whether a template aura can target the contained token depending on its targeting.
   * @param {MeasuredTemplateDocument} template   The containing template.
   * @param {Babonus} bonus                       The babonus with the aura.
   * @returns {boolean}                           Whether the bonus can apply.
   */
  _matchTemplateDisposition(template, bonus) {
    const tisp = template.flags.babonus.templateDisposition;
    const bisp = bonus.aura.disposition;
    return this._matchDisposition(tisp, bisp);
  }

  /**
   * Given a disposition of a template/token and the targeting of of an aura, get whether the aura should apply.
   * @param {number} tisp   Token or template disposition.
   * @param {number} bisp   The targeting disposition of a babonus.
   * @returns {boolean}     Whether the targeting applies.
   */
  _matchDisposition(tisp, bisp) {
    if (bisp === AURA_TARGETS.ANY) {
      // If the bonus targets everyone, immediately return true.
      return true;
    } else if (bisp === AURA_TARGETS.ALLY) {
      // If the bonus targets allies, the roller and the source must match.
      return tisp === this.disposition;
    } else if (bisp === AURA_TARGETS.ENEMY) {
      // If the bonus targets enemies, the roller and the source must have opposite dispositions.
      const modes = CONST.TOKEN_DISPOSITIONS;
      const set = new Set([tisp, this.disposition]);
      return set.has(modes.FRIENDLY) && set.has(modes.HOSTILE);
    }
  }

  /**
   * Draw the collected auras, then remove them 5 seconds later or when this function is called again.
   */
  async _drawAuras() {
    const id = `babonus-${foundry.utils.randomID()}`;
    this._deletePixiAuras();
    for (const bonus of this.tokenBonuses.concat(this.tokenBonusesWithout)) {
      const range = dnd5e.utils.simplifyBonus(bonus.aura.range, bonus.getRollData({deterministic: true}));
      if (range === -1) continue;
      const shape = new PIXI.Graphics();
      shape.id = id;
      const token = bonus.token;
      const color = this.tokenBonuses.includes(bonus) ? "0x00FF00" : "0xFF0000";
      const pixels = range * canvas.dimensions.distancePixels + token.h / 2;
      shape.lineStyle(5, color, 0.5);
      shape.drawCircle(token.w / 2, token.h / 2, pixels);
      token.addChild(shape);
    }
    setTimeout(() => this._deletePixiAuras(id), 5000);
  }

  /**
   * Delete pixi auras. If an id is granted, delete only those with that id, otherwise
   * all pixi auras that have an id starting with 'babonus-'.
   * @param {string} [id=null]     The optional id.
   */
  _deletePixiAuras(id = null) {
    for (const token of canvas.tokens.placeables) {
      const children = token.children.filter(c => {
        return id ? (c.id === id) : c.id?.startsWith("babonus-");
      });
      for (const c of children) token.removeChild(c);
    }
  }
}
