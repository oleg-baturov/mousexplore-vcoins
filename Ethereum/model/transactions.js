var mongoose = require("mongoose");

var transactionSchema = new mongoose.Schema({
	blocknumber: Number,
	hash: String,
	from: String,
	to: String,
	value: Number,
	fee: Number,
	timestamp: Number
});

var Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;