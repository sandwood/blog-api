import express from "express";
import User from "../models/User";
import parseErrors from "../utils/parseErrors";
import { sendConfirmationEmail } from "../mailer";

const router = express.Router();

router.post("/", (req, res) => {
  const { email, password } = req.body.user;
  const user = new User({ email });
  user.setPassword(password);
  user.setConfirmationToken();
  user
    .save()
    .then(userRecord => {
      sendConfirmationEmail(userRecord);
      res.json({ user: userRecord.toAuthJSON() });
      console.log("User ", req.body.user.email, "Signed Up.");
    })
    .catch(err => {
      res.status(400).json({ errors: parseErrors(err.errors) });
      console.log("User ", req.body.user.email, "Failed to Sign Up.");
    });
});

export default router;
