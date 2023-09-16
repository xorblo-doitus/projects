class HistoryHelper {
	static updateURL(url, data = undefined) {
		if (location.href != url) {
			history.pushState(data, "", url);
		}
	}
}

export { HistoryHelper };