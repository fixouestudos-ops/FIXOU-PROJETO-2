CREATE TABLE IF NOT EXISTS login_failures (
  email TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  PRIMARY KEY (email)
);
