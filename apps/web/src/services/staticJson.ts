/**
 * Orbisol web - fetch a precomputed pipeline file from /data. A file that is not deployed is "not available"
 * (null), not an error: Vercel answers 404, and the Vite dev server answers with index.html (HTML, not JSON).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
export async function fetchStaticJson(path: string, signal?: AbortSignal): Promise<unknown | null> {
  const res = await fetch(path, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  if (!(res.headers.get('content-type') ?? '').includes('json')) return null;
  return res.json();
}
