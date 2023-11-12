import { CSVParser } from "../csv-parser/csv-parser.js";
import { HTMLElementHelper, SHADOW_HOST_CLASS } from "../elements/elements.js";
import { HistoryHelper } from "../history-helper/history-helper.js";
import { Signal } from "../signal/signal.js";


const TRANSLATION_KEY_ATTR = "trkey";
const TRANSLATED_ATTRIBUTES_ATTR = "trattributes";
const TRANSLATION_LANG_ATTR = "trlang";


class TranslationServer {
	langChanged = new Signal;
	
	/** @type {LangSelect[]} */
	selectors = [];
	
	/**
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
		HTMLElementHelper.elementCreated.bind((element) => {
			this.listenToAddedNodes(element.root);
		});
		
		onpopstate = _ => {
			this.chooseLangFromURL();
		}
		
		this.langChanged.bind(() => {
			for (const infos of this.boundAttributes) {
				infos.element.setAttribute(infos.attribute, this.tr(infos.key));
			}
			
			for (const langSelect of this.selectors) {
				langSelect.chooseBest();
			}
			
			this.trDOM();
		})
	}
	
	/**
	 * @param {CSVParser} CSVData 
	 * @param {String} lang 
	 */
	setup(CSVData, lang = null) {
		this.CSVData = CSVData;
		
		this.chooseLang(lang);
	}
	
	/**
	 * @param {String?} lang 
	 */
	chooseLangFromURL(lang = null) {
		if (lang == null) {
			lang = new URL(location.href).searchParams.get("lang");
		}
		this.chooseLang(lang);
	}
	
	/**
	 * @param {String?} lang 
	 */
	chooseLang(lang) {
		if (lang == "AUTO") {
			lang = null;
		}
		this.lang = lang == null ? navigator.language : lang;
	}
	
	
	set lang(newValue) {
		this._lang = newValue;
		document.querySelector("html").lang = newValue;
		
		HistoryHelper.updateURLParameter("lang", navigator.language == newValue ? null : newValue);
		
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
		this.langChanged.fire();
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
	
	
	bindAttribute(element, attribute, key) {
		const alreadyExistIndex = this.boundAttributes.findIndex((bind) => {bind.element == element && bind.attribute == attribute});
		if (alreadyExistIndex != -1) {
			this.boundAttributes.splice(alreadyExistIndex, 1);
		}
		this.boundAttributes.push({"element": element, "attribute": attribute, "key": key});
		if (this.CSVData != undefined) {
			element.setAttribute(attribute, this.tr(key));
		}
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
			for (const element of toScan.querySelectorAll(`[${TRANSLATED_ATTRIBUTES_ATTR}]`)) {
				const binds = element.getAttribute(TRANSLATED_ATTRIBUTES_ATTR).split(";").reduce(
					function(accumulator, value) {
						// Allow trailing semicolon and empty binds.
						if (value.length > 0) {
							accumulator.push(value);
						}
						return accumulator;
					},
					[]
				);
				
				for (const bind of binds) {
					this.bindAttribute(element, ...bind.split(":"));
				}
			}
		}
	}
	
	alreadyListening = [];
	listenToAddedNodes(DOM) {
		if (this.alreadyListening.includes(DOM)) {
			return;
		}
		
		this.alreadyListening.push(DOM);
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
	/** @type {Array<String>} */
	langs = [];
	
	constructor() {
		super();
		this.select = this.querySelector("select");
		
		this.select.addEventListener(
			"change",
			(event) => {
				const lang = event.target.value;
				if (lang == "AUTO") {
					translationServer.chooseLang(null);
				} else {
					translationServer.lang = lang;
				}
			}
		);
		
		translationServer.selectors.push(this);
	}
	
	
	/**
	 * @param {Array<String>} langs 
	 */
	setLangs(langs) {
		this.langs = langs;
		this.select.innerHTML = "";
		for (const lang of langs) {
			this.createOption(lang);
		}
		
		this.chooseBest();
		
		if (this.select.selectedIndex == -1) {
			this.createOption(translationServer.lang);
			this.select.selectedIndex = langs.length;
		}
		
		this.createOption("AUTO");
	}
	
	/**
	 * @param {Array<String>} langs 
	 */
	chooseBest() {
		for (const lang of translationServer.cachedLangs) {
			this.select.selectedIndex = this.langs.findIndex(elem=>elem==lang);
			if (this.select.selectedIndex != -1) {
				break;
			}
		}
	}
	
	/**
	 * @param {String} lang 
	 * @returns {HTMLOptionElement}
	 */
	createOption(lang) {
		let option = document.createElement("option");
		
		option.value = lang;
		if (lang == "AUTO") {
			option.textContent = translationServer.tr(lang);
		} else {
			let localizationProgress = translationServer.trWithLang("LOCALIZATION_PROGRESS", lang);
			if (localizationProgress != "100%") {
				option.textContent = `${translationServer.trWithLang(lang, lang)} (${localizationProgress})`;
			} else {
				option.textContent = translationServer.trWithLang(lang, lang);
			}
		}
		this.select.appendChild(option);
		
		return option;
	}
}
await LangSelect.removeDefauktStyleSheet()
	.setHTMLPath("lib/patou/localization/lang-select/lang-select.html")
	.register();


export { translationServer, TranslationServer, LangSelect, TRANSLATION_KEY_ATTR, TRANSLATION_LANG_ATTR };