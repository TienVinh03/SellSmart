const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const { refreshToken } = require("../middleware/authApi");

router.get("/login", AuthController.getLogin);
router.post("/login", AuthController.login);
router.get("/logout", AuthController.logout);

// Routes cho mobile app
router.post("/mobile/login", AuthController.mobileLogin);
router.post("/mobile/logout", AuthController.mobileLogout);
router.post("/refresh-token", refreshToken);

module.exports = router;
