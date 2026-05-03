import { Router } from 'express';

import { finishLogin, startLogin } from '../controllers/auth.controller.js';

const router = Router({ mergeParams: true });

router.get('/:provider/login', startLogin);
router.get('/:provider/callback', finishLogin);

export default router;
