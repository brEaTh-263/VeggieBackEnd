const bcrypt = require("bcrypt");
const express = require("express");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const { User } = require("../models/user");
const { Product } = require("../models/Product");
const _ = require("lodash");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  console.log(req.user);
  const token = req.header("x-auth-token");
  const { _id } = req.user;
  try {
    let user = await User.findOne({ _id: _id });
    if (!user) {
      return res.status(404).send({ Error: "Something went wrong" });
    }
    console.log(user);
    const details = _.pick(user, [
      "name",
      "email",
      "phoneNumber",
      "location",
      "imageURL",
      "_id",
      "bookmarks",
      "totalAmount",
      "cartProducts",
      "orders",
    ]);
    const editedCards = user.cards.map((det) => {
      let mid8 = `${det.number}`.substring(4, 12);
      let newNum = `${det.number}`.replace(mid8, "XXXXXXXX");
      return {
        _id: det._id,
        number: newNum,
        nickname: det.nickname,
      };
    });

    return res
      .status(200)
      .send({ details: details, paymentOptions: editedCards, token: token });
  } catch (error) {
    console.log(error);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/edit-username", auth, async (req, res) => {
  const { _id } = req.user;
  const token = req.header("x-auth-token");
  try {
    let user = await User.findByIdAndUpdate(_id, {
      $set: {
        name: req.body.userName,
      },
    });
    if (!user) {
      return res
        .status(404)
        .send({ Error: "User with given id was not found!" });
    }
    console.log(user);
    const details = _.pick(user, [
      "name",
      "email",
      "phoneNumber",
      "location",
      "imageURL",
      "_id",
      "bookmarks",
    ]);
    details.name = req.body.userName;
    return res.status(200).send({ details: details, token: token });
  } catch (error) {
    console.log(error);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/add-address", auth, async (req, res) => {
  const _id = req.user;
  const token = req.header("x-auth-token");
  const { latitude, longitude, address } = req.body;
  if (!latitude || !longitude || !address) {
    res.status(400).send({ Error: "Valid details were not provided" });
  }
  try {
    let user = await User.findOne({ _id: _id });
    if (!user) {
      return res
        .status(404)
        .send({ Error: "User with given id was not found!" });
    }
    console.log(user);
    user.location.push({
      latitude: latitude,
      longitude: longitude,
      address: address,
    });
    console.log(user);
    await user.save();
    return res.status(200).send({
      status: "Address was successfully added",
      allLocations: user.location,
      token: token,
    });
  } catch (error) {
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/edit-address", auth, async (req, res) => {
  const _id = req.user;
  const token = req.header("x-auth-token");
  const { addressId, address } = req.body;
  if (!addressId || !address) {
    res.status(400).send({ Error: "Details were not provided" });
  }
  try {
    let user = await User.findOne({ _id: _id });
    if (!user) {
      return res
        .status(404)
        .send({ Error: "User with given id was not found!" });
    }
    const newLocations = user.location.map((loc) => {
      if (loc._id.equals(addressId)) {
        return {
          _id: addressId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: address,
        };
      } else {
        return {
          _id: loc._id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
        };
      }
    });
    console.log(newLocations);
    user.location = newLocations;

    await user.save();
    return res.status(200).send({
      status: "Address was successfully edited",
      allLocations: user.location,
      token: token,
    });
  } catch (error) {
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/delete-address", auth, async (req, res) => {
  const _id = req.user;
  const token = req.header("x-auth-token");
  const addressId = req.body.addressId;
  console.log(addressId);
  if (!addressId) {
    res.status(400).send({ Error: "Address to be deleted was not provided" });
  }
  try {
    let user = await User.findOne({ _id: _id });
    if (!user) {
      return res
        .status(404)
        .send({ Error: "User with given id was not found!" });
    }

    const newLocations = user.location.filter((loc) => {
      if (loc._id.equals(addressId)) {
        return false;
      } else {
        return true;
      }
    });
    user.location = newLocations;

    await user.save();
    return res.status(200).send({
      status: "Address was successfully deleted",
      allLocations: user.location,
      token: token,
    });
  } catch (error) {
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/check-validity-password", auth, async (req, res) => {
  let { password } = req.body;
  const { _id } = req.user;
  if (!password) {
    return res.status(400).send({ Error: "Please provide password" });
  }
  let user = await User.findById(_id);

  if (!user) {
    return res.status(403).send({ Error: "User not found!" });
  }
  try {
    let validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(403).send({ status: "Invalid" });
    }
    return res.status(200).send({ status: "Approved" });
  } catch (err) {
    return res.status(505).send(err.message);
  }
});

router.post("/add-to-cart", auth, async (req, res) => {
  let { productId, qty, isKg } = req.body;
  const { _id } = req.user;
  console.log(productId, qty, isKg, _id);

  try {
    if (!productId || !qty) {
      return res.status(400).send("All details were not provided");
    }

    let user = await User.findById(_id);
    let product = await Product.findById(productId);
    console.log(product);
    if (user.cartProducts.length)
      for (let i = 0; i < user.cartProducts.length; i++) {
        if (user.cartProducts[i].productId.equals(productId)) {
          if (user.cartProducts[i].isKg) {
            user.totalAmount -= user.cartProducts[i].quantity * product.priceKg;
          } else {
            user.totalAmount -=
              user.cartProducts[i].quantity * product.priceQty;
          }
          user.cartProducts[i].quantity = qty;
          if (isKg) {
            user.cartProducts[i].price = qty * product.priceKg;
            user.cartProducts[i].isKg = true;
          } else {
            user.cartProducts[i].price = qty * product.priceQty;
            user.cartProducts[i].isKg = false;
          }
          user.totalAmount += user.cartProducts[i].price;
          await user.save();
          return res.status(200).send({
            status: "Added successfully in cart",
            totalAmount: user.totalAmount,
            cartProducts: user.cartProducts,
          });
        }
      }

    if (isKg) {
      user.totalAmount += qty * product.priceKg;
      user.cartProducts.push({
        productId: productId,
        quantity: qty,
        isKg: true,
        price: qty * product.priceKg,
      });
    } else {
      user.totalAmount += qty * product.priceQty;
      user.cartProducts.push({
        productId: productId,
        quantity: qty,
        isKg: false,
        price: qty * product.priceQty,
      });
    }

    await user.save();
    return res.status(200).send({
      status: "Added successfully in cart",
      totalAmount: user.totalAmount,
      cartProducts: user.cartProducts,
    });
  } catch (err) {
    console.log(err);
    return res.status(505).send(err.message);
  }
});

router.post("/remove-from-cart", auth, async (req, res) => {
  let { productId } = req.body;
  const { _id } = req.user;
  console.log(productId);
  try {
    if (!productId) {
      return res.status(400).send("All details were not provided");
    }

    let user = await User.findById(_id);
    let product = await Product.findById(productId);
    console.log(product);

    if (user.cartProducts.length)
      for (let i = 0; i < user.cartProducts.length; i++) {
        if (user.cartProducts[i].productId.equals(productId)) {
          if (user.cartProducts[i].isKg) {
            user.totalAmount -= user.cartProducts[i].quantity * product.priceKg;
          } else {
            user.totalAmount -=
              user.cartProducts[i].quantity * product.priceQty;
          }

          const editedCartProducts = user.cartProducts.filter((item) => {
            if (item.productId.equals(productId)) {
              return false;
            } else {
              return true;
            }
          });

          user.cartProducts = editedCartProducts;

          await user.save();
          return res.status(200).send({
            status: "Deleted successfully from cart",
            totalAmount: user.totalAmount,
            cartProducts: user.cartProducts,
          });
        }
      }

    await user.save();
    return res.status(200).send({
      status: "Deleted successfully from cart",
      totalAmount: user.totalAmount,
      cartProducts: user.cartProducts,
    });
  } catch (err) {
    console.log(err);
    return res.status(505).send(err.message);
  }
});

router.post("/add-to-cart-no-auth", async (req, res) => {
  let { productId, cartProducts, totalAmount, qty, isKg } = req.body;

  if (!productId) {
    return res.status(200).send({ Error: "All details were not provided" });
  }

  try {
    let product = await Product.findById(productId);
    console.log(cartProducts);
    if (cartProducts.length > 0)
      for (let i = 0; i < cartProducts.length; i++) {
        if (String(cartProducts[i].productId) === String(productId)) {
          if (cartProducts[i].isKg) {
            totalAmount -= cartProducts[i].quantity * product.priceKg;
          } else {
            totalAmount -= cartProducts[i].quantity * product.priceQty;
          }
          cartProducts[i].quantity = qty;
          if (isKg) {
            cartProducts[i].price = qty * product.priceKg;
            cartProducts[i].isKg = true;
          } else {
            cartProducts[i].price = qty * product.priceQty;
            cartProducts[i].isKg = false;
          }
          totalAmount += cartProducts[i].price;
          return res.status(200).send({
            status: "Added successfully in cart",
            totalAmount: totalAmount,
            cartProducts: cartProducts,
          });
        }
      }
    if (isKg) {
      totalAmount += qty * product.priceKg;
      cartProducts.push({
        productId: productId,
        quantity: qty,
        isKg: true,
        price: qty * product.priceKg,
      });
    } else {
      totalAmount += qty * product.priceQty;
      cartProducts.push({
        productId: productId,
        quantity: qty,
        isKg: false,
        price: qty * product.priceQty,
      });
    }

    return res.status(200).send({
      status: "Added successfully in cart",
      totalAmount: totalAmount,
      cartProducts: cartProducts,
    });
  } catch (error) {
    console.log(error);
    return res.status(505).send(error.message);
  }
});

router.post("/remove-from-cart-no-auth", async (req, res) => {
  let { productId, cartProducts, totalAmount } = req.body;

  if (!productId) {
    return res.status(200).send({ Error: "All details were not provided" });
  }

  try {
    let product = await Product.findById(productId);
    console.log(product);

    if (cartProducts.length)
      for (let i = 0; i < cartProducts.length; i++) {
        if (String(cartProducts[i].productId) === String(productId)) {
          if (cartProducts[i].isKg) {
            totalAmount -= cartProducts[i].quantity * product.priceKg;
          } else {
            totalAmount -= cartProducts[i].quantity * product.priceQty;
          }

          const editedCartProducts = cartProducts.filter((item) => {
            if (String(item.productId) === String(productId)) {
              return false;
            } else {
              return true;
            }
          });

          cartProducts = editedCartProducts;

          return res.status(200).send({
            status: "Deleted successfully from cart",
            totalAmount: totalAmount,
            cartProducts: cartProducts,
          });
        }
      }

    await user.save();
    return res.status(200).send({
      status: "Deleted successfully from cart",
      totalAmount: totalAmount,
      cartProducts: cartProducts,
    });
  } catch (err) {
    console.log(err);
    return res.status(505).send(err.message);
  }
});

router.post("/add-bookmark", auth, async (req, res) => {
  let { id } = req.body;
  const { _id } = req.user;
  //NOTE:Front-end doesn't have indianNames for all of the products
  //Therefore,it may result in some error
  try {
    let user = await User.findById(_id);

    //checking if bookmark already exists and trying to again add it
    //so to avoid multiple copies of it looped through the data
    for (let i = 0; i < user.bookmarks.length; i++) {
      if (user.bookmarks[i].productId.equals(id)) {
        return res.status(200).send({ status: "Bookmark added" });
      }
    }

    user.bookmarks.push({
      productId: id,
    });
    await user.save();
    const details = _.pick(user, ["bookmarks"]);
    return res.status(200).send({ status: "Bookmark added", details: details });
  } catch (err) {
    console.log(err);
    return res.status(505).send(err.message);
  }
});

router.post("/remove-bookmark", auth, async (req, res) => {
  let { id } = req.body;
  const { _id } = req.user;
  if (!id) {
    return res.status(400).send("Id not found");
  }
  try {
    let user = await User.findById(_id);
    const editedBookmarks = user.bookmarks.filter((item) => {
      if (item.productId.equals(id)) {
        return false;
      } else {
        return true;
      }
    });

    user.bookmarks = editedBookmarks;
    await user.save();
    const details = _.pick(user, ["bookmarks"]);
    return res
      .status(200)
      .send({ status: "Bookmark removed", details: details });
  } catch (error) {
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/empty-cart", auth, async (req, res) => {
  const { _id } = req.user;
  try {
    let user = await User.findById(_id);
    user.cartProducts = [];
    user.totalAmount = 0;
    await user.save();
    return res.status(200).send({ status: "Cart Emptied" });
  } catch (err) {
    console.log(err);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/order-now", auth, async (req, res) => {
  const { _id } = req.user;
  const { paymentMethod, lat, lng, address } = req.body;

  if (!paymentMethod || !lat || !lng || !address) {
    return res.status(400).send("Payment method not found");
  }
  try {
    let user = await User.findById(_id);
    const totalAmount = user.totalAmount;
    const cartProducts = user.cartProducts;
    user.orders.push({
      products: cartProducts,
      totalAmount: totalAmount,
      status: [
        {
          condition: "Processing",
          date: new Date(),
        },
      ],
      paymentMethod: paymentMethod,
      deliveryAddress: {
        latitude: lat,
        longitude: lng,
        address: address,
      },
      username: user.name,
      phoneNumber: user.phoneNumber,
    });
    console.log(user.orders);
    user.totalAmount = 0;
    user.cartProducts = [];
    await user.save();
    return res
      .status(200)
      .send({ status: "Order Confirmed", allOrders: user.orders });
  } catch (error) {
    console.log(error);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/add-card", auth, async (req, res) => {
  const { _id } = req.user;
  const { cardName, cardNumber, nickname, type, expiryDate } = req.body;

  if (!cardName || !cardNumber || !nickname || !type || !expiryDate) {
    return res.status(400).send("All details were not provided");
  }
  try {
    let user = await User.findById(_id);
    user.cards.push({
      name: cardName,
      number: cardNumber,
      expiryDate: expiryDate,
      nickname: nickname,
      type: type,
    });

    const editedCards = user.cards.map((det) => {
      let mid8 = `${det.number}`.substring(4, 12);
      let newNum = `${det.number}`.replace(mid8, "XXXXXXXX");
      return {
        _id: det._id,
        number: newNum,
        nickname: det.nickname,
      };
    });
    await user.save();
    return res
      .status(200)
      .send({ status: "Card Added", cardDetails: editedCards });
  } catch (error) {
    console.log(error);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/edit-nickname-card", auth, async (req, res) => {
  const { _id } = req.user;
  const { nickname, cardId } = req.body;

  if (!cardId || !nickname) {
    return res.status(400).send("All details were not provided");
  }

  try {
    let user = await User.findById(_id);
    const newCards = user.cards.map((details) => {
      if (details._id.equals(cardId)) {
        return {
          _id: cardId,
          name: details.name,
          nickname: nickname,
          number: details.number,
          type: details.type,
          expiryDate: details.expiryDate,
        };
      } else {
        return {
          _id: details._id,
          name: details.name,
          nickname: details.nickname,
          number: details.number,
          type: details.type,
          expiryDate: details.expiryDate,
        };
      }
    });

    user.cards = newCards;
    const editedCards = user.cards.map((det) => {
      let mid8 = `${det.number}`.substring(4, 12);
      let newNum = `${det.number}`.replace(mid8, "XXXXXXXX");
      return {
        _id: det._id,
        number: newNum,
        nickname: det.nickname,
      };
    });
    await user.save();
    return res
      .status(200)
      .send({ status: "Card Added", cardDetails: editedCards });
  } catch (error) {
    console.log(error);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

router.post("/delete-card", auth, async (req, res) => {
  const { _id } = req.user;
  const { cardId } = req.body;
  console.log("INSIDE");
  console.log(cardId);
  if (!cardId) {
    return res.status(400).send("All details were not provided");
  }

  try {
    let user = await User.findById(_id);
    const newCards = user.cards.filter((card) => String(card._id) !== cardId);

    user.cards = newCards;
    const editedCards = user.cards.map((det) => {
      let mid8 = `${det.number}`.substring(4, 12);
      let newNum = `${det.number}`.replace(mid8, "XXXXXXXX");
      return {
        _id: det._id,
        number: newNum,
        nickname: det.nickname,
      };
    });
    await user.save();
    return res
      .status(200)
      .send({ status: "Card Added", cardDetails: editedCards });
  } catch (error) {
    console.log(error);
    return res.status(505).send({ Error: "Something went wrong" });
  }
});

module.exports = router;
