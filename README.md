# React Flow Workflow Builder

A production-quality node-based workflow editor built with React, TypeScript, and React Flow.

## Features

- **Interactive Canvas**: Zoom, pan, and drag nodes on an infinite canvas
- **Node Management**: Add, delete, and configure multiple node types
- **Connections**: Connect nodes with edges and validate relationships
- **History**: Undo/redo functionality with Ctrl+Z / Ctrl+Shift+Z
- **Clipboard**: Copy, paste, and duplicate nodes (Ctrl+C / Ctrl+V / Ctrl+D)
- **Templates**: Save and reuse node configurations
- **Auto Layout**: Automatically arrange workflows using Dagre
- **Import/Export**: Save and load workflows as JSON
- **Validation**: Real-time workflow validation with error reporting
- **Keyboard Shortcuts**: Comprehensive keyboard support
- **Performance**: Optimized for 200+ nodes and 1000+ edges

## Tech Stack

- React 18
- TypeScript
- Vite
- React Flow
- Zustand
- Tailwind CSS
- Dagre (graph layout)
- ESLint + Prettier

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

`ash
# Clone the repository
git clone <repository-url>
cd react-flow-workflow-builder

# Install dependencies
npm install

# Start development server
npm run dev
`

The app will be available at http://localhost:5173

### Available Commands

`ash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
`

## Deployment on Railway

### Prerequisites
- GitHub account
- Railway account (sign up at railway.app)

### Deployment Steps

1. **Push to GitHub**
   `ash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   `

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub account and select this repository
   - Railway will auto-detect and deploy automatically

3. **Access Your App**
   - Railway will provide a URL like: https://your-app.up.railway.app
   - Your workflow editor is now live!

### Environment Variables
No environment variables are required for basic functionality.

## Usage

### Creating Nodes
- Click toolbar buttons to add nodes
- Or drag nodes from the left sidebar onto the canvas

### Connecting Nodes
- Drag from output handles (right side) to input handles (left side)
- Input nodes can only have outgoing edges
- Output nodes can only have incoming edges

### Keyboard Shortcuts
- **Ctrl+Z**: Undo last action
- **Ctrl+Shift+Z**: Redo last action
- **Ctrl+C**: Copy selected node(s)
- **Ctrl+V**: Paste copied nodes
- **Ctrl+D**: Duplicate selected node
- **Delete**: Remove selected node
- **Click**: Select node
- **Drag**: Move node or canvas

### Workflow Operations
- **Auto Arrange**: Click "Auto Arrange" to organize nodes automatically
- **Export**: Click "Export JSON" to save workflow as JSON file
- **Import**: Click "Import JSON" to load workflow from file
- **Reset**: Click "Reset Canvas" to clear all nodes and edges

## Project Structure

`
src/
├── components/          # UI components
│   ├── Toolbar.tsx     # Action buttons and controls
│   ├── SidePanel.tsx   # Node properties editor
│   ├── NodeSearchPanel.tsx    # Node palette and search
│   └── ValidationPanel.tsx    # Workflow validation display
├── flow/
│   └── FlowCanvas.tsx  # Main canvas component
├── nodes/              # Custom node components
│   ├── InputNode.tsx
│   ├── ProcessingNode.tsx
│   ├── OutputNode.tsx
│   └── index.ts
├── store/              # Zustand state management
│   ├── index.ts       # Main store
│   └── slices/        # Store slices
│       ├── history.ts    # Undo/redo
│       ├── clipboard.ts  # Copy/paste
│       ├── templates.ts  # Templates
│       └── validation.ts # Validation
├── hooks/              # Custom React hooks
│   ├── useKeyboardShortcuts.ts
│   └── useValidation.ts
├── utils/              # Utility functions
│   ├── layout.ts         # Graph layout
│   └── importExport.ts   # JSON serialization
├── types/              # TypeScript definitions
│   └── index.ts
├── App.tsx            # Root component
├── main.tsx           # Entry point
└── index.css          # Global styles
`

## Performance Considerations

- Nodes are memoized to prevent unnecessary re-renders
- State updates are batched using Zustand
- React Flow optimization for large graphs
- Supports 200+ nodes without performance degradation

## Workflow JSON Format

`json
{
  "nodes": [
    {
      "id": "input-123",
      "type": "input",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Data Input", "properties": {} }
    },
    {
      "id": "process-456",
      "type": "processing",
      "position": { "x": 300, "y": 100 },
      "data": { "label": "Transform", "properties": {} }
    }
  ],
  "edges": [
    {
      "id": "edge-789",
      "source": "input-123",
      "target": "process-456"
    }
  ],
  "version": "1.0"
}
`

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
