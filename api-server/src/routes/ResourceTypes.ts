import { Router } from 'express';

import * as ResourceTypes from '@controllers/ResourceTypes'

import { StatusCodes } from 'http-status-codes';

const { OK, INTERNAL_SERVER_ERROR } = StatusCodes;

const router = Router()

router.get('/', (req, res) => {
  ResourceTypes.list()
  .then(types => res.status(OK).jsonp(types))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error', error } }))
})

export default router;
