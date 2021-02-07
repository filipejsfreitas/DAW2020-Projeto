import { Response, Router } from 'express';
import * as Resources from '@controllers/Resources';
import * as Comments from '@controllers/Comments';
import * as Replies from '@controllers/Replies';
import * as Files from '@controllers/Files';
import { StatusCodes } from 'http-status-codes';

const router = Router();

const { OK, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_SERVER_ERROR } = StatusCodes;

/**
 * @swagger
 * /resources:
 *  get:
 *    tags:
 *      - resources
 *    description: Get all resources registered on the server.
 *    security:
 *      - bearerToken: []
 *      - queryToken: []
 *    responses:
 *      200:
 *        description: JSON array with all of the resources created on this server.
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
  Resources.list(req.user)
  .then(resources => res.status(OK).jsonp(resources))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } }))
})

/**
 * @swagger
 * /resources:
 *  post:
 *    tags:
 *      - resources
 *    description: Create a new resource on the server associated with the logged in user.
 *    security:
 *      - bearerToken: []
 *      - queryToken: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *              subtitle:
 *                type: string
 *              description:
 *                type: string
 *              type:
 *                type: string
 *              tags:
 *                type: array
 *                items:
 *                  type: string
 *                  description: Name of the tag
 *              authors:
 *                type: array
 *                items:
 *                  type: string
 *                  description: Name of the author
 *    responses:
 *      200:
 *        description: JSON object with the created resource
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Resource'
 *      400:
 *        $ref: '#/components/responses/ClientError'
 *      403:
 *        $ref: '#/components/responses/Unauthorized'
 *      500:
 *        $ref: '#/components/responses/ServerError'
 */
router.post('/', (req, res) => {
  Resources.create({ ...req.body, uploader: req.user })
  .then(resource => res.status(OK).jsonp({ resource }))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } }))
});

router.post('/search', (req, res) => {
  const skip = parseInt(req.query.skip as string ?? '0');
  const limit = parseInt(req.query.limit as string ?? '10');

  Resources.search({ ...req.body }, req.user, skip, limit)
  .then(({ resources, totalCount }) => res.status(OK).jsonp({ resources, totalCount }))
  .catch(error => res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error', error } }))
})

/**
 * @swagger
 * /resources/{id}:
 *  get:
 *    tags:
 *      - resources
 *    description: Get the details of a resource. Authentication is only required for hidden or modifiable resources.
 *    security:
 *      - bearerToken: []
 *      - queryToken: []
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: JSON object with the created resource
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Resource'
 *      400:
 *        $ref: '#/components/responses/ClientError'
 *      403:
 *        $ref: '#/components/responses/Unauthorized'
 *      500:
 *        $ref: '#/components/responses/ServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const resource = await checkResourceAccessPrivileges(req.user, req.params.id, res)
    if(!resource) return;

    return res.status(OK).jsonp({ resource });
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal server error', error } });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const resource = await checkResourceAccessPrivileges(req.user, req.params.id, res)
    if(!resource) return;

    await Resources.update(resource, req.body)

    return res.status(OK).jsonp({ success: true })
  } catch(error) {
    return res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const resource = await checkResourceEditPrivileges(req.user, req.params.id, res)
    if(!resource) return;

    const resourceData = JSON.parse(JSON.stringify(resource));
    
    await Files.deleteAll(resource)
    await Comments.deleteAll(resource)

    await resource.deleteOne()

    res.status(OK).jsonp({ resource: resourceData })
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

router.get('/:id/files', async (req, res) => {
  try {
    const resource = await checkResourceAccessPrivileges(req.user, req.params.id, res)
    if(!resource) return;

    res.status(OK).jsonp(resource.files)
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

router.post('/:id/files', async (req, res) => {
  try {
    const resource = await checkResourceEditPrivileges(req.user, req.params.id, res)
    if(!resource) return;
    if(!req.user) return;

    res.status(OK).jsonp(await Resources.addFiles(resource, req.body.files));
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

router.delete('/:id/files/:fileId', async (req, res) => {
  try {
    const resource = await checkResourceEditPrivileges(req.user, req.params.id, res)
    if(!resource) return;
    if(!req.user) return;

    const file = await Files.get(req.params.fileId)

    if(!file) {
      return res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested file was not found' } })
    }

    await file.remove()
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

router.get('/:id/comments', async (req, res) => {
  try {
    const resource = await checkResourceAccessPrivileges(req.user, req.params.id, res)
    if(!resource) return;

    res.status(OK).jsonp(resource.comments)
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

router.post('/:id/comments', async (req, res) => {
  try {
    const resource = await checkResourceCommentPrivileges(req.user, req.params.id, res)
    if(!resource) return;
    if(!req.user) return;

    res.status(OK).jsonp(await Comments.insert(resource, req.user, req.body as string[]));
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error', error } })
  }
})

router.get('/:resourceId/comments/:commentId/replies', async (req, res) => {
  try {
    const resource = await checkResourceAccessPrivileges(req.user, req.params.resourceId, res)
    if(!resource) return;

    const comment = await Comments.getResourceComment(resource, req.params.commentId)
    
    if(!comment) {
      return res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested comment was not found!' } })
    }

    res.status(OK).jsonp(comment.replies)
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

router.post('/:resourceId/comments/:commentId/replies', async (req, res) => {
  try {
    const resource = await checkResourceCommentPrivileges(req.user, req.params.resourceId, res)
    if(!resource) return;
    if(!req.user) return;

    const comment = await Comments.getResourceComment(resource, req.params.commentId)
    
    if(!comment) {
      return res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested comment was not found!' } })
    }

    res.status(OK).jsonp(await Replies.insert(comment, req.user, req.body));
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
  }
})

export default router;

async function checkResourceAccessPrivileges(user: Express.User | undefined, resId: string, res: Response) {
  try {
    const resource = await Resources.get(resId)

    if(!user && resource?.visibility !== 'public') {
      res.status(UNAUTHORIZED).jsonp({ error: { name: 'unauthorized', message: 'You are not logged in!' } })
      return false;
    }

    if(!resource) {
      res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested resource does not exist' } })
      return false;
    }

    if(resource.visibility !== 'public' && user?.role.name !== 'admin' && resource.uploader.id !== user?.id) {
      res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested resource does not exist' } })
      // Here we return a 404 instead of FORBIDDEN because we do not want to leak the resource's existance if the visibility
      // is private
      return false;
    }

    // We return the resource if any of the following are true:
    // 1) The resource is public
    // 2) The resource isn't public AND the user is logged in AND (the user is an admin or the resource's uploader)
    return resource;
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
    return false;
  }
}

async function checkResourceCommentPrivileges(user: Express.User | undefined, resId: string, res: Response) {
  try {
    const resource = await Resources.get(resId)

    if(!user) {
      res.status(UNAUTHORIZED).jsonp({ error: { name: 'unauthorized', message: 'You are not logged in!' } })
      return false;
    }

    if(!resource) {
      res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested resource does not exist' } })
      return false;
    }

    if(resource.visibility !== 'public' && user?.role.name !== 'admin' && resource.uploader.id !== user?.id) {
      res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested resource does not exist' } })
      // Here we return a 404 instead of FORBIDDEN because we do not want to leak the resource's existance if the visibility
      // is private
      return false;
    }

    // We return the resource if all of the following are true:
    // 1) The user is logged in
    // 2) The resource exists
    // 3) The resource is public OR (the user is an admin or the resource's uploader)
    return resource;
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
    return false;
  }
}

async function checkResourceEditPrivileges(user: Express.User | undefined, resId: string, res: Response) {
  try {
    const resource = await Resources.get(resId)

    if(!user) {
      res.status(UNAUTHORIZED).jsonp({ error: { name: 'unauthorized', message: 'You are not logged in!' } })
      return false;
    }

    if(!resource) {
      res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested resource does not exist' } })
      return false;
    }

    if(user?.role.name === 'admin') {
      return resource;
    }

    if(resource.visibility === 'public') {
      res.status(FORBIDDEN).jsonp({ error: { name: 'forbidden', message: 'You cannot edit this resource' } })
      return false;
    }

    if(resource.uploader.id !== user?.id) {
      res.status(NOT_FOUND).jsonp({ error: { name: 'not_found', message: 'The requested resource does not exist' } })
      // Here we return a 404 instead of FORBIDDEN because we do not want to leak the resource's existance if the visibility
      // is private
      return false;
    }

    // We return the resource if any of the following are true:
    // 1) The user is an admin
    // 2) The resource is private and the user is the resource's uploader
    return resource;
  } catch(error) {
    res.status(INTERNAL_SERVER_ERROR).jsonp({ error: { name: 'internal_server_error', message: 'Internal Server Error' } })
    return false;
  }
}
