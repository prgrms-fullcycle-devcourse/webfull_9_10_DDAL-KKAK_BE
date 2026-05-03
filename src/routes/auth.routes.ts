import { Router } from 'express';

import {
  finishLogin,
  logoutUser,
  startLogin,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/:provider/login', startLogin);
router.get('/:provider/callback', finishLogin);

router.post('/logout', authenticate, logoutUser);

export default router;
