const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/PromotionController");
const { protect } = require("../middleware/auth");

// 📌 Lấy toàn bộ danh sách khuyến mãi và render ra giao diện EJS
router.get("/", protect, promotionController.getPromotions);

// 📌 Lấy danh sách khuyến mãi dưới dạng JSON
router.get("/json", promotionController.getPromotionAsJson);

// 📌 Lấy chi tiết khuyến mãi theo ID
router.get("/:promotionId", promotionController.getPromotionById);

// 📌 Thêm khuyến mãi mới (POST)
router.post("/", promotionController.addPromotion);

// 📌 Cập nhật thông tin khuyến mãi (PUT)
router.put("/:promotionId", promotionController.updatePromotion);

// 📌 Xóa khuyến mãi (DELETE)
router.delete("/:promotionId", promotionController.deletePromotion);

module.exports = router;