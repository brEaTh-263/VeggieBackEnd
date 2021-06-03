const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { Product } = require("../models/Product");

aws.config.update({
  secretAccessKey: SECRET_ACCESS_KEY,
  accessKeyId: ACCESS_KEY_ID,
  region: "us-west-1",
});

const s3 = new aws.S3();
const upload = multer({
  // limits: { fieldSize: 10000 },
  storage: multerS3({
    s3: s3,
    bucket: "images263/profile_pictures",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      // console.log(file);
      // console.log(req.file);
      cb(null, { description: "Profile picture of the user." });
    },
    key: function (req, file, cb) {
      const { _id } = req.user;
      // console.log(file);
      // console.log(req.file);
      cb(null, _id);
    },
  }),
});

const uploadProductPic = multer({
  // limits: { fieldSize: 10000 },
  storage: multerS3({
    s3: s3,
    bucket: "images263/Products",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      // console.log(file);
      // console.log(req.file);
      cb(null, { description: "Product picture" });
    },
    key: function (req, file, cb) {
      const _id = req.header("product-id");

      cb(null, _id);
    },
  }),
});

const addProductPic = multer({
  // limits: { fieldSize: 10000 },
  storage: multerS3({
    s3: s3,
    bucket: "images263/Products",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      // console.log(file);
      // console.log(req.file);
      cb(null, { description: "Product picture" });
    },
    key: async function (req, file, cb) {
      const name = req.header("product-name");
      const Category = req.header("product-category");
      let product = await Product.findOne({
        name: name,
        Category: Category,
      });
      req.body._id = product._id;

      cb(null, String(product._id));
    },
  }),
});

exports.uploadProductPic = uploadProductPic;
exports.addProductPic = addProductPic;
exports.upload = upload;
