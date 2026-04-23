import { useCallback } from 'react'
import introJs from 'intro.js'
import 'intro.js/introjs.css'

// ── Per-user tour state key ────────────────────────────────────

function tourKey(): string {
  try {
    const raw = localStorage.getItem('auth-store')
    if (raw) {
      const p = JSON.parse(raw) as { state?: { user?: { id?: string } } }
      const id = p?.state?.user?.id ?? 'guest'
      return `flowbuilder-tour-done-${id}`
    }
  } catch { /* */ }
  return 'flowbuilder-tour-done-guest'
}

export function hasTourBeenSeen(): boolean {
  return localStorage.getItem(tourKey()) === '1'
}

function markTourSeen() {
  localStorage.setItem(tourKey(), '1')
}

// ── Step definitions ───────────────────────────────────────────

// Use a plain object array to avoid the strict Step type position mismatch
const STEPS: Array<{
  element?: string
  title: string
  intro: string
  position?: string
  tooltipClass?: string
}> = [
  {
    title: '👋 Welcome to FlowBuilder',
    intro: `
      <p style="margin:0 0 8px">Build powerful workflow automations visually — no code required.</p>
      <p style="margin:0;color:#64748b;font-size:13px">This quick tour will show you the key areas in about 60 seconds.</p>
    `,
    tooltipClass: 'fb-tooltip fb-tooltip--welcome',
  },
  {
    element: '[data-tour="node-library"]',
    title: '📦 Node Library',
    intro: `
      <p style="margin:0 0 8px">Browse <strong>47 built-in nodes</strong> across 10 categories.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Search by name, or expand a category and <strong>drag any node</strong> onto the canvas.</p>
    `,
    position: 'right',
  },
  {
    element: '[data-tour="canvas"]',
    title: '🎨 Canvas',
    intro: `
      <p style="margin:0 0 8px">This is your workflow canvas. Drop nodes here, then <strong>drag from an output handle to an input handle</strong> to connect them.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Right-click anywhere for a quick-add menu. Double-click a node to set a breakpoint.</p>
    `,
    position: 'top',
  },
  {
    element: '[data-tour="property-panel"]',
    title: '⚙️ Property Panel',
    intro: `
      <p style="margin:0 0 8px">Click any node to configure it here. Fields are rendered automatically from the node's schema.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Click <strong>Save Template</strong> to save a configured node for reuse.</p>
    `,
    position: 'left',
  },
  {
    element: '[data-tour="run-controls"]',
    title: '▶ Run Controls',
    intro: `
      <p style="margin:0 0 8px">Execute your workflow with the <strong>▶ Run</strong> button. Watch nodes animate through running → success/error states in real time.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Use <strong>Pause</strong>, <strong>Step</strong>, and <strong>Stop</strong> for full execution control.</p>
    `,
    position: 'bottom',
  },
  {
    element: '[data-tour="execution-panel"]',
    title: '📋 Execution Panel',
    intro: `
      <p style="margin:0 0 8px">Expand this panel to see <strong>per-node logs</strong> with timestamps, inputs, outputs, and durations.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Every run is saved to Run History automatically.</p>
    `,
    position: 'top',
  },
  {
    element: '[data-tour="ai-builder"]',
    title: '✨ AI Workflow Builder',
    intro: `
      <p style="margin:0 0 8px">Describe your automation in plain English and let AI generate the full workflow for you.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Example: <em>"Fetch data from an API every hour, summarize it with AI, and email the report"</em></p>
    `,
    position: 'bottom',
  },
  {
    element: '[data-tour="templates-btn"]',
    title: '🔖 Templates',
    intro: `
      <p style="margin:0 0 8px">Load one of <strong>5 ready-to-run workflow templates</strong> instantly, or browse your saved node templates.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Templates are a great starting point for common automation patterns.</p>
    `,
    position: 'bottom',
  },
  {
    element: '[data-tour="versions-btn"]',
    title: '⎇ Version History',
    intro: `
      <p style="margin:0 0 8px">Save named snapshots of your workflow at any time and restore them with one click.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Restoring a version saves the current state to undo history first — so you can always go back.</p>
    `,
    position: 'bottom',
  },
  {
    element: '[data-tour="monitoring-btn"]',
    title: '📊 Monitoring',
    intro: `
      <p style="margin:0 0 8px">View <strong>run statistics</strong>, success rates, average execution times, and top failing nodes — all derived from local run history.</p>
      <p style="margin:0;color:#64748b;font-size:13px">No backend required — everything is computed from your browser's localStorage.</p>
    `,
    position: 'bottom',
  },
  {
    title: '🚀 You\'re ready!',
    intro: `
      <p style="margin:0 0 10px">You now know the key features of FlowBuilder. Here's how to get started:</p>
      <ol style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.8">
        <li>Drag a <strong>Trigger</strong> node onto the canvas</li>
        <li>Add processing nodes and connect them</li>
        <li>Configure each node in the Property Panel</li>
        <li>Click <strong>▶ Run</strong> to execute</li>
      </ol>
      <p style="margin:10px 0 0;color:#64748b;font-size:12px">Press <kbd style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:1px 5px">?</kbd> at any time to restart this tour.</p>
    `,
    tooltipClass: 'fb-tooltip fb-tooltip--final',
  },
]

// ── Hook ───────────────────────────────────────────────────────

export function useWalkthrough() {
  const start = useCallback((force = false) => {
    if (!force && hasTourBeenSeen()) return

    const intro = introJs()

    intro.setOptions({
      steps: STEPS,
      showProgress: true,
      showBullets: false,
      showStepNumbers: false,
      exitOnOverlayClick: false,
      exitOnEsc: true,
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Get Started!',
      scrollToElement: true,
      scrollPadding: 80,
      tooltipPosition: 'auto',
      highlightClass: 'fb-highlight',
      overlayOpacity: 0.55,
      disableInteraction: false,
    } as any)

    intro.oncomplete(() => markTourSeen())
    intro.onexit(() => markTourSeen())

    intro.start()
  }, [])

  const restart = useCallback(() => start(true), [start])

  return { start, restart }
}
