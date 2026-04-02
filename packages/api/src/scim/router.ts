import { Router } from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { scimBearerAuth } from './middleware';
import { serviceProviderConfig, resourceTypes, schemas } from './meta';
import { createScimUsersHandlers } from './users';
import { createScimGroupsHandlers } from './groups';
import type { ScimUsersDeps } from './users';
import type { ScimGroupsDeps } from './groups';

export type ScimRouterDeps = ScimUsersDeps & ScimGroupsDeps;

export function createScimRouter(deps: ScimRouterDeps): Router {
  const router = Router();
  const users = createScimUsersHandlers(deps);
  const groups = createScimGroupsHandlers(deps);

  // Apply SCIM bearer token auth to all routes
  router.use(scimBearerAuth as RequestHandler);

  // Set SCIM content type on all responses
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'application/scim+json');
    next();
  });

  // Service discovery endpoints
  router.get('/ServiceProviderConfig', serviceProviderConfig as RequestHandler);
  router.get('/ResourceTypes', resourceTypes as RequestHandler);
  router.get('/Schemas', schemas as RequestHandler);

  // User resources
  router.get('/Users', users.listUsers as RequestHandler);
  router.post('/Users', users.createUser as RequestHandler);
  router.get('/Users/:id', users.getUser as RequestHandler);
  router.put('/Users/:id', users.replaceUser as RequestHandler);
  router.patch('/Users/:id', users.patchUser as RequestHandler);
  router.delete('/Users/:id', users.deleteUser as RequestHandler);

  // Group resources
  router.get('/Groups', groups.listGroups as RequestHandler);
  router.post('/Groups', groups.createGroup as RequestHandler);
  router.get('/Groups/:id', groups.getGroup as RequestHandler);
  router.put('/Groups/:id', groups.replaceGroup as RequestHandler);
  router.patch('/Groups/:id', groups.patchGroup as RequestHandler);
  router.delete('/Groups/:id', groups.deleteGroup as RequestHandler);

  return router;
}
