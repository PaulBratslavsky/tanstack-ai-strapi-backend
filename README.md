# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## 🛡️ MCP Guard

This application includes [MCP Guard](https://github.com/PaulBratslavsky/strapi-mcp-guard), a security plugin that monitors and protects Strapi's built-in MCP endpoint (`POST /mcp`).

### What it does

- **Logs** every MCP tool call with caller, duration, and outcome
- **Validates** JSON-RPC requests and enforces tool policies
- **Scans** for prompt injection patterns in both tool arguments and results
- **Admin dashboard** to view events, stats, and configuration (accessible via the MCP Guard menu item)

### Configuration

MCP Guard runs in **observe mode** by default (warn-only, non-blocking) to avoid disrupting existing MCP tools used by Paul's AI assistant.

Default settings in `config/plugins.ts`:
- `inbound: 'warn'` - Logs suspicious tool arguments but doesn't block them
- `outbound: 'warn'` - Logs suspicious results but doesn't sanitize or block them
- `deniedTools: []` - No tools are blocked by default
- `persist: false` - Events are stored in memory only (reset on restart)

### Environment variables

- `MCP_GUARD_INBOUND` - Set to `'block'` to reject suspicious tool calls (default: `'warn'`)
- `MCP_GUARD_OUTBOUND` - Set to `'block'` or `'sanitize'` to filter results (default: `'warn'`)
- `MCP_GUARD_PERSIST` - Set to `'true'` to persist events to the database (default: `false`)

### Enforcing stricter policies

To enable active protection (for production use):

```typescript
// config/plugins.ts or config/env/production/plugins.ts
'mcp-guard': {
  config: {
    inbound: 'block',        // Block suspicious tool arguments
    outbound: 'sanitize',    // Strip injection patterns from results
    deniedTools: ['delete_*'], // Block specific tools (glob patterns supported)
    persist: true,           // Keep event history across restarts
  },
}
```

See the [MCP Guard documentation](https://github.com/PaulBratslavsky/strapi-mcp-guard) for full details.

---

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
