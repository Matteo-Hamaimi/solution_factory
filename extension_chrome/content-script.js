console.log('Hello World')

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.greeting === "fetchData") {
        sendResponse(document.all[0].outerHTML);
      }
    }
  );