import { type Env, isValidSlug, jsonResponse } from '../../_lib/likes';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const raw = new URL(request.url).searchParams.get('slugs') ?? '';
  const slugs = [
    ...new Set(
      raw
        .split(',')
        .map((slug) => slug.trim())
        .filter((slug) => isValidSlug(slug)),
    ),
  ].slice(0, 50);

  if (slugs.length === 0) {
    return jsonResponse({ counts: {} }, 200, { 'Cache-Control': 'no-store' });
  }

  const placeholders = slugs.map(() => '?').join(', ');
  const rows = await env.LIKES_DB.prepare(
    `SELECT slug, count FROM tool_likes WHERE slug IN (${placeholders})`,
  )
    .bind(...slugs)
    .all<{ slug: string; count: number }>();

  const counts: Record<string, number> = {};
  for (const slug of slugs) counts[slug] = 0;
  for (const row of rows.results ?? []) counts[row.slug] = row.count;

  return jsonResponse({ counts }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: { Allow: 'GET, OPTIONS' } });
}
