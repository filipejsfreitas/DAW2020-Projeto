import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import * as Comments from '@controllers/Replies';

const { OK, INTERNAL_SERVER_ERROR } = StatusCodes;

const router = Router()

router.get('/:id', (req, res) => {
  Comments.get(req.params.id)
  .then(comment => res.status(OK).jsonp(comment))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error', error }}))
})

export default router;
