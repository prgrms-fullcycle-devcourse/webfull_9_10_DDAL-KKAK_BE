import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../types/expenses.types.js';

const expenseSummaryInclude = {
  payer: { select: { id: true, name: true } },
  expenseShares: {
    include: {
      participant: { select: { id: true, name: true } },
    },
    orderBy: { participantId: 'asc' as const },
  },
} as const;

export type ExpenseWithSummary = Prisma.ExpenseGetPayload<{
  include: typeof expenseSummaryInclude;
}>;

const omitSplitIds = (
  input: CreateExpenseInput,
): Omit<CreateExpenseInput, 'splitWithParticipantIds'> => {
  const result = { ...input };
  delete result.splitWithParticipantIds;

  return result;
};

export const expensesRepository = {
  findWithSummaryById(expenseId: string) {
    return prisma.expense.findUnique({
      where: { id: expenseId },
      include: expenseSummaryInclude,
    });
  },

  findManyWithSummaryByTripId(tripId: string) {
    return prisma.expense.findMany({
      where: { tripId },
      orderBy: { spentAt: 'desc' },
      include: expenseSummaryInclude,
    });
  },

  async createWithSummary(
    input: CreateExpenseInput,
    shareParticipantIds: string[],
  ) {
    const data = omitSplitIds(input);

    return prisma.$transaction(async tx => {
      const expense = await tx.expense.create({
        data: {
          tripId: data.tripId,
          payerParticipantId: data.payerParticipantId,
          title: data.title,
          spentAt: new Date(data.spentAt),
          currency: data.currency,
          amountOriginal: data.amountOriginal,
          fxMode: data.fxMode ?? 'FIXED',
          fxRateTripToKrw: data.fxRateTripToKrw,
          amountKrw: data.amountKrw,
          ...(data.receiptId !== undefined && { receiptId: data.receiptId }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.note !== undefined && { note: data.note }),
        },
      });

      const rows = buildExpenseShareRows(
        expense.id,
        Number(expense.amountKrw),
        shareParticipantIds,
      );
      if (rows.length > 0) {
        await tx.expenseShare.createMany({ data: rows });
      }

      return tx.expense.findUniqueOrThrow({
        where: { id: expense.id },
        include: expenseSummaryInclude,
      });
    });
  },

  async updateWithSummary(
    expenseId: string,
    scalarInput: Omit<UpdateExpenseInput, 'splitWithParticipantIds'>,
    shareParticipantIds: string[] | null,
  ) {
    return prisma.$transaction(async tx => {
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          ...(scalarInput.payerParticipantId !== undefined && {
            payerParticipantId: scalarInput.payerParticipantId,
          }),
          ...(scalarInput.title !== undefined && { title: scalarInput.title }),
          ...(scalarInput.category !== undefined && {
            category: scalarInput.category,
          }),
          ...(scalarInput.note !== undefined && { note: scalarInput.note }),
          ...(scalarInput.spentAt !== undefined && {
            spentAt: new Date(scalarInput.spentAt),
          }),
          ...(scalarInput.currency !== undefined && {
            currency: scalarInput.currency,
          }),
          ...(scalarInput.amountOriginal !== undefined && {
            amountOriginal: scalarInput.amountOriginal,
          }),
          ...(scalarInput.fxMode !== undefined && {
            fxMode: scalarInput.fxMode,
          }),
          ...(scalarInput.fxRateTripToKrw !== undefined && {
            fxRateTripToKrw: scalarInput.fxRateTripToKrw,
          }),
          ...(scalarInput.amountKrw !== undefined && {
            amountKrw: scalarInput.amountKrw,
          }),
          ...(scalarInput.receiptId !== undefined && {
            receiptId: scalarInput.receiptId,
          }),
        },
      });

      const updated = await tx.expense.findUniqueOrThrow({
        where: { id: expenseId },
        select: { amountKrw: true, payerParticipantId: true },
      });

      if (shareParticipantIds !== null) {
        await tx.expenseShare.deleteMany({ where: { expenseId } });
        const ids =
          shareParticipantIds.length > 0
            ? shareParticipantIds
            : [updated.payerParticipantId];
        const rows = buildExpenseShareRows(
          expenseId,
          Number(updated.amountKrw),
          ids,
        );
        if (rows.length > 0) {
          await tx.expenseShare.createMany({ data: rows });
        }
      }

      return tx.expense.findUniqueOrThrow({
        where: { id: expenseId },
        include: expenseSummaryInclude,
      });
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

  countParticipantsInTrip(tripId: string, participantIds: string[]) {
    if (participantIds.length === 0) {
      return Promise.resolve(0);
    }

    return prisma.participant.count({
      where: {
        tripId,
        id: { in: participantIds },
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

  deleteById(expenseId: string) {
    return prisma.expense.delete({
      where: { id: expenseId },
    });
  },
};

/** 원 단위 금액을 N명에게 원 단위로 균등 분배(센트 단위에서 나머지 분배). */
function equalShareKrwParts(amountKrw: number, count: number): number[] {
  if (count <= 0) {
    return [];
  }
  const cents = Math.round(amountKrw * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;

  return Array.from(
    { length: count },
    (_, i) => (base + (i < remainder ? 1 : 0)) / 100,
  );
}

function buildExpenseShareRows(
  expenseId: string,
  amountKrw: number,
  participantIds: string[],
): { expenseId: string; participantId: string; shareAmountKrw: string }[] {
  const parts = equalShareKrwParts(amountKrw, participantIds.length);

  return participantIds.map((participantId, i) => ({
    expenseId,
    participantId,
    shareAmountKrw: (parts[i] ?? 0).toFixed(2),
  }));
}
