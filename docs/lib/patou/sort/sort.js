class FuzzySearch {
	/**
	 * @param {object[]} toScan 
	 * @param {object} options WARNING : you can't modify it afterwards. (At least you can't for key name).
	 */
	constructor(toScan, options) {
		for (const key of options.keys) {
			if (!key.keyPath) {
				key.keyPath = key.name.split(".");
			}
		}
		
		this.toScan = toScan;
		this.options = options;
	}
	
	static getScore(queryPart, part) {
		if (queryPart == part) {
			return queryPart.length * 1.6 + 1;
		}
		
		if (part.includes(queryPart)) {
			return queryPart.length;
		}
		
		let score = 0;
		let idx = 0;
		let queryIdx = 0;
		let len = part.length
		let lenQ = queryPart.length
		
		while (idx < len && queryIdx < lenQ) {
			switch (part[idx]) {
				case queryPart[queryIdx]:
					score++;
					queryIdx++;
					break;
				case queryPart[queryIdx + 1]:
					if (part[idx + 1] == queryPart[queryIdx]) {
						score += 1.5;
						idx++;
						queryIdx += 2;
					} else {
						score += 0.5;
						queryIdx += 2;
					}
					break;
				case queryPart[queryIdx - 1]:
					score += 0.5;
					queryIdx--;
					break;
				default:
					score -= 0.1;
			}
			idx++;
		}
		
		return Math.max(score, 0);
	}
	
	/**
	 * 
	 * @param {*} obj 
	 * @param {PropertyKey[]} keyPath 
	 * @returns 
	 */
	static getByKeyPath(obj, keyPath) {
		return keyPath.reduce(
			function(a,b) {
				return a && a[b];
			},
			obj
		);
	}
	
	static compareScores(a, b) {
		return b.score - a.score;
	}
	
	/**
	 * 
	 * @param {string} query 
	 */
	search(query) {
		const keys = this.options.keys;
		const splittedQuery = query.toLowerCase().split(" ");
		const scores = [];
		
		for (const toScan of this.toScan) {
			let score = 0;
			for (const {keyPath, weight} of this.options.keys) {
				let subScore = 0;
				for (const part of FuzzySearch.getByKeyPath(toScan, keyPath).toLowerCase().split(" ")) {
					for (const queryPart of splittedQuery) {
						subScore += FuzzySearch.getScore(queryPart, part);
					}
				}
				score += subScore * (weight || 1);
			}
			scores.push({
				item: toScan,
				score: score,
			})
		}
		
		scores.sort(FuzzySearch.compareScores);
		
		
		const threshold = splittedQuery.reduce(
			function (accumulator, value) {
				return accumulator + value.length;
			},
			0
		) * this.options.threshold || 0;
		
		console.log(threshold, " - max: ", scores[0].score);
			
		const result = [];
		for (const scoreItem of scores) {
			if (scoreItem.score < threshold) {
				break;
			}
			result.push(scoreItem);
		}
		
		return result;
	}
}


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
	 * Check elements against these callables, if every return true, it will be included.
	 * @type {Array<function(*): Boolean>} (element) => {if (should be shown) {return true} else {return false}}
	 */
	whiteList = [];
	/**
	 * Check elements against these callables, if any return false, it will be excluded, even if it mathed a whitelister.
	 * @type {Array<function(*): Boolean>} (element) => {if (should NOT be shown) {return true} else {return false}}
	 */
	blackList = [];
	
	/**
	 * When sorting, elements with all these tags will be shown.
	 * @type {String[]}
	 */
	includedTags = [];
	
	/**
	 * When sorting, elements with any of these tags will NOT be showen.
	 * @type {String[]}
	 */
	excludedTags = [];
	
	fuseOptions = {};
	
	query = "";
	
	_elements = null;
	
	/**
	 * @param {object[]} newValue
	 */
	set elements(newValue) {
		this._elements = newValue;
		this._fuse = new Fuse(newValue, this.fuseOptions);
	}
	get elements() {
		if (this._elements == null) {
			this._elements = this.getElements();
			this._fuse = new FuzzySearch(this._elements, this.fuseOptions);
		}
		return this._elements;
	}
	
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
			elements = this.elements;
		} else {
			this.elements = elements;
		}
		
		let result = [];
		
		if (this.query) {
			for (const elem of this._fuse.search(this.query)) {
				result.push(elem.item);
			}
		} else {
			result = elements;
		}
		
		// White List
		if (this.whiteList.length != 0) {
			let newResult = [];
			for (const element of result) {
				if (this.matchEvery(element, this.whiteList)) {
					newResult.push(element);
				}
			}
			result = newResult;
		}
		
		// Included Tags
		if (this.includedTags.length != 0) {
			let newResult = [];
			for (const element of result) {
				if (this.matchEveryTag(this.getTags(element), this.includedTags)) {
					newResult.push(element);
				}
			}
			result = newResult;
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
			if (this.reverted) {
				result.reverse();
			}
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
	 * @param {*} element 
	 * @param {Array<function(*): Boolean>} checkers 
	 */
	matchEvery(element, checkers) {
		for (const checker of checkers) {
			if (!checker(element)) {
				return false;
			}
		}
		return true;
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
	
	/**
	 * @param {String[]} elementTags 
	 * @param {String[]} filterTags 
	 */
	matchEveryTag(elementTags, filterTags) {
		return filterTags.every(
			(tag) => {return elementTags.includes(tag);}
		);
	}
}



export { Sorter }