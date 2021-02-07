import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import * as Files from '@controllers/Files';

const { OK, INTERNAL_SERVER_ERROR } = StatusCodes;

const router = Router()

router.get('/:id', (req, res) => {
  Files.get(req.params.id)
  .then(file => res.status(OK).jsonp(file))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error', error }}))
})

export default router;
