/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require("crypto-js/sha256");
const Block = require("./block.js");
const bitcoinMessage = require("bitcoinjs-message");

class Blockchain {
  constructor() {
    this.chain = [];
    this.height = -1;
    this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   */
  async initializeChain() {
    if (this.height === -1) {
      await this._addBlock(new Block({ data: "Genesis Block" }));
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  getChainHeight() {
    let self = this;
    return new Promise((resolve, reject) => {
      resolve(self.height);
    });
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   */
  _addBlock(block) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        const validations = await self.validateChain();
        if (self.height === -1 || validations.every((isValid) => isValid)) {
          block.time = new Date().getTime().toString().slice(0, -3);
          self.height++;
          if (self.height > 0) {
            block.previousBlockHash = self.chain[self.height - 1].hash;
            block.height = self.height;
          }
          block.hash = await SHA256(JSON.stringify(block)).toString();
          self.chain.push(block);
          resolve(block);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  requestMessageOwnershipVerification(address) {
    return new Promise((resolve) => {
      resolve(
        `${address}:${new Date()
          .getTime()
          .toString()
          .slice(0, -3)}:starRegistry`
      );
    });
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  submitStar(address, message, signature, star) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        const messageSentTime = parseInt(message.split(":")[1]);
        const currentTime = parseInt(
          new Date().getTime().toString().slice(0, -3)
        );
        if (
          currentTime - messageSentTime < 300 &&
          bitcoinMessage.verify(message, address, signature)
        ) {
          const block = new Block({ data: { star, address } });
          await self._addBlock(block);
          resolve(block);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * @param {*} hash
   */
  getBlockByHash(hash) {
    let self = this;
    return new Promise((resolve, reject) => {
      const block = self.chain.find((block) => block.hash === hash);
      if (block) resolve(block);
      reject("Not found.");
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  getBlockByHeight(height) {
    let self = this;
    return new Promise((resolve, reject) => {
      let block = self.chain.find((block) => block.height === height);
      if (block) resolve(block);
      reject("Not found");
    });
  }

  /**
   * This method will return a Promise that will resolve with an array of decoded Stars objects existing in the chain and belonging to the owner with the wallet address passed as parameter.
   * @param {*} address
   */
  getStarsByWalletAddress(walletAddress) {
    let self = this;
    return new Promise((resolve, reject) => {
      Promise.all(
        self.chain.map(async (block) =>
          block.height > 0 ? await block.getData() : {}
        )
      )
        .then((stars) => {
          const result = stars.reduce(
            (filtered, { data: { address, star } = {} }) => {
              if (address === walletAddress) {
                filtered.push({ owner: address, star });
              }
              return filtered;
            },
            []
          );
          if (result.length === 1) reject(new Error("No stars found"));
          resolve(result);
        })
        .catch(reject);
    });
  }
  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   */
  validateChain() {
    let self = this;
    return new Promise((resolve, reject) => {
      Promise.all(
        self.chain.map(async (block, index, chain) => {
          if (index === 0) return true;
          if (index > 0 && block.previousBlockHash === chain[index - 1].hash) {
            return await block.validate();
          }
        })
      )
        .then(resolve)
        .catch(reject);
    });
  }
}

module.exports.Blockchain = Blockchain;
