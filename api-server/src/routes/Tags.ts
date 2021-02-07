import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import * as Resources from '@controllers/Resources';
import * as Tags from '@controllers/Tags';

const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = StatusCodes;

const router = Router()

router.get('/:id', (req, res) => {
  Tags.get(req.params.id)
  .then(tag => res.status(OK).jsonp(tag))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error', error }}))
})

router.get('/:id/resources', async (req, res) => {
  try {
    const tag = await Tags.get(req.params.id)

    if(!tag) {
      return res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested tag does not exist' } })
    }

    const resources = await Tags.getResources(tag, parseInt(req.query.skip as string ?? '0'), parseInt(req.query.limit as string ?? '10'));

    return res.status(OK).jsonp({ resources, totalCount: resources.length })
  } catch(error) {
    return res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

export default router;
