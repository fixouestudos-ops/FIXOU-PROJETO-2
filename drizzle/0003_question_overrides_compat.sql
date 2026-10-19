-- Rebuild idempotente de question_overrides para o formato real de produção.
-- O banco de produção foi criado pelo CREATE TABLE do server (sem CHECK de field
-- e sem FOREIGN KEY) antes da migração 0001 ser registrada, então 0001 nunca
-- rodou de fato em produção. Bancos novos (dev/local) passam por 0001 com
-- CHECK+FK; este rebuild remove essas restrições para igualar o schema de
-- produção e libera a escrita de campos como contentStatus/needsReview/imageStatus.
CREATE TABLE question_overrides_new (
  question_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (question_id, field)
);
INSERT INTO question_overrides_new (question_id, field, value, actor_user_id, created_at, updated_at)
  SELECT question_id, field, value, actor_user_id, created_at, updated_at FROM question_overrides;
DROP TABLE question_overrides;
ALTER TABLE question_overrides_new RENAME TO question_overrides;
CREATE INDEX IF NOT EXISTS idx_overrides_question ON question_overrides(question_id);
