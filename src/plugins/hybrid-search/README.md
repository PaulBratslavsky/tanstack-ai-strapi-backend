# strapi-plugin-hybrid-search

Generic hybrid search for Strapi 5. The plugin does not know about any one content model. The host app configures a uid and the fields to index, then calls the `search` service.

## What it stores

One vector per entry in the plugin-owned table `hybrid_search_vectors` (base64 Float32, plus `model`, `embedding_version`, and `text_hash`). Vectors are loaded into memory once at boot and searched there. Keyword search is Postgres `tsvector` + a GIN index on `hybrid_search_tsv`, with a `LIKE` fallback on SQLite. There is no second database and no LangChain.

Set `OPENAI_API_KEY` for OpenAI `text-embedding-3-small`. Without the key the plugin still boots, keyword search still runs, and `/status`, the admin page, and search responses say that semantic search is off.

Routes and admin permissions are registered on every boot, whether or not the key is set.

## API

Admin routes (authenticated admin + permission):

- `GET /hybrid-search/status`
- `POST /hybrid-search/search` body `{ query, uids?, limit?, equals?, since?, tag? }`
- `POST /hybrid-search/reindex` body `{ uids?, dryRun?, wait? }`

Service `strapi.plugin('hybrid-search').service('search')`:

- `search`, `similar`, `reindex`, `status`

Permissions: `plugin::hybrid-search.read`, `plugin::hybrid-search.reindex`.

Reindex pages with a limit of 100, rate-limits embedding calls, retries OpenAI 429s with exponential backoff, and reports per-row errors. `dryRun: true` does not call OpenAI or write.

## pgvector later

`server/src/services/vector-store.ts` is the only file to replace.

- Use an HNSW index, not IVFFlat.
- Copy the stored base64 vectors into a `vector` column. Do not re-embed.
- A dimension change is a migration (new column, backfill, swap), not a cast.
- Keep skipping rows whose `model` or `embedding_version` is not current. Status counts must use that same check, including when a stored status label still says `current`.
- v1 is one vector per entry. A future chunker gets its own version, rebuilds every chunk of an entry on update, and uses a real parent column. Do not add a morph relation to every content type.

Startup runs `SELECT name FROM pg_available_extensions WHERE name = 'vector'` and reports it. It does not enable the extension.
