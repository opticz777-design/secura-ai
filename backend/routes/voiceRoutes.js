const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const multer = require('multer');

// Configure multer for temp storage
const upload = multer({ dest: 'uploads/' });

router.post('/process', upload.single('audio'), voiceController.processAudio);
router.post('/entries', voiceController.saveEntry);
router.get('/entries', voiceController.getRecentEntries);
router.get('/audio/:filename', voiceController.getAudio);

module.exports = router;
