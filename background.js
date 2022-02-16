

// This basically just returns the printHandler file when requested
function handleMessage(request, sender, sendResponse) {
	if (request.action == "getPage") {
		return new Promise((res, err) => {
			fetch(browser.runtime.getURL("/printHandler.html"))
				.then(resp => resp.text())
				.then(text => res(text))
		})
	} 		
}
browser.runtime.onMessage.addListener(handleMessage);
