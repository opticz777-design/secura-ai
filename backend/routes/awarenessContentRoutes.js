const express = require('express');
const router = express.Router();
const awarenessContentController = require('../controllers/awarenessContentController');

router.post('/generate', awarenessContentController.generate);
router.get('/metrics', awarenessContentController.metrics);
router.get('/suggestions', awarenessContentController.suggestions);
router.post('/tts', awarenessContentController.tts);

router.get('/', awarenessContentController.getAll);
router.get('/:id', awarenessContentController.getById);
router.post('/', awarenessContentController.create);
router.put('/:id', awarenessContentController.update);
router.delete('/:id', awarenessContentController.delete);

router.post('/:id/share', awarenessContentController.share);
router.post('/:id/download', awarenessContentController.download);

module.exports = router;
