import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import { tripRepository } from '../repositories/trips.repository.js';
import type { CreateTripInput, UpdateTripInput } from '../types/trips.types.js';

function validateCreateInput(input: CreateTripInput) {
  if (!input.ownerUserId?.trim()) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_001',
      'ownerUserId는 필수입니다.',
    );
  }

  if (!input.title?.trim()) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_002',
      '여행 제목은 필수입니다.',
    );
  }

  if (!input.tripCurrencyCode?.trim()) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_003',
      '여행 통화 코드는 필수입니다.',
    );
  }

  if (
    input.defaultFxMode &&
    !['FIXED', 'REALTIME'].includes(input.defaultFxMode)
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_004',
      'defaultFxMode는 FIXED 또는 REALTIME이어야 합니다.',
    );
  }

  if (input.fixedExchangeRate !== undefined && input.fixedExchangeRate <= 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_005',
      '환율은 0보다 커야 합니다.',
    );
  }

  if (
    input.startDate !== undefined &&
    isNaN(new Date(input.startDate).getTime())
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_006',
      'startDate 형식이 올바르지 않습니다.',
    );
  }

  if (input.endDate !== undefined && isNaN(new Date(input.endDate).getTime())) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_007',
      'endDate 형식이 올바르지 않습니다.',
    );
  }

  if (
    input.startDate !== undefined &&
    input.endDate !== undefined &&
    new Date(input.endDate) < new Date(input.startDate)
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'TRIP_008',
      '종료일은 시작일보다 이후여야 합니다.',
    );
  }
}

export const tripService = {
  async createTrip(input: CreateTripInput) {
    validateCreateInput(input);

    return tripRepository.create(input);
  },

  async getTrips(ownerUserId: string) {
    if (!ownerUserId?.trim()) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'TRIP_001',
        'ownerUserId는 필수입니다.',
      );
    }

    return tripRepository.findManyByOwner(ownerUserId);
  },

  async getTripById(tripId: string) {
    const trip = await tripRepository.findById(tripId);

    if (trip === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'TRIP_009',
        '여행을 찾을 수 없습니다.',
      );
    }

    return trip;
  },

  async updateTrip(tripId: string, input: UpdateTripInput) {
    const trip = await tripRepository.findById(tripId);

    if (trip === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'TRIP_009',
        '여행을 찾을 수 없습니다.',
      );
    }

    if (
      input.defaultFxMode &&
      !['FIXED', 'REALTIME'].includes(input.defaultFxMode)
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'TRIP_004',
        'defaultFxMode는 FIXED 또는 REALTIME이어야 합니다.',
      );
    }

    if (
      input.fixedExchangeRate !== undefined &&
      input.fixedExchangeRate !== null &&
      input.fixedExchangeRate <= 0
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'TRIP_005',
        '환율은 0보다 커야 합니다.',
      );
    }

    if (
      input.startDate !== undefined &&
      input.startDate !== null &&
      isNaN(new Date(input.startDate).getTime())
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'TRIP_006',
        'startDate 형식이 올바르지 않습니다.',
      );
    }

    if (
      input.endDate !== undefined &&
      input.endDate !== null &&
      isNaN(new Date(input.endDate).getTime())
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'TRIP_007',
        'endDate 형식이 올바르지 않습니다.',
      );
    }

    const startDate =
      input.startDate !== undefined
        ? input.startDate
        : trip.startDate?.toISOString();
    const endDate =
      input.endDate !== undefined ? input.endDate : trip.endDate?.toISOString();

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'TRIP_008',
        '종료일은 시작일보다 이후여야 합니다.',
      );
    }

    return tripRepository.update(tripId, input);
  },

  async deleteTrip(tripId: string) {
    const trip = await tripRepository.findById(tripId);

    if (trip === null) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'TRIP_009',
        '여행을 찾을 수 없습니다.',
      );
    }

    await tripRepository.deleteById(tripId);
  },
};
