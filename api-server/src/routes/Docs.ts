import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const router = express.Router();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de dados',
      version: '1.0.0'
    }
  },
  apis: [
    path.resolve(__dirname, '*.js'),
    path.resolve(__dirname, '*.ts'),
    path.resolve(__dirname, '..', 'models', '*.ts')
  ]
};

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

export default router;

/**
 * @swagger
 * components:
 *  securitySchemes:
 *    bearerToken:
 *      type: http
 *      scheme: bearer
 *      bearerFormat: JWT
 *      description: JWT token sent in Authorization header
 *    queryToken:
 *      type: apiKey
 *      in: query
 *      name: token
 *      description: JWT token sent in query string parameter token
 *  responses:
 *    NotFound:
 *      description: The requested resource was not found.
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              error:
 *                type: object
 *    Unauthorized:
 *      description: The user is not authorized to perform the requested action, either because he is not logged in or doesn't have the required access privileges.
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              error:
 *                type: object
 *    ClientError:
 *      description: The server couldn't understand the request because of wrong input.
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              error:
 *                type: object
 *    ServerError:
 *      description: The server encountered an error while processing the request.
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              error:
 *                type: object
 * tags:
 *  - name: resources
 *  - name: posts
 *  - name: comments
 *  - name: users
 *  - name: auth
 */
