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
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/ocr', authenticate, createReceiptOcrJob);
router.get('/ocr/:receiptId', authenticate, getReceiptOcrJob);
router.delete('/ocr/:receiptId', authenticate, deleteReceiptOcrJob);
router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/:expenseId', getExpenseById);
router.patch('/:expenseId', updateExpense);
router.delete('/:expenseId', deleteExpense);

export default router;
