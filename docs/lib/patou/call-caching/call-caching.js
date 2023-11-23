import { Decorator } from "../decorator/decorator.js";


/**
 * 
 * @param {[]} a 
 * @param {[]} b 
 * @returns {boolean}
 */
function compareArrays(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	
	for (const [i, element] of a.entries()) {
		if (element instanceof Array) {
			if (b[i] instanceof Array) {
				if (!compareArrays(element, b[i])) {
					return false;
				}
			} else {
				return false;
			}
		} else if (element !== b[i]) {
			return false;
		}
	}
	
	return true;
}


// console.assert(compareArrays([1, 2, 5], [1, 2, 5]))
// console.assert(!compareArrays([1, 99, 5], [1, 2, 5]))
// console.assert(!compareArrays([1, [99, 8], 5], [1, [6, 8], 5]))
// console.assert(compareArrays([1, [6, 8], 5], [1, [6, 8], 5]))


class Cache {
	static notCached = Symbol("Not cached");
	
	/**
	 * @type {Map<[], *>}
	 */
	map = new Map();
	
	get(...args) {
		for (const [key, value] of this.map.entries()) {
			if (compareArrays(args, key)) {
				return value;
			}
		}
		return Cache.notCached;
	}
	
	store(value, ...args) {
		this.map.set(args, value);
	}
}

const cache = new Cache()

export const cached = new Decorator(function(func) {
	return function(...args) {
		const cacheResult = cache.get(...args);
		if (cacheResult !== Cache.notCached) {
			return cacheResult;
		}
		const result = func(...args);
		cache.store(result, ...args);
		return result;
	}
})