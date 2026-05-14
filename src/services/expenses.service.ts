import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import {
  expensesRepository,
  type ExpenseWithSummary,
} from '../repositories/expenses.repository.js';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../types/expenses.types.js';

const isAllowedCategory = (value: string): boolean =>
  ['FOOD', 'SHOPPING', 'TRANSPORT', 'TOUR', 'ETC'].includes(value);

const isAllowedCurrency = (value: string): boolean =>
  ['KRW', 'TRIP'].includes(value);

const isAllowedFxMode = (value: string): boolean =>
  ['FIXED', 'REALTIME'].includes(value);

const dedupePreserveOrder = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const t = id.trim();
    if (t === '' || seen.has(t)) {
      continue;
    }
    seen.add(t);
    out.push(t);
  }

  return out;
};

const distinctShareParticipantIds = (
  shares: ExpenseWithSummary['expenseShares'],
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of shares) {
    if (!seen.has(s.participantId)) {
      seen.add(s.participantId);
      out.push(s.participantId);
    }
  }

  return out;
};

const validateParticipantsBelongToTrip = async (
  tripId: string,
  participantIds: string[],
): Promise<void> => {
  const unique = dedupePreserveOrder(participantIds);
  if (unique.length === 0) {
    return;
  }
  const count = await expensesRepository.countParticipantsInTrip(
    tripId,
    unique,
  );
  if (count !== unique.length) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_005',
      '유효하지 않은 지출 요청입니다.',
      'splitWithParticipantIds에 해당 여행에 속하지 않는 참가자가 포함되어 있습니다.',
    );
  }
};

const mapExpenseToResponse = (row: ExpenseWithSummary) => {
  const { payer, expenseShares, ...rest } = row;

  return {
    ...rest,
    payerName: payer.name,
    splitWith: expenseShares.map(es => ({
      participantId: es.participant.id,
      name: es.participant.name,
    })),
  };
};

const validateCreateExpenseInput = (input: CreateExpenseInput): void => {
  if (input.tripId.trim() === '') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'tripId는 필수 값입니다.',
    );
  }

  if (input.payerParticipantId.trim() === '') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'payerParticipantId는 필수 값입니다.',
    );
  }

  if (input.title.trim() === '') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'title은 필수 값입니다.',
    );
  }

  if (Number.isNaN(new Date(input.spentAt).getTime())) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'spentAt 형식이 올바르지 않습니다.',
    );
  }

  if (!isAllowedCurrency(input.currency)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'currency는 KRW 또는 TRIP 이어야 합니다.',
    );
  }

  if (input.category !== undefined && !isAllowedCategory(input.category)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'category 값이 올바르지 않습니다.',
    );
  }

  if (input.fxMode !== undefined && !isAllowedFxMode(input.fxMode)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'fxMode는 FIXED 또는 REALTIME 이어야 합니다.',
    );
  }

  if (
    input.amountOriginal <= 0 ||
    input.fxRateTripToKrw <= 0 ||
    input.amountKrw <= 0
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      '금액 및 환율은 0보다 커야 합니다.',
    );
  }

  if (input.splitWithParticipantIds !== undefined) {
    if (!Array.isArray(input.splitWithParticipantIds)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'EXP_001',
        '필수 입력값이 누락되었습니다.',
        'splitWithParticipantIds는 문자열 배열이어야 합니다.',
      );
    }

    for (const id of input.splitWithParticipantIds) {
      if (typeof id !== 'string' || id.trim() === '') {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'EXP_001',
          '필수 입력값이 누락되었습니다.',
          'splitWithParticipantIds 항목은 비어 있지 않은 문자열이어야 합니다.',
        );
      }
    }
  }
};

const validateUpdateExpenseInput = (input: UpdateExpenseInput): void => {
  if (input.title !== undefined && input.title.trim() === '') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'title은 빈 문자열일 수 없습니다.',
    );
  }

  if (
    input.spentAt !== undefined &&
    Number.isNaN(new Date(input.spentAt).getTime())
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'spentAt 형식이 올바르지 않습니다.',
    );
  }

  if (input.currency !== undefined && !isAllowedCurrency(input.currency)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'currency는 KRW 또는 TRIP 이어야 합니다.',
    );
  }

  if (input.category !== undefined && !isAllowedCategory(input.category)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'category 값이 올바르지 않습니다.',
    );
  }

  if (input.fxMode !== undefined && !isAllowedFxMode(input.fxMode)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      'fxMode는 FIXED 또는 REALTIME 이어야 합니다.',
    );
  }

  if (
    (input.amountOriginal !== undefined && input.amountOriginal <= 0) ||
    (input.fxRateTripToKrw !== undefined && input.fxRateTripToKrw <= 0) ||
    (input.amountKrw !== undefined && input.amountKrw <= 0)
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_001',
      '필수 입력값이 누락되었습니다.',
      '금액 및 환율은 0보다 커야 합니다.',
    );
  }

  if (input.splitWithParticipantIds !== undefined) {
    if (!Array.isArray(input.splitWithParticipantIds)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'EXP_001',
        '필수 입력값이 누락되었습니다.',
        'splitWithParticipantIds는 문자열 배열이어야 합니다.',
      );
    }

    for (const id of input.splitWithParticipantIds) {
      if (typeof id !== 'string' || id.trim() === '') {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'EXP_001',
          '필수 입력값이 누락되었습니다.',
          'splitWithParticipantIds 항목은 비어 있지 않은 문자열이어야 합니다.',
        );
      }
    }
  }
};

const validateReceiptLink = async ({
  receiptId,
  userId,
  tripId,
  excludeExpenseId,
}: {
  receiptId: string;
  userId: string;
  tripId: string;
  excludeExpenseId?: string;
}): Promise<void> => {
  const receipt = await expensesRepository.findReceiptById(receiptId);
  if (receipt === null) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'EXP_002',
      '유효하지 않은 지출 요청입니다.',
      'receiptId에 해당하는 영수증이 존재하지 않습니다.',
    );
  }

  if (receipt.createdByUserId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'EXP_003',
      '접근 권한이 없습니다.',
      '본인 소유의 영수증만 연결할 수 있습니다.',
    );
  }

  if (receipt.tripId !== tripId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'EXP_002',
      '유효하지 않은 지출 요청입니다.',
      '영수증의 tripId와 지출 tripId가 일치하지 않습니다.',
    );
  }

  if (receipt.status !== 'SUCCESS') {
    throw new AppError(
      StatusCodes.CONFLICT,
      'EXP_006',
      '영수증 OCR이 아직 완료되지 않았습니다.',
      'SUCCESS 상태의 영수증만 지출에 연결할 수 있습니다.',
    );
  }

  let alreadyLinked: { id: string } | null;
  if (excludeExpenseId !== undefined) {
    alreadyLinked =
      await expensesRepository.findExpenseByReceiptIdExcludingExpense(
        receiptId,
        excludeExpenseId,
      );
  } else {
    alreadyLinked = await expensesRepository.findExpenseByReceiptId(receiptId);
  }

  if (alreadyLinked !== null) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'EXP_004',
      '이미 연결된 영수증입니다.',
      '해당 receiptId는 다른 지출에 이미 연결되어 있습니다.',
    );
  }
};

export const expensesService = {
  async createExpense(userId: string, input: CreateExpenseInput) {
    validateCreateExpenseInput(input);

    const trip = await expensesRepository.findTripById(input.tripId);
    if (trip === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXP_002',
        '유효하지 않은 지출 요청입니다.',
        'tripId에 해당하는 여행이 존재하지 않습니다.',
      );
    }

    if (trip.ownerUserId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'EXP_003',
        '접근 권한이 없습니다.',
        '본인 소유의 여행에만 지출을 추가할 수 있습니다.',
      );
    }

    const participant = await expensesRepository.findParticipantById(
      input.payerParticipantId,
    );
    if (participant === null || participant.tripId !== input.tripId) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'EXP_005',
        '유효하지 않은 지출 요청입니다.',
        'payerParticipantId가 해당 여행에 속하지 않습니다.',
      );
    }

    if (input.receiptId !== undefined && input.receiptId.trim() !== '') {
      await validateReceiptLink({
        receiptId: input.receiptId,
        userId,
        tripId: input.tripId,
      });
    }

    const shareParticipantIds =
      input.splitWithParticipantIds !== undefined &&
      input.splitWithParticipantIds.length > 0
        ? dedupePreserveOrder(input.splitWithParticipantIds)
        : [input.payerParticipantId];

    await validateParticipantsBelongToTrip(input.tripId, shareParticipantIds);

    const created = await expensesRepository.createWithSummary(
      input,
      shareParticipantIds,
    );

    return mapExpenseToResponse(created);
  },

  async updateExpense(
    userId: string,
    expenseId: string,
    input: UpdateExpenseInput,
    options: { replaceSplits: boolean },
  ) {
    validateUpdateExpenseInput(input);

    const expense = await expensesRepository.findExpenseById(expenseId);
    if (expense === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId에 해당하는 지출이 존재하지 않습니다.',
      );
    }

    if (expense.trip.ownerUserId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'EXP_003',
        '접근 권한이 없습니다.',
        '본인 소유의 여행 지출만 수정할 수 있습니다.',
      );
    }

    const before = await expensesRepository.findWithSummaryById(expenseId);
    if (before === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId에 해당하는 지출이 존재하지 않습니다.',
      );
    }

    if (input.payerParticipantId !== undefined) {
      const p = await expensesRepository.findParticipantById(
        input.payerParticipantId,
      );
      if (p === null || p.tripId !== expense.tripId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'EXP_005',
          '유효하지 않은 지출 요청입니다.',
          'payerParticipantId가 해당 여행에 속하지 않습니다.',
        );
      }
    }

    if (typeof input.receiptId === 'string' && input.receiptId.trim() !== '') {
      await validateReceiptLink({
        receiptId: input.receiptId,
        userId,
        tripId: expense.tripId,
        excludeExpenseId: expense.id,
      });
    }

    const scalarInput = { ...input };
    delete scalarInput.splitWithParticipantIds;

    const amountRelatedPatch =
      input.amountKrw !== undefined ||
      input.amountOriginal !== undefined ||
      input.fxRateTripToKrw !== undefined;

    let shareParticipantIds: string[] | null = null;

    if (options.replaceSplits) {
      const raw = input.splitWithParticipantIds ?? [];
      shareParticipantIds = raw.length > 0 ? dedupePreserveOrder(raw) : [];
      const mergedPayer =
        input.payerParticipantId !== undefined
          ? input.payerParticipantId
          : before.payerParticipantId;
      const toValidate =
        shareParticipantIds.length > 0 ? shareParticipantIds : [mergedPayer];
      await validateParticipantsBelongToTrip(before.tripId, toValidate);
    } else if (before.expenseShares.length > 0 && amountRelatedPatch) {
      shareParticipantIds = distinctShareParticipantIds(before.expenseShares);
    }

    const updated = await expensesRepository.updateWithSummary(
      expenseId,
      scalarInput,
      shareParticipantIds,
    );

    return mapExpenseToResponse(updated);
  },

  async getExpenses(userId: string, tripId: string) {
    if (tripId.trim() === '') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'EXP_001',
        '필수 입력값이 누락되었습니다.',
        'tripId는 필수 값입니다.',
      );
    }

    const trip = await expensesRepository.findTripById(tripId);
    if (trip === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXP_002',
        '유효하지 않은 지출 요청입니다.',
        'tripId에 해당하는 여행이 존재하지 않습니다.',
      );
    }

    if (trip.ownerUserId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'EXP_003',
        '접근 권한이 없습니다.',
        '본인 소유의 여행 지출만 조회할 수 있습니다.',
      );
    }

    const rows = await expensesRepository.findManyWithSummaryByTripId(tripId);

    return rows.map(mapExpenseToResponse);
  },

  async getExpenseById(userId: string, expenseId: string) {
    const expenseForAuth = await expensesRepository.findExpenseById(expenseId);
    if (expenseForAuth === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId에 해당하는 지출이 존재하지 않습니다.',
      );
    }

    if (expenseForAuth.trip.ownerUserId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'EXP_003',
        '접근 권한이 없습니다.',
        '본인 소유의 여행 지출만 조회할 수 있습니다.',
      );
    }

    const row = await expensesRepository.findWithSummaryById(expenseId);
    if (row === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId에 해당하는 지출이 존재하지 않습니다.',
      );
    }

    return mapExpenseToResponse(row);
  },

  async deleteExpense(userId: string, expenseId: string) {
    const expense = await expensesRepository.findExpenseById(expenseId);
    if (expense === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'EXP_007',
        '지출을 찾을 수 없습니다.',
        'expenseId에 해당하는 지출이 존재하지 않습니다.',
      );
    }

    if (expense.trip.ownerUserId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'EXP_003',
        '접근 권한이 없습니다.',
        '본인 소유의 여행 지출만 삭제할 수 있습니다.',
      );
    }

    await expensesRepository.deleteById(expenseId);
  },
};
