import {
  canWriteLike,
  type Env,
  isSameOrigin,
  isValidSlug,
  isValidVisitorId,
  jsonResponse,
  visitorHash,
} from '../../_lib/likes';

interface Context {
  request: Request;
  env: Env;
  params: { slug: string };
}

interface Body {
  visitorId?: unknown;
  action?: unknown;
}

export async function onRequestPost({ request, env, params }: Context): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonResponse({ error: 'origin' }, 403);
  }
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    return jsonResponse({ error: 'content-type' }, 415);
  }

  const slug = params.slug ?? '';
  if (!isValidSlug(slug)) {
    return jsonResponse({ error: 'unknown-tool' }, 404);
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonResponse({ error: 'invalid-json' }, 400);
  }
  if (!isValidVisitorId(body.visitorId)) {
    return jsonResponse({ error: 'visitor' }, 400);
  }
  const action = body.action === 'unlike' ? 'unlike' : body.action === 'like' ? 'like' : null;
  if (!action) {
    return jsonResponse({ error: 'action' }, 400);
  }

  if (!(await canWriteLike(request, env))) {
    return jsonResponse({ error: 'rate-limit' }, 429, { 'Retry-After': '3600' });
  }

  const hash = await visitorHash(body.visitorId, env);
  const now = new Date().toISOString();

  if (action === 'like') {
    const inserted = await env.LIKES_DB.prepare(
      `INSERT OR IGNORE INTO like_visitors (slug, visitor_hash, created_at)
       VALUES (?, ?, ?)`,
    )
      .bind(slug, hash, now)
      .run();
    if ((inserted.meta.changes ?? 0) > 0) {
      await env.LIKES_DB.prepare(
        `INSERT INTO tool_likes (slug, count, updated_at) VALUES (?, 1, ?)
         ON CONFLICT(slug) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`,
      )
        .bind(slug, now)
        .run();
    }
  } else {
    const removed = await env.LIKES_DB.prepare(
      `DELETE FROM like_visitors WHERE slug = ? AND visitor_hash = ?`,
    )
      .bind(slug, hash)
      .run();
    if ((removed.meta.changes ?? 0) > 0) {
      await env.LIKES_DB.prepare(
        `UPDATE tool_likes
         SET count = CASE WHEN count > 0 THEN count - 1 ELSE 0 END, updated_at = ?
         WHERE slug = ?`,
      )
        .bind(now, slug)
        .run();
    }
  }

  const row = await env.LIKES_DB.prepare(`SELECT count FROM tool_likes WHERE slug = ?`)
    .bind(slug)
    .first<{ count: number }>();

  return jsonResponse({ slug, count: row?.count ?? 0, liked: action === 'like' }, 200, {
    'Cache-Control': 'no-store',
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
}
