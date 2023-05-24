class Tool {

  static key = "sGcpp2vPEw4EH6YZTTaU8sgzyjI4M6iY";

  static iv = "u1Pws46Ri8IFdW5v";

  aesEncode(str: string) {
    const crypto = require('crypto');
    const algorithm = 'AES-256-CBC';
    const cipher = crypto.createCipheriv(algorithm, Tool.key, Tool.iv);
    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted
  }

  aesDecode() {

  }

  urlGetParams(key) {
    let url = decodeURI(window.location.hash);
    let object = {};
    if (url.indexOf("?") !== -1) {
      let str = url.substr(url.indexOf("?") + 1);
      let strs = str.split("&");
      for (let i = 0; i < strs.length; i++) {
        object[strs[i].split("=")[0]] = strs[i].split("=")[1];
      }
    }
    return object[key];
  }

  isEmail(email) {
    const reg = new RegExp("^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\\.[a-zA-Z0-9_-]+)+$")
    return reg.test(email)
  }

}

export default new Tool()
