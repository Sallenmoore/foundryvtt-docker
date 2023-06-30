import CONSTANTS from "../constants.js";
import {
	isPlacementVertical,
	is_real_number,
	retrieveFirstImageFromJournalId,
	retrieveFirstTextFromJournalId
} from "../lib/lib.js";
import { noteControl } from "./NoteControl.js";
import { PinCushion } from "./PinCushion.js";
// import { PinCushionContainer } from "./PinCushionContainer.js";

/**
 * @class PinCushionHUD
 *
 * A HUD extension that shows the Note preview
 */
export class PinCushionHUDV2 extends BasePlaceableHUD {
	constructor(note, options) {
		super(note, options);
		this.data = note;
	}

	/**
	 * Assign the default options which are supported by the entity edit sheet
	 * @type {Object}
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "pin-cushion-hud-v2",
			classes: [...super.defaultOptions.classes, "pin-cushion-hud-v2"],
			// width: 400,
			// height: 200,
			minimizable: false,
			resizable: false,
			template: "modules/pin-cushion/templates/journal-preview-v2.html"
		});
	}

	/**
	 * Get data for template
	 */
	async getData() {
		const data = super.getData();
		const entry = this.object.entry;
		let entryName = data.text;
		let entryIsOwner = true;
		let entryId = undefined;
		let entryIcon = data.texture?.src;
		let entryContent = data.text;
		if (entry) {
			entryName = entry.name;
			entryId = entry.id;
			entryIsOwner = entry.isOwner ?? true;
			entryIcon = retrieveFirstImageFromJournalId(entryId, this.object.page?.id, false);
			if (!entryIcon && data.icon) {
				entryIcon = data.icon;
			}
			entryContent = retrieveFirstTextFromJournalId(entryId, this.object.page?.id, false);
			if (!entryContent && data.text) {
				entryContent = data.text;
			}
		}
		// TODO The getFlag was returning as 'not a function', for whatever reason...
		// const showImage = this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE);
		const showImage = getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.SHOW_IMAGE);
		const showImageExplicitSource = getProperty(
			this.object.document.flags[PinCushion.MODULE_NAME],
			PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE
		);

		let content;
		if (showImage) {
			const imgToShow = showImageExplicitSource ? showImageExplicitSource : entryIcon;
			if (imgToShow && imgToShow.length > 0) {
				content = await TextEditor.enrichHTML(`<img class='image' src='${imgToShow}' alt=''></img>`, {
					secrets: entryIsOwner,
					documents: true,
					async: true
				});
			} else {
				content = await TextEditor.enrichHTML(
					`<img class='image' src='${CONSTANTS.PATH_TRANSPARENT}' alt=''></img>`,
					{
						secrets: entryIsOwner,
						documents: true,
						async: true
					}
				);
			}
		} else {
			const previewTypeAdText = getProperty(
				this.object.document.flags[PinCushion.MODULE_NAME],
				PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET
			);
			const firstContent = entryContent;
			if (!previewTypeAdText) {
				content = await TextEditor.enrichHTML(firstContent, {
					secrets: entryIsOwner,
					documents: true,
					async: true
				});
			} else {
				const previewMaxLength = game.settings.get(PinCushion.MODULE_NAME, "previewMaxLength");
				const textContent = $(firstContent).text();
				content =
					textContent.length > previewMaxLength
						? `${textContent.substr(0, previewMaxLength)} ...`
						: textContent;
			}
		}

		let titleTooltip = entryName; // by default is the title of the journal
		const newtextGM = getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.PIN_GM_TEXT);
		if (game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "noteGM") && newtextGM) {
			titleTooltip = newtextGM;
		} else if (data.text && data.text !== titleTooltip) {
			titleTooltip = data.text;
		}

		// let bodyPlaceHolder = `<img class='image' src='${CONSTANTS.PATH_TRANSPARENT}' alt=''></img>`;

		data.tooltipId = this.object.id;
		data.title = titleTooltip;
		// data.body = content;
		// data.body = bodyPlaceHolder;

		const fontSize = game.settings.get(CONSTANTS.MODULE_NAME, "fontSize") || canvas.grid.size / 5;
		const maxWidth = game.settings.get(CONSTANTS.MODULE_NAME, "maxWidth") || 400;

		data.titleTooltip = titleTooltip;
		data.content = content;
		data.fontSize = fontSize;
		data.maxWidth = maxWidth;

		this.contentTooltip = await TextEditor.enrichHTML(`
          <div id="container" class="pin-cushion-hud-container" style="font-size:${fontSize}px; max-width:${maxWidth}px">
              <div id="header">
                  <h3>${titleTooltip}</h3>
              </div>
              <hr/>
              <div id="content">
                ${content}
              </div>
          </div>

      `);
		data.body = this.contentTooltip;
		return data;
	}

	setPosition() {
		// {left, top, width, height, scale}={}){
		if (!this.object) {
			return;
		}
		const fontSize = game.settings.get(CONSTANTS.MODULE_NAME, "fontSize") || canvas.grid.size / 5;
		const maxWidth = game.settings.get(CONSTANTS.MODULE_NAME, "maxWidth");

		const tooltipColor =
			getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_COLOR) ?? "";

		const tooltipPopupClass = tooltipColor
			? "pin-cushion-hud-tooltip-" + tooltipColor
			: "pin-cushion-hud-tooltip-default";

		const mapNoteXPosition = this.object.x;
		const mapNoteYPosition = this.object.y;
		const viewportWidth = visualViewport.width;
		const mapNoteIconWidth = this.object.controlIcon.width;
		const mapNoteIconHeight = this.object.controlIcon.height;
		const orientation = (this.object.getGlobalPosition()?.x ?? 0) < viewportWidth / 2 ? "right" : "left";

		// this.element.addClass(tooltipPopupClass);
		this.element.css({
			// background: tooltipColor ? tooltipColor : "white",
			// border: "1px solid var(--color-border-light-primary)",
			// "border-radius": "5px",
			// "box-shadow": "0 0 20px var(--color-shadow-dark)",
			// padding: "10px",
			width: "auto",
			"max-width": `${maxWidth}px`,
			height: "auto",
			top: mapNoteYPosition - mapNoteIconHeight / 2,
			left: orientation === "right" ? mapNoteXPosition + mapNoteIconWidth : mapNoteXPosition - mapNoteIconWidth,
			transform: orientation === "right" ? "" : "translateX(-100%)",
			"overflow-wrap": "break-word",
			// "text-align": "left",
			"font-size": fontSize,
			// color: "var(--color-text-dark-primary)",
			"pointer-events": "none"
		});
	}
}
