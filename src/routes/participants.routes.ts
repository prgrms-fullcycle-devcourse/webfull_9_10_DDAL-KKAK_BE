import { Router } from 'express';

import { participantsController } from '../controllers/participants.controller.js';

const router = Router({ mergeParams: true });

router.post('/', participantsController.createParticipant);
router.patch('/:participantId', participantsController.updateParticipant);
router.delete('/:participantId', participantsController.deleteParticipant);

export default router;
