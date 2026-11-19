/**
 * Hybrid ranking. One module owns the constants and the math.
 *
 * Ported from yt-kb `client/src/lib/services/retrieval.ts` and music-kb
 * `retrieval-fusion.ts`:
 *   - Reciprocal Rank Fusion decides ORDER only.
 *   - Cosine similarity is the user-facing score.
 *   - Match tiers come from rank, not from the raw cosine.
 *
 * The lexical list is the order returned by Postgres `ts_rank` (or the
 * SQLite LIKE fallback). This module does not build a BM25 index.
 * `BM25_WEIGHT` is the lexical weight in the fusion, kept under that name
 * so the tuning stays comparable with the earlier plugins.
 *
 * Tag, alias, title-token, and pinned boosts are applied here too, then the
 * list is re-ranked. Callers pass aliases in as their own list; they use the
 * same per-tag weight because they are curated labels, same as tags.
 */

export const RRF_K = 60;
export const BM25_WEIGHT = 2.5;
export const TAG_BOOST_PER_TAG = 0.06;
export const TITLE_BOOST_PER_TOKEN = 0.015;
export const TITLE_TOKEN_MIN_IDF = 1.5;
/** Small extra so a pinned note can outrank an otherwise equal neighbor. */
export const PINNED_BOOST = 0.05;

export type MatchTier = 'top' | 'strong' | 'good' | 'related';

export const MATCH_TIER_LABEL: Record<MatchTier, string> = {
  top: 'Top match',
  strong: 'Strong match',
  good: 'Good match',
  related: 'Related',
};

/** Rank-only tier. Cosine is ignored on purpose (music-kb / yt-kb). */
export function getMatchTier(rank: number, _score?: number): MatchTier {
  if (rank === 0) return 'top';
  if (rank < 3) return 'strong';
  if (rank < 8) return 'good';
  return 'related';
}

export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export type Ranking = {
  order: string[];
  weight?: number;
};

/** Cormack et al. (2009). A hit in only one list still scores. */
export function fuseRRF(rankings: Ranking[], k: number = RRF_K): Map<string, number> {
  const fused = new Map<string, number>();
  for (const { order, weight = 1 } of rankings) {
    order.forEach((id, rank) => {
      fused.set(id, (fused.get(id) ?? 0) + weight / (rank + 1 + k));
    });
  }
  return fused;
}

export type FusedHit = {
  id: string;
  rrfScore: number;
  cosineScore: number;
  matchTier: MatchTier;
};

export function rankByFusedScore(
  rrfScores: Map<string, number>,
  cosineScores: Map<string, number>
): FusedHit[] {
  return Array.from(rrfScores.entries())
    .map(([id, rrfScore]) => ({
      id,
      rrfScore,
      cosineScore: cosineScores.get(id) ?? 0,
      matchTier: 'related' as MatchTier,
    }))
    .sort((a, b) => b.rrfScore - a.rrfScore || a.id.localeCompare(b.id))
    .map((hit, rank) => ({ ...hit, matchTier: getMatchTier(rank, hit.cosineScore) }));
}

export function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

/**
 * Okapi-style IDF: ln(1 + (N - df + 0.5) / (df + 0.5)).
 * A term in 1 of 8 docs is about ln(6) ≈ 1.79, which clears TITLE_TOKEN_MIN_IDF.
 */
export function idf(tokenizedDocs: string[][]): Record<string, number> {
  const n = tokenizedDocs.length;
  const df = new Map<string, number>();
  for (const doc of tokenizedDocs) {
    for (const token of new Set(doc)) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const scores: Record<string, number> = {};
  for (const [token, docs] of df) {
    scores[token] = Math.log(1 + (n - docs + 0.5) / (docs + 0.5));
  }
  return scores;
}

export function distinctiveTitleTokens(
  query: string,
  corpusIdf: Record<string, number>
): Set<string> {
  return new Set(
    tokenize(query).filter((token) => {
      const score = corpusIdf[token];
      return score !== undefined && score >= TITLE_TOKEN_MIN_IDF;
    })
  );
}

export type BoostMeta = {
  title: string;
  tags: string[];
  aliases: string[];
  pinned: boolean;
};

export type BoostReport = {
  tagBoosts: Map<string, string[]>;
  aliasBoosts: Map<string, string[]>;
  titleBoosts: Map<string, string[]>;
  pinned: string[];
};

function normalizeLabel(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Mutates `fused` in place. Tags and aliases share TAG_BOOST_PER_TAG.
 * Title tokens use TITLE_BOOST_PER_TOKEN and only when the token is
 * distinctive in the candidate corpus. Pinned adds PINNED_BOOST.
 */
export function applyTagAliasAndTitleBoosts(
  fused: Map<string, number>,
  query: string,
  meta: Map<string, BoostMeta>
): BoostReport {
  const queryTokens = new Set(tokenize(query));
  const titles = Array.from(meta.values()).map((row) => tokenize(row.title));
  const corpusIdf = idf(titles);
  const titleTokens = distinctiveTitleTokens(query, corpusIdf);

  const tagBoosts = new Map<string, string[]>();
  const aliasBoosts = new Map<string, string[]>();
  const titleBoosts = new Map<string, string[]>();
  const pinned: string[] = [];

  for (const [id, row] of meta) {
    const matchedTags = row.tags
      .map(normalizeLabel)
      .filter((tag) => tag.length >= 2 && queryTokens.has(tag));
    if (matchedTags.length > 0) {
      fused.set(id, (fused.get(id) ?? 0) + matchedTags.length * TAG_BOOST_PER_TAG);
      tagBoosts.set(id, matchedTags);
    }

    const matchedAliases = row.aliases
      .map(normalizeLabel)
      .filter((alias) => alias.length >= 2 && queryTokens.has(alias));
    if (matchedAliases.length > 0) {
      fused.set(id, (fused.get(id) ?? 0) + matchedAliases.length * TAG_BOOST_PER_TAG);
      aliasBoosts.set(id, matchedAliases);
    }

    const candidateTitle = new Set(tokenize(row.title));
    const matchedTitle = Array.from(titleTokens).filter((token) => candidateTitle.has(token));
    if (matchedTitle.length > 0) {
      fused.set(id, (fused.get(id) ?? 0) + matchedTitle.length * TITLE_BOOST_PER_TOKEN);
      titleBoosts.set(id, matchedTitle);
    }

    if (row.pinned) {
      fused.set(id, (fused.get(id) ?? 0) + PINNED_BOOST);
      pinned.push(id);
    }
  }

  return { tagBoosts, aliasBoosts, titleBoosts, pinned };
}

export function vectorOrder(cosineScores: Map<string, number>): string[] {
  return Array.from(cosineScores.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

/**
 * Fuse lexical + dense order, apply tag/alias/title/pinned boosts, re-rank.
 * `cosineScores` only needs entries that have a current vector. Everyone
 * else keeps cosine 0 and can still rank via the lexical list or a boost.
 */
export function rankHybrid(input: {
  query: string;
  keywordOrder: string[];
  cosineScores: Map<string, number>;
  meta: Map<string, BoostMeta>;
}): FusedHit[] {
  const denseOrder = vectorOrder(input.cosineScores);
  const fused = fuseRRF([
    { order: denseOrder, weight: 1 },
    { order: input.keywordOrder, weight: BM25_WEIGHT },
  ]);
  applyTagAliasAndTitleBoosts(fused, input.query, input.meta);
  return rankByFusedScore(fused, input.cosineScores);
}
