const SHA256 = require("crypto-js/sha256");
const hex2ascii = require("hex2ascii");

class Block {
  constructor(data) {
    this.hash = null;
    this.height = 0;
    this.body = Buffer.from(JSON.stringify(data)).toString("hex");
    this.time = 0;
    this.previousBlockHash = null;
  }

  async validate() {
    let self = this;
    return new Promise(async (resolve, reject) => {
      self.hash ===
      (await SHA256(
        JSON.stringify({
          ...self,
          hash: null,
        })
      ).toString())
        ? resolve(true)
        : reject(false);
    });
  }

  getData() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.height > 0
        ? resolve(JSON.parse(hex2ascii(self.body)))
        : reject(new Error("Cannot get data from Genesis block"));
    });
  }
}

module.exports = Block;
