import { CSVParser } from "./lib/patou/csv-parser/csv-parser.js";
import { translationServer } from "./common/common.js";
import { Sorter } from "./lib/patou/sort/sort.js";
import { ProjectCard } from "./elements/define-elements.js";


const FILTERS = document.getElementById("filters");
const PROJECT_LIST = document.getElementById("project-list");

class ProjectSorter extends Sorter {
	// includedTags = ["arcade"]; // Testing values.
	// excludedTags = ["multiplayer"]; // Testing values.
	
	comparingFunctions = new Map([
		["title", (a, b) => { return a.title.localeCompare(b.title); }],
	]);
	currentComparingFunction = "";
	
	/**
	 * @param {ProjectCard} element 
	 * @returns {String[]}
	 */
	getTags(element) { return [...element.tagsList.values()]; }
	
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
			element.style.display = "";
		}
	}
}

const PROJECT_SORTER = new ProjectSorter();

var text = (await fetch("assets/data/projects.csv").then((response) => {return response.text()}));

// var start = performance.now()
var parser = new CSVParser().parseText(text)
// var end = performance.now()

// console.log(`Call to parseText took ${end - start} milliseconds`)

// console.log(parser.data)
// start = performance.now();
const ALL_TAGS = new Set;

for (const row of parser) {
	let newCard = document.createElement("project-card");
	// console.log(row);
	translationServer.bindAttribute(newCard, "title", row.get("title"));
	translationServer.bindAttribute(newCard, "desc", row.get("title") + "_DESC");
	newCard.setAttribute("thumbnail", row.get("thumbnail"));
	newCard.setAttribute("url", row.get("url"));
	newCard.setAttribute("tags", row.get("tags"));
	newCard.setAttribute("unixtime", row.get("unixtime"));
	newCard.dateFormat = row.get("date_format");
	PROJECT_LIST.appendChild(newCard);
    
    for (const tag of newCard.tagsList.values()) {
        ALL_TAGS.add(tag);
    }
}

const TAG_FILTERS = [];
function onFiltersChanged() {
	PROJECT_SORTER.includedTags.splice(0);
	PROJECT_SORTER.excludedTags.splice(0);
	
	for (const tagFilter of FILTERS.childNodes) {
		if (tagFilter.mode == "include") {
			PROJECT_SORTER.includedTags.push(tagFilter.tag);
		} else if (tagFilter.mode == "exclude") {
			PROJECT_SORTER.excludedTags.push(tagFilter.tag);
		}
	}
	
	PROJECT_SORTER.sort();
}

for (const tag of ALL_TAGS.values()) {
    let newTagFilter = document.createElement("tag-filter");
    newTagFilter.tag = tag;
	newTagFilter.addModeChangedListener(onFiltersChanged);
    FILTERS.appendChild(newTagFilter);
}
// end = performance.now();

// console.log(`Iteration took ${end - start} milliseconds`)


PROJECT_SORTER.sort();
translationServer.addLangChangedListener(() => {PROJECT_SORTER.sort()});