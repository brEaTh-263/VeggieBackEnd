const bcrypt = require("bcrypt");
const express = require("express");
const admin = require("../middlewares/admin");
const mongoose = require("mongoose");
const { Product } = require("../models/Product");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const { uploadProductPic, addProductPic } = require("../services/image");

const router = express.Router();

router.post("/validate-admin", async (req, res) => {
  const { password } = req.body;
  if (password === "breath_263") {
    const token = jwt.sign({ admin: true }, "mysecretkey");
    return res
      .status(200)
      .send({ token: token, status: "You are logged in as admin" });
  }
  return res.status(400).send({ Error: "Invalid password" });
});

router.get("/products-review", admin, async (req, res) => {
  const data = await Product.find({});
  if (!data) {
    return res.status(404).send("Please send a valid category");
  }
  return res.status(200).send(data);
});

router.post("/edit-product", admin, async (req, res) => {
  const {
    _id,
    name,
    indianName,
    category,
    subCategory,
    quantity,
    priceKg,
    priceQty,
    weightOnly,
  } = req.body;
  try {
    let product = await Product.findById(_id);
    if (!product) {
      return res.status(400).send("Product not found");
    }
    product.name = name;
    product.indianName = indianName;
    product.Category = category;
    product.subCategory = subCategory;
    product.priceKg = priceKg;
    product.priceQty = priceQty;
    product.weightOnly = weightOnly;
    product.quantity = quantity;
    product = await product.save();
    console.log(product);

    return res.status(200).send({ product });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});

router.post("/delete-product", admin, async (req, res) => {
  const { _id } = req.body;
  try {
    const product = await Product.findByIdAndDelete(_id);
    if (!product) {
      return res.status(400).send("Product not found");
    }
    return res.status(200).send({ status: "Product deleted" });
  } catch (err) {
    return res.status(400).send("Something went wrong");
  }
});

router.post("/add-product", admin, async (req, res) => {
  const {
    Category,
    subCategory,
    name,
    indianName,
    priceKg,
    priceQty,
    weightOnly,
    quantity,
  } = req.body;
  try {
    let productExists = await Product.findOne({
      name: name,
      Category: Category,
    });
    if (!productExists) {
      let product = new Product({
        name,
        indianName,
        priceKg,
        priceQty,
        weightOnly,
        quantity,
        Category,
        subCategory,
      });
      product = await product.save();
      return res.status(200).send({
        product,
      });
    } else {
      return res.status(400).send({
        status: "Product already exists with that name within that category",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ Error: "Something went wrong" });
  }
});

const singleUpload = uploadProductPic.single("image");

router.post("/edit-product-pic", admin, singleUpload, async (req, res) => {
  const _id = req.header("product-id");
  console.log(req.file);
  try {
    let product = await Product.findById(_id);
    if (!product) {
      return res.status(404).send({ Error: "Product not found!" });
    }
    product.imageUrl = req.file.location;
    product = await product.save();
    console.log(product);
    return res.status(200).send({ product });
  } catch (err) {
    console.log(err);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

const singleUploadAdd = addProductPic.single("image");

router.post("/add-product-pic", admin, singleUploadAdd, async (req, res) => {
  const { _id } = req.body;
  try {
    let product = await Product.findById(_id);
    if (!product) {
      return res.status(404).send({ Error: "Product not found!" });
    }
    product.imageUrl = req.file.location;
    product = await product.save();
    console.log(product);
    return res.status(200).send({ product });
  } catch (err) {
    console.log(err);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

module.exports = router;
