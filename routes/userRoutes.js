const express = require("express");
const router = express.Router();
const { jwtAuthMiddleware, generateToken } = require("../jwt");
const User = require("../models/user");

router.post("/register", async (req, res) => {
  try {
    const role = req.body.role;
    if (role === "admin") {
      const user = await User.findOne({ role: "admin" });
      if (user) {
        return res.status(500).json({ error: "Admin is already present" });
      }
    }
    const user = new User(req.body);
    const response = await user.save();
    const payload = { id: response.id };
    const token = generateToken(payload);
    res.status(201).json({ response: response, token: token });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { aadharCardNumber, password } = req.body;

    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid Username or Password" });
    }
    const payload = {
      id: user.id,
    };
    const token = generateToken(payload);
    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    const userId = userData.id;
    const user = User.findById(userId);
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    const userId = userData.id;
    const { oldPassword, newPassword } = req.body;
    const user = User.findById(userId);
    if (!user || !(await user.comparePassword(oldPassword))) {
      return res.status(401).json({ error: "Invalid Username or Password" });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Message Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
