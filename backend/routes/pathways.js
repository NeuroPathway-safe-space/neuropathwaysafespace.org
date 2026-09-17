import { Router } from "express";
import { pathways, checkins } from "../storage/data.js";
import { sanitizeText } from "../middleware/security.js";

const router = Router();

router.get("/pathways", (_req, res) => {
  res.json({ data: pathways });
});

router.get("/checkins", (_req, res) => {
  res.json({ data: checkins });
});

router.post("/checkins", (req, res) => {
  const memberName = sanitizeText(req.body?.memberName, 120);
  const focus = sanitizeText(req.body?.focus, 300);
  const mood = sanitizeText(req.body?.mood, 80);
  const nextStep = sanitizeText(req.body?.nextStep, 500);

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
