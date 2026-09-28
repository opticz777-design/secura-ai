const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams needed to get patientId from app.use
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const patientDocumentController = require('../controllers/patientDocumentController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'patient-documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate secure random UUID-like filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter 
});

// Wrapper to handle multer errors gracefully instead of crashing HTML error pages
const uploadMiddleware = (req, res, next) => {
  const uploader = upload.single('file');
  uploader(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size must not exceed 5 MB.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

router.post('/', uploadMiddleware, patientDocumentController.uploadDocument);
router.get('/', patientDocumentController.getPatientDocuments);
router.get('/:documentId', patientDocumentController.viewDocument);

module.exports = router;
