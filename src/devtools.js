if (chrome.devtools) {
    chrome.devtools.network.onBeforeRequest.addListener(request => { 
        if (chrome.runtime) {
                    chrome.runtime.sendMessage(request);
        }
        return ture;
    }, { urls: ['all_urls'] }, []);      
    chrome.devtools.network.onRequestFinished.addListener(request => {
        request.getContent((body) => {
            if (request.request && request.request.url) {
              if (request.request.url.includes('kibana/internal/search/es')) {
                 var bodyObj = JSON.parse(body);
                 if (chrome.runtime) {
                    chrome.runtime.sendMessage({"msg": "search", bodyObj});
                 }
              }
        }
        });
    });  
}