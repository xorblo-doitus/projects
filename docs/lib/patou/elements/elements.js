const SHADOW_HOST_CLASS = "shadow-host";


class PropertyAttributeBindHelper {
	/** @type {String} */
	name = null;
	/** @type {PropertyDescriptor} */
	propertyDescriptor = null;
	
	/**
	 * 
	 * @param {String} name 
	 * @param {(attributeValue: string) => *} parser 
	 * @param {(newValue: *) => string} serializer 
	 * @param {string} attributeName 
	 */
	constructor(name, parser = undefined, serializer = undefined, attributeName = name) {
		this.name = name;
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
	 * @param {*} target 
	 */
	applyTo(target) {
		Object.defineProperty(target, this.name, this.propertyDescriptor);
	}
}


class HTMLElementHelper extends HTMLElement {
	static allInnerHTML = new Map();
	/** The name of the element, used between `<>` to create this element.
	 * @type {string} */
	static _name = undefined;
	
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
	 * Define the element in the document and download innerHTML of shadowRoot.
	 * @param {String} name 
	 * @param {CustomElementConstructor} constructor 
	 * @param {String} path If not specified, trye to find `elements/${name}/${name}.html`.
	 */
	static async register(name, constructor, path = undefined) {
		if (path == undefined) {
			path = `elements/${name}/${name}.html`;
		}
		
		HTMLElementHelper.allInnerHTML.set(
			name,
			await fetch(path)
				.then(response => response.text())
		);
		
		constructor._name = name;
		
		customElements.define(name, constructor);
	}
	
	getElementById(id) {
		return this.root.getElementById(id);
	}
	
	getElementsByClassName(className) {
		return this.root.querySelectorAll("." + className);
	}
	
	querySelector(query) {
		return this.root.querySelector(query);
	}
	
	querySelectorAll(query) {
		return this.root.querySelectorAll(query);
	}
	
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
			property.applyTo(this.prototype);
			// Object.defineProperty(this.prototype, property.name, propertyDescriptor);
		}
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