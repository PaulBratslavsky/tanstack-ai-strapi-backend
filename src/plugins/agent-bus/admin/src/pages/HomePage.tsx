import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Dialog,
  EmptyStateLayout,
  Field,
  Flex,
  IconButton,
  Modal,
  Radio,
  SingleSelect,
  SingleSelectOption,
  Switch,
  Table,
  Tbody,
  Td,
  Textarea,
  TextInput,
  Th,
  Thead,
  Tr,
  Typography,
} from '@strapi/design-system';
import { Duplicate, Plus, Trash, WarningCircle } from '@strapi/icons';
import { ConfirmDialog, Layouts, Page, useFetchClient, useNotification } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../pluginId';

interface Agent {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  kind: string;
  state: string;
  permissionPack: string;
  lastSeenAt: string | null;
  webhookUrl: string | null;
  credentials: AgentCredential[];
}

interface AgentCredential {
  id: number;
  kind: string;
  tokenId: string;
  tokenName: string | null;
  state: string;
  mintedByPlugin: boolean;
}

interface TokenOption {
  id: number;
  name: string;
  description?: string | null;
  expiresAt?: string | null;
}

interface CreatedToken {
  accessKey: string;
  tokenName: string;
}

interface PendingConfirmation {
  title: string;
  body: string;
  action: () => Promise<unknown>;
  successMessage: string;
}

const PERMISSION_PACKS = [
  { value: 'asker', label: 'Asker (agent.read, message.send)' },
  { value: 'specialist', label: 'Specialist (+ message.inbox)' },
  { value: 'orchestrator', label: 'Orchestrator (+ message.manage, approval.*, delivery.read)' },
  { value: 'custom', label: 'Custom' },
];

const KINDS = [
  { value: 'orchestrator', label: 'Orchestrator' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'human', label: 'Human' },
  { value: 'app', label: 'App' },
];

const WEBHOOK_MODES = [
  { value: 'reference', label: 'Reference (message ID only)' },
  { value: 'full', label: 'Full (complete message body)' },
];

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—');

const CopyValue = ({ label, value }: { label: string; value: string }) => {
  const { toggleNotification } = useNotification();
  return (
    <Flex gap={2} alignItems="center" paddingBottom={2}>
      <Box minWidth="220px">
        <Typography variant="omega" fontWeight="semiBold">
          {label}
        </Typography>
      </Box>
      <Typography variant="omega" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {value}
      </Typography>
      <IconButton
        label={`Copy ${label}`}
        variant="ghost"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          toggleNotification({ type: 'success', message: `${label} copied` });
        }}
      >
        <Duplicate />
      </IconButton>
    </Flex>
  );
};

const TokenSelect = ({
  tokens,
  value,
  onChange,
  disabled,
}: {
  tokens: TokenOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  return (
    <SingleSelect
      aria-label="API Token"
      placeholder="Choose an unbound token"
      value={value || null}
      disabled={disabled}
      onChange={(next: string | number) => onChange(String(next))}
    >
      {tokens.map((token) => (
        <SingleSelectOption key={token.id} value={String(token.id)}>
          {token.name}
        </SingleSelectOption>
      ))}
    </SingleSelect>
  );
};

const AddAgentModal = ({ onCreated, tokens }: { onCreated: () => void; tokens: TokenOption[] }) => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('specialist');
  const [permissionPack, setPermissionPack] = useState('asker');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookAuthHeader, setWebhookAuthHeader] = useState('');
  const [webhookMode, setWebhookMode] = useState('reference');
  const [credentialType, setCredentialType] = useState<'bind' | 'mint'>('mint');
  const [tokenId, setTokenId] = useState('');
  const [created, setCreated] = useState<CreatedToken | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setKind('specialist');
    setPermissionPack('asker');
    setDescription('');
    setWebhookUrl('');
    setWebhookSecret('');
    setWebhookAuthHeader('');
    setWebhookMode('reference');
    setCredentialType('mint');
    setTokenId('');
    setCreated(null);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await post<{ data: { agent: Agent; token?: CreatedToken } }>(`/${PLUGIN_ID}/admin/agents`, {
        name,
        kind,
        permissionPack,
        description,
        webhookUrl: webhookUrl.trim() || null,
        webhookSecret: webhookSecret.trim() || null,
        webhookAuthHeader: webhookAuthHeader.trim() || null,
        webhookMode,
        credentialType,
        tokenId: credentialType === 'bind' ? Number(tokenId) : undefined,
      });
      if (data.data.token) {
        setCreated(data.data.token);
      }
      onCreated();
      if (!data.data.token) {
        setOpen(false);
        reset();
      }
    } catch (error: any) {
      toggleNotification({ type: 'danger', message: error?.response?.data?.error?.message ?? 'Could not create agent' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal.Root
      open={open}
      onOpenChange={(next: boolean) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Modal.Trigger>
        <Button startIcon={<Plus />}>Add agent</Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{created ? 'Agent created' : 'Add an agent'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {created ? (
            <Flex direction="column" alignItems="stretch" gap={4}>
              <Alert variant="warning" title="Copy this now" closeLabel="Close">
                The access key is shown only once. Save it securely.
              </Alert>
              <CopyValue label="Token name" value={created.tokenName} />
              <CopyValue label="Access key" value={created.accessKey} />
            </Flex>
          ) : (
            <Flex direction="column" alignItems="stretch" gap={4}>
              <Field.Root name="name" required>
                <Field.Label>Name</Field.Label>
                <TextInput value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="My Agent" />
              </Field.Root>

              <Field.Root name="kind">
                <Field.Label>Kind</Field.Label>
                <SingleSelect value={kind} onChange={(value: string | number) => setKind(String(value))}>
                  {KINDS.map((k) => (
                    <SingleSelectOption key={k.value} value={k.value}>
                      {k.label}
                    </SingleSelectOption>
                  ))}
                </SingleSelect>
              </Field.Root>

              <Field.Root name="permissionPack">
                <Field.Label>Permission Pack</Field.Label>
                <SingleSelect value={permissionPack} onChange={(value: string | number) => setPermissionPack(String(value))}>
                  {PERMISSION_PACKS.map((p) => (
                    <SingleSelectOption key={p.value} value={p.value}>
                      {p.label}
                    </SingleSelectOption>
                  ))}
                </SingleSelect>
              </Field.Root>

              <Field.Root name="description">
                <Field.Label>Description</Field.Label>
                <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} />
              </Field.Root>

              <Field.Root name="webhookUrl">
                <Field.Label>Webhook URL</Field.Label>
                <TextInput value={webhookUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookUrl(e.target.value)} placeholder="https://example.com/webhook" />
              </Field.Root>

              <Field.Root name="webhookSecret">
                <Field.Label>Webhook Secret (optional)</Field.Label>
                <TextInput value={webhookSecret} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookSecret(e.target.value)} type="password" placeholder="Signature verification secret" />
              </Field.Root>

              <Field.Root name="webhookAuthHeader">
                <Field.Label>Webhook Auth Header (optional)</Field.Label>
                <TextInput value={webhookAuthHeader} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookAuthHeader(e.target.value)} type="password" placeholder="Bearer token..." />
              </Field.Root>

              <Field.Root name="webhookMode">
                <Field.Label>Webhook Mode</Field.Label>
                <SingleSelect value={webhookMode} onChange={(value: string | number) => setWebhookMode(String(value))}>
                  {WEBHOOK_MODES.map((m) => (
                    <SingleSelectOption key={m.value} value={m.value}>
                      {m.label}
                    </SingleSelectOption>
                  ))}
                </SingleSelect>
              </Field.Root>

              <Field.Root name="credentialType" hint="Mint: create a new token with permissions from the pack. Bind: attach an existing unbound token.">
                <Field.Label>Credential</Field.Label>
                <Radio.Group value={credentialType} onValueChange={(value: string) => setCredentialType(value as 'bind' | 'mint')} aria-label="Credential type">
                  <Radio.Item value="mint">Mint new token</Radio.Item>
                  <Radio.Item value="bind">Bind existing token</Radio.Item>
                </Radio.Group>
                <Field.Hint />
              </Field.Root>

              {credentialType === 'bind' && (
                <Field.Root name="tokenId" required>
                  <Field.Label>Select Token</Field.Label>
                  <TokenSelect tokens={tokens} value={tokenId} onChange={setTokenId} />
                </Field.Root>
              )}
            </Flex>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">{created ? 'Done' : 'Cancel'}</Button>
          </Modal.Close>
          {!created && (
            <Button onClick={submit} loading={submitting} disabled={!name.trim() || (credentialType === 'bind' && !tokenId)}>
              Create
            </Button>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

const EditAgentModal = ({ agent, onUpdated, tokens }: { agent: Agent; onUpdated: () => void; tokens: TokenOption[] }) => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(agent.name);
  const [kind, setKind] = useState(agent.kind);
  const [permissionPack, setPermissionPack] = useState(agent.permissionPack);
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(agent.webhookUrl || '');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookAuthHeader, setWebhookAuthHeader] = useState('');
  const [webhookMode, setWebhookMode] = useState('reference');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await put(`/${PLUGIN_ID}/admin/agents/${agent.documentId}`, {
        name,
        kind,
        permissionPack,
        description: description || undefined,
        webhookUrl: webhookUrl.trim() || null,
        webhookSecret: webhookSecret.trim() || undefined,
        webhookAuthHeader: webhookAuthHeader.trim() || undefined,
        webhookMode,
      });
      toggleNotification({ type: 'success', message: 'Agent updated' });
      onUpdated();
      setOpen(false);
    } catch (error: any) {
      toggleNotification({ type: 'danger', message: error?.response?.data?.error?.message ?? 'Could not update agent' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Trigger>
        <Button variant="secondary" size="S">Edit</Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Edit {agent.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" alignItems="stretch" gap={4}>
            <Field.Root name="name" required>
              <Field.Label>Name</Field.Label>
              <TextInput value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            </Field.Root>

            <Field.Root name="kind">
              <Field.Label>Kind</Field.Label>
              <SingleSelect value={kind} onChange={(value: string | number) => setKind(String(value))}>
                {KINDS.map((k) => (
                  <SingleSelectOption key={k.value} value={k.value}>
                    {k.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Field.Root>

            <Field.Root name="permissionPack">
              <Field.Label>Permission Pack</Field.Label>
              <SingleSelect value={permissionPack} onChange={(value: string | number) => setPermissionPack(String(value))}>
                {PERMISSION_PACKS.map((p) => (
                  <SingleSelectOption key={p.value} value={p.value}>
                    {p.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Field.Root>

            <Field.Root name="description">
              <Field.Label>Description</Field.Label>
              <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} />
            </Field.Root>

            <Field.Root name="webhookUrl">
              <Field.Label>Webhook URL</Field.Label>
              <TextInput value={webhookUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookUrl(e.target.value)} placeholder="https://example.com/webhook" />
            </Field.Root>

            <Field.Root name="webhookSecret" hint="Leave empty to keep current secret">
              <Field.Label>Webhook Secret (optional)</Field.Label>
              <TextInput value={webhookSecret} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookSecret(e.target.value)} type="password" placeholder="Leave empty to keep current" />
              <Field.Hint />
            </Field.Root>

            <Field.Root name="webhookAuthHeader" hint="Leave empty to keep current header">
              <Field.Label>Webhook Auth Header (optional)</Field.Label>
              <TextInput value={webhookAuthHeader} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookAuthHeader(e.target.value)} type="password" placeholder="Leave empty to keep current" />
              <Field.Hint />
            </Field.Root>

            <Field.Root name="webhookMode">
              <Field.Label>Webhook Mode</Field.Label>
              <SingleSelect value={webhookMode} onChange={(value: string | number) => setWebhookMode(String(value))}>
                {WEBHOOK_MODES.map((m) => (
                  <SingleSelectOption key={m.value} value={m.value}>
                    {m.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Field.Root>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">Cancel</Button>
          </Modal.Close>
          <Button onClick={submit} loading={submitting} disabled={!name.trim()}>
            Save
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

const BindTokenModal = ({ agent, onBound, tokens }: { agent: Agent; onBound: () => void; tokens: TokenOption[] }) => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await post(`/${PLUGIN_ID}/admin/agents/${agent.documentId}/bind`, {
        tokenId: Number(tokenId),
      });
      toggleNotification({ type: 'success', message: 'Token bound' });
      onBound();
      setOpen(false);
      setTokenId('');
    } catch (error: any) {
      toggleNotification({ type: 'danger', message: error?.response?.data?.error?.message ?? 'Could not bind token' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Trigger>
        <Button variant="secondary" size="S">Bind Token</Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Bind Token to {agent.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Field.Root name="tokenId" required>
            <Field.Label>Select Token</Field.Label>
            <TokenSelect tokens={tokens} value={tokenId} onChange={setTokenId} />
          </Field.Root>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">Cancel</Button>
          </Modal.Close>
          <Button onClick={submit} loading={submitting} disabled={!tokenId}>
            Bind
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

const MintTokenModal = ({ agent, onMinted }: { agent: Agent; onMinted: () => void }) => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<CreatedToken | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await post<{ data: CreatedToken }>(`/${PLUGIN_ID}/admin/agents/${agent.documentId}/mint`, {});
      setCreated(data.data);
      onMinted();
    } catch (error: any) {
      toggleNotification({ type: 'danger', message: error?.response?.data?.error?.message ?? 'Could not mint token' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal.Root
      open={open}
      onOpenChange={(next: boolean) => {
        setOpen(next);
        if (!next) setCreated(null);
      }}
    >
      <Modal.Trigger>
        <Button variant="secondary" size="S">Mint Token</Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{created ? 'Token created' : `Mint Token for ${agent.name}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {created ? (
            <Flex direction="column" alignItems="stretch" gap={4}>
              <Alert variant="warning" title="Copy this now" closeLabel="Close">
                The access key is shown only once. Save it securely.
              </Alert>
              <CopyValue label="Token name" value={created.tokenName} />
              <CopyValue label="Access key" value={created.accessKey} />
            </Flex>
          ) : (
            <Typography>
              This will create a new admin token with permissions from the {agent.permissionPack} pack and bind it to {agent.name}.
            </Typography>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">{created ? 'Done' : 'Cancel'}</Button>
          </Modal.Close>
          {!created && (
            <Button onClick={submit} loading={submitting}>
              Mint
            </Button>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

const HomePage = () => {
  const { get, del, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([
        get<{ data: Agent[] }>(`/${PLUGIN_ID}/admin/agents`),
        get<{ data: TokenOption[] }>(`/${PLUGIN_ID}/admin/tokens`),
      ]);
      setAgents(a.data.data);
      setTokens(t.data.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toggleNotification({ type: 'success', message });
    } catch (error: any) {
      toggleNotification({ type: 'danger', message: error?.response?.data?.error?.message ?? 'Something went wrong' });
    }
    load();
  };

  if (loading) {
    return <Page.Loading />;
  }

  if (loadError) {
    return (
      <Page.Main>
        <Page.Title>Agent Bus</Page.Title>
        <Layouts.Header title="Agent Bus" />
        <Layouts.Content>
          <Alert
            variant="danger"
            title="Could not load Agent Bus data"
            closeLabel="Close"
            action={
              <Button
                variant="tertiary"
                onClick={() => {
                  setLoading(true);
                  load();
                }}
              >
                Retry
              </Button>
            }
          >
            Check that you have the Manage Agent Bus permission and that Strapi is running.
          </Alert>
        </Layouts.Content>
      </Page.Main>
    );
  }

  return (
    <Page.Main>
      <Page.Title>Agent Bus</Page.Title>
      <Layouts.Header
        title="Agent Bus"
        subtitle="Manage registered agents and their token bindings for secure agent-to-agent communication."
      />
      <Layouts.Content>
        <Box background="neutral0" hasRadius shadow="tableShadow" padding={6}>
          <Flex justifyContent="space-between" alignItems="flex-start" gap={4} paddingBottom={4}>
            <Flex direction="column" alignItems="flex-start" gap={1}>
              <Typography variant="delta" tag="h2">
                Agents
              </Typography>
              <Typography textColor="neutral600">
                Registered agents with their credentials and webhook configurations
              </Typography>
            </Flex>
            <AddAgentModal onCreated={load} tokens={tokens} />
          </Flex>
          {agents.length === 0 ? (
            <EmptyStateLayout content="No agents registered yet." />
          ) : (
            <Table colCount={9} rowCount={agents.length + 1}>
              <Thead>
                <Tr>
                  <Th><Typography variant="sigma">Name</Typography></Th>
                  <Th><Typography variant="sigma">Slug</Typography></Th>
                  <Th><Typography variant="sigma">Kind</Typography></Th>
                  <Th><Typography variant="sigma">State</Typography></Th>
                  <Th><Typography variant="sigma">Pack</Typography></Th>
                  <Th><Typography variant="sigma">Credentials</Typography></Th>
                  <Th><Typography variant="sigma">Webhook</Typography></Th>
                  <Th><Typography variant="sigma">Last Seen</Typography></Th>
                  <Th><Typography variant="sigma">Actions</Typography></Th>
                </Tr>
              </Thead>
              <Tbody>
                {agents.map((agent) => (
                  <Tr key={agent.id}>
                    <Td>
                      <Typography fontWeight="semiBold">{agent.name}</Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" style={{ fontFamily: 'monospace' }}>
                        {agent.slug}
                      </Typography>
                    </Td>
                    <Td>
                      <Badge>{agent.kind}</Badge>
                    </Td>
                    <Td>
                      <Switch
                        aria-label={`${agent.name} active`}
                        checked={agent.state === 'active'}
                        onCheckedChange={(checked: boolean) =>
                          run(
                            () => put(`/${PLUGIN_ID}/admin/agents/${agent.documentId}`, { state: checked ? 'active' : 'disabled' }),
                            checked ? 'Agent activated' : 'Agent disabled'
                          )
                        }
                      />
                    </Td>
                    <Td>
                      <Typography>{agent.permissionPack}</Typography>
                    </Td>
                    <Td>
                      <Flex direction="column" alignItems="flex-start" gap={1}>
                        {agent.credentials.length === 0 ? (
                          <Typography textColor="neutral600">None</Typography>
                        ) : (
                          agent.credentials.map((cred) => (
                            <Flex key={cred.id} gap={2} alignItems="center">
                              <Badge variant={cred.state === 'active' ? 'success' : 'secondary'}>
                                {cred.kind}
                              </Badge>
                              <Typography variant="pi">
                                {cred.tokenName || 'Deleted token'}
                              </Typography>
                              {cred.mintedByPlugin && <Badge variant="secondary">minted</Badge>}
                              <IconButton
                                label="Revoke credential"
                                variant="ghost"
                                onClick={() =>
                                  setConfirmation({
                                    title: 'Revoke credential?',
                                    body: `This will revoke the binding${cred.mintedByPlugin ? ' and delete the token' : ''}. The agent will no longer authenticate.`,
                                    action: () => del(`/${PLUGIN_ID}/admin/agents/${agent.documentId}/credentials/${cred.id}`),
                                    successMessage: 'Credential revoked',
                                  })
                                }
                              >
                                <Trash />
                              </IconButton>
                            </Flex>
                          ))
                        )}
                      </Flex>
                    </Td>
                    <Td>
                      {agent.webhookUrl ? (
                        <Badge variant="success">Configured</Badge>
                      ) : (
                        <Typography textColor="neutral600">—</Typography>
                      )}
                    </Td>
                    <Td>
                      <Typography variant="pi">{formatDate(agent.lastSeenAt)}</Typography>
                    </Td>
                    <Td>
                      <Flex gap={1} direction="column" alignItems="flex-start">
                        <EditAgentModal agent={agent} onUpdated={load} tokens={tokens} />
                        <BindTokenModal agent={agent} onBound={load} tokens={tokens} />
                        <MintTokenModal agent={agent} onMinted={load} />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Layouts.Content>
      <Dialog.Root open={confirmation !== null} onOpenChange={(open: boolean) => !open && setConfirmation(null)}>
        {confirmation && (
          <ConfirmDialog
            title={confirmation.title}
            variant="danger-light"
            icon={<WarningCircle />}
            onConfirm={async () => {
              const pending = confirmation;
              setConfirmation(null);
              await run(pending.action, pending.successMessage);
            }}
          >
            {confirmation.body}
          </ConfirmDialog>
        )}
      </Dialog.Root>
    </Page.Main>
  );
};

export { HomePage };
