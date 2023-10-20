import { CSVParser } from "./lib/patou/csv-parser/csv-parser.js";
import { translationServer } from "./common/common.js";
import { Sorter } from "./lib/patou/sort/sort.js";
import { ProjectCard } from "./elements/define-elements.js";


const TAG_FILTERS = [];
const SORT_FILTERS = [];
// const TAG_FILTERS = document.getElementById("tag-filters");
const PROJECT_LIST = document.getElementById("project-list");

class ProjectSorter extends Sorter {
	// includedTags = ["arcade"]; // Testing values.
	// excludedTags = ["multiplayer"]; // Testing values.
	// currentComparingFunction = "date";
	// reverted = true; // Testing values.
	
	/**
	 * @type {Map<String, function(ProjectCard, ProjectCard): Number>}
	 */
	comparingFunctions = new Map([
		["title", (a, b) => { return a.title.localeCompare(b.title); }],
		["date", (a, b) => { return a.unixtime - b.unixtime; }],
		["fun", (a, b) => { return a.fun - b.fun; }],
	]);
	
	/**
	 * @param {ProjectCard} element 
	 * @returns {String[]}
	 */
	getTags(element) { return [...element.tags.values()]; }
	
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

const ALL_TAGS = new Set;

for (const row of parser) {
	let newCard = document.createElement("project-card");
	// console.log(row);
	translationServer.bindAttribute(newCard, "title", row.get("title"));
	translationServer.bindAttribute(newCard, "desc", row.get("title") + "_DESC");
	newCard.thumbnail = row.get("thumbnail");
	newCard.url = row.get("url");
	newCard.tags.value = row.get("tags");
	newCard.unixtime = row.get("unixtime");
	newCard.fun = row.get("fun");
	newCard.dateFormat = row.get("date_format");
	PROJECT_LIST.appendChild(newCard);
    
    for (const tag of newCard.tags.values()) {
        ALL_TAGS.add(tag);
    }
}

function onTagFiltersChanged() {
	PROJECT_SORTER.includedTags.splice(0);
	PROJECT_SORTER.excludedTags.splice(0);
	
	for (const tagFilter of TAG_FILTERS) {
		if (tagFilter.mode == 1) {
			PROJECT_SORTER.includedTags.push(tagFilter.tag);
		} else if (tagFilter.mode == -1) {
			PROJECT_SORTER.excludedTags.push(tagFilter.tag);
		}
	}
	
	PROJECT_SORTER.sort();
}

for (const tagFilter of document.querySelectorAll("tag-filter")) {
	tagFilter.modeChanged.bind(onTagFiltersChanged);
	tagFilter.modeChanged.bind(function() {
		if (tagFilter.mode == 0) {
			tagFilter.clearMimic();
		} else {
			if (tagFilter.mimic) {
				tagFilter.createMimic();
			} else {
				document.getElementById("tag-filters-sumup").appendChild(tagFilter.createMimic());
			}
		}
	})
	TAG_FILTERS.push(tagFilter);
}

function onSortFiltersChanged(sortFilter) {
	for (const otherSortFilter of SORT_FILTERS) {
		if (otherSortFilter != sortFilter) {
			otherSortFilter.mode = 0;
		}
	}
	
	if (sortFilter.mode == 0) {
		PROJECT_SORTER.currentComparingFunction = "";
		PROJECT_SORTER.reverted = false;
	} else {
		PROJECT_SORTER.currentComparingFunction = sortFilter.sortBy;
		PROJECT_SORTER.reverted = sortFilter.mode == -1;
	}
	PROJECT_SORTER.sort();
}

for (const sortFilter of document.querySelectorAll("sort-filter")) {
	sortFilter.modeChanged.bind(onSortFiltersChanged);
	SORT_FILTERS.push(sortFilter);
}


for (const filterContainer of document.getElementsByClassName("filters-container")) {
	const expandButton = filterContainer.querySelector("expand-button")
	if (expandButton) {
		expandButton.toggled.bind(() => {filterContainer.classList.toggle("open")});
	}
}


document.querySelector('sort-filter[sort-by="date"]').mode = -1;
translationServer.langChanged.bind(() => {PROJECT_SORTER.sort()});