import { translationServer } from "../lib/patou/localization/localization.js";
import { ProjectCard } from "../elements/define-elements.js";
import { CSVParser } from "../lib/patou/csv-parser/csv-parser.js";




translationServer.setup(
	new CSVParser().parseText(await fetch("assets/data/translations.csv").then(response => response.text()))
);

for (const langSelect of document.querySelectorAll("lang-select")) {
	langSelect.setLangs(translationServer.getDisponibleLangs());
}


export { translationServer };