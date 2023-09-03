import { HTMLElementHelper } from "../lib/patou/elements/elements.js";
import { TokenList } from "../lib/patou/token-list/token-list.js";


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
                    console.log(this.tagsList);
                    this.listenTagsListChanged = true;
                }
                
                const tagsContainer = this.getElementById("tags");
                tagsContainer.innerHTML = "";
                for (const tag of this.tagsList) {
                    let newTag = document.createElement("project-tag");
                    newTag.tag = tag;
                    tagsContainer.appendChild(newTag);
                }
                
                break;
		}
	}
}
await HTMLElementHelper.register("project-card", ProjectCard);


class ProjectTag extends HTMLElementHelper {
    constructor() {
        super("project-tag");
    }
    
    static get observedAttributes() {
		return [
            "tag",
        ];
	}
    
    set tag(newValue) { this.setAttribute("tag", newValue); }
    get tag() {return this.getAttribute("tag"); }
    
    
    attributeChangedCallback(attribute, oldValue, newValue) {
		switch (attribute) {
			case "tag":
				this.getElementById("tag-text").textContent = newValue;
				this.getElementById("background").setAttribute("tag", newValue);
                break;
		}
	}
}
await HTMLElementHelper.register("project-tag", ProjectTag);


export { ProjectCard }