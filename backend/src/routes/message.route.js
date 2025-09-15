import express from "express";

const router = express.Router();

router.get("/send", (req, res) => {
  res.send("Get messages endpoint");
});

export default router;
