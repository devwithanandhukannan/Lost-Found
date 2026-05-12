import multer from "multer";
import path from "path";   
import fs from "fs";

const upload = path.join(process.cwd(), "uploads");

if (!fs.existsSync(upload)) {
  fs.mkdirSync(upload);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, upload);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and GIF files are allowed"), false);
  }
}

const uploadMiddleware = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

export default uploadMiddleware;