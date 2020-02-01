const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: "Enter a name for transaction"
  },
  value: {
    type: Number,
    required: "Enter an amount"
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    required: true
  }
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
