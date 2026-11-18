/** Types `forget` can archive. Resources use `state: "archived"`; the others use a boolean. */
export const ARCHIVE_FLAG_TYPES = ['note', 'person', 'project', 'decision', 'source'] as const;

export type ArchiveFlagType = (typeof ARCHIVE_FLAG_TYPES)[number];

const FLAG_SET = new Set<string>(ARCHIVE_FLAG_TYPES);

export function isArchivedRecord(type: string, entity: { archived?: boolean; state?: string } | null | undefined): boolean {
  if (!entity) return false;
  if (type === 'resource') return entity.state === 'archived';
  if (FLAG_SET.has(type)) return entity.archived === true;
  return false;
}

/**
 * Document-service filter that keeps live rows.
 * Boolean columns added later may be null on old rows, so null counts as not archived.
 * Resource lifecycle is the `state` enumeration (`draft` | `final` | `archived`).
 */
export function activeRecordFilter(type: string): Record<string, unknown> | null {
  if (type === 'resource') return { state: { $ne: 'archived' } };
  if (FLAG_SET.has(type)) {
    return {
      $or: [{ archived: { $eq: false } }, { archived: { $null: true } }],
    };
  }
  return null;
}

/** Merge `activeRecordFilter` into a filters object without clobbering an existing `$or`. */
export function withActiveRecords(type: string, filters: Record<string, any> = {}): Record<string, any> {
  const active = activeRecordFilter(type);
  if (!active) return filters;
  if (active.$or) {
    return {
      ...filters,
      $and: [...(Array.isArray(filters.$and) ? filters.$and : []), { $or: active.$or }],
    };
  }
  return { ...filters, ...active };
}
