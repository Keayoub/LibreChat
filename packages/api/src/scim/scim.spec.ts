import { Types } from 'mongoose';
import { SystemRoles } from 'librechat-data-provider';
import type { IUser, IGroup, UserDeleteResult } from '@librechat/data-schemas';
import type { Response } from 'express';
import { createScimUsersHandlers } from './users';
import { createScimGroupsHandlers } from './groups';
import { buildUserFilterQuery, buildGroupFilterQuery, extractMemberIdFromPath } from './filter';

jest.mock('@librechat/data-schemas', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function makeUser(overrides: Partial<IUser> = {}): IUser {
  return {
    _id: new Types.ObjectId(),
    name: 'Jane Doe',
    email: 'jane@example.com',
    provider: 'scim',
    role: SystemRoles.USER,
    emailVerified: true,
    active: true,
    idOnTheSource: 'okta-user-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    ...overrides,
  } as IUser;
}

function makeGroup(overrides: Partial<IGroup> = {}): IGroup {
  return {
    _id: new Types.ObjectId(),
    name: 'Engineering',
    source: 'scim',
    idOnTheSource: 'okta-group-456',
    memberIds: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    ...overrides,
  } as unknown as IGroup;
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(overrides: { params?: Record<string, string>; query?: Record<string, unknown>; body?: unknown } = {}) {
  return {
    params: overrides.params ?? {},
    query: overrides.query ?? {},
    body: overrides.body ?? {},
    headers: {},
  };
}

// ------------------------------------------------------------------
// filter.ts
// ------------------------------------------------------------------
describe('buildUserFilterQuery', () => {
  it('returns empty object when no filter', () => {
    expect(buildUserFilterQuery()).toEqual({});
  });

  it('maps userName eq to email', () => {
    expect(buildUserFilterQuery('userName eq "jane@example.com"')).toEqual({
      email: 'jane@example.com',
    });
  });

  it('maps emails.value eq to email', () => {
    expect(buildUserFilterQuery('emails.value eq "jane@example.com"')).toEqual({
      email: 'jane@example.com',
    });
  });

  it('maps externalId eq to idOnTheSource', () => {
    expect(buildUserFilterQuery('externalId eq "okta-123"')).toEqual({
      idOnTheSource: 'okta-123',
    });
  });

  it('maps active eq true', () => {
    expect(buildUserFilterQuery('active eq true')).toEqual({ active: true });
  });

  it('maps active eq false', () => {
    expect(buildUserFilterQuery('active eq false')).toEqual({ active: false });
  });

  it('returns empty object for unsupported filter', () => {
    expect(buildUserFilterQuery('unknownAttr gt 5')).toEqual({});
  });
});

describe('buildGroupFilterQuery', () => {
  it('maps displayName eq to name', () => {
    expect(buildGroupFilterQuery('displayName eq "Engineering"')).toEqual({ name: 'Engineering' });
  });

  it('maps externalId eq to idOnTheSource', () => {
    expect(buildGroupFilterQuery('externalId eq "okta-group-1"')).toEqual({
      idOnTheSource: 'okta-group-1',
    });
  });
});

describe('extractMemberIdFromPath', () => {
  it('extracts member id from SCIM path filter', () => {
    const id = new Types.ObjectId().toString();
    expect(extractMemberIdFromPath(`members[value eq "${id}"]`)).toBe(id);
  });

  it('returns null for plain members path', () => {
    expect(extractMemberIdFromPath('members')).toBeNull();
  });

  it('returns null for non-member path', () => {
    expect(extractMemberIdFromPath('displayName')).toBeNull();
  });
});

// ------------------------------------------------------------------
// users.ts – createScimUsersHandlers
// ------------------------------------------------------------------
describe('createScimUsersHandlers', () => {
  const userId = new Types.ObjectId();
  const user = makeUser({ _id: userId });

  const baseDeps = {
    findUsers: jest.fn(),
    countUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUserById: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  describe('listUsers', () => {
    it('returns SCIM ListResponse with users', async () => {
      baseDeps.findUsers.mockResolvedValue([user]);
      baseDeps.countUsers.mockResolvedValue(1);
      const { listUsers } = createScimUsersHandlers(baseDeps);
      const req = mockReq({ query: {} });
      const res = mockRes();

      await listUsers(req as never, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalResults: 1,
          Resources: expect.arrayContaining([
            expect.objectContaining({ userName: 'jane@example.com' }),
          ]),
        }),
      );
    });
  });

  describe('getUser', () => {
    it('returns 404 for invalid ObjectId', async () => {
      const { getUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await getUser(mockReq({ params: { id: 'not-an-id' } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 when user not found', async () => {
      baseDeps.getUserById.mockResolvedValue(null);
      const { getUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await getUser(mockReq({ params: { id: userId.toString() } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns SCIM user when found', async () => {
      baseDeps.getUserById.mockResolvedValue(user);
      const { getUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await getUser(mockReq({ params: { id: userId.toString() } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'jane@example.com', active: true }),
      );
    });
  });

  describe('createUser', () => {
    it('returns 400 when userName is missing', async () => {
      const { createUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await createUser(mockReq({ body: {} }) as never, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 409 when user already exists', async () => {
      baseDeps.findUsers.mockResolvedValue([user]);
      const { createUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await createUser(
        mockReq({ body: { userName: 'jane@example.com', schemas: [] } }) as never,
        res,
      );
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates user and returns 201', async () => {
      baseDeps.findUsers.mockResolvedValue([]);
      baseDeps.createUser.mockResolvedValue({ _id: userId, ...user });
      baseDeps.getUserById.mockResolvedValue(user);
      const { createUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await createUser(
        mockReq({ body: { userName: 'jane@example.com', externalId: 'okta-123', schemas: [] } }) as never,
        res,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(baseDeps.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'jane@example.com', provider: 'scim', emailVerified: true }),
        undefined,
        true,
        true,
      );
    });
  });

  describe('patchUser – deprovision', () => {
    it('sets active=false and clears refreshToken on deprovision', async () => {
      baseDeps.getUserById.mockResolvedValue(user);
      baseDeps.updateUser.mockResolvedValue({ ...user, active: false, refreshToken: [] });
      const { patchUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await patchUser(
        mockReq({
          params: { id: userId.toString() },
          body: {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{ op: 'replace', path: 'active', value: false }],
          },
        }) as never,
        res,
      );
      expect(baseDeps.updateUser).toHaveBeenCalledWith(
        userId.toString(),
        expect.objectContaining({ active: false, refreshToken: [] }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 when Operations array is missing', async () => {
      baseDeps.getUserById.mockResolvedValue(user);
      const { patchUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await patchUser(
        mockReq({ params: { id: userId.toString() }, body: { schemas: [] } }) as never,
        res,
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteUser', () => {
    it('returns 204 on success', async () => {
      baseDeps.deleteUserById.mockResolvedValue({ deletedCount: 1 } as UserDeleteResult);
      const { deleteUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await deleteUser(mockReq({ params: { id: userId.toString() } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 when user not found', async () => {
      baseDeps.deleteUserById.mockResolvedValue({ deletedCount: 0 } as UserDeleteResult);
      const { deleteUser } = createScimUsersHandlers(baseDeps);
      const res = mockRes();
      await deleteUser(mockReq({ params: { id: userId.toString() } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

// ------------------------------------------------------------------
// groups.ts – createScimGroupsHandlers
// ------------------------------------------------------------------
describe('createScimGroupsHandlers', () => {
  const groupId = new Types.ObjectId();
  const group = makeGroup({ _id: groupId });

  const baseDeps = {
    findUsers: jest.fn(),
    countGroups: jest.fn(),
    listGroups: jest.fn(),
    findGroupById: jest.fn(),
    createGroup: jest.fn(),
    updateGroupById: jest.fn(),
    deleteGroup: jest.fn(),
    addUserToGroup: jest.fn(),
    removeMemberById: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  describe('getGroup', () => {
    it('returns 404 for invalid ObjectId', async () => {
      const { getGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await getGroup(mockReq({ params: { id: 'bad-id' } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns SCIM group with empty members', async () => {
      baseDeps.findGroupById.mockResolvedValue(group);
      baseDeps.findUsers.mockResolvedValue([]);
      const { getGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await getGroup(mockReq({ params: { id: groupId.toString() } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Engineering', members: [] }),
      );
    });
  });

  describe('createGroup', () => {
    it('returns 400 when displayName is missing', async () => {
      const { createGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await createGroup(mockReq({ body: { schemas: [] } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates group with source=scim', async () => {
      baseDeps.createGroup.mockResolvedValue(group);
      baseDeps.findGroupById.mockResolvedValue(group);
      baseDeps.findUsers.mockResolvedValue([]);
      const { createGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await createGroup(
        mockReq({
          body: { displayName: 'Engineering', externalId: 'okta-group-456', schemas: [], members: [] },
        }) as never,
        res,
      );
      expect(baseDeps.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Engineering', source: 'scim' }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('deleteGroup', () => {
    it('returns 204 on success', async () => {
      baseDeps.deleteGroup.mockResolvedValue(group);
      const { deleteGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await deleteGroup(mockReq({ params: { id: groupId.toString() } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 when group not found', async () => {
      baseDeps.deleteGroup.mockResolvedValue(null);
      const { deleteGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await deleteGroup(mockReq({ params: { id: groupId.toString() } }) as never, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('patchGroup – add/remove members', () => {
    it('adds members via SCIM PATCH add', async () => {
      const memberId = new Types.ObjectId().toString();
      baseDeps.findGroupById.mockResolvedValue(group);
      baseDeps.addUserToGroup.mockResolvedValue({ user: makeUser(), group });
      baseDeps.findUsers.mockResolvedValue([]);
      const { patchGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await patchGroup(
        mockReq({
          params: { id: groupId.toString() },
          body: {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{ op: 'add', path: 'members', value: [{ value: memberId }] }],
          },
        }) as never,
        res,
      );
      expect(baseDeps.addUserToGroup).toHaveBeenCalledWith(memberId, groupId.toString());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('removes member by path filter', async () => {
      const memberUserId = new Types.ObjectId().toString();
      const memberUser = makeUser({ _id: new Types.ObjectId(memberUserId), idOnTheSource: 'okta-user-abc' });
      baseDeps.findGroupById.mockResolvedValue(group);
      baseDeps.findUsers.mockResolvedValue([memberUser]);
      baseDeps.removeMemberById.mockResolvedValue(group);
      const { patchGroup } = createScimGroupsHandlers(baseDeps);
      const res = mockRes();
      await patchGroup(
        mockReq({
          params: { id: groupId.toString() },
          body: {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{ op: 'remove', path: `members[value eq "${memberUserId}"]` }],
          },
        }) as never,
        res,
      );
      // Removes by idOnTheSource (stored in memberIds)
      expect(baseDeps.removeMemberById).toHaveBeenCalledWith(groupId.toString(), 'okta-user-abc');
    });
  });
});
