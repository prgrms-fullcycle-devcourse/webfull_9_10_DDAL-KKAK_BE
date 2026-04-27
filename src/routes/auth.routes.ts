import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

const router = Router();

router.get('/', (_req, res) => res.status(StatusCodes.OK).send('Auth'));

export default router;
