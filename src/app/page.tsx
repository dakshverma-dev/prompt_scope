"use client";

import { useDeferredValue, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  Braces,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  FileCode2,
  Gauge,
  Lightbulb,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Terminal,
} from "lucide-react";
import { defaultPrompt, demoAnalysis, testCases, type PromptAnalysis, type TestCase, type TestResult } from "@/lib/demo";
import { analyzePromptLocal } from "@/lib/prompt-analysis";

const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[420px] place-items-center bg-[#0f172a] text-sm text-zinc-500">
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin text-sky-400" size={16} />
        Loading Monaco Editor...
      </div>
    </div>
  ),
});

type Tab = "Analyze" | "Diff" | "Tests" | "Optimize";

const tabs: { id: Tab; icon: typeof Gauge }[] = [
  { id: "Analyze", icon: Gauge },
  { id: "Diff", icon: FileCode2 },
  { id: "Tests", icon: CheckCircle2 },
  { id: "Optimize", icon: Sparkles },
];

const sidebarItems = [
  [Code2, "Editor Workspace", "Active"],
  [Gauge, "Performance Profiler", "Local"],
  [SlidersHorizontal, "Evaluation Rules", "Strict"],
  [FileCode2, "Version History", "v1.4"],
] as const;

export default function Home() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const deferredPrompt = useDeferredValue(prompt);
  const [activeTab, setActiveTab] = useState<Tab>("Analyze");
  const [tests, setTests] = useState<TestCase[]>(testCases);
  const [analysis, setAnalysis] = useState<PromptAnalysis>(demoAnalysis);
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(4);
  const [runId, setRunId] = useState(1);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const local = analyzePromptLocal(deferredPrompt, tests);
    setAnalysis((current) => ({
      ...local,
      timeline: current.timeline,
    }));
  }, [deferredPrompt, tests]);

  async function analyze() {
    setLoading(true);
    setActiveStage(0);
    setRunId((id) => id + 1);
    setApiError(null);

    const stepDuration = 280;
    for (let step = 0; step <= 4; step++) {
      setActiveStage(step);
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tests }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API unavailable (${response.status})`);
      }

      const data = (await response.json()) as PromptAnalysis;
      setAnalysis(data);
    } catch (error) {
      const fallback = analyzePromptLocal(prompt, tests);
      setAnalysis(fallback);
      setApiError(error instanceof Error ? error.message : "Fallback to deterministic engine.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPrompt(defaultPrompt);
    setTests(testCases);
    setAnalysis(demoAnalysis);
    setApiError(null);
  }

  function addTest() {
    const newTest: TestCase = {
      id: `test-${Date.now()}`,
      name: `Scenario ${tests.length + 1}`,
      input: "Enter representative input data...",
      expected: "Define expected output behavior or required keywords...",
    };
    setTests([...tests, newTest]);
    setActiveTab("Tests");
  }

  const readiness = Math.max(10, Math.min(99, Math.round((analysis.score * 0.6 + (100 - analysis.complexity) * 0.4))));

  return (
    <main className="app-shell min-h-[100dvh] overflow-hidden bg-[#090d16] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(56,189,248,0.15),transparent_35%)]" />
      <div className="relative flex min-h-[100dvh]">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[#0f172a]/90 p-4 backdrop-blur-md lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3 px-1">
              <div className="grid size-10 place-items-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
                <Braces size={22} />
              </div>
              <div>
                <p className="m-0 text-base font-bold tracking-tight text-white">PromptScope</p>
                <p className="m-0 text-xs text-zinc-400">DevTools for prompts</p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3.5">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                <span>Ship Readiness</span>
                <span className="font-semibold text-white">{readiness}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-sky-400"
                  animate={{ width: `${readiness}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 24 }}
                />
              </div>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map(([Icon, label, meta]) => (
                <button
                  key={label}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} className="text-zinc-400 group-hover:text-sky-400" />
                    {label}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">{meta}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-300">
              <Sparkles size={16} />
              <span>One Workflow</span>
            </div>
            <p className="m-0 text-xs leading-5 text-zinc-300">Write, analyze, optimize, test, and ship with ultra-low latency.</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#0f172a]/95 px-5 backdrop-blur-md">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Workspace</span>
                <ChevronRight size={14} className="text-zinc-500" />
                <span className="text-zinc-300">q2-report-assistant</span>
              </div>
              <h1 className="truncate text-base font-bold tracking-tight text-white">Untitled prompt profile</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={reset} className="icon-button" title="Reset prompt">
                <RotateCcw size={16} />
              </button>
              <button onClick={addTest} className="hidden h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10 md:flex">
                <Plus size={16} />
                Test Case
              </button>
              <button onClick={analyze} className="primary-button" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={15} fill="currentColor" />}
                Analyze Prompt
              </button>
            </div>
          </header>

          <div className="grid flex-1 grid-rows-[auto_220px] gap-4 overflow-auto p-4 md:p-5 xl:min-h-0 xl:grid-rows-[minmax(0,1fr)_220px] xl:overflow-hidden">
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

  function updatePrompt(value: string) {
    setPrompt(value);
  }

  function updateTests(updated: TestCase[]) {
    setTests(updated);
  }
}

function EditorPanel({ prompt, setPrompt, analysis }: { prompt: string; setPrompt: (value: string) => void; analysis: PromptAnalysis }) {
  return (
    <section className="panel flex min-h-[420px] min-w-0 flex-col overflow-hidden xl:resize-x">
      <div className="toolbar">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Code2 size={16} className="text-sky-400" />
          Main Editor
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-zinc-300">SYSTEM</span>
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
            fontSize: 14,
            lineHeight: 24,
            padding: { top: 18, bottom: 18 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            fontFamily: "var(--font-mono)",
          }}
        />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-zinc-400">
        <span>{prompt.split(/\s+/).filter(Boolean).length} words</span>
        <span>Complexity Score {analysis.complexity}/100</span>
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
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <SlidersHorizontal size={16} className="text-sky-400" />
          Right Analysis Panel
        </div>
        <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs text-emerald-300">Local first</span>
      </div>

      <div className="border-b border-white/10 bg-black/30 p-2.5">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-black/50 p-1">
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition ${activeTab === id ? "bg-sky-500 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {apiError ? (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
            Live OpenAI analysis is unavailable, so the deterministic profiler is active. {apiError}
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
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
              <span className="text-xs text-zinc-400">{label}</span>
              <Icon size={16} className="text-sky-400" />
            </div>
            <p className="m-0 mt-3 text-xl font-bold tracking-tight text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="sub-panel">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>Prompt Profiler</span>
          <span className="text-xs text-zinc-400">Complexity {analysis.complexity}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full rounded-full bg-sky-400" animate={{ width: `${analysis.complexity}%` }} />
        </div>
        <div className="mt-4 space-y-2">
          {(analysis.redundantInstructions.length ? analysis.redundantInstructions : ["No severe redundancy detected."]).map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
              <Circle size={10} className="mt-1 shrink-0 fill-sky-400 text-sky-400" />
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
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Lightbulb size={16} className="text-amber-400" />
        <span>Optimization Suggestions</span>
      </div>
      <div className="space-y-2.5">
        {suggestions.map((suggestion) => (
          <div key={suggestion.title} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-sm font-semibold text-white">{suggestion.title}</p>
                <p className="m-0 mt-1 text-xs leading-5 text-zinc-400">{suggestion.detail}</p>
              </div>
              <span className="shrink-0 rounded-md bg-sky-500/20 px-2 py-1 text-xs font-medium text-sky-300">{suggestion.impact}</span>
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
        <h2 className="text-sm font-bold text-white">Prompt Diff</h2>
        <p className="mt-1 text-xs leading-5 text-zinc-400">Additions, deletions, and modified guidance are isolated for review.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <DiffBox title="Original" tone="red" lines={removed.length ? removed : ["No deleted lines."]} />
          <DiffBox title="Optimized" tone="green" lines={added.length ? added : ["No new lines."]} />
        </div>
      </section>
      <section className="sub-panel">
        <h2 className="text-sm font-bold text-white">Output Comparison</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <OutputCard title="Before" text="Likely follows the task, but may stay silent when the source lacks a requested detail." />
          <OutputCard title="After" text="Keeps the same useful structure while making missing evidence explicit before finalizing." active />
        </div>
      </section>
    </div>
  );
}

function DiffBox({ title, tone, lines }: { title: string; tone: "red" | "green"; lines: string[] }) {
  const toneClass = tone === "green" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200";
  const prefix = tone === "green" ? "+" : "-";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="m-0 mb-2 font-mono text-xs font-bold">{title}</p>
      <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-5">{lines.map((line) => `${prefix} ${line}`).join("\n")}</pre>
    </div>
  );
}

function OutputCard({ title, text, active }: { title: string; text: string; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${active ? "border-sky-400/40 bg-sky-500/10" : "border-white/10 bg-black/30"}`}>
      <p className="m-0 font-semibold text-xs text-zinc-300">{title}</p>
      <p className="m-0 mt-2 text-sm leading-6 text-zinc-200">{text}</p>
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
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-zinc-600"
                value={test.name}
                onChange={(event) => updateTest(test.id, "name", event.target.value)}
              />
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${result?.status === "PASS" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-rose-500/20 text-rose-300 border border-rose-400/30"}`}>
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
            <p className="m-0 mt-3 text-xs text-zinc-400">{result?.reason}</p>
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
          <h2 className="text-sm font-bold text-white">One Click Optimize</h2>
          <span className="rounded-full bg-sky-500/20 border border-sky-400/30 px-3 py-1 text-xs font-semibold text-sky-300">+{analysis.improvementScore} score</span>
        </div>
        <div className="mt-4 space-y-3">
          <PromptBlock title="Before" text={prompt} />
          <div className="flex justify-center text-zinc-500">
            <ArrowDown size={18} />
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
    <div className={`rounded-xl border p-3.5 ${active ? "border-sky-400/40 bg-sky-500/10" : "border-white/10 bg-black/30"}`}>
      <p className="m-0 mb-2 font-mono text-xs font-semibold text-zinc-400">{title}</p>
      <pre className="m-0 max-h-44 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-200">{text}</pre>
    </div>
  );
}

function Timeline({ analysis, activeStage, runId, loading }: { analysis: PromptAnalysis; activeStage: number; runId: number; loading: boolean }) {
  return (
    <section className="panel overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <Activity size={14} className="text-sky-400" />
            <span>Run #{String(runId).padStart(3, "0")}</span>
          </div>
          <h2 className="m-0 mt-1 text-sm font-bold text-white">Prompt Timeline</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${loading ? "bg-amber-500/20 text-amber-200 border border-amber-400/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"}`}>
          {loading ? "Analyzing..." : "Completed"}
        </span>
      </div>
      <div className="relative grid grid-cols-2 gap-3 md:grid-cols-7">
        <div className="absolute left-4 right-4 top-[26px] hidden h-px bg-white/10 md:block" />
        <motion.div
          className="absolute left-4 top-[25px] hidden h-0.5 bg-sky-400 md:block"
          animate={{ width: `${(activeStage / Math.max(1, analysis.timeline.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 24 }}
        />
        {analysis.timeline.map((stage, index) => {
          const done = index <= activeStage;
          const current = index === activeStage;
          return (
            <motion.div
              key={stage.id}
              className={`relative rounded-xl border p-3.5 transition-all ${done ? "border-sky-400/40 bg-sky-500/10" : "border-white/10 bg-white/5"}`}
              animate={{ y: current ? -4 : 0, opacity: done ? 1 : 0.6 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
            >
              <div className={`mb-3 grid size-7 place-items-center rounded-full border ${done ? "border-sky-400/50 bg-sky-500/20 text-sky-300" : "border-white/10 bg-black/50 text-zinc-500"}`}>
                {done ? <CheckCircle2 size={15} /> : <Circle size={12} />}
              </div>
              <p className="m-0 text-xs font-bold leading-4 text-white">{stage.title}</p>
              <p className="m-0 mt-1 line-clamp-2 text-xs leading-4 text-zinc-400">{stage.detail}</p>
              <span className="mt-2.5 inline-block rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{stage.duration}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
