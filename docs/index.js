import { CSVParser } from "./lib/patou/csv-parser/csv-parser.js";
import { translationServer } from "./common/common.js";

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
    document.getElementById("project-list").appendChild(newCard);
}
// end = performance.now();

// console.log(`Iteration took ${end - start} milliseconds`)