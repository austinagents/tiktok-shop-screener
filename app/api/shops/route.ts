export const dynamic = "force-dynamic";

const SHOPS_API_BASE_URL =
  process.env.SHOPS_API_BASE_URL ??
  "https://tiktok-shop-screener-api.austindtaylor7.workers.dev";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category =
    searchParams.get("category") ?? "Sports & Outdoors";

  try {
    const response = await fetch(
      `${SHOPS_API_BASE_URL}/shops?category=${encodeURIComponent(category)}`,
      {
        cache: "no-store",
      }
    );

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ??
          "application/json",
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to reach shops API" },
      { status: 500 }
    );
  }
}
