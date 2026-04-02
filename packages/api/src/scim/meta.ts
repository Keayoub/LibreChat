import type { Request, Response } from 'express';
import { SCIM_SCHEMAS } from './types';

const BASE_URL = '/scim/v2';

export function serviceProviderConfig(_req: Request, res: Response): void {
  res.status(200).json({
    schemas: [SCIM_SCHEMAS.SERVICE_PROVIDER_CONFIG],
    documentationUri: 'https://librechat.ai/docs/configuration/scim',
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        name: 'OAuth Bearer Token',
        description: 'Authentication scheme using the OAuth Bearer Token standard',
        specUri: 'http://www.rfc-editor.org/info/rfc6750',
        type: 'oauthbearertoken',
        primary: true,
      },
    ],
    meta: {
      resourceType: 'ServiceProviderConfig',
      location: `${BASE_URL}/ServiceProviderConfig`,
    },
  });
}

export function resourceTypes(_req: Request, res: Response): void {
  res.status(200).json({
    schemas: [SCIM_SCHEMAS.LIST_RESPONSE],
    totalResults: 2,
    startIndex: 1,
    itemsPerPage: 2,
    Resources: [
      {
        schemas: [SCIM_SCHEMAS.RESOURCE_TYPE],
        id: 'User',
        name: 'User',
        endpoint: '/Users',
        description: 'User accounts',
        schema: SCIM_SCHEMAS.USER,
        schemaExtensions: [],
        meta: { location: `${BASE_URL}/ResourceTypes/User`, resourceType: 'ResourceType' },
      },
      {
        schemas: [SCIM_SCHEMAS.RESOURCE_TYPE],
        id: 'Group',
        name: 'Group',
        endpoint: '/Groups',
        description: 'Groups',
        schema: SCIM_SCHEMAS.GROUP,
        schemaExtensions: [],
        meta: { location: `${BASE_URL}/ResourceTypes/Group`, resourceType: 'ResourceType' },
      },
    ],
  });
}

export function schemas(_req: Request, res: Response): void {
  res.status(200).json({
    schemas: [SCIM_SCHEMAS.LIST_RESPONSE],
    totalResults: 2,
    startIndex: 1,
    itemsPerPage: 2,
    Resources: [
      {
        id: SCIM_SCHEMAS.USER,
        name: 'User',
        description: 'User Account',
        attributes: [
          { name: 'userName', type: 'string', required: true, uniqueness: 'server' },
          { name: 'name', type: 'complex', subAttributes: [
            { name: 'formatted', type: 'string' },
            { name: 'givenName', type: 'string' },
            { name: 'familyName', type: 'string' },
          ]},
          { name: 'displayName', type: 'string' },
          { name: 'emails', type: 'complex', multiValued: true },
          { name: 'active', type: 'boolean' },
          { name: 'externalId', type: 'string' },
        ],
        meta: { resourceType: 'Schema', location: `${BASE_URL}/Schemas/${SCIM_SCHEMAS.USER}` },
      },
      {
        id: SCIM_SCHEMAS.GROUP,
        name: 'Group',
        description: 'Group',
        attributes: [
          { name: 'displayName', type: 'string', required: true },
          { name: 'members', type: 'complex', multiValued: true },
          { name: 'externalId', type: 'string' },
        ],
        meta: { resourceType: 'Schema', location: `${BASE_URL}/Schemas/${SCIM_SCHEMAS.GROUP}` },
      },
    ],
  });
}
