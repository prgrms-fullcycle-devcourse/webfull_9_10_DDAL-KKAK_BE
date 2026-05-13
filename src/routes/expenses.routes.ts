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
router.get('/', authenticate, getExpenses);
router.post('/', authenticate, createExpense);
router.get('/:expenseId', authenticate, getExpenseById);
router.patch('/:expenseId', authenticate, updateExpense);
router.delete('/:expenseId', authenticate, deleteExpense);

export default router;
