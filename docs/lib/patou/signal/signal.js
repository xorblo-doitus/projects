// A Little module to create events that are not related to DOM. (In a non-javascript look).

/**
 * A callback taking any number of arguments, and return nothing.
 * @typedef {(anyNuberOfArgument) => void} Callback
 */



/**
 * An event wich is not related to the DOM. Nammed signal like in the Godot game engine to not shadow built-in event-like classes.
 */
class Signal {
	/** @type {Callback[]} */
	callbacks = [];
	/** @type {boolean} */
	preventingRecursion = false;
	
	/**
	 * Bind a callback that will be called when this event is fired.
	 * @param {Callback} callback 
	 */
	bind(callback) {
		this.callbacks.push(callback);
	}
	
	/**
	 * Unbind a callback.
	 * @param {Callback} callback 
	 */
	unbind(callback) {
		const index = this.callbacks.indexOf(callback);
		if (index != -1) {
			this.callbacks.splice(index, 1);
		}
	}
	
	/**
	 * Fire every callback from {@link callbacks} with {@link args}.
	 * @param  {...any} args 
	 */
	fire(...args) {
		for (const callback of this.callbacks) {
			callback(...args);
		}
	}
	
	/**
	 * Fire every callback from {@link callbacks} with {@link args}
	 * while preventing a new firing to be made trough this function.
	 * (normal fire still can produce recursion)
	 * @param  {...any} args 
	 */
	fireNoRecursion(...args) {
		if (this.preventingRecursion) {
			return;
		}
		this.preventingRecursion = true;
		this.fire(...args);
		this.preventingRecursion = false;
	}
}



export { Signal };