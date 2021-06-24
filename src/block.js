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

  validate = async () =>
    new Promise(async (resolve, reject) => {
      this.hash === (await SHA256(JSON.stringify(this)))
        ? resolve(true)
        : reject(false);
    });

  getData = () =>
    new Promise((resolve, reject) => {
      this.height > 0
        ? resolve(JSON.parse(hex2ascii(this.body)))
        : reject(new Error("Cannot get data from Genesis block"));
    });
}

module.exports = Block;
