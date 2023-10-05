const SHADOW_HOST_CLASS = "shadow-host";


class PropertyAttributeBindHelper {
	/** @type {string} */
	name = null;
	/** @type {string} */
	attributeName = null;
	/** @type {PropertyDescriptor} */
	propertyDescriptor = null;
	/** @type {(newValue: string) => void}} */
	attributeChangedCallback = null;
	/** @type {(newValue: string) => void}} */
	elementBindingBefore = null;
	/** @type {(newValue: string) => void}} */
	elementBindingAfter = null;
	
	
	/**
	 * 
	 * @param {String} name 
	 * @param {(attributeValue: string) => *} parser 
	 * @param {(newValue: *) => string} serializer 
	 * @param {string} attributeName 
	 */
	constructor(name, parser = undefined, serializer = undefined, attributeName = name) {
		this.name = name;
		this.attributeName = attributeName;
		this.propertyDescriptor = {
			configurable: true,
			enumerable: true,
		};
		
		this.propertyDescriptor.get = parser ?
			function() { return parser(this.getAttribute(attributeName)); }
			: function() { return this.getAttribute(attributeName); };
		
		this.propertyDescriptor.set = serializer ?
			function(newValue) { this.setAttribute(attributeName, serializer(newValue)); }
			: function(newValue) { this.setAttribute(attributeName, newValue); };
	}
	
	/**
	 * (Chainable) Set a callback for this attribute when it's changed.
	 * @param {(newValue: string) => void} newCallback 
	 * @returns {PropertyAttributeBindHelper} `this`
	 */
	setAttributeChangedCallback(newCallback) {
		this.attributeChangedCallback = newCallback;
		return this;
	}
	
	/**
	 * Use a CSS selector to find elements that are supposed to hold an attribute value as text.
	 * @param {string} selector A CSS selector.
	 * @param {boolean} after If true, update occurs after normal callback. Only two element bindings can be defined : one before, one after.
	 * @returns 
	 */
	bindElements(selector, after = false) {
		let func = function(newValue) {
			for (const element of this.querySelectorAll(selector)) {
				element.textContent = newValue;
			}
		};
		
		if (after) {
			this.elementBindingAfter = func;
		} else {
			this.elementBindingBefore = func;
		}
		
		return this;
	}
	
	/**
	 * @param {*} target 
	 */
	applyTo(target) {
		Object.defineProperty(target.prototype, this.name, this.propertyDescriptor);
		
		const callbacks = [
			this.elementBindingBefore,
			this.attributeChangedCallback,
			this.elementBindingAfter,
		].reduce(
			(accumulator, newValue) => {
				if (newValue) {
					accumulator.push(newValue);
				}
				return accumulator;
			},
			[]
		);
		
		if (callbacks.length) {
			target.observedAttributes = target.observedAttributes.concat(this.attributeName);
			let func;
			if (callbacks.length == 1) {
				func = callbacks[0];
			} else {
				func = function(newValue) {
					for (const callback of callbacks) {
						callback.call(this, newValue);
					}
				}
			}
			target.attributeChangedCallbacks = new Map(target.attributeChangedCallbacks).set(this.attributeName, func);
		}
	}
}


class HTMLElementHelper extends HTMLElement {
	constructor() {
		super();
		
		this.root = this.attachShadow({ mode: "open" });
		// let sheets = [...this.root.adoptedStyleSheets, noTranisitionSheet];
		// this.root.adoptedStyleSheets = sheets;
		this.root.innerHTML = HTMLElementHelper.allInnerHTML.get(this.constructor._name);
		
		// setTimeout(
		// 	() => {
		// 		sheets.splice(this.root.adoptedStyleSheets.indexOf(noTranisitionSheet), 1);
		// 		this.root.adoptedStyleSheets = sheets;
		// 	},
		// 	3000 // Enough for slow 3G (tested with devtool's throttling)
		// );
	}
	
	connectedCallback() {
		this.classList.add(SHADOW_HOST_CLASS);
	}
	
	/**
	 * @see {@link DocumentFragment.getElementById}
	 * @param {string} id 
	 */
	getElementById(id) {
		return this.root.getElementById(id);
	}
	
	/**
	 * @see {@link Document.getElementsByClassName}
	 * @param {string} className 
	 */
	getElementsByClassName(className) {
		return this.root.querySelectorAll("." + className);
	}
	
	/**
	 * @see {@link Element.querySelector}
	 * @param {string} query 
	 */
	querySelector(query) {
		return this.root.querySelector(query);
	}
	
	/**
	 * @see {@link Element.querySelectorAll}
	 * @param {string} query 
	 */
	querySelectorAll(query) {
		return this.root.querySelectorAll(query);
	}
	
	/**
	 * @param {string} attribute 
	 * @param {string} newValue 
	 * @param {string} oldValue 
	 */
	attributeChangedCallback(attribute, oldValue, newValue) {
		for (const [attributeCandidate, callback] of this.constructor.attributeChangedCallbacks) {
			if (attributeCandidate == attribute) {
				callback.call(this, newValue);
			}
		}
	}
	
	/** @type {Map<string, string>} */
	static allInnerHTML = new Map();
	/** The name of the element, used between `<>` to create this element.
	 * @type {string} */
	static _name = undefined;
	
	/** @type {Promise<void>[]} */
	static registeringPromises = [];
	
	/**
	 * Does the same as {@link register}, but put the promise in a lsit that can be fully awaited with {@link awaitAllRegistering}
	 * @param {String} name The tag name of the element. Must include a `-`, among other necessary conditions.
	 * @param {CustomElementConstructor} constructor If not specified, default to this
	 * @param {String} path If not specified, try to find `elements/${name}/${name}.html`.
	 */
	static pushRegistering(name, constructor = undefined, path = undefined) {
		HTMLElementHelper.registeringPromises = HTMLElementHelper.registeringPromises.concat(this.register(name, constructor, path));
	}
	
	/**
	 * Use this method with await to wait for the download of every element's innerHTML.
	 */
	static async awaitAllRegistering() {
		while (HTMLElementHelper.registeringPromises.length > 0) {
			await HTMLElementHelper.registeringPromises[0];
			HTMLElementHelper.registeringPromises.shift(); // Shift to ensure that if a new promise is added, it the right promise wich get removed.
		}
	}
	
	/**
	 * Define the element in the document and download innerHTML of shadowRoot.
	 * @param {String} name The tag name of the element. Must include a `-`, among other necessary conditions.
	 * @param {CustomElementConstructor} constructor If not specified, default to this
	 * @param {String} path If not specified, try to find `elements/${name}/${name}.html`.
	 */
	static async register(name, constructor = this, path = `elements/${name}/${name}.html`) {
		HTMLElementHelper.allInnerHTML.set(
			name,
			await fetch(path)
				.then(response => response.text())
		);
		
		constructor._name = name;
		
		customElements.define(name, constructor);
	}
	
	/** @type {string[]} */
	static observedAttributes = [];
	/** @type {Map<string, (newValue: string) => void>} */
	static attributeChangedCallbacks = new Map();
	
	/**
	 * Returns all the shadow roots present under the given `root`. Search recursively. Only finds shadow roots created trough {@link HTMLElementHelper}
	 * @param {DocumentFragment} root 
	 * @param {boolean} includeBaseRoot If true, the returned value will include `root`
	 * @returns {DocumentFragment[]}
	 */
	static getRootsRecursive(root, includeBaseRoot = true) {
		let allToScan = [root];
		let result = includeBaseRoot ? [root] : [];
		
		while (allToScan.length != 0) {
			const subRoots = Array.from(allToScan.pop().querySelectorAll("." + SHADOW_HOST_CLASS)).reduce(
				(accumulator, newValue) => {
					accumulator.push(newValue.root);
					return accumulator;
				},
				[]
			);
			result = result.concat(subRoots);
			allToScan = allToScan.concat(subRoots);
		}
		
		return result;
	}
	
	/**
	 * @param {PropertyAttributeBindHelper[]} properties 
	 */
	static bindPropertiesToAtributes(properties) {
		for (const property of properties) {
			property.applyTo(this);
		}
		
		return this; // Allow chaining
	}
}


/* Exemple

class CommonFooter extends HTMLElementHelper {
	constructor() {
		super();
		// other stuff
	}
}
await HTMLElementHelper.register("common-footer", CommonFooter)
*/


export {HTMLElementHelper, PropertyAttributeBindHelper, SHADOW_HOST_CLASS};