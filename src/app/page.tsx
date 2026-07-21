"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  Braces,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  Lightbulb,
  Loader2,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Wand2,
} from "lucide-react";
import { demoPrompt, initialAnalysis } from "@/lib/demo";
import { analyzePrompt, defaultTests, type PromptAnalysis, type TestCase, type TestResult } from "@/lib/prompt-analysis";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <textarea
      className="h-full w-full resize-none bg-[#080b10] p-5 font-mono text-sm leading-6 text-zinc-300 outline-none"
      defaultValue={demoPrompt}
    />
  ),
});

type Tab = "Analyze" | "Diff" | "Tests" | "Optimize";

const tabs: Array<{ id: Tab; icon: typeof Activity }> = [
  { id: "Analyze", icon: Activity },
  { id: "Diff", icon: GitCompareArrows },
  { id: "Tests", icon: FlaskConical },
  { id: "Optimize", icon: Wand2 },
];

const sidebarItems = [
  [Terminal, "Prompt Lab", "Active"],
  [Activity, "Timeline", "Live"],
  [ShieldCheck, "Validation", "4 tests"],
  [Rocket, "Ship Check", "Ready"],
] as const;

export default function Home() {
  const [prompt, setPrompt] = useState(demoPrompt);
  const [liveAnalysis, setLiveAnalysis] = useState<PromptAnalysis | null>(null);
  const [tests, setTests] = useState<TestCase[]>(defaultTests);
  const [activeTab, setActiveTab] = useState<Tab>("Analyze");
  const [activeStage, setActiveStage] = useState(initialAnalysis.timeline.length - 1);
  const [runId, setRunId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const localAnalysis = useMemo(() => analyzePrompt(prompt, tests), [prompt, tests]);
  const analysis = liveAnalysis || localAnalysis;
  const passing = analysis.tests.filter((test) => test.status === "PASS").length;
  const readiness = Math.round((analysis.score + (passing / Math.max(1, analysis.tests.length)) * 100) / 2);

  useEffect(() => {
    const timers = analysis.timeline.map((_, index) =>
      window.setTimeout(() => setActiveStage(index), index * 260),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [runId, analysis.timeline]);

  async function analyze() {
    setLoading(true);
    setRunId((value) => value + 1);
    setApiError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json();
      setLiveAnalysis(result);
      setApiError(result.error || null);
    } finally {
      window.setTimeout(() => setLoading(false), 720);
    }
  }

  function reset() {
    setPrompt(demoPrompt);
    setTests(defaultTests);
    setLiveAnalysis(null);
    setApiError(null);
    setRunId((value) => value + 1);
  }

  function updatePrompt(value: string) {
    setPrompt(value);
    setLiveAnalysis(null);
  }

  function updateTests(nextTests: TestCase[]) {
    setTests(nextTests);
    setLiveAnalysis(null);
  }

  function addTest() {
    const id = `test-${tests.length + 1}`;
    updateTests([
      ...tests,
      {
        id,
        name: "New behavior check",
        input: "Add a realistic edge case.",
        expected: "Describe the expected model behavior.",
      },
    ]);
    setActiveTab("Tests");
  }

  return (
    <main className="app-shell min-h-[100dvh] overflow-hidden bg-[#07090d] text-zinc-100 selection:bg-white/20 selection:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(255,255,255,0.035),transparent_42%),radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.025),transparent_35%)]" />
      <div className="relative flex min-h-[100dvh]">
        <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.08] bg-[#090c12] p-4 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3 px-1">
              <div className="grid size-9 place-items-center rounded-xl border border-white/[0.12] bg-white/[0.04]">
                <Braces size={18} className="text-white" />
              </div>
              <div>
                <p className="m-0 text-xs font-semibold tracking-tight text-zinc-100">PromptScope</p>
                <p className="m-0 text-[11px] text-zinc-500">DevTools for prompts</p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="mb-2.5 flex items-center justify-between font-mono text-[11px] text-zinc-400">
                <span>Ship readiness</span>
                <span className="text-zinc-200">{readiness}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: `${readiness}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 24 }}
                />
              </div>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map(([Icon, label, meta]) => (
                <button
                  key={label}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} className="text-zinc-500 transition group-hover:text-white" />
                    {label}
                  </span>
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-zinc-500">{meta}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
              <Sparkles size={14} className="text-white" />
              <span>One Workflow</span>
            </div>
            <p className="m-0 text-[11px] leading-4 text-zinc-500">Write, analyze, optimize, test, and ship with ultra-low latency.</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#090c12]/95 px-5 backdrop-blur-md">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                <span>workspace</span>
                <ChevronRight size={12} className="text-zinc-600" />
                <span className="text-zinc-400">q2-report-assistant</span>
              </div>
              <h1 className="truncate text-xs font-semibold tracking-tight text-zinc-200">Untitled prompt profile</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={reset} className="icon-button" title="Reset prompt">
                <RotateCcw size={14} />
              </button>
              <button onClick={addTest} className="hidden h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white md:flex">
                <Plus size={14} />
                Test
              </button>
              <button onClick={analyze} className="primary-button" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                Analyze
              </button>
            </div>
          </header>

          <div className="grid flex-1 grid-rows-[auto_200px] gap-4 overflow-auto p-4 md:p-5 xl:min-h-0 xl:grid-rows-[minmax(0,1fr)_200px] xl:overflow-hidden">
            <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(420px,1fr)_minmax(380px,480px)]">
              <EditorPanel prompt={prompt} setPrompt={updatePrompt} analysis={analysis} />
              <AnalysisPanel
                analysis={analysis}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                prompt={prompt}
                tests={tests}
                setTests={updateTests}
                apiError={apiError}
              />
            </div>
            <Timeline analysis={analysis} activeStage={activeStage} runId={runId} loading={loading} />
          </div>
        </section>
      </div>
    </main>
  );
}

function EditorPanel({ prompt, setPrompt, analysis }: { prompt: string; setPrompt: (value: string) => void; analysis: PromptAnalysis }) {
  return (
    <section className="panel flex min-h-[420px] min-w-0 flex-col overflow-hidden xl:resize-x">
      <div className="toolbar">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-zinc-200">
          <Code2 size={15} className="text-white" />
          Main Editor
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-zinc-300">SYSTEM</span>
          <span>{analysis.inputTokens} tokens</span>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language="markdown"
          value={prompt}
          onChange={(value) => setPrompt(value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 22,
            padding: { top: 18, bottom: 18 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            fontFamily: "var(--font-mono)",
          }}
        />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.08] bg-white/[0.01] px-4 py-2 font-mono text-[11px] text-zinc-500">
        <span>{prompt.split(/\s+/).filter(Boolean).length} words</span>
        <span>Complexity score {analysis.complexity}/100</span>
      </div>
    </section>
  );
}

function AnalysisPanel(props: {
  analysis: PromptAnalysis;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  prompt: string;
  tests: TestCase[];
  setTests: (tests: TestCase[]) => void;
  apiError: string | null;
}) {
  const { analysis, activeTab, setActiveTab, prompt, tests, setTests, apiError } = props;

  return (
    <aside className="panel flex min-h-[420px] min-w-0 flex-col overflow-hidden">
      <div className="toolbar">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-zinc-200">
          <SlidersHorizontal size={15} className="text-white" />
          Right Analysis Panel
        </div>
        <span className="rounded-full border border-white/[0.12] bg-white/[0.05] px-2.5 py-0.5 font-mono text-[10px] text-zinc-200">Local first</span>
      </div>

      <div className="border-b border-white/[0.08] bg-black/20 p-2.5">
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/[0.06] bg-black/40 p-1">
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex h-7 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition ${activeTab === id ? "border border-white/[0.08] bg-white/[0.12] text-white shadow-sm" : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"}`}
            >
              <Icon size={13} className={activeTab === id ? "text-white" : "text-zinc-500"} />
              <span className="hidden sm:inline">{id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mb-3.5 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 font-mono text-[11px] text-zinc-300">
          <span className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Deterministic Engine Active
          </span>
          <span className="text-zinc-500">0ms latency</span>
        </div>
        {apiError ? (
          <div className="mb-3 rounded-xl border border-white/[0.1] bg-white/[0.04] p-3 text-xs leading-5 text-zinc-300">
            <span className="font-semibold text-white">Live API Fallback:</span> {apiError}
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "Analyze" ? <Profiler analysis={analysis} /> : null}
            {activeTab === "Diff" ? <PromptDiff prompt={prompt} optimized={analysis.optimizedPrompt} /> : null}
            {activeTab === "Tests" ? <PromptTests tests={tests} setTests={setTests} results={analysis.tests} /> : null}
            {activeTab === "Optimize" ? <Optimize analysis={analysis} prompt={prompt} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

function Profiler({ analysis }: { analysis: PromptAnalysis }) {
  const metrics = [
    ["Quality", `${analysis.score}/100`, Gauge],
    ["Tokens", analysis.inputTokens.toLocaleString(), Braces],
    ["Cost", analysis.cost, Activity],
    ["Latency", analysis.latency, Terminal],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(([label, value, Icon]) => (
          <div key={label} className="metric-card">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-400">{label}</span>
              <Icon size={14} className="text-white" />
            </div>
            <p className="m-0 mt-3 font-mono text-lg font-semibold tracking-tight text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      <section className="sub-panel">
        <div className="mb-2.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200">Prompt Profiler</span>
          <span className="font-mono text-zinc-400">Complexity {analysis.complexity}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div className="h-full rounded-full bg-white" animate={{ width: `${analysis.complexity}%` }} />
        </div>
        <div className="mt-4 space-y-2">
          {(analysis.redundantInstructions.length ? analysis.redundantInstructions : ["No severe redundancy detected."]).map((item) => (
            <div key={item} className="flex gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 text-xs leading-5 text-zinc-300">
              <Circle size={8} className="mt-1.5 shrink-0 fill-white text-white" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <SuggestionList suggestions={analysis.suggestions} />
    </div>
  );
}

function SuggestionList({ suggestions }: { suggestions: PromptAnalysis["suggestions"] }) {
  return (
    <section className="sub-panel">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-200">
        <Lightbulb size={15} className="text-white" />
        <span>Optimization Suggestions</span>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div key={suggestion.title} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-medium text-zinc-200">{suggestion.title}</p>
                <p className="m-0 mt-1 text-[11px] leading-4 text-zinc-400">{suggestion.detail}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white">{suggestion.impact}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromptDiff({ prompt, optimized }: { prompt: string; optimized: string }) {
  const removed = prompt.split("\n").filter((line) => line.trim() && !optimized.includes(line.trim()));
  const added = optimized.split("\n").filter((line) => line.trim() && !prompt.includes(line.trim()));

  return (
    <div className="space-y-4">
      <section className="sub-panel">
        <h2 className="text-xs font-semibold text-zinc-200">Prompt Diff</h2>
        <p className="mt-1 text-[11px] leading-4 text-zinc-400">Additions, deletions, and modified guidance are isolated for review.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <DiffBox title="Original" tone="red" lines={removed.length ? removed : ["No deleted lines."]} />
          <DiffBox title="Optimized" tone="green" lines={added.length ? added : ["No new lines."]} />
        </div>
      </section>
      <section className="sub-panel">
        <h2 className="text-xs font-semibold text-zinc-200">Output Comparison</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <OutputCard title="Before" text="Likely follows the task, but may stay silent when the source lacks a requested detail." />
          <OutputCard title="After" text="Keeps the same useful structure while making missing evidence explicit before finalizing." active />
        </div>
      </section>
    </div>
  );
}

function DiffBox({ title, tone, lines }: { title: string; tone: "red" | "green"; lines: string[] }) {
  const toneClass = tone === "green" ? "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-200" : "border-rose-500/20 bg-rose-500/[0.04] text-rose-200";
  const prefix = tone === "green" ? "+" : "-";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="m-0 mb-2 font-mono text-[11px] font-semibold">{title}</p>
      <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-5">{lines.map((line) => `${prefix} ${line}`).join("\n")}</pre>
    </div>
  );
}

function OutputCard({ title, text, active }: { title: string; text: string; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${active ? "border-white/40 bg-white/[0.06]" : "border-white/[0.07] bg-white/[0.015]"}`}>
      <p className="m-0 font-mono text-[11px] font-semibold text-zinc-400">{title}</p>
      <p className="m-0 mt-2 text-xs leading-5 text-zinc-300">{text}</p>
    </div>
  );
}

function PromptTests({ tests, setTests, results }: { tests: TestCase[]; setTests: (tests: TestCase[]) => void; results: TestResult[] }) {
  function updateTest(id: string, key: keyof TestCase, value: string) {
    setTests(tests.map((test) => (test.id === id ? { ...test, [key]: value } : test)));
  }

  return (
    <div className="space-y-3">
      {tests.map((test) => {
        const result = results.find((item) => item.id === test.id);
        return (
          <section key={test.id} className="sub-panel">
            <div className="mb-3 flex items-start justify-between gap-3">
              <input
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-zinc-200 outline-none placeholder:text-zinc-600"
                value={test.name}
                onChange={(event) => updateTest(test.id, "name", event.target.value)}
              />
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${result?.status === "PASS" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-300"}`}>
                {result?.status || "PENDING"}
              </span>
            </div>
            <textarea
              className="field mb-2"
              value={test.input}
              onChange={(event) => updateTest(test.id, "input", event.target.value)}
              rows={2}
            />
            <textarea
              className="field"
              value={test.expected}
              onChange={(event) => updateTest(test.id, "expected", event.target.value)}
              rows={2}
            />
            <p className="m-0 mt-3 text-[11px] text-zinc-400">{result?.reason}</p>
          </section>
        );
      })}
    </div>
  );
}

function Optimize({ analysis, prompt }: { analysis: PromptAnalysis; prompt: string }) {
  return (
    <div className="space-y-4">
      <section className="sub-panel">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-200">One Click Optimize</h2>
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-white">+{analysis.improvementScore} score</span>
        </div>
        <div className="mt-4 space-y-3">
          <PromptBlock title="Before" text={prompt} />
          <div className="flex justify-center text-zinc-600">
            <ArrowDown size={16} />
          </div>
          <PromptBlock title="After" text={analysis.optimizedPrompt} active />
        </div>
      </section>
      <SuggestionList suggestions={analysis.suggestions} />
    </div>
  );
}

function PromptBlock({ title, text, active }: { title: string; text: string; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${active ? "border-white/40 bg-white/[0.06]" : "border-white/[0.07] bg-white/[0.015]"}`}>
      <p className="m-0 mb-2 font-mono text-[11px] font-semibold text-zinc-400">{title}</p>
      <pre className="m-0 max-h-44 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-300">{text}</pre>
    </div>
  );
}

function Timeline({ analysis, activeStage, runId, loading }: { analysis: PromptAnalysis; activeStage: number; runId: number; loading: boolean }) {
  return (
    <section className="panel overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
            <Activity size={13} className="text-white" />
            <span>run #{String(runId).padStart(3, "0")}</span>
          </div>
          <h2 className="m-0 mt-1 text-xs font-semibold text-zinc-200">Prompt Timeline</h2>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${loading ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>
          {loading ? "Analyzing..." : "Completed"}
        </span>
      </div>
      <div className="relative grid grid-cols-2 gap-2.5 md:grid-cols-7">
        <div className="absolute left-4 right-4 top-[24px] hidden h-px bg-white/[0.08] md:block" />
        <motion.div
          className="absolute left-4 top-[24px] hidden h-px bg-white md:block"
          animate={{ width: `${(activeStage / Math.max(1, analysis.timeline.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 24 }}
        />
        {analysis.timeline.map((stage, index) => {
          const done = index <= activeStage;
          const current = index === activeStage;
          return (
            <motion.div
              key={stage.id}
              className={`relative rounded-xl border p-3.5 transition-all ${done ? "border-white/35 bg-white/[0.06]" : "border-white/[0.07] bg-white/[0.015]"}`}
              animate={{ y: current ? -3 : 0, opacity: done ? 1 : 0.5 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
            >
              <div className={`mb-3 grid size-6 place-items-center rounded-full border ${done ? "border-white/40 bg-white/15 text-white" : "border-white/[0.08] bg-black/40 text-zinc-600"}`}>
                {done ? <CheckCircle2 size={13} /> : <Circle size={10} />}
              </div>
              <p className="m-0 text-xs font-semibold leading-4 text-zinc-200">{stage.title}</p>
              <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-400">{stage.detail}</p>
              <span className="mt-2.5 inline-block rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{stage.duration}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}



