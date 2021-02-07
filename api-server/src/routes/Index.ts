import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /:
 *  get:
 *    description: Checks if the server is alive.
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: Server is alive.
 *      other:
 *        description: Server is dead.
 */
router.get('/', (req, res) => {
  res.status(200).jsonp({ alive: true });
})

export default router;
