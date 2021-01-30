const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");

const locationSchema = mongoose.Schema({
  latitude: {
    type: Number,
    default: 80,
  },
  longitude: {
    type: Number,
    default: 80,
  },
  address: {
    type: String,
    default: "New Address",
  },
});

const productSchema = mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
});

const cartProductsSchema = mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: {
    type: Number,
    min: 0,
  },
  isKg: Boolean,
  price: Number,
});

const statusSchema = mongoose.Schema({
  condition: {
    type: "String",
    enum: ["Processing", "Pending", "Cancelled", "Delivered"],
  },
  date: Date,
});

const orderSchema = mongoose.Schema({
  products: [cartProductsSchema],
  totalAmount: Number,
  status: [statusSchema],
  paymentMethod: String,
  deliveryAddress: locationSchema,
  username: String,
  phoneNumber: {
    type: Number,
    maxLength: 10,
    minLength: 10,
  },
});

const cardSchema = mongoose.Schema({
  name: String,
  number: {
    type: Number,
    maxLength: 16,
  },
  expiryDate: String,
  nickname: String,
  type: String,
});

const userSchema = mongoose.Schema({
  name: {
    // required: true,
    type: String,
    minlength: 3,
    default: "User",
  },
  email: {
    // required: true,
    type: String,
    // unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  phoneNumber: {
    type: Number,
    // unique: true,
    maxLength: 10,
    minlength: 10,
    default: 0000000000,
  },
  imageURL: {
    type: String,
    default: "",
  },
  orders: [orderSchema],
  location: [locationSchema],
  bookmarks: [productSchema],
  cartProducts: [cartProductsSchema],
  totalAmount: {
    type: Number,
    default: 0,
  },
  cards: [cardSchema],
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, config.get("jwtPrivateKey"));
  return token;
};

const User = mongoose.model("User", userSchema);
exports.User = User;
