import { EMBEDDING_MODEL, missingKeyMessage, retryDelayMs } from './text';

const EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
const MAX_429_ATTEMPTS = 5;

export class EmbedRateLimitError extends Error {
  constructor(readonly retryAfterHeader: string | null) {
    super('OpenAI embeddings rate limited');
    this.name = 'EmbedRateLimitError';
  }
}

export type EmbedResult =
  | { ok: true; vector: number[] }
  | { ok: false; reason: 'missing-key' | 'empty' | 'error'; message: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Thin OpenAI embedder. No LangChain, no chat model.
 * Stores the configured model name, not the snapshot id OpenAI echoes back,
 * so a dated response model cannot mark every row stale.
 */
export function createEmbedder(options?: { gapMs?: number; fetchImpl?: typeof fetch }) {
  const gapMs = options?.gapMs ?? 40;
  const fetchImpl = options?.fetchImpl ?? fetch;
  let tail: Promise<unknown> = Promise.resolve();
  let lastAt = 0;

  const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = tail.then(async () => {
      const wait = gapMs - (Date.now() - lastAt);
      if (wait > 0) await sleep(wait);
      try {
        return await fn();
      } finally {
        lastAt = Date.now();
      }
    });
    tail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };

  const embedOnce = async (text: string, apiKey: string): Promise<number[]> => {
    const response = await fetchImpl(EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 429) {
      throw new EmbedRateLimitError(response.headers.get('retry-after'));
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`OpenAI embeddings ${response.status}: ${body.slice(0, 180)}`);
    }
    const json = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const embedding = json?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('OpenAI embeddings response had no vector');
    }
    return embedding;
  };

  return {
    model: EMBEDDING_MODEL,
    hasKey(): boolean {
      return Boolean(process.env.OPENAI_API_KEY);
    },
    missingKeyMessage,
    async embed(text: string): Promise<EmbedResult> {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return { ok: false, reason: 'missing-key', message: missingKeyMessage() };
      if (!text.trim()) return { ok: false, reason: 'empty', message: 'Nothing to embed' };
      return enqueue(async () => {
        for (let attempt = 0; attempt < MAX_429_ATTEMPTS; attempt += 1) {
          try {
            const vector = await embedOnce(text, apiKey);
            return { ok: true as const, vector };
          } catch (error) {
            if (error instanceof EmbedRateLimitError && attempt < MAX_429_ATTEMPTS - 1) {
              await sleep(retryDelayMs(attempt, error.retryAfterHeader));
              continue;
            }
            const message = error instanceof Error ? error.message : 'Embedding failed';
            return { ok: false as const, reason: 'error' as const, message };
          }
        }
        return { ok: false as const, reason: 'error' as const, message: 'OpenAI embeddings rate limited' };
      });
    },
  };
}

export type Embedder = ReturnType<typeof createEmbedder>;
