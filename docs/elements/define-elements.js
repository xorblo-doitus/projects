import { HTMLElementHelper } from "../lib/patou/elements/elements.js";
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
		super("project-card");
		
		this.tagsList.addChangedListener(() => {
			this.setAttribute("tags", this.tagsList.value);
		});
	}
	
	static get observedAttributes() {
		return [
			"thumbnail",
			"desc",
			"title",
			"url",
			"tags",
		];
	}
	
	attributeChangedCallback(attribute, oldValue, newValue) {
		switch (attribute) {
			case "thumbnail":
				this.getElementById("thumbnail").src = newValue;
				break;
			case "desc":
			case "title":
				this.getElementById(attribute).textContent = newValue;
				break;
			case "url":
				for (const elem of this.getElementsByClassName("link")) {
					elem.href = newValue;
				}
				break;
			case "tags":
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
				
				break;
		}
	}
}
await HTMLElementHelper.register("project-card", ProjectCard);


class ProjectTag extends HTMLElementHelper {
	constructor(tagName = "project-tag") {
		super(tagName);
	}
	
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
		super("tag-filter");
		
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


export { ProjectCard }