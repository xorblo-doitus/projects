class Decorator {
	/**
	 * 
	 * @param {(func: Function) => {Function}} builder 
	 */
	constructor(builder) {
		this.build = builder;
	}
	
	/**
	 * 
	 * @param {*} target 
	 * @param {PropertyKey} propertyKey 
	 */
	decorate(target, propertyKey) {
		target[propertyKey] = this.build(target[propertyKey]);
	}
	
	/**
	 * 
	 * @param {*} target 
	 * @param {PropertyKey} propertyKey 
	 * @param  {...Decorator} decorators 
	 */
	static decorate(target, propertyKey, ...decorators) {
		for (const decorator of decorators) {
			decorator.decorate(target, propertyKey);
		}
	}
	
	/**
	 * 
	 * @param {*} target Class
	 * @param {PropertyKey} propertyKey 
	 * @param  {...Decorator} decorators 
	 */
	static decorateMethod(target, propertyKey, ...decorators) {
		this.decorate(target.prototype, propertyKey, ...decorators);
	}
}

export const decorate = Decorator.decorate
export { Decorator };