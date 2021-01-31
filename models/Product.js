const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  name: String,
  indianName: String,
  priceQty: Number,
  priceKg: Number,
  quantity: Number,
  imageUrl: String,
  Category: String,
  weightOnly: Boolean,
  subCategory: String,
});

const Product = mongoose.model("stock", stockSchema);

exports.Product = Product;
