import express from 'express';
import { getClasses, getRaces, getBackgrounds, getSources } from '../controllers/dataController.js';

const router = express.Router();

router.get('/classes', getClasses);
router.get('/races', getRaces);
router.get('/backgrounds', getBackgrounds);
router.get('/sources', getSources);

export default router;
