const SPLITTER = /\s/;

class TokenList extends Set {
	/**
	 * @type {Array<CallableFunction>}
	 */
	changedListeners = [];
	
	/**
	 * @type {Boolean}
	 */
	notifyChanged = true;
	
	constructor() {
		super();
	}
	
	/**
	 * 
	 * @param {String} token 
	 */
	add(token) {
		super.add(token);
		this.fireChanged();
	}
	
	/**
	 * @param {String} token 
	 * @returns {Boolean}
	 */
	contains(token) {
		return this.has(token);
	}
	
	/**
	 * 
	 * @param {String} token 
	 */
	remove(token) {
		super.delete(token);
		this.fireChanged();
	}
	
	/**
	 * 
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
	 * 
	 * @param {String} oldToken 
	 * @param {String} newToken 
	 * @returns {Boolean}
	 */
	replace(oldToken, newToken) {
		if (this.has(oldToken)) {
			super.delete(oldToken);
			super.add(newToken);
			this.fireChanged();
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
			super.add(token);
		}
		
		this.fireChanged();
	}
	
	/**
	 * @type {String}
	 */
	get value() {
		return [...this.values()].join(" ");
	}
	
	/**
	 * 
	 * @param {CallableFunction} callback 
	 */
	addChangedListener(callback) {
		this.changedListeners.push(callback);
	}
	
	/**
	 * 
	 * @param {CallableFunction} callback 
	*/
	removeChangedListener(callback) {
		const index = this.changedListeners.indexOf(callback);
		if (index == -1) {
			return;
		}
		this.changedListeners.splice(index, 1);
	}
	
	fireChanged() {
		if (this.notifyChanged) {
			this.notifyChanged = false;
			for (const callback of this.changedListeners) {
				callback();
			}
			this.notifyChanged = true;
		}
	}
}


// let test = new TokenList;
// test.add("arbre");
// test.add("arbre");
// test.add("banane");
// test.toggle("banane");
// test.toggle("fruit");
// test.remove("i don't exist");
// test.replace("fruit", "abricot")
// console.log(test);
// console.log(test.value);

export { TokenList };