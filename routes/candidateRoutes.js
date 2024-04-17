const express = require("express");
const router = express.Router();
const { jwtAuthMiddleware } = require("../jwt");
const Candidate = require("../models/candidate");
const User = require("../models/user");

const checkAdminRole = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user.role === "admin";
  } catch (error) {
    return false;
  }
};

router.get("/", async (req, res) => {
    try{
  const candidatess = await Candidate.find();
  const candidates = candidatess.map((candidate) => {
    return {
      name: candidate.name,
      party: candidate.party,
      age: candidate.age,
    };
  });
  res.status(200).json({ candidates });
}
catch(error){
    res.status(500).json({ error: "Internal Server Error" });
}
});

router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "User has no admin role" });
    }
    const user = new Candidate(req.body);
    const response = await user.save();
    res.status(201).json({ response: response });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "User has no admin role" });
    }
    const candidateID = req.params.candidateID;
    const data = req.body;
    const response = await Candidate.findByIdAndUpdate(candidateID, data, {
      new: true,
      runValidators: true,
    });
    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: "User has no admin role" });
    }
    const candidateID = req.params.candidateID;
    const response = await Candidate.findByIdAndDelete(candidateID);
    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.status(200).json({ message: "Candidate Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/vote/:candidateId", jwtAuthMiddleware, async (req, res) => {
  try {
    const candidateID = req.params.candidateId;
    const userId = req.user.id;

    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate Not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User Not found" });
    }
    if (user.isVoted) {
      return res.status(400).json({ error: "User had already given vote " });
    }
    if (user.role === "admin") {
      return res.status(400).json({ error: "Admin is not allowed to vote" });
    }

    user.isVoted = true;
    await user.save();
    candidate.votes.push({ user: userId });
    candidate.voteCount++;
    await candidate.save();
    res.status(200).json({ message: "Vote is Recorded" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/vote/count", async (req, res) => {
  try {
    const candidate = await Candidate.find().sort({ voteCount: "desc" });
    const voteRecord = candidate.map((data) => {
      return {
        party: data.party,
        voteCount: data.voteCount,
      };
    });
    return res.status(200).json(voteRecord);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
