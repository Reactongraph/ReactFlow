# React Flow Workflow Builder

A production-quality node-based workflow editor built with React, TypeScript, and React Flow, featuring a plugin-based node library, client-side execution engine, real-time collaboration, and AI-assisted workflow building.

## Features

### Canvas & Editor
- **Interactive Canvas**: Zoom, pan, and drag nodes on an infinite canvas
- **Context Menu**: Right-click canvas to add nodes, paste, auto-layout, or fit view
- **Connections**: Connect nodes with animated smoothstep edges and validated relationships
- **History**: Undo/redo with Ctrl+Z / Ctrl+Shift+Z (50-step history)
- **Clipboard**: Copy, paste, and duplicate nodes (Ctrl+C / Ctrl+V / Ctrl+D)
- **Auto Layout**: Automatically arrange workflows using Dagre (LR / TB / BT / RL)
- **Import/Export**: Save and load workflows as JSON or export canvas as PDF
- **Validation**: Real-time workflow validation with error reporting panel
- **Keyboard Shortcuts**: Comprehensive keyboard support with command palette (Ctrl+K)
- **Breakpoints**: Double-click any node to set a breakpoint; step through execution
- **Snap to Grid**: 16px grid snapping for clean node alignment
- **MiniMap**: Overview map showing each node in its actual category color

### User-Scoped Canvas
- **Per-user isolation**: Each user's canvas, nodes, edges, templates, versions, and run history are stored in a separate localStorage key (`flow-storage-v2-{userId}`) — no data leaks between users on the same machine/browser
- **Clear on logout**: All user-scoped localStorage data is wiped on sign-out; the canvas resets to blank for the next user

### Plugin-Based Node Library
- **47 built-in nodes** across 10 categories, all self-registering via a plugin registry
- **Registry system**: Every node exports a `NodeDefinition` with type, name, description, category, icon, color, input/output port schemas, config field schemas, and an executor function
- **Schema-driven property panel**: Config forms are auto-rendered from field schemas — no per-node form code needed
- **GenericNode component**: Default React Flow component shared by all plugin nodes
- **Drag and drop**: Drag any node from the library onto the canvas
- **Search**: Live search across all node names, descriptions, and type keys
- **Category filters**: Collapsible sections with colored accent bars and node count badges
- **Node templates**: Save any configured node as a reusable single-node template

### Node Categories & Types

| Category | Nodes |
|---|---|
| **Triggers** | Webhook Trigger, Schedule (Cron), Email Trigger, Database Change, File Upload Trigger, Manual Trigger, Input |
| **API & HTTP** | HTTP Request, REST API, GraphQL, Webhook Response, API Call |
| **AI / LLM** | Text Generation, Text Summarization, Classification, Embedding Generator, AI Node |
| **Logic & Control** | IF Condition, Switch, Loop, Delay, Retry, Decision |
| **Data Transform** | JSON Transform, CSV Parser, Text Parser, Regex Extractor, Format Converter, Transform, Processing |
| **Database** | PostgreSQL, MongoDB, Redis Cache |
| **Communication** | Email Sender, Slack Message, Discord Message, Push Notification |
| **Files** | File Upload, File Download, PDF Parser, Image Processor |
| **Utilities** | Date Formatter, UUID Generator, Random Generator, Math Calculator, String Manipulator |
| **Debug** | Log, Debug Inspector, Output Viewer, Test Data Generator, Output |

### Workflow Templates
- **5 built-in workflow templates**: Fully-wired multi-node workflows ready to load and run
- **Template panel**: Two-tab UI — Workflows tab (multi-node presets) and Node Templates tab (single-node saved configs)
- **Load workflow**: One click replaces the canvas with the full template; current state is saved to undo history
- **Node flow preview**: Each template card shows the full node chain with icons and arrows
- **Save node templates**: Select any configured node → click Save Template in the Property Panel

#### Built-in Workflow Templates

| Template | Category | Flow |
|---|---|---|
| **Webhook → Slack Alert** | Communication | Webhook → Extract Fields → IF status=error → Slack Error / Slack Success → Log |
| **Daily API Report via Email** | Automation | Schedule (9am weekdays) → HTTP GET → Pick Metrics → AI Summarize → Email → Output |
| **CSV Upload → Database Import** | Data | File Upload → Parse CSV → Filter Valid Rows → IF any rows → PostgreSQL INSERT / Slack Empty → Log |
| **AI Classify & Route Notification** | AI | Manual Trigger → AI Classify → Switch (critical/warning/info) → Slack + Email / Slack Warning / Log → Output |
| **DB Change → Enrich & Cache** | Data | DB INSERT → HTTP Fetch Customer → Merge JSON → IF total>500 → Redis VIP + Slack Alert / Redis Standard → Output |

### Execution Engine
- **Client-side execution**: Runs entirely in the browser — no backend required
- **Topological ordering**: Kahn's algorithm ensures correct node execution order
- **Per-node executors**: Each node plugin provides its own executor function
- **Live status indicators**: Nodes animate through idle → running → success/error states
- **Active edge highlighting**: Edges animate in indigo as data flows through them
- **Execution panel**: Collapsible log panel with timestamped entries per node
- **Pause / Resume / Stop**: Full execution control with step-through mode
- **Breakpoints**: Set per-node breakpoints; execution auto-pauses before that node

### Run History (Client-Side)
- **Persisted locally**: Every completed or failed run is recorded in localStorage per user
- **Full log capture**: Each run stores all execution logs, node results, durations, and status
- **Run History panel**: Browse all past runs with expandable log views per run
- **Clear history**: One-click clear of all recorded runs

### Monitoring Dashboard (Client-Side)
- **Derived metrics**: All stats computed from local run history — no backend needed
- **Stats**: Total runs, success rate, completed today, failed today, average execution time
- **Sparkline chart**: Bar chart of the last 7 runs colored by status
- **Top failing nodes**: Ranked list with proportional error bars

### Version History
- **Named snapshots**: Save the current canvas state with a custom name at any time
- **Timeline view**: Browse all versions with timestamp, node/edge count, and age
- **One-click restore**: Restoring a version saves the current state to undo history first
- **Max 20 versions** stored per user

### Collaboration & Backend Features
- **Real-time collaboration**: Live canvas updates via WebSockets (Socket.IO)
- **Workflow persistence**: Save/load workflows to PostgreSQL via NestJS backend
- **AI Workflow Builder**: Generate workflows from a natural language prompt (OpenAI)
- **Credential Manager**: Securely store and reference API credentials
- **Authentication**: JWT-based login with Passport; session restored on page load
- **Scheduled runs**: Backend SchedulerService triggers workflows on cron schedules using the workflow owner's credentials (no ForbiddenException)
- **Run history (backend)**: Backend also records runs via Bull job queues (when connected)

## Tech Stack

### Frontend
- React 18
- TypeScript 5
- Vite 5
- React Flow 11
- Zustand 4 (with `persist` middleware, user-scoped keys)
- Tailwind CSS 3
- Dagre (graph layout)
- React Hook Form + Zod
- Axios + Socket.IO Client
- Lucide React (icons)
- html2canvas + jsPDF (PDF export)
- ESLint + Prettier

### Backend
- NestJS 10
- TypeScript
- TypeORM + PostgreSQL
- JWT + Passport (authentication)
- Socket.IO (WebSockets)
- Bull / BullMQ (job queues)
- OpenAI SDK (AI features)
- Swagger (API docs)
- Winston (logging)
- Helmet (security)

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (only required for backend features)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd react-flow-workflow-builder

# Install all dependencies (frontend + backend)
npm run setup

# Start both frontend and backend
npm run dev:all
```

The frontend will be available at http://localhost:5173

> The app is fully functional without the backend. Run `npm run dev` for frontend-only mode — execution, run history, monitoring, templates, and the node library all work offline.

### Available Commands

```bash
# Development
npm run dev              # Frontend only
npm run dev:backend      # Backend only
npm run dev:all          # Frontend + backend concurrently

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## Deployment on Railway

### Prerequisites
- GitHub account
- Railway account (sign up at railway.app)
- PostgreSQL database (Railway provides this)

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub account and select this repository
   - Add a PostgreSQL plugin from the Railway dashboard
   - Railway will auto-detect and deploy automatically

3. **Access Your App**
   - Railway will provide a URL like: https://your-app.up.railway.app

### Environment Variables

```
DATABASE_URL=<postgresql-connection-string>
JWT_SECRET=<your-jwt-secret>
OPENAI_API_KEY=<your-openai-api-key>
```

## Usage

### Adding Nodes
- Drag any node from the Node Library panel onto the canvas
- Right-click the canvas for a quick-add context menu
- Use the AI Workflow Builder (✨ icon in the toolbar) to generate a workflow from a text prompt

### Using Templates
- Click the **Templates** icon (bookmark) in the toolbar to open the Templates panel
- **Workflows tab**: Click **Load Workflow** on any of the 5 built-in templates to instantly populate the canvas
- **Node Templates tab**: Drag a saved node template onto the canvas, or click **Add** to place it
- **Save a node template**: Select a node → click **Save Template** in the Property Panel

### Version History
- Click the **Versions** icon (branch) in the toolbar
- Type an optional name and click **Save** to snapshot the current canvas
- Click **Restore** on any version to roll back (current state is saved to undo history first)

### Connecting Nodes
- Drag from an output handle (right side) to an input handle (left side)
- Trigger/Input nodes have only outgoing edges
- Output/terminal nodes have only incoming edges
- Decision and IF nodes have named output handles (Yes/No, True/False)
- Switch nodes have Case 1, Case 2, and Default output handles

### Configuring Nodes
- Click any node to open the Property Panel on the right
- Config fields are rendered automatically from the node's schema
- Fields include: text, URL, number, select, boolean toggle, password, JSON editor, and code editor
- Expand the **Ports** section to see input/output data types

### Running a Workflow
1. Build a workflow on the canvas (or load a template)
2. Click the **▶ Run** button in the toolbar
3. Watch nodes animate through running → success/error states
4. Expand the Execution Panel (bottom bar) to see per-node logs
5. Click the **History** icon to review past runs with full logs

### Toolbar Reference

| Icon | Action |
|---|---|
| ↩ / ↪ | Undo / Redo |
| ⊞ | Auto Layout (choose direction) |
| ↺ | Reset canvas |
| ▶ ⏸ ⏭ ■ | Run / Pause / Step / Stop |
| ✓ | Validate workflow |
| ✨ | AI Workflow Builder |
| 🔖 | Templates panel |
| ⎇ | Version History |
| ⏱ | Run History |
| 📊 | Monitoring Dashboard |
| 🔑 | Credential Manager |
| ⋯ | Import / Export JSON / PDF |
| 💾 | Save to backend |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+C | Copy selected node(s) |
| Ctrl+V | Paste nodes |
| Ctrl+D | Duplicate selected node |
| Ctrl+K | Open command palette |
| Delete | Remove selected node |
| Double-click node | Toggle breakpoint |

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── auth/                   # Login / register page
│   │   ├── layout/                 # TopBar (icon-based toolbar), StatusBar
│   │   ├── panels/
│   │   │   ├── AiWorkflowBuilder.tsx
│   │   │   ├── CredentialManager.tsx
│   │   │   ├── ExecutionPanel.tsx
│   │   │   ├── MonitoringDashboard.tsx  # Client-side metrics from run history
│   │   │   ├── RunHistoryPanel.tsx      # Client-side run history (localStorage)
│   │   │   ├── TemplatesPanel.tsx       # Workflow + node template browser
│   │   │   └── VersionHistoryPanel.tsx
│   │   ├── ui/                     # Button, Badge, Tooltip, ConfirmDialog
│   │   ├── CommandPalette.tsx
│   │   ├── NodeLibrary.tsx         # Registry-driven, searchable, categorized
│   │   ├── PropertyPanel.tsx       # Schema-driven config forms
│   │   └── ValidationPanel.tsx
│   ├── data/
│   │   └── workflowTemplates.ts    # 5 built-in multi-node workflow templates
│   ├── engine/
│   │   └── executor.ts             # Topological sort, node executor routing
│   ├── flow/
│   │   ├── FlowCanvas.tsx          # React Flow canvas; MiniMap uses registry colors
│   │   └── CanvasContextMenu.tsx
│   ├── hooks/
│   │   ├── auth/
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useValidation.ts
│   ├── nodes/
│   │   ├── registry/
│   │   │   ├── types.ts            # NodeDefinition, FieldSchema, PortSchema interfaces
│   │   │   ├── index.ts            # registerNode, getNode, getNodesByCategory
│   │   │   └── GenericNode.tsx     # Default React Flow component for all plugin nodes
│   │   ├── lib/
│   │   │   ├── legacy/             # Input, Output, Processing, Transform, Decision, API, AI
│   │   │   ├── triggers/           # Webhook, Schedule, Email, DB Change, File Upload, Manual
│   │   │   ├── api/                # HTTP Request, REST API, GraphQL, Webhook Response
│   │   │   ├── ai/                 # Text Generation, Summarization, Classification, Embedding
│   │   │   ├── logic/              # IF, Switch, Loop, Delay, Retry
│   │   │   ├── transform/          # JSON Transform, CSV Parser, Text Parser, Regex, Format
│   │   │   ├── database/           # PostgreSQL, MongoDB, Redis
│   │   │   ├── communication/      # Email, Slack, Discord, Push Notification
│   │   │   ├── files/              # Upload, Download, PDF Parser, Image Processor
│   │   │   ├── utilities/          # Date, UUID, Random, Math, String
│   │   │   └── debug/              # Log, Inspector, Output Viewer, Test Data Generator
│   │   ├── BaseNode.tsx            # Shared node card UI (header, handles, status, timing)
│   │   └── index.ts                # Barrel — triggers registration, exports nodeTypes map
│   ├── services/
│   │   ├── api.ts                  # Axios instance
│   │   ├── auth.service.ts
│   │   ├── workflow.service.ts
│   │   ├── ai-builder.service.ts
│   │   ├── credentials.service.ts
│   │   ├── monitoring.service.ts
│   │   └── realtime.service.ts
│   ├── store/
│   │   ├── index.ts                # Zustand store — user-scoped persist key, workflow templates
│   │   └── slices/
│   │       ├── auth.ts             # Login/logout — clears all user-scoped localStorage on logout
│   │       ├── clipboard.ts
│   │       ├── execution.ts        # Execution engine + runHistory recording
│   │       ├── history.ts          # Undo/redo
│   │       ├── templates.ts        # Single-node template save/load
│   │       ├── validation.ts
│   │       └── versions.ts
│   ├── types/
│   │   └── index.ts                # FlowState, LocalRun, WorkflowTemplate, NodeDefinition…
│   ├── utils/
│   │   ├── layout.ts               # Dagre auto-layout
│   │   ├── importExport.ts         # JSON serialization
│   │   └── exportPdf.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
└── backend/
    └── src/
        ├── scheduler/              # Cron scheduler — uses workflow owner userId (no ForbiddenException)
        ├── execution/              # Execution service with bypassOwnership flag for internal callers
        ├── workflows/              # findOneInternal() for trusted internal lookups
        └── ...                     # auth, AI, credentials, WebSockets, queue processor
```

## Adding a Custom Node

Create a file anywhere and call `registerNode`:

```typescript
import React from 'react'
import { registerNode } from './src/nodes/registry'

registerNode({
  type: 'my-custom-node',
  name: 'My Node',
  description: 'Does something useful',
  category: 'Utilities',
  color: 'from-teal-500 to-teal-600',
  icon: React.createElement(MyIcon, { size: 13 }),
  inputs:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
  outputs: [{ id: 'out', label: 'Output', dataType: 'any' }],
  fields: [
    { key: 'message', label: 'Message', type: 'text', placeholder: 'Hello world' },
  ],
  defaultConfig: { message: 'Hello world' },
  executor: async (config, input, ctx) => {
    if (ctx.signal.aborted) throw new Error('Aborted')
    return { result: config.message, input }
  },
})
```

Then import the file in `src/nodes/index.ts` alongside the other lib imports.

## Workflow JSON Format

```json
{
  "version": "2.0",
  "workflowName": "My Workflow",
  "nodes": [
    {
      "id": "trigger-webhook-1234",
      "type": "trigger-webhook",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Webhook Trigger",
        "status": "idle",
        "config": { "method": "POST", "path": "/webhook/my-flow" }
      }
    },
    {
      "id": "http-request-5678",
      "type": "http-request",
      "position": { "x": 350, "y": 100 },
      "data": {
        "label": "HTTP Request",
        "status": "idle",
        "config": { "method": "GET", "url": "https://api.example.com/data" }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "trigger-webhook-1234",
      "target": "http-request-5678",
      "type": "smoothstep"
    }
  ]
}
```

## Performance

- All node components are memoized with `React.memo`
- Zustand state updates are batched and scoped to minimize re-renders
- React Flow virtualization handles large graphs efficiently
- Run history is capped at 100 entries per user in localStorage
- Supports 200+ nodes and 1000+ edges without degradation

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
