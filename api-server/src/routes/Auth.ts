import { Router } from 'express';

import * as jwt from 'jwt-promisify';
import passport from 'passport';

import * as Users from '../controllers/Users';
import * as UserRoles from '../controllers/UserRoles';

import { StatusCodes } from 'http-status-codes';
import { customAlphabet } from 'nanoid';

const { OK, CREATED, BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR } = StatusCodes;

const jti = customAlphabet('0123456789', 10);

const router = Router();

router.get('/registerteste', async (req, res) => {
  if(process.env.NODE_ENV !== 'development') {
    return res.status(404).jsonp({ error: { name: 'not_found' } })
  }

  if(await UserRoles.get('admin') === null) {
    await UserRoles.insert('admin');
  }

  Users.insert({
      name: "diogo",
      email: "d12@gmail.com",
      role: "admin",
      affiliation: "UM"
  }, "teste")
  .then(resp => res.status(200).jsonp(resp))
  .catch(error => res.status(500).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } }))
});

/**
 * @swagger
 * /auth/login:
 *  post:
 *    tags:
 *      - auth
 *    summary: Attempts to log the user in.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              password:
 *                type: string
 *    responses:
 *      201:
 *        description: Successful login
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                token:
 *                  type: string
 *                  description: The JWT token to be used for subsequent requests
 *      404:
 *        description: Wrong username/password
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/Unauthorized'
 *      500:
 *        $ref: '#/components/responses/ServerError'
 */
router.post('/login', (req, res) => {
  passport.authenticate('local', { session: false }, (err, user: Express.User) => {
      if(!user) {
        return res.status(UNAUTHORIZED).jsonp({ error: { name: 'wrong_credentials', message: 'Wrong username/password!' } })
      }

      jwt.sign(
        { uid: user.id, email: user.email, role: user.role.name },
        process.env.JWT_KEY ?? 'DAW2020',
        { expiresIn: parseInt(process.env.JWT_DURATION ?? '3600'), jwtid: jti() }
      )
      .then(token => res.status(CREATED).jsonp({ token }))
      .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } }))
  })(req, res);
});

/**
 * @swagger
 * /auth/logout:
 *  post:
 *    tags:
 *      - auth
 *    summary: Attempts to log the user out.
 *    security:
 *      - queryToken: []
 *      - bearerToken: []
 *    responses:
 *      200:
 *        description: Successful logout
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  type: boolean
 *      400:
 *        description: The user is already logged out
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/ClientError'
 *      500:
 *        $ref: '#/components/responses/ServerError'
 */
router.post('/logout', async (req, res) => {
  if(!req.user || !req.jwt) {
    return res.status(BAD_REQUEST).jsonp({ error: { name: 'not_logged_in', message: 'You are not logged in!' } })
  }

  req.user.destroyedTokens.push(req.jwt.jti);

  try {
    await req.user.save();
  } catch(error) {
    return res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } })
  }

  return res.status(OK).jsonp({ success: true })
})

/**
 * @swagger
 * /auth/register:
 *  post:
 *    tags:
 *      - auth
 *    summary: Attempts to register the user with the given data.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              email:
 *                type: string
 *              password:
 *                type: string
 *              affiliation:
 *                type: string
 *    responses:
 *      200:
 *        description: Successful registration
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      401:
 *        description: Wrong username/password
 *        content:
 *          application/json:
 *            type: object
 *            properties:
 *              error:
 *                type: object
 *                description: An error object containing the specifics about the error that occurred.
 */
router.post('/register', (req, res) => {
  if(req.user) {
    return res.status(BAD_REQUEST).jsonp({ error: 'You must be logged out to register a new account!' })
  }

  Users.insert(req.body, req.body.password)
  .then(resp => res.status(OK).jsonp(resp))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } }))
})

router.get('/', (req, res) => {
  if(!req.user) {
    return res.status(BAD_REQUEST).jsonp({ error: { name: 'not_logged_in' } })
  }

  res.status(OK).jsonp(req.user);
})

router.put('/', async (req, res) => {
  if(!req.user) {
    return res.status(BAD_REQUEST).jsonp({ error: { name: 'not_logged_in' } })
  }

  try {
    await req.user.update(req.body).exec()
  } catch(error) {
    return res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'Internal Server Error' }})
  }

  res.status(OK).jsonp({ success: true });
})

export default router;
