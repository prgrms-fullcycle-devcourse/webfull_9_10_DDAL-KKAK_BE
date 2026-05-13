import { Router } from 'express';

import { getCurrencies } from '../controllers/currencies.controller.js';

const router = Router();

router.get('/', getCurrencies);

export default router;
