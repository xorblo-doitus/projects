const SHADOW_HOST_CLASS = "shadow-host";


class HTMLElementHelper extends HTMLElement {
	static allInnerHTML = new Map();
	
	constructor(name) {
		super();
		
		this.root = this.attachShadow({ mode: "open" });
		// let sheets = [...this.root.adoptedStyleSheets, noTranisitionSheet];
		// this.root.adoptedStyleSheets = sheets;
		this.root.innerHTML = HTMLElementHelper.allInnerHTML.get(name);
		
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
	 * 
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
}


/* Exemple

class CommonFooter extends HTMLElementHelper {
	constructor() {
		super("common-footer");
		// other stuff
	}
}
await HTMLElementHelper.register("common-footer", CommonFooter)
*/


export {HTMLElementHelper, SHADOW_HOST_CLASS};