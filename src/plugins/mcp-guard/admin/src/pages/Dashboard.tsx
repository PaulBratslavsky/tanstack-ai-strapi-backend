import * as React from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  EmptyStateLayout,
  Flex,
  Loader,
  SingleSelect,
  SingleSelectOption,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  Typography,
} from '@strapi/design-system';
import { ArrowClockwise, Trash } from '@strapi/icons';
import { Layouts, useFetchClient, useNotification } from '@strapi/strapi/admin';

type Finding = {
  rule: string;
  severity: 'high' | 'medium';
  description: string;
  sample: string;
  path: string;
  count: number;
  paths: string[];
};

type GuardEvent = {
  id: number;
  occurredAt: string;
  method: string;
  tool: string | null;
  action: 'clean' | 'sanitized' | 'blocked' | 'rejected' | 'errored';
  adminUser: number | null;
  httpStatus: number;
  durationMs: number;
  args: string | null;
  reason: string | null;
  findings: Finding[];
};

type Stats = {
  totals: Record<string, number>;
  buffered: number;
  capacity: number;
  persisting: boolean;
  eventsWithFindings: number;
  medianDurationMs: number | null;
  topRules: Array<{ rule: string; count: number }>;
  lastEventAt: string | null;
};

type GuardConfig = {
  path: string;
  inbound: string;
  outbound: string;
  deniedTools: string[];
  allowedTools: string[] | null;
  persist: boolean;
  bufferSize: number;
};

const ACTION_STYLE: Record<GuardEvent['action'], { bg: string; fg: string }> = {
  clean: { bg: 'success100', fg: 'success600' },
  sanitized: { bg: 'warning100', fg: 'warning600' },
  blocked: { bg: 'danger100', fg: 'danger600' },
  rejected: { bg: 'neutral150', fg: 'neutral700' },
  errored: { bg: 'secondary100', fg: 'secondary600' },
};

const REFRESH_MS = 5000;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

/** A labelled number. The summary row is what you read before the table. */
const Tile = ({
  label,
  value,
  tone = 'neutral800',
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
  hint?: string;
}) => (
  <Box
    background="neutral0"
    hasRadius
    shadow="tableShadow"
    padding={4}
    borderColor="neutral150"
    style={{ flex: '1 1 9rem', minWidth: '9rem' }}
  >
    <Flex direction="column" alignItems="flex-start" gap={1}>
      <Typography variant="sigma" textColor="neutral600">
        {label}
      </Typography>
      <Typography variant="alpha" textColor={tone}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="pi" textColor="neutral500">
          {hint}
        </Typography>
      ) : null}
    </Flex>
  </Box>
);

const FindingBadges = ({ findings }: { findings: Finding[] }) => {
  if (findings.length === 0) {
    return (
      <Typography variant="pi" textColor="neutral500">
        —
      </Typography>
    );
  }

  return (
    <Flex gap={1} wrap="wrap">
      {findings.map((finding) => (
        <Tooltip
          key={finding.rule}
          label={`${finding.description}\n${finding.paths.join(', ')}\n\n${finding.sample}`}
        >
          {/* Tooltip forwards a ref to its child; Badge is a plain function
              component, so give the ref a DOM node to land on. */}
          <span>
            <Badge
              backgroundColor={finding.severity === 'high' ? 'danger100' : 'warning100'}
              textColor={finding.severity === 'high' ? 'danger600' : 'warning600'}
            >
              {finding.rule}
              {finding.count > 1 ? ` ×${finding.count}` : ''}
            </Badge>
          </span>
        </Tooltip>
      ))}
    </Flex>
  );
};

/** Badge for what the guard did, with the rejection reason on hover. */
const ActionBadge = ({
  action,
  reason,
}: {
  action: GuardEvent['action'];
  reason: string | null;
}) => {
  const badge = (
    <Badge backgroundColor={ACTION_STYLE[action].bg} textColor={ACTION_STYLE[action].fg}>
      {action}
    </Badge>
  );

  if (reason === null) {
    return badge;
  }

  return (
    <Tooltip label={reason}>
      <span>{badge}</span>
    </Tooltip>
  );
};

const Dashboard = () => {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [events, setEvents] = React.useState<GuardEvent[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [config, setConfig] = React.useState<GuardConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionFilter, setActionFilter] = React.useState('all');
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const [eventsRes, statsRes, configRes] = await Promise.all([
        get(`/mcp-guard/events?limit=100&action=${actionFilter}`),
        get('/mcp-guard/stats'),
        get('/mcp-guard/config'),
      ]);

      setEvents(eventsRes.data.events);
      setStats(statsRes.data);
      setConfig(configRes.data);
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: 'Could not load MCP guard events.',
      });
    } finally {
      setLoading(false);
    }
  }, [get, actionFilter, toggleNotification]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (autoRefresh === false) {
      return undefined;
    }
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, load]);

  const clear = async () => {
    await post('/mcp-guard/clear');
    toggleNotification({ type: 'success', message: 'Event buffer cleared.' });
    load();
  };

  const totals = stats?.totals ?? {};
  const flagged = stats?.eventsWithFindings ?? 0;

  return (
    <Layouts.Root>
      <Layouts.Header
        title="MCP Guard"
        subtitle={
          config === null
            ? 'Loading…'
            : `Watching ${config.path} · inbound ${config.inbound} · outbound ${config.outbound}` +
              `${config.persist ? ' · persisting' : ''}`
        }
        primaryAction={
          <Flex gap={2}>
            <Button
              variant="tertiary"
              startIcon={<ArrowClockwise />}
              onClick={() => setAutoRefresh((on) => !on)}
            >
              {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            </Button>
            <Button variant="danger-light" startIcon={<Trash />} onClick={clear}>
              Clear buffer
            </Button>
          </Flex>
        }
      />

      <Layouts.Content>
        {loading ? (
          <Flex justifyContent="center" padding={10}>
            <Loader>Loading events…</Loader>
          </Flex>
        ) : (
          <Flex direction="column" alignItems="stretch" gap={6}>
            {/* summary ------------------------------------------------------ */}
            <Flex gap={4} wrap="wrap" alignItems="stretch">
              <Tile label="Requests" value={totals.requests ?? 0} hint={`${totals.toolCalls ?? 0} tool calls`} />
              <Tile
                label="Rejected"
                value={totals.rejected ?? 0}
                tone={(totals.rejected ?? 0) > 0 ? 'neutral800' : 'neutral500'}
                hint="blocked inbound"
              />
              <Tile
                label="Sanitized"
                value={totals.sanitized ?? 0}
                tone={(totals.sanitized ?? 0) > 0 ? 'warning600' : 'neutral500'}
                hint="rewritten outbound"
              />
              <Tile
                label="Blocked"
                value={totals.blocked ?? 0}
                tone={(totals.blocked ?? 0) > 0 ? 'danger600' : 'neutral500'}
                hint="result discarded"
              />
              <Tile
                label="Flagged"
                value={flagged}
                hint={`of ${stats?.buffered ?? 0} buffered`}
              />
              <Tile
                label="Median"
                value={stats?.medianDurationMs === null ? '—' : `${stats?.medianDurationMs}ms`}
                hint="request duration"
              />
            </Flex>

            {/* top rules ---------------------------------------------------- */}
            {stats !== null && stats.topRules.length > 0 ? (
              <Box background="neutral0" hasRadius shadow="tableShadow" padding={4}>
                <Flex direction="column" alignItems="flex-start" gap={3}>
                  <Typography variant="sigma" textColor="neutral600">
                    Most frequent rules
                  </Typography>
                  <Flex gap={2} wrap="wrap">
                    {stats.topRules.map((rule) => (
                      <Badge key={rule.rule} backgroundColor="neutral150" textColor="neutral700">
                        {rule.rule} · {rule.count}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              </Box>
            ) : null}

            <Divider />

            {/* filter ------------------------------------------------------- */}
            <Flex justifyContent="space-between" alignItems="center" gap={4}>
              <Box style={{ minWidth: '14rem' }}>
                <SingleSelect
                  label="Action"
                  value={actionFilter}
                  onChange={(value: string) => setActionFilter(value)}
                >
                  <SingleSelectOption value="all">All events</SingleSelectOption>
                  <SingleSelectOption value="clean">Clean</SingleSelectOption>
                  <SingleSelectOption value="sanitized">Sanitized</SingleSelectOption>
                  <SingleSelectOption value="blocked">Blocked</SingleSelectOption>
                  <SingleSelectOption value="rejected">Rejected</SingleSelectOption>
                  <SingleSelectOption value="errored">Errored</SingleSelectOption>
                </SingleSelect>
              </Box>
              <Typography variant="pi" textColor="neutral500">
                Buffer holds the last {stats?.capacity ?? 0} events
                {stats?.persisting ? ' · also persisted to MCP Guard Event' : ' · resets on restart'}
              </Typography>
            </Flex>

            {/* table -------------------------------------------------------- */}
            {events.length === 0 ? (
              <EmptyStateLayout
                content="No MCP requests recorded yet. Call a tool against /mcp and it will appear here."
              />
            ) : (
              <Table colCount={7} rowCount={events.length}>
                <Thead>
                  <Tr>
                    <Th>
                      <Typography variant="sigma">Time</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Method / tool</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Action</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Findings</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">User</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Status</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Duration</Typography>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {events.map((event) => (
                    <Tr key={event.id}>
                      <Td>
                        <Typography variant="pi" textColor="neutral600">
                          {formatTime(event.occurredAt)}
                        </Typography>
                      </Td>
                      <Td>
                        <Flex direction="column" alignItems="flex-start">
                          <Typography fontWeight="semiBold">
                            {event.tool ?? event.method}
                          </Typography>
                          {event.tool !== null ? (
                            <Typography variant="pi" textColor="neutral500">
                              {event.method}
                            </Typography>
                          ) : null}
                        </Flex>
                      </Td>
                      <Td>
                        <ActionBadge action={event.action} reason={event.reason} />
                      </Td>
                      <Td>
                        <FindingBadges findings={event.findings} />
                      </Td>
                      <Td>
                        <Typography variant="pi" textColor="neutral600">
                          {event.adminUser ?? 'anon'}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography
                          variant="pi"
                          textColor={event.httpStatus >= 400 ? 'danger600' : 'neutral600'}
                        >
                          {event.httpStatus}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography variant="pi" textColor="neutral600">
                          {event.durationMs}ms
                        </Typography>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Flex>
        )}
      </Layouts.Content>
    </Layouts.Root>
  );
};

export { Dashboard };
