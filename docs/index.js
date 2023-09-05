import { CSVParser } from "./lib/patou/csv-parser/csv-parser.js";
import { translationServer } from "./common/common.js";
import { Sorter } from "./lib/patou/sort/sort.js";
import { ProjectCard } from "./elements/define-elements.js";

const PROJECT_LIST = document.getElementById("project-list");

class ProjectSorter extends Sorter {
    // includedTags = ["arcade"]; // Testing values.
    // excludedTags = ["multiplayer"]; // Testing values.
    
    /**
     * @param {ProjectCard} element 
     * @returns {String[]}
     */
    getTags(element) { return [...element.tagsList.values()] }
    
    /**
	 * @returns {ProjectCard[]}
	 */
	getElements() {
        const result = [];
        for (const childNode of PROJECT_LIST.childNodes) {
            if (childNode instanceof ProjectCard) {
                result.push(childNode);
            }
        }
		return result;
	}
    
    /**
     * @param {ProjectCard[]} newOrder 
     */
    onSorted(newOrder) {
        for (const element of this.lastDropped) {
            element.style.display = "none";
        }
        for (const [idx, element] of newOrder.entries()) {
            element.style.order = idx;
        }
    }
}

var text = (await fetch("assets/data/projects.csv").then((response) => {return response.text()}));

// var start = performance.now()
var parser = new CSVParser().parseText(text)
// var end = performance.now()

// console.log(`Call to parseText took ${end - start} milliseconds`)

// console.log(parser.data)
// start = performance.now();
for (const row of parser) {
    let newCard = document.createElement("project-card");
    // console.log(row);
    translationServer.bindAttribute(newCard, "title", row.get("title"));
    translationServer.bindAttribute(newCard, "desc", row.get("title") + "_DESC");
    newCard.setAttribute("thumbnail", row.get("thumbnail"));
    newCard.setAttribute("url", row.get("url"));
    newCard.setAttribute("tags", row.get("tags"));
    PROJECT_LIST.appendChild(newCard);
}
// end = performance.now();

// console.log(`Iteration took ${end - start} milliseconds`)


new ProjectSorter().sort();