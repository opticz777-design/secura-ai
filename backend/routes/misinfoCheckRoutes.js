const express = require('express');
const router = express.Router();
const misinfoCheckController = require('../controllers/misinfoCheckController');
const multer = require('multer');

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage });

router.post('/check', upload.single('screenshot'), misinfoCheckController.check);
router.get('/history', misinfoCheckController.getHistory);
router.get('/trending', misinfoCheckController.getTrending);

router.get('/', misinfoCheckController.getAll);
router.get('/:id', misinfoCheckController.getById);
router.post('/', misinfoCheckController.create);
router.put('/:id', misinfoCheckController.update);
router.delete('/:id', misinfoCheckController.delete);

module.exports = router;
