-- 도구 좋아요: 도구별 합계와 방문자별 1회 기록, IP 일일 제한.
CREATE TABLE IF NOT EXISTS tool_likes (
  slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS like_visitors (
  slug TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (slug, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_like_visitors_created
  ON like_visitors (created_at);

CREATE TABLE IF NOT EXISTS like_rate (
  ip_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);
