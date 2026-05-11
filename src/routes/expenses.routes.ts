import { Router } from 'express';

import {
  createExpense,
  createReceiptOcrJob,
  deleteExpense,
  deleteReceiptOcrJob,
  getExpenseById,
  getExpenses,
  getReceiptOcrJob,
  updateExpense,
} from '../controllers/expenses.controller.js';

const router = Router();

router.post('/ocr', createReceiptOcrJob);
router.get('/ocr/:receiptId', getReceiptOcrJob);
router.delete('/ocr/:receiptId', deleteReceiptOcrJob);
router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/:expenseId', getExpenseById);
router.patch('/:expenseId', updateExpense);
router.delete('/:expenseId', deleteExpense);

export default router;
