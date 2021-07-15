console.log('test');
chrome.devtools.network.onRequestFinished.addListener(
  function(request) {
      console.log(request);
});