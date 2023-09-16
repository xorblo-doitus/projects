import { CSVParser } from "../csv-parser/csv-parser.js";
import { HTMLElementHelper, SHADOW_HOST_CLASS } from "../elements/elements.js";


const TRANSLATION_KEY_ATTR = "trkey";
const TRANSLATION_LANG_ATTR = "trlang";


class TranslationServer {
	/**
	 * 
	 * @param {CSVParser} CSVData 
	 * @param {String} lang 
	 */
	constructor(CSVData, lang = null) {
		this.boundAttributes = [];
		
		this._fallbacks = navigator.languages.slice(1).concat(["en", "fr"]);
		this.setup(CSVData, lang);
		
		this.trDOM();
		for (const root of HTMLElementHelper.getRootsRecursive(document)) {
			this.listenToAddedNodes(root);
		}
	}
	
	/**
	 * 
	 * @param {CSVParser} CSVData 
	 * @param {String} lang 
	 */
	setup(CSVData, lang = null) {
		this.CSVData = CSVData;
		if (lang == null) {
			lang = new URL(location.href).searchParams.get("lang");
		}
		this.lang = lang == null ? navigator.language : lang;
	}
	
	
	set lang(newValue) {
		this._lang = newValue;
		document.querySelector("html").lang = newValue;
		
		const newURL = new URL(location.href);
		if (navigator.language == newValue) {
			newURL.searchParams.delete("lang");
		} else {
			newURL.searchParams.set("lang", newValue);
		}
		history.pushState(undefined, "", newURL.toString());
		
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
		).reduce(
			(accumulator, currentValue) => {
				if (!accumulator.includes(currentValue)) {
					accumulator.push(currentValue);
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
		if (this.CSVData == undefined) {
			return;
		}
		
		return this.CSVData.getCellByHeaders(key, lang, key);
	}
	
	
	/**
	 * 
	 * @param {String} key 
	 */
	tr(key) {
		if (this.CSVData == undefined) {
			return;
		}
		
		let translation = undefined;
		for (const lang of this.cachedLangs) {
			translation = this.CSVData.getCellByHeaders(key, lang, undefined);
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
	
	/** @type {CallableFunction[]} */
	langChangedCallbacks = [];
	
	/**
	 * @param {CallableFunction} callback 
	 */
	addLangChangedListener(callback) {
		this.langChangedCallbacks.push(callback);
	}
	
	/**
	 * @param {CallableFunction} callback 
	 */
	removeLangChangedListener(callback) {
		const index = this.langChangedCallbacks.indexOf(callback);
		if (index == -1) {
			return;
		}
		this.langChangedCallbacks.splice(index, 1);
	}
	
	onLangChanged() {
		for (const infos of this.boundAttributes) {
			infos.element.setAttribute(infos.attribute, this.tr(infos.key));
		}
		
		for (const callback of this.langChangedCallbacks) {
			callback();
		}
		
		this.trDOM();
	}
	
	
	trElement(element) {
		const lang = element.getAttribute(TRANSLATION_LANG_ATTR);
		if (lang == null) {
			element.textContent = this.tr(element.getAttribute(TRANSLATION_KEY_ATTR));
		} else {
			element.textContent = this.trWithLang(element.getAttribute(TRANSLATION_KEY_ATTR), lang);
		}
	}
	
	trDOM(DOM = document) {
		for (const toScan of HTMLElementHelper.getRootsRecursive(DOM)) {
			for (const element of toScan.querySelectorAll(`[${TRANSLATION_KEY_ATTR}]`)) {
				this.trElement(element);
			}
		}
	}
	
	listenToAddedNodes(DOM) {
		const pseudoThis = this;
		
		new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				for(const addedNode of  mutation.addedNodes) {
					if (addedNode instanceof HTMLElement) {
						if (addedNode.hasAttribute(TRANSLATION_KEY_ATTR)) {
							pseudoThis.trElement(addedNode);
						}
						if (addedNode.classList.contains(SHADOW_HOST_CLASS)) {
							pseudoThis.trDOM(addedNode.shadowRoot);
							pseudoThis.listenToAddedNodes(addedNode.shadowRoot);
						}
					}
				}
			})
		}).observe(DOM, {
			childList: true,
			subtree: true,
		});
	}
}
const translationServer = new TranslationServer();



class LangSelect extends HTMLElementHelper {
	constructor() {
		super("lang-select");
		this.select = this.querySelector("select");
		
		this.select.addEventListener(
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
		this.select.innerHTML = "";
		for (const lang of langs) {
			this.createOption(lang);
		}
		
		for (const lang of translationServer.cachedLangs) {
			this.select.selectedIndex = langs.findIndex(elem=>elem==lang);
			if (this.select.selectedIndex != -1) {
				break;
			}
		}
		
		if (this.select.selectedIndex == -1) {
			this.createOption(translationServer.lang);
			this.select.selectedIndex = langs.length;
		}
	}
	
	/**
	 * 
	 * @param {String} lang 
	 * @returns {HTMLOptionElement}
	 */
	createOption(lang) {
		let option = document.createElement("option");
		
		option.value = lang;
		option.innerHTML = translationServer.trWithLang(lang, lang);
		this.select.appendChild(option);
		
		return option;
	}
}
HTMLElementHelper.register("lang-select", LangSelect, "lib/patou/localization/lang-select/lang-select.html");



export { translationServer, TranslationServer, LangSelect, TRANSLATION_KEY_ATTR, TRANSLATION_LANG_ATTR };