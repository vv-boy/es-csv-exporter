class Core {
  constructor () {
    this.cookies = {}
  }
  sendToBackground (method, data, callback) {
    chrome.runtime.sendMessage({
      method,
      data
    }, callback)
  }

  httpSend ({ url, options }, resolve, reject) {
    fetch(url, options).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          resolve(data);
        }).catch(e => {
          reject(e);
        })
      } else {
        reject(response)
      }
    }).catch((err) => {
      reject(err)
    })
  }
}

export default new Core()
