import type { FilterQuery } from 'mongoose';
import type { IUser, IGroup } from '@librechat/data-schemas';

type FilterValue = string | boolean;

interface ParsedFilter {
  attr: string;
  op: string;
  value: FilterValue;
}

const FILTER_RE = /^(\S+)\s+(eq|ne|co|sw|ew)\s+"?([^"]*)"?$/i;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseFilter(str: string): ParsedFilter | null {
  const m = FILTER_RE.exec(str.trim());
  if (!m) return null;
  const [, attr, op, rawVal] = m;
  const lower = rawVal.toLowerCase();
  const value: FilterValue = lower === 'true' ? true : lower === 'false' ? false : rawVal;
  return { attr: attr.toLowerCase(), op: op.toLowerCase(), value };
}

export function buildUserFilterQuery(filter?: string): FilterQuery<IUser> {
  if (!filter) return {};
  const parsed = parseFilter(filter);
  if (!parsed) return {};
  const { attr, op, value } = parsed;
  const strVal = String(value);

  if (op === 'eq') {
    if (attr === 'username' || attr === 'emails.value') return { email: strVal };
    if (attr === 'externalid') return { idOnTheSource: strVal };
    if (attr === 'active') return { active: value };
    if (attr === 'id') return { _id: strVal };
  }
  if (op === 'sw') {
    const re = { $regex: `^${escapeRegex(strVal)}`, $options: 'i' };
    if (attr === 'username' || attr === 'emails.value') return { email: re };
    if (attr === 'displayname') return { name: re };
  }
  if (op === 'co') {
    const re = { $regex: escapeRegex(strVal), $options: 'i' };
    if (attr === 'username' || attr === 'emails.value') return { email: re };
    if (attr === 'displayname') return { name: re };
  }
  return {};
}

export function buildGroupFilterQuery(filter?: string): FilterQuery<IGroup> {
  if (!filter) return {};
  const parsed = parseFilter(filter);
  if (!parsed) return {};
  const { attr, op, value } = parsed;
  const strVal = String(value);

  if (op === 'eq') {
    if (attr === 'displayname') return { name: strVal };
    if (attr === 'externalid') return { idOnTheSource: strVal };
    if (attr === 'id') return { _id: strVal };
  }
  if (op === 'sw') {
    const re = { $regex: `^${escapeRegex(strVal)}`, $options: 'i' };
    if (attr === 'displayname') return { name: re };
  }
  if (op === 'co') {
    const re = { $regex: escapeRegex(strVal), $options: 'i' };
    if (attr === 'displayname') return { name: re };
  }
  return {};
}

/** Extract single member value from a SCIM path like: members[value eq "user-id"] */
export function extractMemberIdFromPath(path: string): string | null {
  const m = path.match(/^members\[value\s+eq\s+"([^"]+)"\]$/i);
  return m ? m[1] : null;
}
