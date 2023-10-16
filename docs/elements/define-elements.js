import { HTMLElementHelper, PropertyAttributeBindHelper, TokenListHelper } from "../lib/patou/elements/elements.js";
import { TokenList } from "../lib/patou/token-list/token-list.js";
import { TRANSLATION_KEY_ATTR, translationServer } from "../lib/patou/localization/localization.js";
import { Signal } from "../lib/patou/signal/signal.js";



class ProjectCard extends HTMLElementHelper {
	constructor() {
		super();
		
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
		this.getElementById("date").title = new Date(timeSince1970ms).toLocaleDateString();
	}
}

ProjectCard.bindPropertiesToAtributes([
	new PropertyAttributeBindHelper("fun", parseInt).setAttributeChangedCallback(function(newValue) {
		this.getElementById("fun").textContent = newValue;
		this.getElementById("fun").style.backgroundColor = `color-mix(in hwb, var(--bad), var(--good) ${newValue}%)`;
	}),
	new PropertyAttributeBindHelper("thumbnail").setAttributeChangedCallback(function(newValue) {
		this.getElementById("thumbnail").src = newValue;
	}),
	new PropertyAttributeBindHelper("desc").bindElements("#desc"),
	new PropertyAttributeBindHelper("title").bindElements("#title"),
	new PropertyAttributeBindHelper("url").setAttributeChangedCallback(function(newValue) {
		for (const elem of this.getElementsByClassName("link")) {
			elem.href = newValue;
		}
	}),
	new TokenListHelper("tags").setChangedCallback(function(newValue) {

		const tagsContainer = this.getElementById("tags");
		tagsContainer.innerHTML = "";
		for (const tag of this.tags) {
			let newTag = document.createElement("project-tag");
			newTag.tag = tag;
			translationServer.bindAttribute(newTag, "title", tag.toUpperCase() + "_DESC");
			tagsContainer.appendChild(newTag);
		}
	}),
	new PropertyAttributeBindHelper("unixtime", parseInt).setAttributeChangedCallback(function(newValue) {
		this.updateDate();
	}),
]).pushRegistering("project-card");


class ProjectTag extends HTMLElementHelper {}
ProjectTag.bindPropertiesToAtributes([
	new PropertyAttributeBindHelper("tag").setAttributeChangedCallback(function(newValue) {
		this.getElementById("tag-text").setAttribute(TRANSLATION_KEY_ATTR, newValue.toUpperCase().replace(" ", "_"));
		this.getElementById("background").setAttribute("tag", newValue);
	})
]).pushRegistering("project-tag");


class TagFilter extends ProjectTag {
	/** @type {String} */
	mode = "";
	modeChanged = new Signal;
	
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
				tagFilter.mode = "include";
				tagFilter.includeCheckbox.checked = true;
				tagFilter.excludeCheckbox.checked = false;
			} else {
				tagFilter.mode = "";
				tagFilter.includeCheckbox.checked = false;
			}
			tagFilter.modeChanged.fire();
		}
		this.includeCheckbox.addEventListener("change", this.includeCallback);
		
		this.excludeCallback = function(event) {
			if (event.target.checked) {
				tagFilter.mode = "exclude";
				tagFilter.includeCheckbox.checked = false;
				tagFilter.excludeCheckbox.checked = true;
			} else {
				tagFilter.mode = "";
				tagFilter.excludeCheckbox.checked = false;
			}
			tagFilter.modeChanged.fire();
		}
		this.excludeCheckbox.addEventListener("change", this.excludeCallback);
		
		this.switchCallback = function(event) {
			switch (tagFilter.mode) {
				case "":
					tagFilter.mode = "include";
					tagFilter.includeCheckbox.checked = true;
					tagFilter.excludeCheckbox.checked = false;
					break;
				case "include":
					tagFilter.mode = "exclude";
					tagFilter.includeCheckbox.checked = false;
					tagFilter.excludeCheckbox.checked = true;
					break;
				case "exclude":
					tagFilter.mode = "";
					tagFilter.includeCheckbox.checked = false;
					tagFilter.excludeCheckbox.checked = false;
					break;
				}
			tagFilter.modeChanged.fire();
		}
		this.getElementById("background").addEventListener("click", this.switchCallback);
	}
}
TagFilter.pushRegistering("tag-filter", undefined, undefined, ["/projects/elements/project-tag/project-tag.css"]);


class ExpandButton extends HTMLElementHelper {
	toggled = new Signal;
	
	constructor() {
		super();
		this.addEventListener("click", function(e) {
			this.classList.toggle("open");
			this.toggled.fire();
		});
	}
}
ExpandButton.pushRegistering("expand-button");

await HTMLElementHelper.awaitAllRegistering();

export { ProjectCard }