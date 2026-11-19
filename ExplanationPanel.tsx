import { useState } from 'react';
import type { CheckResult } from '../types';
import { explainWithFallback, type ExplanationResult } from '../explanation/explanation';
import { reasonCodeFromResult } from '../explanation/reasonCode';

type Props = { roomLabel: string; startTime: string; endTime: string; result: CheckResult };
/** Shows optional, explicitly mock explanation below the authoritative status. */
export default function ExplanationPanel({ roomLabel, startTime, endTime, result }: Props) {
  const [response, setResponse] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  async function handleExplain() {
    setLoading(true);
    const explanation = await explainWithFallback({
      roomLabel, startTime, endTime,
      isAvailable: result.status === 'available',
      reasonCode: reasonCodeFromResult(result)
    });
    setResponse(explanation);
    setLoading(false);
  }
  return <section aria-label="Optional availability explanation" className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold text-slate-800">Explain availability</h2>
        <p className="text-xs text-slate-600">Optional mock AI-style explanation. The booking status above is the confirmed result.</p>
      </div>
      <button type="button" disabled={loading} onClick={handleExplain}
        className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-sky-800">
        {loading ? 'Explaining…' : 'Explain availability'}
      </button>
    </div>
    {response && <div role="status" aria-live="polite" className="mt-4 rounded-lg bg-white border border-sky-100 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{response.kind === 'mock' ? 'Mock explanation · not an AI API' : response.kind === 'fallback' ? 'Safe fallback' : 'Invalid explanation input'}</p>
      <p className="mt-2 text-sm text-slate-700">{response.explanation}</p>
    </div>}
  </section>;
}
