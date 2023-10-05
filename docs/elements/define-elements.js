import { HTMLElementHelper, PropertyAttributeBindHelper } from "../lib/patou/elements/elements.js";
import { TokenList } from "../lib/patou/token-list/token-list.js";
import { TRANSLATION_KEY_ATTR, translationServer } from "../lib/patou/localization/localization.js";



class ProjectCard extends HTMLElementHelper {
	/**
	 * @type {TokenList}
	 */
	tagsList = new TokenList;
	/**
	 * @type {Boolean}
	 */
	listenTagsListChanged = true;
	
	constructor() {
		super();
		
		this.tagsList.addChangedListener(() => {
			this.setAttribute("tags", this.tagsList.value);
		});
		
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
	new PropertyAttributeBindHelper("tags").setAttributeChangedCallback(function(newValue) {
		if (this.listenTagsListChanged) {
			this.listenTagsListChanged = false;
			this.tagsList.value = newValue;
			this.listenTagsListChanged = true;
		}
		
		const tagsContainer = this.getElementById("tags");
		tagsContainer.innerHTML = "";
		for (const tag of this.tagsList) {
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


class ProjectTag extends HTMLElementHelper {
	static get observedAttributes() {
		return [
			"tag",
		];
	}
	
	set tag(newValue) { this.setAttribute("tag", newValue); }
	get tag() {return this.getAttribute("tag"); }
	
	
	/**
	 * 
	 * @param {String} attribute 
	 * @param {String} oldValue 
	 * @param {String} newValue 
	 */
	attributeChangedCallback(attribute, oldValue, newValue) {
		switch (attribute) {
			case "tag":
				this.getElementById("tag-text").setAttribute(TRANSLATION_KEY_ATTR, newValue.toUpperCase().replace(" ", "_"));
				this.getElementById("background").setAttribute("tag", newValue);
				break;
		}
	}
}
await HTMLElementHelper.register("project-tag", ProjectTag);


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
	 * 
	 * @param {CallableFunction} callback 
	 */
	addModeChangedListener(callback) {
		this.modeChangedListeners.push(callback);
	}
	
	/**
	 * 
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
await HTMLElementHelper.register("tag-filter", TagFilter);



await HTMLElementHelper.awaitAllRegistering();

export { ProjectCard }