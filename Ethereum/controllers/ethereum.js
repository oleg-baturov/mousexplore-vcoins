var config = require("../config/common").info;
var web3 = require("../config/common").web3;
var TransactionModel = require("../model/transactions");
var TokenModel = require("../model/tokens");

exports.getBalance = function (req, res) {
  var addr = req.params.address;

  // Show the address in the console.
  //console.log('Address:', addr);

  // Use Wb3 to get the balance of the address, convert it and then show it in the console.
  web3.eth.getBalance(addr, function (error, result) {
    if (!error) {
      var ethervalue = web3.utils.fromWei(result, "ether");
      //console.log('Ether:', ethervalue); // Show the ether balance after converting it from Wei
      res.status(200).json({ balance: ethervalue });
    } else {
      console.log("we have a promblem: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
  });
};

exports.createAccount = function (req, res) {
  console.log("createAccount");

  // Use Wb3 to get the balance of the address, convert it and then show it in the console.
  web3.eth.personal.newAccount(config.mainpass, function (error, result) {
    if (!error) {
      console.log("New Account:", result);
      res.status(200).json({ address: result });
    } else {
      console.log("createAccount error: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
  });
};

//to enable calls of personal functions, need to set --rpcapi eth,web3,personal when call geth
exports.sendTransaction = function (req, res) {
  console.log("sendTransaction", req.body);
  var from = req.body.from;
  var to = req.body.to;
  var value = req.body.value;
  // Use Wb3 to get the balance of the address, convert it and then show it in the console.
  web3.eth.personal.unlockAccount(from, config.mainpass, function (
    error,
    result
  ) {
    if (!error) {
      console.log("Unlocked Account: ", result);
      web3.eth.sendTransaction(
        {
          from: from,
          to: to,
          value: web3.utils.toWei(value)
        },
        function (err, hash) {
          if (!err) {
            console.log("Send transaction: ", hash);
            res.status(200).json({ hash: hash });
          } else {
            console.log("error: ", err);
            res.status(400).json({ error: error });
          }
        }
      );
    } else {
      console.log("we have a promblem: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
  });
};

exports.getUpdatedTransactions = function (req, res) {
  var blocknum = req.body.blocknum;

  var lastblock = web3.eth.getBlockNumber(async function (error, number) {
    //console.log("lastblock= ", number);

    if (!error) {
      try {
        var blocks = [];
        for (let i = blocknum; i <= number; i++) {
          var blockdata = await web3.eth.getBlock(i, true);
          blocks = blocks.concat(blockdata.transactions);
        }

        res.status(200).json({ lastblock: number, data: blocks });
      } catch (e) {
        console.log("we have a promblem: ", e); // Should dump errors here
        res.status(400).json({ error: e });
      }
    } else {
      console.log("we have a promblem: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
  });
};

/*
* Get blocklist of specified count of blocks from certain number.
* @param start_height number of block from where to get block list.
* @param count count of list to get.
* @return list of block information same as the etherscan.io
* Here are some differences:
*   Age is second unit.
*   Miner is address, not the name. In etherscan, name is only comment from user on site. 
*       refer: https://ethereum.stackexchange.com/questions/2620/how-can-i-add-my-name-next-to-address-on-etherscan
*   GasPrice is GWei unit
*   Reward cannot be retrieved from node. Maybe should get it from etherscan
*/
exports.blocklist = function (req, res) {
  var blocknum = req.body.blocknum;
  var count = req.body.count;

  web3.eth.getBlockNumber(async function (error, number) {
    if (!error) {
      try {
        console.log("last number " + number);
        var blocks = [];
        for (let i = blocknum; i <= number && i < blocknum + count; i++) {
          var blockdata = await web3.eth.getBlock(i, true);

          var Height = blockdata.number;
          var Age = blockdata.timestamp;
          var txn = blockdata.transactions.length;
          var Uncles = blockdata.uncles.length;
          var Miner = blockdata.miner;
          var GasUsed = blockdata.gasUsed;
          var GasLimit = blockdata.gasLimit;

          var Reward = 0;
          var gas = 0;
          for (let j = 0; j < txn; j++) {
            let hash = blockdata.transactions[j].hash;
            let gasprice = blockdata.transactions[j].gasPrice;
            let transaction = await web3.eth.getTransactionReceipt(hash);

            let price = gasprice * transaction.gasUsed;
            gas += transaction.gasUsed;
            Reward += price / 1000000000;
          }

          var GasPrice = txn ? Reward / gas : 0;
          Reward = Reward / 1000000000;

          blocks.push({
            blockNumber: Height,
            timeStamp: Age,
            txn: txn,
            uncles: Uncles,
            blockMiner: Miner,
            gasUsed: GasUsed,
            gasLimit: GasLimit,
            avgGasPrice: GasPrice.toFixed(2)
          });
        }

        console.log("blocks: ", blocks);
        res.status(200).json({ msg: "success", data: blocks });
      } catch (e) {
        console.log("blocklist: we have a promblem: ", e); // Should dump errors here
        res.status(400).json({ error: e });
      }
    } else {
      console.log("getBlockNumber: we have a promblem: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
  });
};

/**
 * Get latest blocklist from offset and count.
 * 
 * @param {Number} offset
 * @param {Number} count
 * 
 * @returns { status: 200, msg: 'success', data: [block] }
 */
exports.getBlocks = function (req, res) {
  var offset = Number(req.query.offset);
  var count = Number(req.query.count);

  if (!offset) offset = 0;
  if (!count || count <= 0) count = 10;

  web3.eth.getBlockNumber(async function (error, number) {
    if (!error) {
      try {
        var blocks = [];
        for (let i = 0; i < count; i++) {
          var height = number - offset - i;
          if (height < 0) break;

          var blockdata = await web3.eth.getBlock(height, true);
          if (blockdata) blocks.push(blockdata);
        }

        res.json({ status: 200, msg: "success", data: { total: number, blocks } });
      } catch (e) {
        console.log("blocklist: we have a promblem: ", e); // Should dump errors here
        res.status(400).json({ error: e });
      }
    } else {
      console.log("getBlockNumber: we have a promblem: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
  });
};

exports.getBlockByHash = async function (req, res) {
  var hash = req.params.hash;
  try {
    if (hash.length < 10) hash = Number(hash);
    var blockdata = await web3.eth.getBlock(hash, true);
    res.json({ status: 200, msg: "success", data: blockdata });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

exports.getBlockDetails = async function (req, res) {
  var hash = req.params.hash;
  try {
    if (hash.length < 10) hash = Number(hash);
    var blockdata = await web3.eth.getBlock(hash, true);

    res.json({ status: 200, msg: "success", data: blockdata });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

/**
 * Get transaction list by offset, count, order
 *
 * @param {Number} offset
 * @param {Number} count
 * @param {Number} order
 *
 * @returns transaction list
 */
exports.getTransactions = async function (req, res) {
  var offset = Number(req.query.offset);
  var count = Number(req.query.count);
  var order = Number(req.query.order);

  if (!offset) offset = 0;
  if (!count || count <= 0) count = 10;
  // condition
  var condition;
  if (order) condition = { timestamp: 1 };
  else condition = { timestamp: -1 };

  try {
    var total = await TransactionModel.find().count();
    TransactionModel.find()
      .sort(condition)
      .skip(offset)
      .limit(count)
      .exec(async function (error, rows) {
        if (error) {
          console.log("getTransactionList: we have a promblem: ", error); // Should dump errors here
          return res.json({ status: 400, msg: "errors", data: error });
        }
        var txs = [];
        for (let i = 0; i < rows.length; i++) {
          try {
            var tx = await web3.eth.getTransaction(rows[i]["hash"]);
            txs.push(tx);
          } catch (error) {
            console.log("get transaction error: ", error);
            txs.push({
              hash: rows[i].hash,
              error: true
            });
          }
        }
        return res.json({ status: 200, msg: "success", data: { total, txs } });
      });
  } catch (error) {
    return res.json({ status: 400, msg: "Error occured !", data: error });
  }
};

exports.getTransactionsFromAccount = async function (req, res) {
  var address = req.params.address;
  var offset = Number(req.query.offset);
  var count = Number(req.query.count);
  var order = Number(req.query.order);

  if (!offset) offset = 0;
  if (!count || count <= 0) count = 10;

  var cond;
  if (order > 0) cond = { timestamp: 1 };
  else cond = { timestamp: -1 };

  try {
    var total = await TransactionModel.find().or([{ from: address }, { to: address }]).count();

    var txs = TransactionModel.find()
      .or([{ from: address }, { to: address }])
      .sort(cond)
      .skip(offset)
      .limit(count)
      .exec(function (error, rows) {
        if (error) {
          console.log("getTransactionList: we have a promblem: ", error); // Should dump errors here
          return res.json({ status: 400, msg: "errors", data: error });
        }
        var txs = [];
        for (let i = 0; i < rows.length; i++) {
          try {
            var tx = await web3.eth.getTransaction(rows[i]["hash"]);
            txs.push(tx);
          } catch (error) {
            console.log("get transaction error: ", error);
            txs.push({
              hash: rows[i].hash,
              error: true
            });
          }
        }
        return res.json({ status: 200, msg: "success", data: { total, txs } });
      });
  } catch (error) {
    res.json({ status: 400, msg: "Error in reading transactions !", data: error });
  }
};

/*
* Get transactions count from Account
* @account: account address to get transactions
* @return count
* 
*/
exports.getTransactionCountFromAccount = async function (req, res) {
  var account = req.body.account;

  TransactionModel.find()
    .or([{ from: account }, { to: account }])
    .sort({ timestamp: -1 })
    .exec(function (error, transactions) {
      if (!error) {
        res.status(200).json({ msg: "success", data: transactions.length });
      } else {
        console.log("getTransactionsFromAccount: we have a promblem: ", error); // Should dump errors here
        res.status(400).json({ error: error });
      }
    });
};

exports.getTransactionInfo = function (req, res) {
  var hash = req.params.hash;
  web3.eth.getTransaction(hash, async function (error, transaction) {
    if (error) {
      console.log("getTransaction: we have a promblem: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
    res.status(200).json({ status: 200, msg: "success", data: transaction });
  });
};

exports.getTransactionDetails = async function (req, res) {
  var hash = req.params.hash;

  try {
    var transaction = await web3.eth.getTransaction(hash);
    try {
      var blockdata = await web3.eth.getBlock(transaction.blockNumber, false);
      let txreceipt = await web3.eth.getTransactionReceipt(hash);

      let fee = txreceipt.gasUsed * transaction.gasPrice;
      // fee = fee / 1e18;

      transaction.block = blockdata;
      transaction.txreceipt = txreceipt;
      transaction.fee = fee;
    } catch (e) { }
    res.status(200).json({ msg: "success", data: transaction });
  } catch (error) {
    console.log("getTransaction: we have a promblem: ", error); // Should dump errors here
    res.status(400).json({ error: error });
  }
};

//api for token related
exports.getTokenList = function (req, res) {
  TokenModel.find()
    .sort({ symbol: 1 })
    .exec(function (error, tokens) {
      if (!error) {
        console.log(tokens);
        res.status(200).json({ msg: "success", data: tokens });
      } else {
        console.log("getTokenList: we have a promblem: ", error); // Should dump errors here
        res.status(400).json({ error: error });
      }
    });
};

exports.addToken = function (req, res) {
  var symbol = req.body.symbol;
  var address = req.body.address;

  TokenModel.find({ symbol: symbol, address: address }).exec(function (
    error,
    tokens
  ) {
    if (!error) {
      if (tokens.length) {
        console.log("addToken: token already exsit"); // Should dump errors here
        res.status(400).json({ error: "token already exsit" });
        return;
      }

      var newToken = new TokenModel({ symbol: symbol, address: address });
      newToken.save(function (err, token) {
        res.status(200).json({ msg: "success", data: token });
      });
    } else {
      console.log("addToken: we have a promblem: ", error); // Should dump errors here
      res.status(400).json({ error: error });
    }
  });
};

exports.removeToken = function (req, res) {
  var symbol = req.body.symbol;
  var address = req.body.address;

  TokenModel.findOneAndRemove({ symbol: symbol, address: address }).exec(
    function (error, tokens) {
      if (!error) {
        res.status(200).json({ msg: "success" });
      } else {
        console.log("removeToken: we have a promblem: ", error); // Should dump errors here
        res.status(400).json({ error: error });
      }
    }
  );
};
