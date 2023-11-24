/**
 * An helper to create decorators as there is still no syntactic-sugar to write them.
 */
class Decorator {
	/**
	 * Create a decorator.
	 * @param {(func: Function) => {Function}} builder When applied to a function,
	 * the decorator will replace the function by the new function returned by
	 * this builder.
	 */
	constructor(builder) {
		this.build = builder;
	}
	
	/**
	 * Apply this decorator to the function `target[propertyKey]`
	 * @param {*} target The object wich's method will be modified
	 * @param {PropertyKey} propertyKey The name of the function in `target`
	 */
	decorate(target, propertyKey) {
		target[propertyKey] = this.build(target[propertyKey]);
	}
	
	/**
	 * Apply these decorators to the function `target[propertyKey]`
	 * @param {*} target The object wich's method will be modified
	 * @param {PropertyKey} propertyKey The name of the function in `target`
	 * @param  {...Decorator} decorators An array of decorators that will be applied in this order.
	 */
	static decorate(target, propertyKey, ...decorators) {
		for (const decorator of decorators) {
			decorator.decorate(target, propertyKey);
		}
	}
	
	/**
	 * Apply these decorators to a method of a class (`target.prototype[propertyKey]`)
	 * @param {*} target The class wich's method will be modified
	 * @param {PropertyKey} propertyKey The name of the method of `target`
	 * @param  {...Decorator} decorators An array of decorators that will be applied in this order.
	 */
	static decorateMethod(target, propertyKey, ...decorators) {
		Decorator.decorate(target.prototype, propertyKey, ...decorators);
	}
}

export const decorate = Decorator.decorate
export const decorateMethod = Decorator.decorateMethod
export { Decorator };