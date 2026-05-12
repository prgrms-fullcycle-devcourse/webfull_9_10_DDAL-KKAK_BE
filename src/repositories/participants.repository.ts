import { prisma } from '../lib/prisma.js';
import type {
  CreateParticipantInput,
  UpdateParticipantInput,
} from '../types/participants.types.js';

export const participantsRepository = {
  findTripById(tripId: string) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, ownerUserId: true },
    });
  },

  findById(participantId: string) {
    return prisma.participant.findUnique({
      where: { id: participantId },
    });
  },

  findByNameAndTripId(name: string, tripId: string) {
    return prisma.participant.findUnique({
      where: { tripId_name: { tripId, name } },
    });
  },

  create(tripId: string, input: CreateParticipantInput) {
    return prisma.participant.create({
      data: {
        tripId,
        name: input.name,
      },
    });
  },

  update(participantId: string, input: UpdateParticipantInput) {
    return prisma.participant.update({
      where: { id: participantId },
      data: { name: input.name },
    });
  },

  deleteById(participantId: string) {
    return prisma.participant.delete({
      where: { id: participantId },
    });
  },
};
