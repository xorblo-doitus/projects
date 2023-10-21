class HistoryHelper {
	static updateURL(url, data = undefined) {
		if (location.href != url) {
			history.pushState(data, "", url);
		}
	}
	
	static updateURLParameter(parameter, newValue) {
		const newURL = HistoryHelper.getCurrentURL();
		if (newValue == null) {
			newURL.searchParams.delete(parameter);
		} else {
			newURL.searchParams.set(parameter, newValue);
		}
		HistoryHelper.updateURL(newURL.toString());
	}
	
	static getCurrentURL() {
		return new URL(location.href);
	}
}

export { HistoryHelper };