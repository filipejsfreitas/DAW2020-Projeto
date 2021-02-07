import { Router } from 'express';

import * as Users from '../controllers/Users';
import * as Resources from '../controllers/Resources';
import { StatusCodes } from 'http-status-codes';

const router = Router();

const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = StatusCodes;

/**
 * @swagger
 * /resources:
 *  get:
 *    tags:
 *      - resources
 *    description: Get all users registered on the platform.
 *    security:
 *      - bearerToken: []
 *      - queryToken: []
 *    responses:
 *      200:
 *        description: JSON array with all of the users registered on the platform.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Resource'
 *      403:
 *        $ref: '#/components/responses/Unauthorized'
 *
 */
router.get('/', (req, res) => {
  Users.list()
  .then(users => res.status(200).jsonp(users))
  .catch(error => res.status(500).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } }))
})

router.get('/:id', (req, res) => {
  Users.get(req.params.id)
  .then(user => res.status(200).jsonp(user))
  .catch(error => res.status(500).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } }))
})

router.get('/:id/resources', async (req, res) => {
  try {
    const user = await Users.get(req.params.id)

    if(!user) {
      return res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested user does not exist' } })
    }

    let restrictPublic = false;
    if(!req.user) {
      restrictPublic = true;
    }

    const skip = parseInt(req.query.skip as string ?? '0');
    const limit = parseInt(req.query.limit as string ?? '10');
    
    const { resources, totalCount } = await Resources.getUserResources(user, restrictPublic, skip, limit)

    return res.status(OK).jsonp({ resources, totalCount })
  } catch(error) {
    return res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})


export default router;
