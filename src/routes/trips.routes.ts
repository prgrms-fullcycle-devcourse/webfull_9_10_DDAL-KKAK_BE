import { Router } from 'express';

import { tripController } from '../controllers/trips.controller.js';

const router = Router();

router.get('/', tripController.getTrips);
router.post('/', tripController.createTrip);

export default router;
