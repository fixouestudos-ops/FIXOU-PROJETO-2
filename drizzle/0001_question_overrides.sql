CREATE TABLE IF NOT EXISTS question_overrides (
  question_id TEXT NOT NULL,
  field TEXT NOT NULL CHECK (field IN ('prompt','answer','options','explanation')),
  value TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (question_id, field),
  FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_overrides_question ON question_overrides(question_id);
