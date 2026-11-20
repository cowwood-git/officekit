import { iconFor } from '../../../src/data/app-icons';
import { type Env, jsonResponse, TOOL_INDEX } from '../../_lib/likes';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const raw = Number(new URL(request.url).searchParams.get('limit') ?? '12');
  const limit = Number.isFinite(raw) ? Math.min(50, Math.max(1, Math.trunc(raw))) : 12;
  const rows = await env.LIKES_DB.prepare(
    `SELECT slug, count FROM tool_likes
     WHERE count > 0
     ORDER BY count DESC, slug
     LIMIT ?`,
  )
    .bind(limit)
    .all<{ slug: string; count: number }>();

  const items = (rows.results ?? [])
    .map((row) => {
      const tool = TOOL_INDEX[row.slug];
      if (!tool) return null;
      return {
        slug: row.slug,
        count: row.count,
        title: tool.title,
        summary: tool.summary,
        path: `/tools/${row.slug}/`,
        iconName: iconFor(row.slug),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return jsonResponse({ items }, 200, {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  });
}
