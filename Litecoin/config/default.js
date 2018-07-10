var rpc = require("json-rpc2");
var localNode = rpc.Client.$create(
  "18332", // RPC_PORT
  "127.0.0.1", // RPC_HOST
  "rpcuser", // RPC_USER
  "pwd" // RPC_PASS
);

config = {
  port: 8080,
  localNode,
  db: "mongodb://localhost:27017/litecoin-db",

  CRON_TIME_INTERVAL: 100,	//if we decrease this to 100ms, cronservice has trouble after some time.
  CHECK_PARELLEL_BLOCKS: 10, //thread count for parellel block processing
  TICKER_BLOCK: 50
};
module.exports = config;
