import multer from 'multer';
import DatauriParser from 'datauri/parser.js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let storage;

if (process.env.LOCAL_FILE_STORAGE === 'true') {
  // Define file storage in disk
  console.log('Storage: disk');
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'src/api/v1/public/uploads');
    },
    filename: function (req, file, cb) {
      const today = new Date().toISOString().replace(/:/g, '-'); // yyyy-mm-ddThh-mm-ss.mmmZ
      cb(null, today + '-' + file.originalname);
      // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      // cb(null, file.fieldname + '-' + uniqueSuffix)
    },
  });
} else {
  // Define file storage in buffer (work with cloudinary)
  console.log('Storage: buffer');
  storage = multer.memoryStorage();
}

// Accepted file's format
// Set this to a function to control which files should be uploaded and which should be skipped.
function fileFilter(req, file, cb) {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

// Multer
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Data uri
const parser = new DatauriParser();
/**
 * @description This function converts the buffer to data url
 * @param {Object} req containing the field object
 * @returns {String} The data url from the string buffer
 */
const bufferToUrl = (file) =>
  parser.format(path.extname(file.originalname).toString(), file.buffer);

export { upload, bufferToUrl };
