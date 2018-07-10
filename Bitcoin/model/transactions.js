var mongoose = require("mongoose");

var transactionSchema = new mongoose.Schema({
	txid: String, 
	time: Number,

	blockhash: String,
	blockheight: Number,

	vin: [{}],
	vout: [{}],
	
	updatedAt: Date
});

transactionSchema.pre('save', function(next) {
	this.updatedAt = Date.now();
	next();
});

transactionSchema.index({
	txid: 1,
});

transactionSchema.index({
	blockhash: 1,
});

transactionSchema.index({
	blockheight: -1
});

transactionSchema.index({
	updatedAt: -1
});

transactionSchema.index({
	updatedAt: 1
});

var Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;