import { Router } from 'express';

import { tripController } from '../controllers/trips.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

import participantsRouter from './participants.routes.js';

const router = Router();

router.use(authenticate);

router.get('/', tripController.getTrips);
router.post('/', tripController.createTrip);
router.get('/:tripId', tripController.getTripById);
router.patch('/:tripId', tripController.updateTrip);
router.delete('/:tripId', tripController.deleteTrip);

router.use('/:tripId/participants', participantsRouter);

export default router;
