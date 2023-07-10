const VERSION = "1.13.0.1";
const CACHE_NAME = "rp-names-cache";
const CACHE_VERSION = VERSION;
const CACHE_ID = `${CACHE_NAME}-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
	"./",
	"./index.html",
	"./rp-names.html",
	"./styles/styles.css",
	"./styles/media-queries.css",
	"./json/adjectives.js",
	"./json/languages.js",
	"./json/genres.js",
	"./json/customTypes.js",
	"./json/rp.json",
	"./json/firstNames.js",
	"./json/lastNames.js",
	"./json/races.js",
	"./scripts/rp-names.js",
	"./scripts/rpgmtools.js",
	"./scripts/generateRandomName.js",
];

const MAX_AGE = 3 * 24 * 60 * 60; // 3 days

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_ID).then((cache) => {
			console.log("Opened cache:", CACHE_ID);
			return cache.addAll(FILES_TO_CACHE).catch((error) => {
				console.error("Failed to cache:", error);
			});
		})
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (
						cacheName.startsWith(CACHE_NAME) &&
						cacheName !== CACHE_ID
					) {
						console.log("Deleting old cache:", cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);

	// This ensures that the new service worker takes control immediately
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
	// Exclude chrome-extension URLs
	if (event.request.url.startsWith("chrome-extension://")) {
		return false;
	}

	event.respondWith(
		// Try fetching the resource from the network
		fetch(event.request)
			.then((response) => {
				// If fetch is successful, update the cache and return the response
				return caches.open(CACHE_ID).then((cache) => {
					cache.put(event.request, response.clone());
					return response;
				});
			})
			// If fetch fails (e.g., no internet connection), return the cached version
			.catch(() => caches.match(event.request))
	);
});

self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});
