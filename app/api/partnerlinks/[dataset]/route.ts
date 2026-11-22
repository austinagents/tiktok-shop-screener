// This server-side endpoint reads the existing public PartnerLinks commerce APIs.
// No PartnerLinks application files, databases, or services are modified.
export const dynamic = "force-dynamic";

const upstreams: Record<string, string> = {
  shops: "https://partnerlinks.ai/api/shops",
  creators: "https://partnerlinks.ai/api/creators",
};
const allowedParams = new Set([
  "page", "pageSize", "window", "metric", "category_id", "category",
  "population", "classification_id", "classification_ids", "heatmap_category",
]);

export async function GET(request: Request, context: { params: { dataset: string } }) {
  const endpoint = upstreams[context.params.dataset];
  if (!endpoint) return Response.json({ error: "Unknown data source" }, { status: 404 });
  const incoming = new URL(request.url);
  const target = new URL(endpoint);
  for (const [key, value] of incoming.searchParams) {
    if (allowedParams.has(key)) target.searchParams.append(key, value);
  }
  try {
    const response = await fetch(target, {
      method: "GET", cache: "no-store", redirect: "manual",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.includes("application/json")) {
      return Response.json({ error: "PartnerLinks data source unavailable" }, { status: 502 });
    }
    return new Response(await response.text(), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "Unable to reach PartnerLinks" }, { status: 502 });
  }
}
