const Stripe = require("stripe");
const stripe = Stripe(
  "sk_test_51HfMg9LZnc45DmOrQ6y9RGGE94OdMp5AC5TX379dBvNulgIzOFG3SMfK8YDf4SRkmdb4xxH5eb4JFXDflVzSBrqm00LuODTrWN"
);
const express = require("express");

const router = express.Router();

router.post("/check-out", async (req, res) => {
  console.log(req.body.amount);
  stripe.charges
    .create({
      amount: req.body.amount,
      currency: "inr",
      source: "tok_mastercard",
    })
    .then((charge) => {
      res.send(charge);
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/pay-with-card", async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: "inr",

    payment_method_types: ["card"],
    statement_descriptor: "Custom descriptor",
  });
  console.log(paymentIntent);
});

module.exports = router;

// Test Secret Key
// sk_test_51HfMg9LZnc45DmOrQ6y9RGGE94OdMp5AC5TX379dBvNulgIzOFG3SMfK8YDf4SRkmdb4xxH5eb4JFXDflVzSBrqm00LuODTrWN;
