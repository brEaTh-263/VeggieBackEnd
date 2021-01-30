const bcrypt = require("bcrypt");
const express = require("express");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const { Product } = require("../models/Product");
const _ = require("lodash");
const { mainCategories, carouselItems } = require("../raw_data");

const router = express.Router();

router.post("/categories", auth, async (req, res) => {
  const data = await Product.find({ Category: req.body.category });
  if (!data) {
    return res.status(404).send("Please send a valid category");
  }
  return res.status(200).send(data);
  //   console.log(data);
});

router.get("/products", async (req, res) => {
  const data = await Product.find({});
  if (!data) {
    return res.status(404).send("Please send a valid category");
  }
  return res.status(200).send({ data, mainCategories, carouselItems });
});

module.exports = router;
