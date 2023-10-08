import { HTMLElementHelper, PropertyAttributeBindHelper, TokenListHelper } from "../lib/patou/elements/elements.js";
import { TokenList } from "../lib/patou/token-list/token-list.js";
import { TRANSLATION_KEY_ATTR, translationServer } from "../lib/patou/localization/localization.js";



class ProjectCard extends HTMLElementHelper {
	constructor() {
		super();
		
		translationServer.addLangChangedListener(() => this.updateDate());
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
	modeChangedListeners = [];
	
	constructor() {
		super();
		
		const includeCheckbox = this.getElementById("include");
		const excludeCheckbox = this.getElementById("exclude");
		
		includeCheckbox.addEventListener("change", (event) => {
			if (event.target.checked) {
				this.mode = "include";
				excludeCheckbox.checked = false;
			} else {
				this.mode = "";
			}
			this.fireModeChanged();
		});
		excludeCheckbox.addEventListener("change", (event) => {
			if (event.target.checked) {
				this.mode = "exclude";
				includeCheckbox.checked = false;
			} else {
				this.mode = "";
			}
			this.fireModeChanged();
		});
		
		for (const element of this.querySelectorAll("label, input")) {
			element.addEventListener("click", event => event.stopPropagation());
		}
		
		this.getElementById("background").addEventListener("click", (event) => {
			switch (this.mode) {
				case "":
					this.mode = "include";
					includeCheckbox.checked = true;
					break;
				case "include":
					this.mode = "exclude";
					includeCheckbox.checked = false;
					excludeCheckbox.checked = true;
					break;
				case "exclude":
					this.mode = "";
					excludeCheckbox.checked = false;
					break;
				}
			this.fireModeChanged();
		});
	}
	
	/**
	 * @param {CallableFunction} callback 
	 */
	addModeChangedListener(callback) {
		this.modeChangedListeners.push(callback);
	}
	
	/**
	 * @param {CallableFunction} callback 
	*/
	removeModeChangedListener(callback) {
		const index = this.modeChangedListeners.indexOf(callback);
		if (index == -1) {
			return;
		}
		this.modeChangedListeners.splice(index, 1);
	}
	
	fireModeChanged() {
		for (const callback of this.modeChangedListeners) {
			callback();
		}
	}
}
await TagFilter.pushRegistering("tag-filter");



await HTMLElementHelper.awaitAllRegistering();

export { ProjectCard }