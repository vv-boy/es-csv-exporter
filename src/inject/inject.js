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
let data = [];
chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            var url = window.location.href;
            if (url.indexOf("app/kibana") >= 0 || url.indexOf("#/discover") >= 0) {
                var options = {
                    fireOnAttributesModification: true, // Defaults to false. Setting it to true would make arrive event fire on existing elements which start to satisfy selector after some modification in DOM attributes (an arrive event won't fire twice for a single element even if the option is true). If false, it'd only fire for newly created elements.
                    onceOnly: false, // Defaults to false. Setting it to true would ensure that registered callbacks fire only once. No need to unbind the event if the attribute is set to true, it'll automatically unbind after firing once.
                    existing: true // Defaults to false. Setting it to true would ensure that the registered callback is fired for the elements that already exists in the DOM and match the selector. If options.onceOnly is set, the callback is only called once with the first element matching the selector.
                };
                document.arrive(".kbnTopNavMenu__wrapper", options, function() {
                    var alreadyExists = document.getElementById("elastic-csv-exporter");
                    if (!alreadyExists) injectCSVExportButton();
                });
                const fetch = window.fetch
                window.fetch = function(url, options) {
                    console.log(arguments);
                    if (url.includes('kibana/internal/search/es')) {
                        console.log(options);
                        return Promise.resolve(fetch.apply(window, arguments))
                    } else {
                        return Promise.resolve(fetch.apply(window, arguments))
                    }
                }
                chrome.runtime.sendMessage({
                    "msg": "badge",
                    data: true
                }, function() {});
            } else {
                //We are in some other page. Just exit.
                chrome.runtime.sendMessage({
                    "msg": "badge",
                    data: false
                }, function() {});
                return;
            }
        }
    }, 10);
});

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function parseTable() {
    var csv = "";
    var tbls = document.getElementsByTagName("table");
    for (var i = 0; i < tbls.length; i++) {
        var tbl = tbls.item(i);
        var h = tbl.innerHTML + "";
        //Replace comma with colon
        h = h.replace(/,/g, ";");
        //Remove multiple-whitespaces with one
        h = h.replace(/\s+/g, ' ');
        //Convert all tag word characters to lower case
        h = h.replace(/<\/*\w+/g, function(s) {
            return s.toLowerCase();
        });
        //special cases
        h = h.replace(/<tr><\/tr>/g, "");
        //Convert the table tags to commas and white spaces
        h = h.replace(/<\/tr>/g, "\n");
        h = h.replace(/<\/td>/g, ",");
        h = h.replace(/<\/th>/g, ",");
        h = h.replace(/( )?<.+?>( )?/g, "");
        h = h.replace(/,\n/g, "\n");
        h = h.replace(/\n,/g, "\n");
        h = h.replace(/^\s+/g, "");
        h = h.replace(/^,/g, '');
        csv += h;
    }
    return csv;
}

function parseAndCopyToClipBoard() {
    var csv = parseTable();
    chrome.runtime.sendMessage({
        "msg": "store-csv",
        data: csv
    }, function(response) {
        console.log("CSV Export:", response.status);
    });
}

function createElement(type, attributes, innerHTML) {
    var elem = document.createElement(type);
    if (attributes) setAttributes(elem, attributes);
    if (innerHTML) elem.innerHTML = innerHTML;
    return elem;
}

function createCSVButton() {
    var csvInnerHTML = `<button class="euiButtonEmpty euiButtonEmpty--primary euiButtonEmpty--xSmall" type="button" data-test-subj="shareTopNavButton"><span class="euiButtonEmpty__content"><span class="euiButtonEmpty__text">CSV</span></span></button>`;
    var csvElemAttributes = {
        "class": "euiFlexItem euiFlexItem--flexGrowZero",
        "id": "elastic-csv-exporter"
    };
    var csvButton = createElement('div', csvElemAttributes, csvInnerHTML);
    let isLoading = false;
    csvButton.onclick = function() {
        if (!isLoading) {
            csvButton.getElementsByClassName("euiButtonEmpty__text")[0].innerHTML = 'isLoading';
            isLoading = true;
        } else {
            console.log('请勿重复下载');
            return;
        }
        var table = document.getElementsByClassName("kbn-table")[0];
        if (table) {
            let th = table.getElementsByTagName("th");
            let fields = [];
            for (let i = 0; i < th.length; i++) {
                fields.push(th[i].textContent);
            }
            console.log(fields);
            delete fields[0];
            delete fields[1];
            fields = fields.filter((e) => e);
            chrome.runtime.sendMessage({
                "msg": "test",
                fields
            }, function(data) {
                if (data.status === 'empty') {
                    alert('请先查询一次');
                } else {
                    function array_get(info, keys) {
                        keys = keys.split('.')
                        keys.forEach(key => {
                            info = info && info[key];
                        });
                        return info;
                    }
                    let raw = data.raw;
                    raw = JSON.parse(raw);
                    raw.params.body.size = 5000;
                    raw = JSON.stringify(raw);
                    var url = new URL(window.location.href);
                    var host = `${url.protocol}://${url.host}`;
                    fetch(host + '/_plugin/kibana/internal/search/es', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Origin': host,
                            'Referer': `{$host}/_plugin/kibana/app/kibana`,
                            'kbn-version': '7.7.0',
                            'Accept': '*/*'
                        },
                        body: raw
                    }).then(res => res.json()).then(res => {
                        console.log(res);
                        let info = res.rawResponse.hits.hits;
                        let needFields = [];
                        let data = [];
                        for (let i = 0; i < info.length; i++) {
                            let item = info[i];
                            if (i === 0) {
                                needFields.push('@timestamp');
                                fields.forEach((e) => needFields.push(e));
                                data.push(fields);
                            }
                            let tmp = [];
                            needFields.forEach(field => {
                                tmp.push(array_get(item._source, field));
                            });
                            data.push(tmp);
                        }
                        csvButton.getElementsByClassName("euiButtonEmpty__text")[0].innerHTML = 'CSV';
                        isLoading = false;                        
                        exportData(data);
                    }).catch(e => {
                        csvButton.getElementsByClassName("euiButtonEmpty__text")[0].innerHTML='CSV';
                        isLoading = false;                      
                        console.log(e);
                    });
                }
            })
        }
    }
    return csvButton;
}

function injectCSVExportButton() {
    var navbar = document.getElementsByClassName("kbnTopNavMenu")[0];
    var buttonGroup;
    if (navbar) {
        buttonGroup = navbar.getElementsByClassName("euiFlexItem")[4];
    } else {
        buttonGroup = document.getElementsByClassName("localBreadcrumb")[0];
    }
    if (buttonGroup) {
        var span = createCSVButton();
        navbar.appendChild(span);
    }
}

function exportData(rows) {
    let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
}
// chrome.devtools.network.getHAR(function(result) {
//   var entries = result.entries;
//   if (!entries.length) {
//     Console.warn("ChromeFirePHP suggests that you reload the page to track" +
//         " FirePHP messages for all the requests");
//   }
//   for (var i = 0; i < entries.length; ++i)
//     ChromeFirePHP.handleFirePhp_headers(entries[i]);
//   chrome.devtools.network.onRequestFinished.addListener(
//       ChromeFirePHP.handleFirePhpHeaders.bind(ChromeFirePHP));
// });