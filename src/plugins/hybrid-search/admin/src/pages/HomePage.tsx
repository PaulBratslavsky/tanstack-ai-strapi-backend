import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Flex, Table, Tbody, Td, Th, Thead, Tr, Typography } from '@strapi/design-system';
import { Layouts, Page, useFetchClient, useNotification } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';

interface TypeRow {
  uid: string;
  contentCount: number;
  current: number;
  stale: number;
  failed: number;
  missing: number;
}

interface StatusPayload {
  embeddings: 'ready' | 'disabled';
  statusMessage: string | null;
  model: string;
  embeddingVersion: number;
  apiKeyConfigured: boolean;
  pgvector: string;
  vectorStore: string;
  lastSyncAt: string | null;
  lexicalReady: boolean;
  types: TypeRow[];
  totals: { current: number; stale: number; failed: number; missing: number; content: number };
  job: {
    running: boolean;
    dryRun: boolean;
    reason?: 'manual' | 'auto';
    incompleteOnly?: boolean;
    scanned: number;
    embedded?: number;
    skipped?: number;
    failed: number;
    startedAt: string;
  } | null;
}

interface ReindexReport {
  dryRun?: boolean;
  started?: boolean;
  alreadyRunning?: boolean;
  partial?: boolean;
  scanned?: number;
  embedded?: number;
  skipped?: number;
  failed?: number;
  deferred?: number;
  removed?: number;
  statusMessage?: string | null;
  errors?: Array<{ uid: string; documentId: string; message: string }>;
}

const formatPacific = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const HomePage = () => {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ReindexReport | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await get(`/${PLUGIN_ID}/admin/status`);
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Could not load hybrid search status. The admin token needs plugin::hybrid-search.read.');
    }
  }, [get]);

  useEffect(() => {
    load();
  }, [load]);

  const runReindex = async (dryRun: boolean) => {
    setBusy(true);
    try {
      const response = await post(`/${PLUGIN_ID}/admin/reindex`, { dryRun, wait: true });
      setReport(response.data);
      toggleNotification({
        type: response.data?.partial ? 'warning' : 'success',
        message: dryRun ? 'Dry run finished' : 'Reindex finished',
      });
      await load();
    } catch (err) {
      toggleNotification({
        type: 'danger',
        message: 'Reindex was rejected. Grant plugin::hybrid-search.reindex to this admin.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page.Main>
      <Layouts.Header
        title="Hybrid Search"
        subtitle="Keyword search plus OpenAI embeddings, cached in memory"
      />
      <Layouts.Content>
        <Flex gap={2} paddingBottom={4}>
          <Button onClick={() => runReindex(false)} loading={busy} disabled={busy}>
            Reindex all
          </Button>
          <Button variant="secondary" onClick={() => runReindex(true)} disabled={busy}>
            Dry run
          </Button>
          <Button variant="tertiary" onClick={load} disabled={busy}>
            Refresh
          </Button>
        </Flex>
        {error && (
          <Box paddingBottom={4}>
            <Alert title="Status unavailable" variant="danger" closeLabel="Close">
              {error}
            </Alert>
          </Box>
        )}
        {status?.statusMessage && (
          <Box paddingBottom={4}>
            <Alert
              title={
                status.job?.running
                  ? 'Reindex running'
                  : status.apiKeyConfigured
                    ? 'Reindex needed'
                    : 'Embeddings disabled'
              }
              variant="warning"
              closeLabel="Close"
            >
              {status.statusMessage}
            </Alert>
          </Box>
        )}
        {status && (
          <Box paddingBottom={4}>
            <Typography>
              Model {status.model}, version {status.embeddingVersion}. Store: {status.vectorStore}. pgvector probe:{' '}
              {status.pgvector}. Keyword index: {status.lexicalReady ? 'ready' : 'not ready'}. Last sync:{' '}
              {formatPacific(status.lastSyncAt)} (Pacific).
            </Typography>
            {status.job?.running && (
              <Typography>
                Reindex in progress ({status.job.reason || 'manual'}). Scanned {status.job.scanned}, embedded{' '}
                {status.job.embedded ?? 0}, failed {status.job.failed}.
              </Typography>
            )}
          </Box>
        )}
        {report && (
          <Box paddingBottom={4}>
            <Alert title={report.dryRun ? 'Dry run' : 'Reindex'} variant={report.partial ? 'warning' : 'success'} closeLabel="Close">
              {`Scanned ${report.scanned ?? 0}, embedded ${report.embedded ?? 0}, skipped ${report.skipped ?? 0}, deferred ${report.deferred ?? 0}, failed ${report.failed ?? 0}, removed ${report.removed ?? 0}.`}
              {report.statusMessage ? ` ${report.statusMessage}` : ''}
            </Alert>
          </Box>
        )}
        <Table colCount={6} rowCount={(status?.types.length ?? 0) + 1}>
          <Thead>
            <Tr>
              <Th><Typography variant="sigma">Type</Typography></Th>
              <Th><Typography variant="sigma">Content</Typography></Th>
              <Th><Typography variant="sigma">Current</Typography></Th>
              <Th><Typography variant="sigma">Stale</Typography></Th>
              <Th><Typography variant="sigma">Failed</Typography></Th>
              <Th><Typography variant="sigma">Missing</Typography></Th>
            </Tr>
          </Thead>
          <Tbody>
            {(status?.types ?? []).map((row) => (
              <Tr key={row.uid}>
                <Td><Typography>{row.uid}</Typography></Td>
                <Td><Typography>{row.contentCount}</Typography></Td>
                <Td><Typography>{row.current}</Typography></Td>
                <Td><Typography>{row.stale}</Typography></Td>
                <Td><Typography>{row.failed}</Typography></Td>
                <Td><Typography>{row.missing}</Typography></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Layouts.Content>
    </Page.Main>
  );
};

export { HomePage };
