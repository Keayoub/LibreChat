import type { Response } from 'express';
import { SCIM_SCHEMAS } from './types';
import type { ScimListResponse, ScimPaginationParams } from './types';

export function sendScimError(
  res: Response,
  status: number,
  detail: string,
  scimType?: string,
): void {
  res.status(status).json({
    schemas: [SCIM_SCHEMAS.ERROR],
    status: String(status),
    ...(scimType ? { scimType } : {}),
    detail,
  });
}

export function parseSCIMPagination(query: Record<string, unknown>): ScimPaginationParams {
  const startIndex = Math.max(1, parseInt(String(query.startIndex ?? '1'), 10) || 1);
  const count = Math.min(200, Math.max(1, parseInt(String(query.count ?? '100'), 10) || 100));
  return { startIndex, count };
}

export function buildListResponse<T>(
  resources: T[],
  totalResults: number,
  { startIndex }: ScimPaginationParams,
): ScimListResponse<T> {
  return {
    schemas: [SCIM_SCHEMAS.LIST_RESPONSE],
    totalResults,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources,
  };
}

export function isValidObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}
