/**
 * Fields the document service will accept on `fields`.
 *
 * Strapi rejects anything that is not a scalar attribute with
 * `Invalid key <name>` (validateFields, scalarAttributes). Notes have no
 * `name` and people have no `title`, so requesting both on every type
 * throws "Invalid key name" or "Invalid key title" and recall falls back.
 * JSON (tags, aliases) is scalar and is kept. Relations are not.
 */
const NON_FIELD_TYPES = new Set(['relation', 'media', 'component', 'dynamiczone']);

export function isSelectableField(
  model: { attributes?: Record<string, { type?: string } | undefined> } | null | undefined,
  field: string | null | undefined
): boolean {
  if (!field) return false;
  const attribute = model?.attributes?.[field];
  if (!attribute?.type) return false;
  return !NON_FIELD_TYPES.has(attribute.type);
}

export function selectableFields(
  model: { attributes?: Record<string, { type?: string } | undefined> } | null | undefined,
  requested: Array<string | null | undefined>
): string[] {
  const fields: string[] = [];
  for (const field of requested) {
    if (!field || fields.includes(field)) continue;
    if (!isSelectableField(model, field)) continue;
    fields.push(field);
  }
  return fields;
}
