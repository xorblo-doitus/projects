class HistoryHelper {
	static updateURL(url, data = undefined) {
		if (location.href != url) {
			history.pushState(data, "", url);
		}
	}
	
	/**
	 * @param {string} parameter 
	 * @param {*} newValue NB: Arrays are join using `~`.
	 */
	static updateURLParameter(parameter, newValue) {
		if (newValue instanceof Array) {
			if (newValue.length == 0) {
				newValue = null;
			} else {
				newValue = newValue.join("~");
			}
		}
		
		const newURL = HistoryHelper.getCurrentURL();
		if (newValue == null) {
			newURL.searchParams.delete(parameter);
		} else {
			newURL.searchParams.set(parameter, newValue);
		}
		
		let newString = newURL.toString().replace("=&", "&")
		if (newString.endsWith("=")) {
			newString = newString.slice(0, -1);
		}
		HistoryHelper.updateURL(newString);
	}
	
	/**
	 * @param {string} parameter
	 */
	static getParameter(parameter) {
		return HistoryHelper.getCurrentSearchParams().get(parameter);
	}
	
	static getCurrentSearchParams() {
		return HistoryHelper.getCurrentURL().searchParams;
	}
	
	static getCurrentURL() {
		return new URL(location.href);
	}
}

export { HistoryHelper };