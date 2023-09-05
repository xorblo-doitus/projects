class Sorter {
	/**
	 * @type {Map<String, function(*, *): Number>}
	 */
	comparingFunctions = new Map;
	
	/**
	 * @type {String}
	 */
	currentComparingFunction = "";
	
	/** @type {Boolean} */
	reverted = false;
	
	/**
	 * Check elements against these callables, if any return true, it will be included.
	 * @type {Array<function(*): Boolean>} (element) => {if (should be shown) {return true} else {return false}}
	 */
	whiteList = [];
	/**
	 * Check elements against these callables, if any return false, it will be excluded, even if it mathed a whitelister.
	 * @type {Array<function(*): Boolean>} (element) => {if (should NOT be shown) {return true} else {return false}}
	 */
	blackList = [];
	
	/**
	 * When sorting, elements with these tags will be shown.
	 * @type {String[]}
	 */
	includedTags = [];
	
	/**
	 * When sorting, elements with these tags will NOT be showen.
	 * @type {String[]}
	 */
	excludedTags = [];
	
	/**
	 * @virtual
	 * @param {*} element 
	 * @returns {String[]}
	 */
	getTags(element) {
		return [];
	}
	
	/**
	 * @virtual
	 */
	getElements() {
		return [];
	}
	
	/**
	 * Called at the end of sort().
	 * @param {*[]} newOrder 
	 */
	onSorted(newOrder) {
		
	}
	
	/** @type {*[]} */
	lastResult = [];
	/** @type {*[]} */
	lastDropped = [];
	
	/**
	 * Sort elements in a new order.
	 * @param {?Array} elements If null, fetch with getElements().
	 * @returns {Array}
	 */
	sort(elements = null) {
		if (elements == null) {
			elements = this.getElements();
		}
		
		let result = [];
		
		// White List
		let dropped = [];
		if (this.whiteList.length != 0) {
			for (const element of elements) {
				if (this.matchAny(element, this.whiteList)) {
					result.push(element);
				} else {
					dropped.push(element)
				}
			}
		} else if (this.includedTags.length == 0) {
			result = elements;
		} else {
			dropped = elements;
		}
		
		// Included Tags
		if (this.includedTags.length != 0) {
			for (const element of dropped) {
				if (this.matchAnyTag(this.getTags(element), this.includedTags)) {
					result.push(element);
				}
			}
		}
		
		
		// Black List
		if (this.blackList.length != 0) {
			let newResult = [];
			for (const element of result) {
				if (!this.matchAny(element, this.blackList)) {
					newResult.push(element);
				}
			}
			result = newResult;
		}
		
		// Excluded tags
		if (this.excludedTags.length != 0) {
			let newResult = [];
			for (const element of result) {
				if (!this.matchAnyTag(this.getTags(element), this.excludedTags)) {
					newResult.push(element);
				}
			}
			result = newResult;
		}
		
		
		if (this.comparingFunctions.get(this.currentComparingFunction, undefined) != undefined) {
			result.sort(this.comparingFunctions.get(this.currentComparingFunction));
		}
		if (this.reverted) {
			result.reverse();
		}
		
		
		this.lastResult = result;
		this.lastDropped = elements.reduce(
			(accumulator, newValue) => {
				if (!result.includes(newValue)) {
					accumulator.push(newValue);
				}
				return accumulator;
			},
			[]
		);
		
		this.onSorted(result);
		return result;
	}
	
	/**
	 * @param {*} element 
	 * @param {Array<function(*): Boolean>} checkers 
	 */
	matchAny(element, checkers) {
		for (const checker of checkers) {
			if (checker(element)) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * @param {String[]} elementTags 
	 * @param {String[]} filterTags 
	 */
	matchAnyTag(elementTags, filterTags) {
		return elementTags.some(
			(tag) => {return filterTags.includes(tag);}
		);
	}
}



export { Sorter }