import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createReceiptOcrJob,
  getReceiptOcrJob,
} from '../controllers/expenses.controller.js';

const router = Router();

router.get('/', (_req, res) => res.status(StatusCodes.OK).send('Expenses'));
router.post('/ocr', createReceiptOcrJob);
router.get('/ocr/:receiptId', getReceiptOcrJob);

export default router;
