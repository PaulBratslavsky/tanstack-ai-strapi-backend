/**
 * Strip nullish values from an object for clean JSON output
 */
export const stripNullish = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};
