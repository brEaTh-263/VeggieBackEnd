const bcrypt = require("bcrypt");
const express = require("express");
const admin = require("../middlewares/admin");
const mongoose = require("mongoose");
const { Product } = require("../models/Product");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

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
    imageUrl,
    quantity,
    price,
  } = req.body;
  try {
    const product = await Product.findById(_id);
    if (!product) {
      return res.status(400).send("Product not found");
    }
    product.name = name;
    product.indianName = indianName;
    product.Category = category;
    product.subCategory = subCategory;
    product.price = price;
    product.quantity = quantity;
    product.imageUrl = imageUrl;
    await product.save();
    return res
      .status(200)
      .send({ status: "Product edited successfully", product: product });
  } catch (error) {
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
    price,
    quantity,
    imageUrl,
  } = req.body;
  try {
    console.log(
      Category,
      subCategory,
      name,
      indianName,
      price,
      quantity,
      imageUrl
    );
    let productExists = await Product.findOne({
      name: name,
      Category: Category,
    });
    if (!productExists) {
      const product = new Product({
        name,
        indianName,
        price,
        quantity,
        Category,
        subCategory,
        imageUrl,
      });
      await product.save();
      return res.status(200).send({ status: "Product added successfully" });
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

module.exports = router;
