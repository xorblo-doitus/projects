import { Signal } from "../signal/signal.js";



const SPLITTER = /\s/;



class TokenList extends Set {
	changed = new Signal
	
	/**
	 * 
	 * @param {String} token 
	 */
	add(token) {
		super.add(token);
		this.changed.fireNoRecursion();
	}
	
	/**
	 * @param {String} token 
	 * @returns {Boolean}
	 */
	contains(token) {
		return this.has(token);
	}
	
	/**
	 * @param {String} token 
	 */
	remove(token) {
		super.delete(token);
		this.changed.fireNoRecursion();
	}
	
	/**
	 * @param {String} token 
	 */
	toggle(token) {
		if (this.has(token)) {
			this.remove(token);
		} else {
			this.add(token);
		}
	}
	
	/**
	 * @param {String} oldToken 
	 * @param {String} newToken 
	 * @returns {Boolean}
	 */
	replace(oldToken, newToken) {
		if (this.has(oldToken)) {
			super.delete(oldToken);
			super.add(newToken);
			this.changed.fireNoRecursion();
			return true;
		}
		return false;
	}
	
	/**
	 * @virtual
	 * @param {*} token 
	 * @returns {Boolean}
	 */
	supports(token) {
		return true;
	}
	
	
	/**
	 * @type {String}
	 */
	set value(newValue) {
		this.clear();
		
		for (const token of newValue.split(SPLITTER)) {
			if (token) { // Prevent empty token due to 2 consecutive splitters.
				super.add(token);
			}
		}
		
		this.changed.fireNoRecursion();
	}
	
	/**
	 * @type {String}
	 */
	get value() {
		return [...this.values()].join(" ");
	}
}



export { TokenList };