import { Decorator } from "../decorator/decorator.js";


/**
 * Compares two arrays by verifying that each values are equal two by two.
 * Work with arrays in arrays, but NOT for recursive arrays (arrays containing themselves).
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


/**
 * A singleton storing values with arrays as keys.
 * This lets cache function's result by call
 */
class Cache {
	static notCached = Symbol("Not cached");
	
	/**
	 * @type {Map<[], *>}
	 */
	map = new Map();
	
	/**
	 * If the function was already called with these arguments, return the result that old function call.
	 * @param  {...any} args Arguments of a call to the function
	 * @returns {Cache.notCached | any} If found, returns that old result, else returns {@link Cache.notCached}
	 */
	get(...args) {
		for (const [key, value] of this.map.entries()) {
			if (compareArrays(args, key)) {
				return value;
			}
		}
		return Cache.notCached;
	}
	
	/**
	 * Stores the result of a function call with given arguments.
	 * @param {*} value The result of the function call
	 * @param  {...any} args The argument passed to the function
	 */
	store(value, ...args) {
		this.map.set(args, value);
	}
}


/**
 * A decorator caching results of a function calls.
 * This way, expensive calls will occur only one time,
 * as the result is then fetched from cache.
 * Wont work if your function returns varying results
 * with the same arguments.
 */
export const cached = new Decorator(function(func) {
	const cache = new Cache();
	return function(...args) {
		const cacheResult = cache.get(...args);
		if (cacheResult !== Cache.notCached) {
			return cacheResult;
		}
		const result = func.call(this, ...args);
		cache.store(result, ...args);
		return result;
	}
})