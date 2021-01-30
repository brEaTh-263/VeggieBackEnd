const jwt = require("jsonwebtoken");
const config = require("config");

function admin(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).send({ Invalid: "No token provided" });
  }
  try {
    const decode = jwt.verify(token, "mysecretkey");
    // req.user = decode;
    // console.log(decode);
    if (decode.admin === true) {
      next();
    } else {
      throw new Error();
    }
  } catch (err) {
    return res.status(400).send({ Invalid: "Invalid token.Access denied!" });
  }
}

module.exports = admin;
