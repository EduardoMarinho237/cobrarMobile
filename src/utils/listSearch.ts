export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function matchesSearchQuery(
  query: string,
  ...values: (string | number | boolean | null | undefined)[]
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => {
    if (value === null || value === undefined) {
      return false;
    }
    return normalizeSearchText(String(value)).includes(normalizedQuery);
  });
}

export function collectSearchableValues(
  ...sources: object[]
): (string | number | boolean)[] {
  const values: (string | number | boolean)[] = [];

  for (const source of sources) {
    for (const value of Object.values(source)) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        values.push(value);
      }
    }
  }

  return values;
}
