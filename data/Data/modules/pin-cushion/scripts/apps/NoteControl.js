import { PinCushion } from "./PinCushion.js";

let setting = (key) => {
	return game.settings.get(PinCushion.MODULE_NAME, key);
};

export async function noteControl(entity, wrapped, ...args) {
	const allowNote = setting("allow-note");
	const allowNotePassthrough = setting("allow-note-passthrough");
	const preventWhenPaused = setting("prevent-when-paused");

	// CHECK IF YOU ARE NOT ON NOTE LAYER
	const noteLayer = canvas.layers.find((layer) => layer.name === "NotesLayer");
	const activeLayer = canvas.layers.find((layer) => layer.active === true);
	if (noteLayer.active || !allowNote) {
		if (wrapped) {
			return wrapped(...args);
		} else {
			return;
		}
	}
	if (!entity) {
		if (wrapped) {
			return wrapped(...args);
		} else {
			return;
		}
	}

	if (allowNotePassthrough) {
		await new Promise((resolve) => {
			resolve();
		});
	}

	// const isRightClick = args[0].type === "rightclick" || args[0].type === "rightdown";
	// const isLeftClick = args[0].type === "leftclick" || args[0].type === "leftdown" || args[0].type === "mousedown";

	let triggerNote = function (note) {
		if (note && allowNote) {
			//check if this is associated with a Tile
			if (note.flags["monks-active-tiles"]?.entity) {
				if (note.flags["monks-active-tiles"].leftclick || note.flags["monks-active-tiles"].rightclick) {
					let entity = note.flags["monks-active-tiles"]?.entity;
					if (typeof entity == "string") {
						entity = JSON.parse(entity || "{}");
					}
					if (entity.id) {
						let notes = [note];

						let docs = [];
						if (entity.id.startsWith("tagger")) {
							if (game.modules.get("tagger")?.active) {
								let tag = entity.id.substring(7);

								let options = {};
								if (!entity.match || entity.match == "any") options.matchAny = true;
								if (entity.match == "exact") options.matchExactly = true;

								if (entity.scene == "_all") options.allScenes = true;
								else if (entity.scene !== "_active" && entity.scene) options.sceneId = entity.scene;

								docs = Tagger.getByTag(tag, options);

								if (entity.scene == "_all") docs = [].concat(...Object.values(docs));
							}
						} else if (entity.id == "within") {
							// Find the tile under this note
							for (let tile of note.parent.tiles) {
								let triggerData = tile.flags["monks-active-tiles"] || {};
								let triggers = MonksActiveTiles.getTrigger(triggerData?.trigger);
								if (
									triggerData?.active &&
									triggerData.actions?.length > 0 &&
									triggers.includes("note")
								) {
									let pt1 = { x: note.c[0], y: note.c[1] };
									let pt2 = { x: note.c[2], y: note.c[3] };
									if (tile.pointWithin(pt1) || tile.pointWithin(pt2)) docs.push(tile);
									else {
										let collisions = tile.getIntersections(pt1, pt2);
										if (collisions.length) {
											docs.push(tile);
										}
									}
								}
							}
						} else {
							let parts = entity.id.split(".");

							const [docName, docId] = parts.slice(0, 2);
							parts = parts.slice(2);
							const collection = CONFIG[docName].collection.instance;
							let entry = collection.get(docId);

							while (entry && parts.length > 1) {
								const [embeddedName, embeddedId] = parts.slice(0, 2);
								entry = entry.getEmbeddedDocument(embeddedName, embeddedId);
								parts = parts.slice(2);
							}

							docs = [entry];
						}

						if (docs.length) {
							let results = {};
							for (let doc of docs) {
								let triggerData = doc.flags["monks-active-tiles"];
								if (triggerData?.active) {
									if (
										preventWhenPaused &&
										game.paused &&
										!game.user.isGM &&
										triggerData.allowpaused !== true
									)
										return;

									//check to see if this trigger is restricted by control type
									if (
										(triggerData.controlled == "gm" && !game.user.isGM) ||
										(triggerData.controlled == "player" && game.user.isGM)
									)
										return;

									let tokens = canvas.tokens.controlled.map((t) => t.document);
									//check to see if this trigger is per token, and already triggered
									if (triggerData.pertoken) {
										tokens = tokens.filter((t) => !doc.hasTriggered(t.id)); //.uuid
										if (tokens.length == 0) return;
									}

									let result =
										doc.trigger({
											tokens: tokens,
											method: "note",
											options: { notes: notes, change: note._notechange || "checklock" }
										}) || {};
									mergeObject(results, result);
								}
							}
							return results;
						}
					}
				}
			}
		}
	};
	if (wrapped) {
		let result = wrapped(...args);
		if (result instanceof Promise) {
			return result.then((note) => {
				let w = note || args[0]?.target?.note?.document;
				if (w && w instanceof WallDocument) {
					triggerNote(w);
					delete w._notechange;
				}
			});
		} else {
			if (this.note) {
				triggerNote(this.note.document);
				delete this.note.document._notechange;
			}
			return result;
		}
	} else {
		// triggerNote(entity.document);
		delete entity.document._notechange;
		return;
	}
}
