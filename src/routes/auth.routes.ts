import { Router } from 'express';

import {
  finishLogin,
  logoutUser,
  refreshUser,
  startLogin,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/:provider/login', startLogin);
router.get('/:provider/callback', finishLogin);

router.post('/logout', authenticate, logoutUser);
router.post('/refresh', refreshUser);

export default router;
