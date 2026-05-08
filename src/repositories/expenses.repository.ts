import { prisma } from '../lib/prisma.js';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../types/expenses.types.js';

export const expensesRepository = {
  create(input: CreateExpenseInput) {
    return prisma.expense.create({
      data: {
        tripId: input.tripId,
        payerParticipantId: input.payerParticipantId,
        title: input.title,
        category: input.category,
        note: input.note,
        spentAt: new Date(input.spentAt),
        currency: input.currency,
        amountOriginal: input.amountOriginal,
        fxMode: input.fxMode ?? 'FIXED',
        fxRateTripToKrw: input.fxRateTripToKrw,
        amountKrw: input.amountKrw,
        ...(input.receiptId !== undefined && { receiptId: input.receiptId }),
      },
    });
  },

  findTripById(tripId: string) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        ownerUserId: true,
      },
    });
  },

  findParticipantById(participantId: string) {
    return prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        tripId: true,
      },
    });
  },

  findReceiptById(receiptId: string) {
    return prisma.receipt.findUnique({
      where: { id: receiptId },
      select: {
        id: true,
        tripId: true,
        status: true,
        createdByUserId: true,
      },
    });
  },

  findExpenseByReceiptId(receiptId: string) {
    return prisma.expense.findFirst({
      where: { receiptId },
      select: { id: true },
    });
  },

  findExpenseById(expenseId: string) {
    return prisma.expense.findUnique({
      where: { id: expenseId },
      select: {
        id: true,
        tripId: true,
        receiptId: true,
        trip: {
          select: {
            ownerUserId: true,
          },
        },
      },
    });
  },

  findExpenseByReceiptIdExcludingExpense(receiptId: string, expenseId: string) {
    return prisma.expense.findFirst({
      where: {
        receiptId,
        id: {
          not: expenseId,
        },
      },
      select: {
        id: true,
      },
    });
  },

  update(expenseId: string, input: UpdateExpenseInput) {
    return prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(input.payerParticipantId !== undefined && {
          payerParticipantId: input.payerParticipantId,
        }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.note !== undefined && { note: input.note }),
        ...(input.spentAt !== undefined && {
          spentAt: new Date(input.spentAt),
        }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.amountOriginal !== undefined && {
          amountOriginal: input.amountOriginal,
        }),
        ...(input.fxMode !== undefined && { fxMode: input.fxMode }),
        ...(input.fxRateTripToKrw !== undefined && {
          fxRateTripToKrw: input.fxRateTripToKrw,
        }),
        ...(input.amountKrw !== undefined && { amountKrw: input.amountKrw }),
        ...(input.receiptId !== undefined && { receiptId: input.receiptId }),
      },
    });
  },
};
