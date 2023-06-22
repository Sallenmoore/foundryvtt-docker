// The base token path
const TOKEN_PATH = "modules/caeora-maps-tokens-assets/assets/tokens/Monster_Manual_Tokens/";

// A cached list of available tokens
let availableTokens = new Set();

// Store a reference to whether artwork is being replaced
let replaceArtwork = false;

/**
 * Initialize the Caeora module on Foundry VTT init
 */
function initialize() {

	// Only support the dnd5e system for this functionality
	if ( game.system.id !== "dnd5e" ) return;

	// Register token replacement setting
	game.settings.register("caeora-maps-tokens-assets", "replaceArtwork", {
		name: "Auto-Replace Actor Artwork",
		hint: "Automatically replace the portrait and token artwork for a NPC Actor when that actor is imported into the game world.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		onChange: replace => replaceArtwork = replace
	});

	// Assign the current saved value if there is one
	replaceArtwork = game.settings.get("caeora-maps-tokens-assets", "replaceArtwork") ?? false;

	// Handle actor replacement, if the setting is enabled
	Hooks.on("preCreateActor", replaceActorArtwork);

	// Cache available tokens
	cacheAvailableTokens();
}

/**
 * Cache the set of available tokens which can be used to replace artwork to avoid repeated filesystem requests
 */
async function cacheAvailableTokens() {
	availableTokens.clear();
	const crs = await FilePicker.browse("data", TOKEN_PATH);
	for ( let cr of crs.dirs ) {
		const tokens = await FilePicker.browse("data", cr+"/with-shadows/");
		tokens.files.forEach(t => availableTokens.add(t));
	}
}

/**
 * Replace the artwork for a NPC actor with the version from this module
 */
function replaceActorArtwork(actor, data, options, userId) {
	if ( !replaceArtwork || (actor.type !== "npc") || !hasProperty(actor, "system.details.cr") ) return;
	const cleanName = actor.name.replace(/ /g, "");
	const crDir = String(getProperty(actor, "system.details.cr")).replace(".", "-");
	let tokenSrc;

	// Special handling for Forge :( :(
	const isForge = (typeof(ForgeVTT) !== "undefined") && ForgeVTT.usingTheForge;
	if ( isForge ) tokenSrc = availableTokens.find(url => url.endsWith(`cr${crDir}/with-shadows/${cleanName}.webp`));

	// Otherwise use the standard module path
	else {
		const tokenPath = `${TOKEN_PATH}cr${crDir}/with-shadows/${cleanName}.webp`;
		tokenSrc = availableTokens.has(tokenPath) ? tokenPath : null;
	}

	// Update the actor if we have a matching token
	if ( tokenSrc ) {
		actor.updateSource({"img": tokenSrc, "prototypeToken.texture.src": tokenSrc});
	}
}

// Initialize module
Hooks.on("init", initialize);
