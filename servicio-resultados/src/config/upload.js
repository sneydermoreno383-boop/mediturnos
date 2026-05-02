const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/app/uploads');
  },
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}-${file.originalname}`;
    cb(null, nombreUnico);
  }
});

const filtroArchivos = (req, file, cb) => {
  const tiposPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'application/dicom'
  ];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filtroArchivos,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB máximo
});

module.exports = upload;