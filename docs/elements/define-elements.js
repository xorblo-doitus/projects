import { HTMLElementHelper } from "../lib/patou/elements/elements.js";


class ProjectCard extends HTMLElementHelper {
    constructor() {
        super("project-card");
    }
    
    static get observedAttributes() {
		return [
            "thumbnail",
            "desc",
            "title",
            "url",
        ];
	}
    
    attributeChangedCallback(attribute, oldValue, newValue) {
		switch (attribute) {
			case "thumbnail":
				this.getElementById("thumbnail").src = newValue
                break;
            case "desc":
            case "title":
                this.getElementById(attribute).textContent = newValue
                break;
            case "url":
                for (const elem of this.getElementsByClassName("link")) {
                    elem.href = newValue
                }
                break;
		}
	}
}
await HTMLElementHelper.register("project-card", ProjectCard)


export { ProjectCard }