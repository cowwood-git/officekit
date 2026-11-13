-- 함께 좋아한 도구 조회를 위한 방문자 해시 인덱스.
CREATE INDEX IF NOT EXISTS idx_like_visitors_hash
  ON like_visitors (visitor_hash);
