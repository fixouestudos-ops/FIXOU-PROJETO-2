PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  avatar_key TEXT,
  avatar_type TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin','owner')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER,
  last_activity_at INTEGER
);
CREATE TABLE IF NOT EXISTS auth_sessions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS password_reset_tokens (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,used_at INTEGER,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS user_progress (user_id TEXT PRIMARY KEY,state_json TEXT NOT NULL,client_saved_at INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY,user_id TEXT,event_type TEXT NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS question_reports (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,question_id TEXT NOT NULL,subject_id TEXT,topic_id TEXT,reason TEXT NOT NULL,comment TEXT,status TEXT NOT NULL DEFAULT 'new',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS suggestions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,category TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS admin_audit_logs (id TEXT PRIMARY KEY,actor_user_id TEXT NOT NULL,action TEXT NOT NULL,target_type TEXT NOT NULL,target_id TEXT,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expiry ON auth_sessions(user_id,expires_at);
CREATE INDEX IF NOT EXISTS idx_events_created_type ON analytics_events(created_at,event_type);
CREATE INDEX IF NOT EXISTS idx_events_user_created ON analytics_events(user_id,created_at);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON question_reports(status,created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_status_created ON suggestions(status,created_at);
CREATE INDEX IF NOT EXISTS idx_users_activity ON users(last_activity_at);

