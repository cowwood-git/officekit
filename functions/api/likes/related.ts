import { iconFor } from '../../../src/data/app-icons';
import { tools } from '../../../src/data/tools';
import { type Env, isValidSlug, jsonResponse } from '../../_lib/likes';

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const slug = params.get('slug') ?? '';
  if (!isValidSlug(slug)) {
    return jsonResponse({ error: 'unknown-tool' }, 404);
  }
  const raw = Number(params.get('limit') ?? '6');
  const limit = Number.isFinite(raw) ? Math.min(12, Math.max(1, Math.trunc(raw))) : 6;

  const rows = await env.LIKES_DB.prepare(
    `SELECT b.slug AS slug, COUNT(*) AS overlap, COALESCE(l.count, 0) AS count
     FROM like_visitors a
     JOIN like_visitors b ON b.visitor_hash = a.visitor_hash
     LEFT JOIN tool_likes l ON l.slug = b.slug
     WHERE a.slug = ? AND b.slug <> ?
     GROUP BY b.slug
     HAVING COUNT(*) >= 2
     ORDER BY overlap DESC, count DESC, b.slug
     LIMIT ?`,
  )
    .bind(slug, slug, limit)
    .all<{ slug: string; overlap: number; count: number }>();

  const items = (rows.results ?? [])
    .map((row) => {
      const tool = bySlug.get(row.slug);
      if (!tool) return null;
      return {
        slug: row.slug,
        count: row.count,
        overlap: row.overlap,
        title: tool.title.ko,
        summary: tool.summary.ko,
        path: `/tools/${row.slug}/`,
        iconName: iconFor(row.slug),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return jsonResponse({ items }, 200, {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  });
}
