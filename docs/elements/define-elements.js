import { cached } from "../lib/patou/call-caching/call-caching.js";
import { decorateMethod } from "../lib/patou/decorator/decorator.js";
import { HTMLElementHelper, PropertyAttributeBindHelper, SHADOW_HOST_CLASS, TokenListHelper } from "../lib/patou/elements/elements.js";
import { HistoryHelper } from "../lib/patou/history-helper/history-helper.js";
import { TRANSLATION_KEY_ATTR, translationServer } from "../lib/patou/localization/localization.js";
import { Signal } from "../lib/patou/signal/signal.js";


const TAG_IMPLIES = {
	scratch: "web 2D",
	roblox: "windows xbox android iOS macOS 3D",
	numworks: "python",
	python: "windows linux macOS",
	coop: "multiplayer",
	"1vs1": "multiplayer",
};
const TAG_COMMAND = "!";
const TAG_ARGUMENT = ".";
const NO_IMPLIES_TAG = TAG_COMMAND + "no-implies";
const DIASBLE_IMPLY_TAG = TAG_COMMAND + "disable" + TAG_ARGUMENT;
const NOT_THAT_TAG = TAG_COMMAND + "not" + TAG_ARGUMENT;


class ProjectCard extends HTMLElementHelper {
	static _missingThumbnail = "/projects/assets/images/thumbnails/missing.svg";
	static _fallbackThumbnailsPath = "/projects/assets/images/thumbnails/fallbacks/";
	
	static fetchedImageURLs = {};
	
	/** @type {ExpandButton} */
	expandButton = this.getElementById("more-info");
	
	constructor() {
		super();
		
		this.querySelector("#thumbnail, #big-thumbnail, .thumbnail-as-bg").addEventListener("error", (event) => {
			if (this.thumbnail.startsWith(ProjectCard._fallbackThumbnailsPath)) {
				return;
			}
			this.useFallbackThumbnail();
		})
		
		translationServer.langChanged.bind(() => this.updateDate());
	}
	
	set dateFormat(newValue) {
		if (newValue == "") {
			newValue = undefined;
		} else if (typeof newValue === 'string' || newValue instanceof String) {
			newValue = JSON.parse(newValue);
		}
		this._dateFormat = newValue;
		this.updateDate();
	}
	get dateFormat() {
		return this._dateFormat;
	}
	
	getDateFormatAuto(timeSince1970ms) {
		let dateFormat = this.dateFormat;
		if (dateFormat != undefined) {
			return dateFormat;
		}
		
		const elapsedms = Date.now() - timeSince1970ms;
		if (elapsedms < 1000 * 60 * 60 * 24 * 6) { // dans la semaine
			return {month: "long", day: "numeric", weekday: "long"};
		} else if (elapsedms < 1000 * 60 * 60 * 24 * 32) { // 1 mois environ
			return {month: "long", day: "numeric"};
		} else if (elapsedms < 1000 * 60 * 60 * 24 * 365 * 2) { // 2 ans
			return {year: "numeric", month: "long"};
		} else {
			return {year: "numeric"};
		}
	}
	
	updateDate() {
		const timeSince1970ms = 1000 * this.unixtime;
		this.getElementById("date").textContent = new Date(timeSince1970ms).toLocaleDateString(translationServer.lang, this.getDateFormatAuto(timeSince1970ms));
		this.getElementById("date").title = new Date(timeSince1970ms).toLocaleDateString(translationServer.lang);
	}
	
	/** @type {Map<string, string>} */
	infoAsRow = new Map();
	
	/**
	 * Set all informations from a row of the projects.csv file.
	 * @param {Map<string, string>} row 
	 */
	setInfoFromRow(row) {
		this.infoAsRow = row;
		
		translationServer.bindAttribute(this, "project-title", row.get("title"));
		translationServer.bindAttribute(this, "desc", row.get("title") + "_DESC");
		
		this.tags.value = row.get("tags");
		this.unixtime = row.get("unixtime");
		this.fun = row.get("fun");
		this.dateFormat = row.get("date_format");
		this.projectID = row.get("id");
		
		this.fetchThumbnail(row);
		this.icon = row.get("icon");
		this.url = row.get("url") ? row.get("url")
			: row.get("tags").includes("scratch") ? `https://scratch.mit.edu/projects/${row.get("foreign_id")}/`
			: row.get("tags").includes("roblox") ? `https://www.roblox.com/games/${row.get("foreign_id")}/`
			: "/404.html";
		
		this.fetchSourceCode(row);
	}
	
	useFallbackThumbnail() {
		this.thumbnail = `${ProjectCard._fallbackThumbnailsPath}${this.projectID}.png`;
	}
	
	async fetchThumbnail(row) {
		this.thumbnail = (
			row.get("thumbnail")
			|| this.fetchThumbScratch(row)
			|| this.fetchThumbSite(row)
			|| this.fetchThumbItch(row)
			|| this.fetchThumbRoblox(row)
			|| (ProjectPage._missingThumbnail + "?ERROR_no_thumbnail_provided")
		);
	}
	
	fetchThumbScratch(row) {
		if (row.get("tags").includes("scratch")) {
			const imageURL = `https://uploads.scratch.mit.edu/get_image/project/${row.get("foreign_id")}_480x360.png`;
			ProjectCard.fetchedImageURLs[this.projectID] = imageURL;
			return imageURL;
		}
	}
	
	fetchThumbSite(row) {
		if (row.get("tags").includes("website") || row.get("url").includes("xorblo-doitus.github.io")) {
			return ProjectCard.getAboutURL(row, "thumbnail.png");
		}
	}
	
	fetchThumbItch(row) {
		if (row.get("url").includes("itch.io")) {
			this.setThumbItch(row.get("url"));
			return ProjectPage._missingThumbnail + "?INFO_fetching_from_itch";
		}
	}
	
	async setThumbItch(url) {
		this.thumbnail = await this.scrapThumbItch(url);
	}
	
	async scrapThumbItch(url) {
		const json = await ProjectCard.CORSProxyFetch(url + "/data.json");
		if (json === undefined) {
			this.useFallbackThumbnail();
			return;
		}
		// const json = await (await fetch(url + "/data.json")).json();
		const imageURL = json["cover_image"];
		ProjectCard.fetchedImageURLs[this.projectID] = imageURL;
		return ProjectCard.toCORSProxy(imageURL);
	}
	
	fetchThumbRoblox(row) {
		if (row.get("tags").includes("roblox")) {
			this.setThumbRoblox(row.get("foreign_id"));
			return ProjectPage._missingThumbnail + "?INFO_fetching_from_roblox";
		}
	}
	
	async setThumbRoblox(placeID) {
		this.thumbnail = await this.scrapThumbRoblox.call(this, placeID);
	}
	
	async scrapThumbRoblox(placeID) {
		const firstResponse = await ProjectCard.CORSProxyFetch(
			`https://apis.roblox.com/universes/v1/places/${placeID}/universe`
		);
		if (firstResponse === undefined) {
			this.useFallbackThumbnail();
			return;
		}
		const universeID = firstResponse.universeId;
		
		const secondResponse = await ProjectCard.CORSProxyFetch(
			`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeID}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`
		);
		if (secondResponse == undefined) {
			this.useFallbackThumbnail();
			return;
		}
		const imageURL = secondResponse.data[0].imageUrl;
		
		ProjectCard.fetchedImageURLs[this.projectID] = imageURL;
		return ProjectCard.toCORSProxy(imageURL);
	}
	
	static toCORSProxy(url) {
		return `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
	}
	
	/**
	 * @param {String} url The url to fetch
	 * @returns The JSON contained in the response, or undefined if it fails.
	 */
	static CORSProxyFetch(url) {
		return fetch(this.toCORSProxy(url)).then(resp => resp.ok?resp.json():undefined).catch(reason => undefined);
	}
	
	/**
	 * @param {Map<string, string>} row 
	 * @param {string} information 
	 */
	static getAboutURL(row, information) {
		let site = row.get("website") || row.get("url");
		
		if (site.includes("xorblo-doitus.github.io/projects") && location.href.includes("://localhost:5500")) {
			site = "http://localhost:5500/"
		}
		
		if (!site.endsWith("/")) {
			site += "/";
		}
		if (site.endsWith("/play/")) {
			site = site.slice(0, -5);
		}
		return `${site}about/${information}`;
	}
	
	/**
	 * @param {Map<string, string>} row 
	 */
	fetchSourceCode(row) {
		let sourceCode = row.get("source_code");
		if (!sourceCode) {
			if (this.url.includes("xorblo-doitus.github.io")) {
				const url = new URL(this.url);
				sourceCode = `https://github.com/xorblo-doitus/${url.pathname.split("/")[1]}/`;
			} else if (this.url.includes("scratch.mit.edu")) {
				sourceCode = `${this.url}editor/`;
			}
		}
		
		this.sourceCode = sourceCode || "";
	}
}

decorateMethod(ProjectCard, "scrapThumbRoblox", cached);
decorateMethod(ProjectCard, "scrapThumbItch", cached);

ProjectCard.bindPropertiesToAtributes([
	new PropertyAttributeBindHelper("fun", parseInt).setAttributeChangedCallback(function(newValue) {
		if (newValue == "-1") {
			this.getElementById("fun").style.display = "none";
		} else {
			this.getElementById("fun").style.display = "";
			this.getElementById("fun").textContent = newValue;
			this.getElementById("fun").style.backgroundColor = `color-mix(in hwb, var(--bad), var(--good) ${newValue}%)`;
		}
	}),
	new PropertyAttributeBindHelper("thumbnail").setAttributeChangedCallback(function(newValue) {
		if (newValue == "NONE") {
			for (const elem of this.querySelectorAll("#thumbnail, .thumbnail-as-bg")) {
				elem.style.display = "none";
			}
		} else {
			for (const elem of this.querySelectorAll("#thumbnail")) {
				elem.src = newValue;
				elem.style.display = "";
			}
			for (const elem of this.getElementsByClassName("thumbnail-as-bg")) {
				elem.style.setProperty("--thumbnail", `url(${newValue})`);
				elem.style.display = "";
			}
		}
	}),
	new PropertyAttributeBindHelper("icon").setAttributeChangedCallback(function(newValue) {
		for (const elem of this.querySelectorAll("#icon")) {
			elem.src = newValue;
		}
	}),
	new PropertyAttributeBindHelper("desc").setAttributeChangedCallback(function(newValue) {
		this.getElementById("desc").innerHTML = newValue.replaceAll("\n", "<br>");
	}),
	new PropertyAttributeBindHelper("title", undefined, undefined, "project-title").bindElements("#title"),
	new PropertyAttributeBindHelper("url").setAttributeChangedCallback(function(newValue) {
		for (const elem of this.getElementsByClassName("link")) {
			elem.href = newValue;
		}
	}),
	new TokenListHelper("tags").setChangedCallback(function(newValue) {
		if (!newValue.includes(NO_IMPLIES_TAG)) {
			for (const [tag, implies] of Object.entries(TAG_IMPLIES)) {
				if (!newValue.includes(`${DIASBLE_IMPLY_TAG}${tag}`)) {
					newValue = newValue.replace(tag, `${tag} ${implies}`);
				}
			}
			
			for (const tag of newValue.split(" ")) {
				if (tag.startsWith(NOT_THAT_TAG)) {
					newValue = newValue.replace(tag.slice(NOT_THAT_TAG.length), "")
				}
			}
			
			this.tags.value = newValue;
		}
		
		const tagsContainer = this.getElementById("tags");
		tagsContainer.innerHTML = "";
		for (const tag of this.tags) {
			if (tag.startsWith(TAG_COMMAND)) {
				continue;
			}
			let newTag = document.createElement("project-tag");
			newTag.tag = tag;
			tagsContainer.appendChild(newTag);
		}
	}),
	new PropertyAttributeBindHelper("unixtime", parseInt).setAttributeChangedCallback(function(newValue) {
		this.updateDate();
	}),
	new PropertyAttributeBindHelper("projectID", parseInt, undefined, "project-id"),
]).pushRegistering();


class ProjectPage extends ProjectCard {
	updateDate() {
		const date = new Date(1000 * this.unixtime);
		this.getElementById("date").textContent = `${date.toLocaleDateString(translationServer.lang, {year: "numeric", month: "long", day: "numeric"})} (${date.toLocaleDateString(translationServer.lang)})`;
	}
	
	setInfoFromRow(row) {
		super.setInfoFromRow(row);
		this.seeAlso.value = row.get("see_also");
		this.bigThumbnailPosition = row.get("big_thumb_pos");
	}
}
ProjectPage.bindPropertiesToAtributes([
	new PropertyAttributeBindHelper("source-code").setAttributeChangedCallback(function(newValue) {
		if (newValue) {
			this.getElementById("source-code").href = newValue;
			this.getElementById("source-code").style.display = "";
		} else {
			this.getElementById("source-code").style.display = "none";
		}
	}),
	new PropertyAttributeBindHelper("bigThumbnailPosition", undefined, undefined, "big-thumb-pos").setAttributeChangedCallback(function(newValue) {
		this.getElementById("big-thumbnail").style.backgroundPosition = newValue;
	}),
	new TokenListHelper("see-also").setChangedCallback(function(newValue) {
		for (const element of this.querySelectorAll(".see-also-link")) {
			element.remove();
		}
		
		if (newValue === "") {
			return;
		}
		
		for (const pair of newValue.split(" ")) {
			const [text, url] = pair.split(":");
			const newLink = document.createElement("a");
			newLink.href = url;
			if (url.startsWith("?projectPage=")) {
				newLink.addEventListener("click", (event) => {
					event.preventDefault();
					const projectId = url.slice(13);
					this.setInfoFromRow(
						document.querySelector(`project-card[project-id="${projectId}"]`).infoAsRow
					);
					HistoryHelper.updateURLParameter("projectPage", projectId);
				})
			}
			newLink.setAttribute("trkey", text);
			newLink.classList.add("see-also-link");
			this.getElementById("see-also").appendChild(newLink);
		}
	}),
]).pushRegistering();

class ProjectTag extends HTMLElementHelper {}
let tagAttibuteBinder = new PropertyAttributeBindHelper("tag").setAttributeChangedCallback(function(newValue) {
	this.getElementById("tag-text").setAttribute(TRANSLATION_KEY_ATTR, newValue.toUpperCase().replace(" ", "_"));
	this.getElementById("background").setAttribute("tag", newValue);
	translationServer.bindAttribute(this, "title", newValue.toUpperCase() + "_DESC");
})
ProjectTag.bindPropertiesToAtributes([tagAttibuteBinder]).pushRegistering();


class Filter extends HTMLElementHelper {
	modeChanged = new Signal;
	_mode = 0;
	
	/** @param {-1|0|1} newValue */
	set mode(newValue) {
		if (newValue != this._mode) {
			this._mode = newValue;
			this.includeCheckbox.checked = newValue == 1;
			this.excludeCheckbox.checked = newValue == -1;
			this.modeChanged.fireNoRecursion(this);
		}
	}
	get mode() {
		return this._mode;
	}
	
	constructor() {
		super();
		
		this.includeCheckbox = this.getElementById("include");
		this.excludeCheckbox = this.getElementById("exclude");
		
		this.link(this);
		
		for (const element of this.querySelectorAll("label, input")) {
			element.addEventListener("click", event => event.stopPropagation());
		}
	}
	
	createMimic() {
		if (!this.mimic) {
			this.mimic = this.cloneNode();
			this.mimic.link(this);
		}
		
		this.mimic.includeCheckbox.checked = this.includeCheckbox.checked;
		this.mimic.excludeCheckbox.checked = this.excludeCheckbox.checked;
		this.mimic.mode = this.mode;
		
		return this.mimic;
	}
	
	clearMimic() {
		this.mimic.parentElement.removeChild(this.mimic);
		this.mimic = undefined;
	}
	
	/**
	 * @param {TagFilter} other 
	 */
	link(tagFilter) {
		if (this.includeCallback) {
			this.includeCheckbox.removeEventListener("change", this.includeCallback);
		}
		if (this.excludeCallback) {
			this.excludeCheckbox.removeEventListener("change", this.excludeCallback);
		}
		if (this.switchCallback) {
			this.getElementById("background").removeEventListener("click", this.switchCallback);
		}
		
		this.includeCallback = function(event) {
			if (event.target.checked) {
				tagFilter.mode = 1;
			} else {
				tagFilter.mode = 0;
			}
		}
		this.includeCheckbox.addEventListener("change", this.includeCallback);
		
		this.excludeCallback = function(event) {
			if (event.target.checked) {
				tagFilter.mode = -1;
			} else {
				tagFilter.mode = 0;
			}
		}
		this.excludeCheckbox.addEventListener("change", this.excludeCallback);
		
		this.switchCallback = function(event) {
			tagFilter.mode = ((tagFilter.mode + 2) % 3) - 1;
		}
		this.getElementById("background").addEventListener("click", this.switchCallback);
	}
}
Filter.removeDefauktStyleSheet();

class TagFilter extends Filter {}
TagFilter.bindPropertiesToAtributes([
	tagAttibuteBinder,
]).addStyleSheetsLowPriority(
	"/projects/elements/project-tag/project-tag.css",
).pushRegistering();


class SortFilter extends Filter {}
SortFilter.bindPropertiesToAtributes([
	new PropertyAttributeBindHelper("sort-by").setAttributeChangedCallback(function(newValue) {
		this.getElementById("sort-text").setAttribute(TRANSLATION_KEY_ATTR, newValue.toUpperCase().replace(" ", "_"));
		this.getElementById("background").setAttribute("sort-by", newValue);
	})
]).pushRegistering();


class ExpandButton extends HTMLElementHelper {
	toggled = new Signal;
	
	constructor() {
		super();
		this.addEventListener("click", this.toggle);
	}
	
	toggle() {
		this.classList.toggle("open");
		this.toggled.fire(this.classList.contains("open"));
	}
}
ExpandButton.pushRegistering();


class ThemeSelect extends HTMLElementHelper {
	// /** @type {String} */
	// theme = "";
	/** @type {HTMLElement[]} */
	targets = [document.documentElement];
	/** @type {String} */
	static optionPrefix = "THEME_"
	
	constructor() {
		super();
		if (!window.themeChoosedFromURL) {
			window.themeChoosedFromURL = true;
			document.documentElement.setAttribute("theme", HistoryHelper.getParameter("theme") || "default");
		}
		
		this.select = this.querySelector("select");
		
		this.select.addEventListener(
			"change",
			(event) => {
				this.onSelected(event.target.value)
			}
		);
	}
	
	/**
	 * @param {String} value 
	 */
	onSelected(value) {
		for (const target of this.targets) {
			console.log("Updated theme to:", value);
			// console.log("Sat theme for", target);
			target.setAttribute("theme", value);
		}
		HistoryHelper.updateURLParameter("theme", value=="default"?undefined:value);
	}
	
	/**
	 * @param {Array<String>} names 
	 */
	setOptions(names) {
		this.select.innerHTML = "";
		for (const name of names) {
			this.createOption(name);
		}
		
		this.chooseBest();
	}

	/**
	 * @param {Array<String>} langs 
	 */
	chooseBest() {
		const options = [...this.options.values()];
		for (const target of this.targets) {
			const targetTheme = target.getAttribute("theme");
			this.select.selectedIndex = options.findIndex(elem=>elem==targetTheme);
			if (this.select.selectedIndex != -1) {
				this.onSelected(targetTheme);
				break;
			}
		}
	}

	/**
	 * @param {String} name 
	 * @returns {HTMLOptionElement}
	 */
	createOption(name) {
		let option = document.createElement("option");
		
		option.value = name;
		option.setAttribute("trkey", this.constructor.optionPrefix + name.toUpperCase())

		this.select.appendChild(option);
		
		return option;
	}
}
ThemeSelect.bindPropertiesToAtributes([
	new TokenListHelper("options").setChangedCallback(function (newValue) {
		this.setOptions(newValue.split(" "));
	}),
]).pushRegistering();


class TooltipReader extends HTMLElementHelper {
	_on = false;
	/** @param {boolean} newValue */
	set on(newValue) {
		if (this._on == newValue) {
			return;
		}
		this._on = newValue
		if (newValue) {
			document.addEventListener("mousemove", this.onMouseMove);
			this.toggleable.classList.add("on");
			this.tooltipShower.style.display = "";
		} else {
			document.removeEventListener("mousemove", this.onMouseMove);
			this.toggleable.classList.remove("on");
		}
	}
	get on() {
		return this._on;
	}
	
	constructor() {
		super();
		
		this.toggleable = this.getElementById("toggleable");
		this.tooltipShower = this.getElementById("tooltip-shower");
		this.backgroundDarkener = this.getElementById("background-darkener");
		
		this.onMouseMove = this.onMouseMove.bind(this);
		
		this.getElementById("on-off").addEventListener("click", (event) => {
			this.on = !this.on;
			if (this.on) {
				this.placeShower(event.clientX, event.clientY);
			}
		})
		
		this.backgroundDarkener.addEventListener("click", (event) => {
			if (this.backgroundDarkener.style.cursor == "pointer") {
				alert(this.tooltipShower.textContent);
			}
		});
		
		this.tooltipShower.style.display = "none";
	}
	
	onMouseMove(event) {
		let title = TooltipReader.getTitleAt(document, event.clientX, event.clientY)
		if (title) {
			this.tooltipShower.textContent = title;
			this.backgroundDarkener.style.cursor = "pointer";
		} else {
			this.backgroundDarkener.style.cursor = "help";
			this.tooltipShower.textContent = translationServer.tr("TOOLTIP_SHOWER");
		}
		
		this.placeShower(event.clientX, event.clientY);
	}
	
	placeShower(x, y) {
		const viewportWidth = document.documentElement.clientWidth;
		if (x < viewportWidth / 2) {
			this.tooltipShower.style.left = `calc(1ch + ${x}px)`;
			this.tooltipShower.style.right = "";
		} else {
			this.tooltipShower.style.left = "";
			this.tooltipShower.style.right = `calc(1ch + ${viewportWidth - x}px)`;
		}
		const viewportHeight = document.documentElement.clientHeight;
		if (y < viewportHeight / 2) {
			this.tooltipShower.style.top = `calc(1ch + ${y}px)`;
			this.tooltipShower.style.bottom = "";
		} else {
			this.tooltipShower.style.top = "";
			this.tooltipShower.style.bottom = `calc(1ch + ${viewportHeight - y}px)`;
		}
	}
	
	/**
	 * @param {Document} doc 
	 * @param {number} x 
	 * @param {number} y 
	 * @returns {string}
	 */
	static getTitleAt(doc, x, y) {
		const fetchedRoots = [doc];
		const elements = doc.elementsFromPoint(x, y);
		
		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];
			if (element.classList.contains(SHADOW_HOST_CLASS) && !fetchedRoots.includes(element.root)) {
				fetchedRoots.push(element.root);
				elements.splice(i, 1, ...element.root.elementsFromPoint(x, y).reduce(
					(accumulator, newValue) => {
						if (!elements.includes(newValue) || newValue == element) {
							accumulator.push(newValue);
						}
						return accumulator;
					},
					[]
				));
				i--;
			}
		}
		
		for (const element of elements) {
			const title = element.getAttribute("title");
			if (title) {
				return title;
			}
		}
		
		return "";
	}
}
TooltipReader.pushRegistering();

await HTMLElementHelper.awaitAllRegistering();

// Free useless things.
tagAttibuteBinder = null

export { ProjectCard }