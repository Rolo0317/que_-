import { Router } from 'express';
import multer from 'multer';
import { getData, postData } from '../controllers/dataController.js';
import { healthCheck } from '../controllers/healthController.js';
import { uploadExcel } from '../controllers/uploadController.js';

const upload = multer({ storage: multer.memoryStorage() });
export const router = Router();

router.get('/health', healthCheck);
router.get('/data', getData);
router.post('/data', postData);
router.post('/upload', upload.single('file'), uploadExcel);
