import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createReceiptOcrJob,
  deleteReceiptOcrJob,
  getReceiptOcrJob,
} from '../controllers/expenses.controller.js';

const router = Router();

router.get('/', (_req, res) => res.status(StatusCodes.OK).send('Expenses'));
router.post('/ocr', createReceiptOcrJob);
router.get('/ocr/:receiptId', getReceiptOcrJob);
router.delete('/ocr/:receiptId', deleteReceiptOcrJob);

export default router;
