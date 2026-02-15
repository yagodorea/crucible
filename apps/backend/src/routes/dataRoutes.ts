import express from 'express';
import { getClasses, getClassDetail, getSubclassDetail, getRaces, getBackgrounds, getBackgroundDetail, getSources } from '../controllers/dataController.js';

const router = express.Router();

router.get('/classes', getClasses);
router.get('/classes/:className', getClassDetail);
router.get('/classes/:className/subclasses/:subclassName', getSubclassDetail);
router.get('/races', getRaces);
router.get('/backgrounds', getBackgrounds);
router.get('/backgrounds/:backgroundName', getBackgroundDetail);
router.get('/sources', getSources);

export default router;
