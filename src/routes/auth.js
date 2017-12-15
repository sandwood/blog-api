import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { sendResetPasswordEmail } from "../mailer";

const router = express.Router();

router.post("/", (req, res) => {
  const { credentials } = req.body;
  User.findOne({ email: credentials.email }).then(user => {
    if (user && user.isValidPassword(credentials.password)) {
      res.json({ user: user.toAuthJSON() });
      console.log(credentials.email, " Just Signed In.");
    } else {
      res.status(400).json({ errors: { global: "조건 충당하지 않습니다." } });
      console.log(credentials.email, " Failed to Sign In.");
    }
  });
});

router.post("/confirmation", (req, res) => {
  console.log("Confirmation Sent.");
  const token = req.body.token;
  User.findOneAndUpdate(
    { confirmationToken: token },
    { confirmationToken: "", confirmed: true },
    { new: true }
  ).then(
    user =>
      user ? res.json({ user: user.toAuthJSON() }) : res.status(400).json({})
  );
});

router.post("/reset_password_request", (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      sendResetPasswordEmail(user);
      res.json({});
      console.log("Reset Password Requested.", user.email);
    } else {
      res.status(400).json({ errors: { global: "그 이메일로 된 사용자가 없습니다." } });
      console.log("Reset Password Request Failed. No Such User.");
    }
  });
});

router.post("/validate_token", (req, res) => {
  jwt.verify(req.body.token, process.env.JWT_SECRET, err => {
    if (err) {
      console.log("Failed to Validate Token.");
      res.status(401).json({});
    } else {
      console.log("Token Validated.");
      res.json({});
    }
  });
});

router.post("/reset_password", (req, res) => {
  const { password, token } = req.body.data;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ errors: { global: "잘못된 토큰입니다." } });
      console.log("Reset Password. Wrong Token.");
    } else {
      User.findOne({ _id: decoded._id }).then(user => {
        if (user) {
          user.setPassword(password);
          user.save().then(() => res.json({}));
          console.log("Password Resetted.", user.email);
        } else {
          res.status(404).json({ errors: { global: "잘못된 토큰입니다." } });
          console.log("Password Reset Failed. Wrong Token.");
        }
      });
    }
  });
});

export default router;
