// backend/src/routes/public.js
const express = require('express');
const router = express.Router();
const publicDocumentController = require('../controllers/PublicDocumentController');

// Route GET để hiển thị danh sách tài liệu công khai
router.get('/documents', publicDocumentController.getPublicDocuments);

// Route GET để hiển thị chi tiết sản phẩm và tài liệu liên quan
router.get('/product/:id', publicDocumentController.getProductDetails);

// Route GET để hiển thị trang chi tiết tài liệu mới (với sidebar)
router.get('/product/:id/documents', publicDocumentController.getDocumentDetailPage);

module.exports = router;