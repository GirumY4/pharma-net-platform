import { Router } from "express";
import { sendContactMessage } from "./support.controller.js";

const router = Router();

router.post("/contact", sendContactMessage);

export default router;
