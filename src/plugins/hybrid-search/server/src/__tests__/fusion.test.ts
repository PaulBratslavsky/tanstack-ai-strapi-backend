import { describe, expect, it } from 'vitest';
import {
  BM25_WEIGHT,
  PINNED_BOOST,
  RRF_K,
  TAG_BOOST_PER_TAG,
  TITLE_BOOST_PER_TOKEN,
  TITLE_TOKEN_MIN_IDF,
  applyTagAliasAndTitleBoosts,
  cosineSimilarity,
  fuseRRF,
  getMatchTier,
  idf,
  rankByFusedScore,
  rankHybrid,
  tokenize,
} from '../services/fusion';

describe('fuseRRF', () => {
  it('scores 1/(rank+1+K) for dense and BM25_WEIGHT/(rank+1+K) for lexical', () => {
    const fused = fuseRRF([
      { order: ['a', 'b'] },
      { order: ['b', 'a'], weight: BM25_WEIGHT },
    ]);
    const expectedA = 1 / (0 + 1 + RRF_K) + BM25_WEIGHT / (1 + 1 + RRF_K);
    const expectedB = 1 / (1 + 1 + RRF_K) + BM25_WEIGHT / (0 + 1 + RRF_K);
    expect(fused.get('a')).toBeCloseTo(expectedA, 10);
    expect(fused.get('b')).toBeCloseTo(expectedB, 10);
    expect(expectedA).toBeCloseTo(expectedB, 10);
  });

  it('gives partial credit when a hit is in only one list', () => {
    const fused = fuseRRF([{ order: ['only-dense'] }, { order: ['only-lexical'], weight: BM25_WEIGHT }]);
    expect(fused.get('only-dense')).toBeCloseTo(1 / (1 + RRF_K), 10);
    expect(fused.get('only-lexical')).toBeCloseTo(BM25_WEIGHT / (1 + RRF_K), 10);
  });
});

describe('rankHybrid', () => {
  it('orders by cosine and keeps fusion from promoting a weak neighbor', () => {
    const ranked = rankHybrid({
      query: 'zephyr habitat',
      keywordOrder: ['b', 'a'],
      cosineScores: new Map<string, number>([
        ['a', 0.62],
        ['b', 0.094],
      ]),
      meta: new Map(),
    });
    expect(ranked[0].id).toBe('a');
    expect(ranked[0].cosineScore).toBeCloseTo(0.62, 10);
    expect(ranked[0].matchTier).toBe('top');
    expect(ranked[1].id).toBe('b');
    expect(ranked[1].cosineScore).toBeCloseTo(0.094, 10);
    expect(ranked[0].rrfScore).not.toBe(ranked[0].cosineScore);
  });

  it('lets a keyword hit pass a slightly closer neighbor', () => {
    const ranked = rankHybrid({
      query: 'zephyr habitat',
      keywordOrder: ['keyword'],
      cosineScores: new Map<string, number>([
        ['semantic', 0.4],
        ['keyword', 0.39],
      ]),
      meta: new Map(),
    });
    expect(ranked[0].id).toBe('keyword');
    expect(ranked[0].cosineScore).toBeCloseTo(0.39, 10);
  });

  it('re-ranks after a tag boost and keeps the original cosine on that row', () => {
    const cosineScores = new Map<string, number>([
      ['plain', 0.45],
      ['tagged', 0.4],
    ]);
    const fused = fuseRRF([
      { order: ['plain', 'tagged'] },
      { order: ['plain'], weight: BM25_WEIGHT },
    ]);
    const before = rankByFusedScore(new Map(fused), cosineScores).map((hit) => hit.id);
    expect(before[0]).toBe('plain');

    applyTagAliasAndTitleBoosts(fused, 'strapi cloud', new Map([
      ['plain', { title: 'Cooking', tags: [], aliases: [], pinned: false }],
      ['tagged', { title: 'Notes', tags: ['strapi'], aliases: ['cloud'], pinned: false }],
    ]));
    const after = rankByFusedScore(fused, cosineScores);
    expect(after[0].id).toBe('tagged');
    expect(after[0].cosineScore).toBeCloseTo(0.4, 10);
    expect(after[0].matchTier).toBe('top');
    expect(after[0].rrfScore - (fuseRRF([{ order: ['plain', 'tagged'] }, { order: ['plain'], weight: BM25_WEIGHT }]).get('tagged') ?? 0)).toBeCloseTo(
      TAG_BOOST_PER_TAG * 2,
      10
    );
  });

  it('boosts aliases with the tag weight, titles only when IDF is high, and pinned notes', () => {
    const titles = ['zephyrite survey', 'paint brushes', 'sourdough starter', 'marathon plan', 'tide chart', 'orchid care', 'wood joinery', 'vineyard soil'];
    const corpus = idf(titles.map((title) => tokenize(title)));
    expect(corpus.zephyrite).toBeGreaterThanOrEqual(TITLE_TOKEN_MIN_IDF);
    expect(corpus.zephyrite).toBeCloseTo(Math.log(1 + (8 - 1 + 0.5) / (1 + 0.5)), 10);

    const fused = new Map<string, number>(titles.map((title, index) => [title, 0.01]));
    const meta = new Map(
      titles.map((title) => [
        title,
        {
          title,
          tags: title === 'paint brushes' ? ['strapi'] : [],
          aliases: title === 'sourdough starter' ? ['zephyrite'] : [],
          pinned: title === 'tide chart',
        },
      ])
    );
    const report = applyTagAliasAndTitleBoosts(fused, 'zephyrite strapi', meta);
    expect(report.aliasBoosts.get('sourdough starter')).toEqual(['zephyrite']);
    expect(fused.get('sourdough starter')).toBeCloseTo(0.01 + TAG_BOOST_PER_TAG, 10);
    expect(report.tagBoosts.get('paint brushes')).toEqual(['strapi']);
    expect(report.titleBoosts.get('zephyrite survey')).toEqual(['zephyrite']);
    expect(fused.get('zephyrite survey')).toBeCloseTo(0.01 + TITLE_BOOST_PER_TOKEN, 10);
    expect(report.pinned).toEqual(['tide chart']);
    expect(fused.get('tide chart')).toBeCloseTo(0.01 + PINNED_BOOST, 10);
    expect(TITLE_BOOST_PER_TOKEN).toBe(0.015);
    expect(TAG_BOOST_PER_TAG).toBe(0.06);
    expect(PINNED_BOOST).toBe(0.05);
  });
});

describe('getMatchTier', () => {
  it('depends on rank and ignores the cosine', () => {
    expect(getMatchTier(0, 0.1)).toBe('top');
    expect(getMatchTier(1, 0.99)).toBe('strong');
    expect(getMatchTier(2, 0.99)).toBe('strong');
    expect(getMatchTier(3, 0.99)).toBe('good');
    expect(getMatchTier(7, 0.2)).toBe('good');
    expect(getMatchTier(8, 0.99)).toBe('related');
  });
});

describe('cosineSimilarity', () => {
  it('is 1 for the same direction and 0 for a mismatch in length', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 10);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
    expect(cosineSimilarity([1, 0], [1])).toBe(0);
  });
});
