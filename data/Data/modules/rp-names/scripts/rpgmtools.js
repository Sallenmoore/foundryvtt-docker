const rpHamburger = document.querySelector(".hamburger");
const rpNavDropdown = document.querySelector(".nav-dropdown");
const rpHeader = document.getElementById("RP");
const rpSpan = document.querySelector(".RP");

/**
 * Return a random element from rpList.
 *
 * @param {Array} rpList - Array of role-play elements
 * @return {string} Randomly selected role-play element
 */
const rpGetRandomRp = (rpList) => {
	const rpWords = rpList[Math.floor(Math.random() * rpList.length)];
	rp.dev(`RP Words: ${rpWords}`);
	return rpWords;
};

/**
 * Retrieves JSON data from the specified file.
 * @param {string} file - The path to the JSON file.
 * @returns {Promise} - A promise that resolves to the JSON data.
 */
const rpGetJson = async (file) => {
	let r = await fetch(file);
	let data = await r.json();
	return data;
};

/**
 * Periodically updates the RP (Role-Play) span with a random RP from the JSON file.
 */
const rpUpdateRp = async () => {
	const rpList = await rpGetJson("../json/rp.json");

	setInterval(async () => {
		rpSpan.classList.add("fade-out");
		await new Promise((resolve) => setTimeout(resolve, 2000));
		rpSpan.textContent = rpGetRandomRp(rpList);
		rpSpan.classList.remove("fade-out");
		rpSpan.classList.add("fade-in");
		await new Promise((resolve) => setTimeout(resolve, 2000));
		rpSpan.classList.remove("fade-in");
	}, 5000);
};

// Event listener for hamburger menu click
rpHamburger.addEventListener("click", () => {
	rpNavDropdown.classList.toggle("active");
});

rpUpdateRp();
