import { CSVParser } from "./lib/patou/csv-parser/csv-parser.js";
import { translationServer } from "./common/common.js";
import { Sorter } from "./lib/patou/sort/sort.js";
import { ProjectCard } from "./elements/define-elements.js";
import { HistoryHelper } from "./lib/patou/history-helper/history-helper.js";


const TAG_FILTERS = [];
const SORT_FILTERS = [];
const MORE_INFO = document.getElementById("more-info");
let lastOpenedProject = null;
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
	
	fuseOptions = {
		threshold: 0.6,
		keys: [
			{
				name: "title",
			},
			{
				name: "desc",
				weight: 0.3,
			},
		],
	};
	
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

// const ALL_TAGS = new Set;


MORE_INFO.querySelector("project-page").expandButton.toggled.bind(function(open) {
	MORE_INFO.classList.toggle("open");
	if (!open) {
		lastOpenedProject.expandButton.toggle();
		HistoryHelper.updateURLParameter("projectPage", null);
	}
})

for (const row of parser) {
	/** @type {ProjectCard} */
	let newCard = document.createElement("project-card");
	
	newCard.setInfoFromRow(row);
	
	newCard.expandButton.toggled.bind(function(open) {
		if (open) {
			lastOpenedProject = newCard;
			HistoryHelper.updateURLParameter("projectPage", newCard.projectID);
			MORE_INFO.querySelector("project-page").setInfoFromRow(row);
			MORE_INFO.querySelector("project-page").expandButton.toggle();
		}
	})
	
	if (HistoryHelper.getParameter("projectPage") == newCard.projectID) {
		newCard.expandButton.toggle();
	}
	
	PROJECT_LIST.appendChild(newCard);
    
    // for (const tag of newCard.tags.values()) {
    //     ALL_TAGS.add(tag);
    // }
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
	
	HistoryHelper.updateURLParameter("included-tags", PROJECT_SORTER.includedTags);
	HistoryHelper.updateURLParameter("excluded-tags", PROJECT_SORTER.excludedTags);
}

let startingIncludedTags = HistoryHelper.getParameter("included-tags")
if (startingIncludedTags == null) {
	startingIncludedTags = [];
} else {
	startingIncludedTags = startingIncludedTags.split("~");
}

let startingExcludedTags = HistoryHelper.getParameter("excluded-tags")
if (startingExcludedTags == null) {
	startingExcludedTags = [];
} else {
	startingExcludedTags = startingExcludedTags.split("~");
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
	
	if (startingIncludedTags.includes(tagFilter.tag)) {
		tagFilter.mode = 1;
	} else if (startingExcludedTags.includes(tagFilter.tag)) {
		tagFilter.mode = -1;
	}
}

let ignoringSortFilters = false;
function onSortFiltersChanged(sortFilter) {
	if (ignoringSortFilters) {
		return;
	}
	ignoringSortFilters = true;
	
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
		// document.getElementById("search-bar").value = "";
	}
	PROJECT_SORTER.sort();
	
	if (PROJECT_SORTER.currentComparingFunction == "date" && PROJECT_SORTER.reverted) {
		HistoryHelper.updateURLParameter("sortBy", null);
		HistoryHelper.updateURLParameter("sortRevert", null);
	} else {
		HistoryHelper.updateURLParameter("sortBy", PROJECT_SORTER.currentComparingFunction ? PROJECT_SORTER.currentComparingFunction : null);
		HistoryHelper.updateURLParameter("sortRevert", PROJECT_SORTER.reverted ? "" : null);
	}
	
	ignoringSortFilters = false;
}

for (const sortFilter of document.querySelectorAll("sort-filter")) {
	sortFilter.modeChanged.bind(onSortFiltersChanged);
	SORT_FILTERS.push(sortFilter);
}

document.getElementById("search-bar").addEventListener("input", function(event) {
	PROJECT_SORTER.query = event.target.value;
	PROJECT_SORTER.sort();
});


for (const filterContainer of document.getElementsByClassName("filters-container")) {
	const expandButton = filterContainer.querySelector("expand-button")
	if (expandButton) {
		expandButton.toggled.bind(() => {filterContainer.classList.toggle("open")});
	}
}

if (HistoryHelper.getParameter("sortBy") == null && HistoryHelper.getParameter("sortRevert") == null) {
	document.querySelector('sort-filter[sort-by="date"]').mode = -1;
} else if (HistoryHelper.getParameter("sortBy") != "") {
	document.querySelector(
		`sort-filter[sort-by="${ HistoryHelper.getParameter("sortBy") }"]`
	).mode = HistoryHelper.getParameter("sortRevert") == null ? 1 : -1;
}
translationServer.langChanged.bind(() => {PROJECT_SORTER.sort()});

new ResizeObserver(() => {
	document.getElementById('top-bar-spacer').style.height = document.getElementById("top-bar").offsetHeight + "px";
	document.getElementById('more-info').style.top = document.getElementById("top-bar").offsetHeight + "px";
}).observe(document.getElementById("top-bar"));

window._stop_fake_load = true;