import { Router } from "express";
import { pathways, checkins } from "../storage/data.js";

const router = Router();

router.get("/pathways", (_req, res) => {
  res.json({ data: pathways });
});

router.get("/checkins", (_req, res) => {
  res.json({ data: checkins });
});

router.post("/checkins", (req, res) => {
  const { memberName, focus, mood, nextStep } = req.body ?? {};

  if (!memberName || !focus) {
    return res.status(400).json({
      error: "memberName and focus are required to create a check-in.",
    });
  }

  const newCheckin = {
    id: `chk-${checkins.length + 1}`,
    memberName,
    focus,
    mood: mood || "steady",
    nextStep: nextStep || "Continue care plan.",
    createdAt: new Date().toISOString(),
  };

  checkins.unshift(newCheckin);
  return res.status(201).json({ data: newCheckin });
});

export default router;
