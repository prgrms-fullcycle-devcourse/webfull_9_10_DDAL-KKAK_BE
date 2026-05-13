import { StatusCodes } from 'http-status-codes';

import { AppError } from '../errors/app-error.js';
import { participantsRepository } from '../repositories/participants.repository.js';
import type {
  CreateParticipantInput,
  UpdateParticipantInput,
} from '../types/participants.types.js';

const checkTripOwnership = async (tripId: string, userId: string) => {
  const trip = await participantsRepository.findTripById(tripId);

  if (trip === null) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'TRIP_009',
      '여행을 찾을 수 없습니다.',
    );
  }

  if (trip.ownerUserId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'TRIP_010',
      '접근 권한이 없습니다.',
    );
  }
};

export const participantsService = {
  async createParticipant(
    tripId: string,
    userId: string,
    input: CreateParticipantInput,
  ) {
    if (!input.name?.trim()) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'MEMBER_001',
        '참여자 이름은 필수입니다.',
      );
    }

    await checkTripOwnership(tripId, userId);

    const existing = await participantsRepository.findByNameAndTripId(
      input.name.trim(),
      tripId,
    );

    if (existing !== null) {
      throw new AppError(
        StatusCodes.CONFLICT,
        'MEMBER_002',
        '이미 존재하는 참여자 이름입니다.',
      );
    }

    return participantsRepository.create(tripId, { name: input.name.trim() });
  },

  async updateParticipant(
    tripId: string,
    participantId: string,
    userId: string,
    input: UpdateParticipantInput,
  ) {
    if (!input.name?.trim()) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'MEMBER_001',
        '참여자 이름은 필수입니다.',
      );
    }

    await checkTripOwnership(tripId, userId);

    const participant = await participantsRepository.findById(participantId);

    if (participant === null || participant.tripId !== tripId) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'MEMBER_003',
        '참여자를 찾을 수 없습니다.',
      );
    }

    const existing = await participantsRepository.findByNameAndTripId(
      input.name.trim(),
      tripId,
    );

    if (existing !== null && existing.id !== participantId) {
      throw new AppError(
        StatusCodes.CONFLICT,
        'MEMBER_002',
        '이미 존재하는 참여자 이름입니다.',
      );
    }

    return participantsRepository.update(participantId, {
      name: input.name.trim(),
    });
  },

  async deleteParticipant(
    tripId: string,
    participantId: string,
    userId: string,
  ) {
    await checkTripOwnership(tripId, userId);

    const participant = await participantsRepository.findById(participantId);

    if (participant === null || participant.tripId !== tripId) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'MEMBER_003',
        '참여자를 찾을 수 없습니다.',
      );
    }

    await participantsRepository.deleteById(participantId);
  },
};
