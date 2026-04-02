export const SCIM_SCHEMAS = {
  USER: 'urn:ietf:params:scim:schemas:core:2.0:User',
  GROUP: 'urn:ietf:params:scim:schemas:core:2.0:Group',
  PATCH_OP: 'urn:ietf:params:scim:api:messages:2.0:PatchOp',
  LIST_RESPONSE: 'urn:ietf:params:scim:api:messages:2.0:ListResponse',
  ERROR: 'urn:ietf:params:scim:api:messages:2.0:Error',
  SERVICE_PROVIDER_CONFIG: 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig',
  RESOURCE_TYPE: 'urn:ietf:params:scim:schemas:core:2.0:ResourceType',
  SCHEMA_DEF: 'urn:ietf:params:scim:schemas:core:2.0:Schema',
} as const;

export interface ScimMeta {
  resourceType: string;
  created?: string;
  lastModified?: string;
  location: string;
  version?: string;
}

export interface ScimName {
  formatted?: string;
  givenName?: string;
  familyName?: string;
  middleName?: string;
}

export interface ScimEmail {
  value: string;
  type?: string;
  primary?: boolean;
}

export interface ScimUser {
  schemas: string[];
  id?: string;
  externalId?: string;
  userName: string;
  name?: ScimName;
  displayName?: string;
  emails?: ScimEmail[];
  active?: boolean;
  meta?: ScimMeta;
}

export interface ScimGroupMember {
  value: string;
  display?: string;
  $ref?: string;
}

export interface ScimGroup {
  schemas: string[];
  id?: string;
  externalId?: string;
  displayName: string;
  members?: ScimGroupMember[];
  meta?: ScimMeta;
}

export interface ScimListResponse<T> {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

export interface ScimError {
  schemas: string[];
  status: string;
  scimType?: string;
  detail?: string;
}

export type PatchOp = 'add' | 'remove' | 'replace';

export interface ScimPatchOperation {
  op: PatchOp;
  path?: string;
  value?: unknown;
}

export interface ScimPatchRequest {
  schemas: string[];
  Operations: ScimPatchOperation[];
}

export interface ScimPaginationParams {
  startIndex: number;
  count: number;
}
