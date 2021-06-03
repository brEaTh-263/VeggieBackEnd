const accountSid =ACCOUNT_SID; //twilio
const serviceSid = SERVICE_SID; //twilio
const authToken = AITH_TOKEN; //twilio
const client = require("twilio")(accountSid, authToken);
const express = require("express");
const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const router = express.Router();
const _ = require("lodash");

router.post("/verify", auth, (req, res) => {
  // if (!req.body.hash) {
  //   return res.status(400).send({ Error: "Something went wrong" });
  // }
  client.verify
    .services(serviceSid)
    .verifications.create({
      to: `+91${req.body.phoneNumber}`,
      channel: "sms",
      // appHash: `${req.body.hash}`,
    })
    .then((data) => {
      const details = _.pick(data, ["status", "to", "valid"]);
      res.status(200).send({ details });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({ Error: "Something went wrong" });
    });
});
router.post("/verify-status-save", auth, async (req, res) => {
  console.log(req.body.code);
  console.log(req.body.phoneNumber);
  const { _id } = req.user;
  try {
    const data = await client.verify
      .services(serviceSid)
      .verificationChecks.create({
        to: `+91${req.body.phoneNumber}`,
        code: req.body.code,
      });
    console.log(data);
    if (data.status === "pending") {
      throw new Error();
    }
    const details = _.pick(data, ["status", "to", "valid"]);
    let user = await User.findByIdAndUpdate(_id, {
      $set: {
        phoneNumber: req.body.phoneNumber,
      },
    });
    let multiUser = await User.find({ phoneNumber: req.body.phoneNumber });
    if (multiUser.length > 1) {
      multiUser.map(async (x) => {
        if (user._id.equals(x._id)) {
        } else {
          await User.findByIdAndDelete(x._id);
        }
      });
    }
    return res.status(200).send({
      details,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send("Something went wrong");
  }
});

module.exports = router;
