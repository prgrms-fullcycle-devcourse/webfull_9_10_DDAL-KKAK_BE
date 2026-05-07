import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createExpense,
  createReceiptOcrJob,
  deleteReceiptOcrJob,
  getReceiptOcrJob,
  updateExpense,
} from '../controllers/expenses.controller.js';

const router = Router();

router.get('/', (_req, res) => res.status(StatusCodes.OK).send('Expenses'));
router.post('/', createExpense);
router.patch('/:expenseId', updateExpense);
router.post('/ocr', createReceiptOcrJob);
router.get('/ocr/:receiptId', getReceiptOcrJob);
router.delete('/ocr/:receiptId', deleteReceiptOcrJob);

export default router;
