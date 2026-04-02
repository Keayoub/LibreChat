import type { IUser, IGroup } from '@librechat/data-schemas';
import { SCIM_SCHEMAS } from './types';
import type { ScimUser, ScimGroup, ScimGroupMember } from './types';

const BASE_URL = '/scim/v2';

function parseName(fullName?: string): { formatted?: string; givenName?: string; familyName?: string } {
  if (!fullName?.trim()) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { formatted: fullName, givenName: parts[0] };
  return { formatted: fullName, givenName: parts[0], familyName: parts.slice(1).join(' ') };
}

export function userToScim(user: IUser): ScimUser {
  const id = user._id?.toString() ?? '';
  return {
    schemas: [SCIM_SCHEMAS.USER],
    id,
    externalId: user.idOnTheSource,
    userName: user.email,
    name: parseName(user.name),
    displayName: user.name,
    emails: [{ value: user.email, type: 'work', primary: true }],
    active: user.active ?? true,
    meta: {
      resourceType: 'User',
      created: user.createdAt?.toISOString(),
      lastModified: user.updatedAt?.toISOString(),
      location: `${BASE_URL}/Users/${id}`,
      version: `W/"${user.updatedAt?.getTime() ?? 0}"`,
    },
  };
}

export function groupToScim(group: IGroup, members?: ScimGroupMember[]): ScimGroup {
  const id = group._id?.toString() ?? '';
  const derivedMembers =
    members ??
    (group.memberIds ?? []).map((v: string) => ({ value: v, $ref: `${BASE_URL}/Users/${v}` }));
  return {
    schemas: [SCIM_SCHEMAS.GROUP],
    id,
    externalId: group.idOnTheSource,
    displayName: group.name,
    members: derivedMembers,
    meta: {
      resourceType: 'Group',
      created: group.createdAt?.toISOString(),
      lastModified: group.updatedAt?.toISOString(),
      location: `${BASE_URL}/Groups/${id}`,
      version: `W/"${group.updatedAt?.getTime() ?? 0}"`,
    },
  };
}
