import { Router } from 'express';

import * as reportController from '../controllers/report.controller.js';
import * as screenshotController from '../controllers/screenshot.controller.js';
import * as settlementController from '../controllers/settlement.controller.js';
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

router.get('/:tripId/settlement', settlementController.getTripSettlement);
router.get(
  '/:tripId/settlement/summary',
  settlementController.getMySettlementSummary,
);

router.get('/:tripId/report', reportController.getAiConsumptionReport);
router.post(
  '/:tripId/report/screenshot',
  screenshotController.generateReportScreenshot,
);

export default router;
