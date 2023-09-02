import { CSVParser } from "../csv-parser/csv-parser.js";
import { HTMLElementHelper } from "../elements/elements.js";


class TranslationServer {
	/**
	 * 
	 * @param {CSVParser} CSVData 
	 * @param {String} lang 
	 */
	constructor(CSVData, lang = undefined) {
		this.boundAttributes = [];
		
		this._fallbacks = navigator.languages.slice(1).concat(["en", "fr"])
		this.setup(CSVData, lang);
	}
	
	/**
	 * 
	 * @param {CSVParser} CSVData 
	 * @param {String} lang 
	 */
	setup(CSVData, lang = undefined) {
		this.CSVData = CSVData;
		this.lang = lang == undefined ? navigator.language : lang;
	}
	
	
	set lang(newValue) {
		this._lang = newValue;
		document.querySelector("html").lang = this.nonDialect(newValue);
		this.refreshCachedLangs();
	}
	get lang() {
		return this._lang;
	}
	
	
	set fallbacks(newValue) {
		this.refreshCachedLangs();
		this._fallbacks = newValue;
	}
	get fallbacks() {
		if (this._fallbacks == undefined) {
			this._fallbacks = [];
		}
		return this._fallbacks;
	}
	
	
	refreshCachedLangs() {
		this._cachedLangs = [this.lang, ...this.fallbacks].reduce(
			(accumulator, currentValue) => {
				accumulator.push(currentValue);
				if (currentValue != this.nonDialect(currentValue)) {
					accumulator.push(this.nonDialect(currentValue));
				}
				return accumulator;
			},
			[]
		)
		this.onLangChanged();
	}
	get cachedLangs() {
		return this._cachedLangs;
	}
	
	
	/**
	 * 
	 * @param {String} lang 
	 */
	nonDialect(lang) {
		return lang.split("-")[0];
	}
	
	
	getDisponibleLangs() {
		return this.CSVData.data[0].slice(1);
	}
	
	
	/**
	 * 
	 * @param {String} key 
	 * @param {String} lang 
	 */
	trWithLang(key, lang) {
		return this.CSVData.getCellByHeaders(key, lang, key);
	}
	
	
	/**
	 * 
	 * @param {String} key 
	 */
	tr(key) {
		let translation = undefined;
		for (const lang of this.cachedLangs) {
			translation = this.CSVData.getCellByHeaders(key, this.nonDialect(lang), undefined);
			if (translation != undefined && translation != "") {
				return translation;
			}
		}
		return key;
	}
	// /**
	//  * 
	//  * @param {String} key 
	//  */
	// tr(key) {
	//	 let translation = this.CSVData.getCellByHeaders(key, this.nonDialect(this.lang), undefined);
	//	 if (translation != undefined && translation != "") {
	//		 return translation;
	//	 }
		
	//	 for (const lang of this.fallbacks) {
	//		 translation = this.CSVData.getCellByHeaders(key, this.nonDialect(lang), undefined);
	//		 if (translation != undefined && translation != "") {
	//			 return translation;
	//		 }
	//	 }
	//	 return key;
	// }
	
	
	bindAttribute(element, attribute, key) {
		this.boundAttributes.push({"element": element, "attribute": attribute, "key": key});
		element.setAttribute(attribute, this.tr(key));
	}
	
	onLangChanged() {
		for (const infos of this.boundAttributes) {
			infos.element.setAttribute(infos.attribute, this.tr(infos.key));
		}
	}
}
const translationServer = new TranslationServer();



class LangSelect extends HTMLElementHelper {
	constructor() {
		super("lang-select");
		
		this.querySelector("select").addEventListener(
			"change",
			(event) => {
				translationServer.lang = event.target.value;
			}
		);
	}
	
	
	/**
	 * 
	 * @param {Array<String>} langs 
	 */
	setLangs(langs) {
		let select = this.querySelector("select");
		select.innerHTML = "";
		for (const lang of langs) {
			let option = document.createElement("option");
			option.value = lang;
			option.innerHTML = translationServer.trWithLang(lang, lang);
			select.appendChild(option);
		}
		
		for (const lang of translationServer.cachedLangs) {
			select.selectedIndex = langs.findIndex(elem=>elem==lang);
			if (select.selectedIndex != -1) {
				break;
			}
		}
		
		if (select.selectedIndex == -1) {
			let option = document.createElement("option");
			option.value = translationServer.lang;
			option.innerHTML = translationServer.trWithLang(translationServer.lang, translationServer.lang);
			select.appendChild(option);
			select.selectedIndex = langs.length;
		}
	}
}
HTMLElementHelper.register("lang-select", LangSelect, "lib/patou/localization/lang-select/lang-select.html")



export { translationServer, TranslationServer, LangSelect }