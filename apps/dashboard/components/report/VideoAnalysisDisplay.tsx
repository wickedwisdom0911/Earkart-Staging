"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface VideoAnalysisDisplayProps {
  content: string;
}

// ── Markdown renderer (used for individual section content) ──────────────────
const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold text-blue-800 mt-3 mb-1 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-semibold text-blue-700 mt-2 mb-1">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-gray-800 mt-2 mb-1">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-gray-700 my-1 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside my-1.5 space-y-0.5 text-sm text-gray-700">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside my-1.5 space-y-0.5 text-sm text-gray-700">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="ml-2">{children}</li>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-gray-200">
      <table className="min-w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-blue-50">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-gray-100">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="hover:bg-gray-50">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold text-gray-800 border-b border-gray-200 whitespace-nowrap">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => {
    const text = String(children ?? "");
    const isCompleted = text.includes("✓") || text.toLowerCase().includes("completed");
    const isMissed = text.includes("✗") || text.toLowerCase().includes("missed");
    const isNA = text.toLowerCase() === "n/a";
    return (
      <td
        className={[
          "px-3 py-2 text-sm border-b border-gray-100",
          isCompleted ? "text-green-700 font-medium" : "",
          isMissed ? "text-red-600" : "",
          isNA ? "text-gray-400 italic" : "",
          !isCompleted && !isMissed && !isNA ? "text-gray-700" : "",
        ].join(" ")}
      >
        {children}
      </td>
    );
  },
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-gray-800">{children}</strong>
  ),
};

// ── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "bg-green-500" : value >= 50 ? "bg-yellow-400" : "bg-red-500";
  const textColor =
    value >= 80 ? "text-green-700" : value >= 50 ? "text-yellow-700" : "text-red-600";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-bold ${textColor}`}>{value.toFixed(2)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Parse scores from the Adherence Scores string ────────────────────────────
function parseScores(text: string) {
  const extract = (label: string) => {
    const re = new RegExp(`${label}[:\\s]+(\\d+(?:\\.\\d+)?)%`);
    const m = text.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  return {
    sequence: extract("Sequence Adherence Score"),
    mandatory: extract("Mandatory Steps Coverage Score"),
    overall: extract("Overall Checklist Score"),
    osas: extract("Overall Script Adherence Score \\(OSAS\\)"),
  };
}

// ── Structured JSON renderer ─────────────────────────────────────────────────
function StructuredAnalysis({ data }: { data: Record<string, string> }) {
  const scores = data["Adherence Scores"] ? parseScores(data["Adherence Scores"]) : null;
  const osas = scores?.osas ?? null;
  const osasColor =
    osas === null ? "text-gray-500" : osas >= 80 ? "text-green-600" : osas >= 50 ? "text-yellow-600" : "text-red-600";
  const osasLabel =
    osas === null ? "" : osas >= 80 ? "Good" : osas >= 50 ? "Needs Improvement" : "Poor";

  return (
    <div className="space-y-4">

      {/* OSAS summary card */}
      {osas !== null && (
        <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full border-4 border-blue-300 flex items-center justify-center bg-white">
            <span className={`text-lg font-extrabold ${osasColor}`}>{osas.toFixed(0)}%</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Overall Script Adherence Score</p>
            <p className={`text-xl font-bold ${osasColor}`}>{osas.toFixed(2)}%</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${osas >= 80 ? "bg-green-100 text-green-700" : osas >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
              {osasLabel}
            </span>
          </div>
        </div>
      )}

      {/* Score bars */}
      {scores && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-800">Adherence Scores</h3>
          </div>
          {scores.sequence !== null && <ScoreBar label="Sequence Adherence" value={scores.sequence} />}
          {scores.mandatory !== null && <ScoreBar label="Mandatory Steps Coverage" value={scores.mandatory} />}
          {scores.overall !== null && <ScoreBar label="Overall Checklist Score" value={scores.overall} />}
          {scores.osas !== null && <ScoreBar label="Overall Script Adherence (OSAS)" value={scores.osas} />}
        </div>
      )}

      {/* Checklist table */}
      {data["Checklist Completion Map"] && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Checklist Completion Map
          </h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {data["Checklist Completion Map"]}
          </ReactMarkdown>
        </div>
      )}

      {/* Detailed findings */}
      {data["Detailed Findings"] && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-orange-500" />
            Detailed Findings
          </h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {data["Detailed Findings"]}
          </ReactMarkdown>
        </div>
      )}

      {/* Conditional steps */}
      {data["Conditional Steps Assessment"] && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <MinusCircle className="w-4 h-4 text-gray-400" />
            Conditional Steps Assessment
          </h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {data["Conditional Steps Assessment"]}
          </ReactMarkdown>
        </div>
      )}

      {/* Final conclusion */}
      {data["Final Conclusion"] && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Final Conclusion
          </h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {data["Final Conclusion"]}
          </ReactMarkdown>
        </div>
      )}

      {/* Recording file path */}
      {data["filepath"] && (
        <p className="text-xs text-gray-400 break-all">
          <span className="font-medium">Recording:</span> {data["filepath"]}
        </p>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export function VideoAnalysisDisplay({ content }: VideoAnalysisDisplayProps) {
  // Try to parse as JSON first
  let parsed: Record<string, string> | null = null;
  try {
    const candidate = JSON.parse(content);
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      parsed = candidate as Record<string, string>;
    }
  } catch {
    // not JSON — fall through to markdown renderer
  }

  if (parsed) {
    return (
      <div className="video-analysis-content text-sm bg-gray-50 rounded-lg p-4 max-h-[700px] overflow-y-auto space-y-1">
        <StructuredAnalysis data={parsed} />
      </div>
    );
  }

  // Fallback: render as markdown
  return (
    <div className="video-analysis-content text-sm bg-white border border-gray-200 rounded-lg p-5 max-h-[600px] overflow-y-auto shadow-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
