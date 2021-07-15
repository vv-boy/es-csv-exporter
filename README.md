# es-csv-exporter
Missing CSV export feature for Elasticsearch on Kibana Dashboard. Install this chrome plugin, go to the Kibana Discover tab and start exporting search results as CSV files.

Tested in Kibana 7.7.0

# other version
You need try to change "kbn-version" value in src/inject/inject.js
```
fetch(host + '/_plugin/kibana/internal/search/es', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': host,
        'Referer': `{$host}/_plugin/kibana/app/kibana`,
        'kbn-version': '7.7.0', // here can specify your kibana version. xsrf
        'Accept': '*/*'
    },
    body: raw
})
```

