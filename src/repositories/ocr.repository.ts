import { type Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

type CreateOcrReceiptParams = {
  tripId: string;
  createdByUserId: string;
  imageUrl: string;
};

type UpdateOcrSuccessParams = {
  receiptId: string;
  parsedJson: Prisma.InputJsonValue;
};

type UpdateOcrFailureParams = {
  receiptId: string;
  errorMessage: string;
};

export const createOcrReceipt = async ({
  tripId,
  createdByUserId,
  imageUrl,
}: CreateOcrReceiptParams) => {
  return prisma.receipt.create({
    data: {
      tripId,
      createdByUserId,
      imageUrl,
      status: 'PENDING',
    },
  });
};

export const findOcrReceiptById = async (receiptId: string) => {
  return prisma.receipt.findUnique({
    where: { id: receiptId },
  });
};

export const markOcrReceiptAsSuccess = async ({
  receiptId,
  parsedJson,
}: UpdateOcrSuccessParams) => {
  return prisma.receipt.update({
    where: { id: receiptId },
    data: {
      status: 'SUCCESS',
      parsedJson,
      ocrText: null,
      errorMessage: null,
    },
  });
};

export const markOcrReceiptAsFailed = async ({
  receiptId,
  errorMessage,
}: UpdateOcrFailureParams) => {
  return prisma.receipt.update({
    where: { id: receiptId },
    data: {
      status: 'FAILED',
      errorMessage,
    },
  });
};
