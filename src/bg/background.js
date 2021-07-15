/*
 * Elasticsearch CSV Exporter
 * v0.1
 * https://github.com/minewhat/es-csv-exporter
 * MIT licensed
 *
 * Copyright (c) 2014-2015 MineWhat,Inc
 *
 * Credits: This extension is created using Extensionizr , github.com/uzairfarooq/arrive
 */

let csvData = [];
let lastUrl = '';
let raw = '';
if (chrome.webRequest) 
{
  chrome.webRequest.onBeforeRequest.addListener(function(data){
    if (data.url.includes('kibana/internal/search/es')) {
      raw = data.requestBody.raw
      raw = new TextDecoder().decode(raw[0].bytes);
      console.log(raw);
    }
  },{'urls':[]},['requestBody']);


}




chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      //console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
      if (request.msg == "store-csv"){
        sendResponse(data);
        var csvContents = request.data;
        var input = document.createElement('textarea');
        document.body.appendChild(input);
        input.value = csvContents;
        input.focus();

        //Select all content
        document.execCommand('SelectAll');
        //Copy Content
        document.execCommand("Copy", false, null);
        input.remove();

        sendResponse({status: "success"});
      }else if(request.msg == "badge"){
        badgeOnOff(request.data);
      } else if (request.msg == "search") {
        csvData = request;
      } else if(request.msg==='test') {
        if (raw) {
          sendResponse({raw, status: "success"})  
        } else {
          sendResponse({status: "empty"});
        }
        
        
        // let info = csvData.bodyObj.rawResponse.hits.hits;
        // let fields = [];
        // let data = [];
        // for (let i = 0; i < info.length; i++) {
        //     let item = info[i];
        //     let fields = [];
        //     if (i === 0) {
        //       fields.push('@timestamp');
        //       request.fields.forEach((e) => fields.push(e));
        //       data.push(fields);  
        //     }
            
        //     let tmp = [];
        //     fields.forEach(field => {
        //       tmp.push(array_get(item._source, field));  
        //     });
        //     data.push(tmp);

        // }
        //   sendResponse(data)
      }else {
        console.log(request);
        sendResponse({status: "Unknown Message"});
      }
    }
);

function array_get(info, keys) {
  keys = keys.split('.')
  keys.forEach(key => {
    info = info && info[key]; 
  });
  return info;
}

function badgeOnOff(on) {
  if (on) {
    chrome.browserAction.setBadgeText({text: 'ON'});
  }
  else {
    chrome.browserAction.setBadgeText({text: ''});
  }
}
chrome.browserAction.setBadgeBackgroundColor({color: '#d57d00'});
chrome.browserAction.setBadgeText({text: ''});


//On tab selection change
chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo){
  chrome.tabs.getSelected(null, function(tab){
    if(tab && tab.url && tab.url.indexOf("app/kibana") >= 0){
      badgeOnOff(true);
    }else{
      badgeOnOff(false);
    }
  });
});


