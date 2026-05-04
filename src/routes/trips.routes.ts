import { Router } from 'express';

import { tripController } from '../controllers/trips.controller.js';

const router = Router();

router.get('/', tripController.getTrips);
router.post('/', tripController.createTrip);
router.get('/:tripId', tripController.getTripById);

export default router;
