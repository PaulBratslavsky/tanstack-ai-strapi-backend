import { getActionId, PERMISSIONS } from './permissions';

/**
 * Actions a normal brain token is expected to hold.
 * `forget` is intentionally withheld (hard delete) and is not reported as missing.
 */
export const EXPECTED_TOKEN_ACTIONS = PERMISSIONS.map((permission) => permission.uid).filter(
  (uid) => uid !== 'forget' && uid !== 'search.reindex'
);

export interface TokenAbility {
  can?: (action: string) => boolean;
}

/** Action ids (`plugin::paul-brain.*`) the current token cannot perform. Empty when ability is unknown. */
export function missingTokenPermissions(userAbility: TokenAbility | null | undefined): string[] {
  if (!userAbility || typeof userAbility.can !== 'function') return [];
  return EXPECTED_TOKEN_ACTIONS.map((uid) => getActionId(uid)).filter((action) => !userAbility.can!(action));
}
