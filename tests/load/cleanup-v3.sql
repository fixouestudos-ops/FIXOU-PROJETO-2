-- =============================================
-- FIXOU LOAD TEST v3 CLEANUP
-- Remove ALL loadtest_v3_* data from D1
-- Execute: npx wrangler d1 execute fixou-db --remote --file=tests/load/cleanup-v3.sql
-- =============================================

-- 1. Analytics events (loadtest: prefix from any test)
DELETE FROM analytics_events WHERE session_id LIKE 'loadtest:%';

-- 2. User progress (loadtest accounts)
DELETE FROM user_progress WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'loadtest_v3_%@loadtest.local'
);

-- 3. Auth sessions (loadtest accounts)
DELETE FROM auth_sessions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'loadtest_v3_%@loadtest.local'
);

-- 4. Login failures (loadtest accounts)
DELETE FROM login_failures WHERE email LIKE 'loadtest_v3_%@loadtest.local';

-- 5. Test accounts themselves
DELETE FROM users WHERE email LIKE 'loadtest_v3_%@loadtest.local';

-- =============================================
-- VERIFY: These should all return 0
-- =============================================
-- SELECT COUNT(*) as users FROM users WHERE email LIKE 'loadtest_v3_%@loadtest.local';
-- SELECT COUNT(*) as progress FROM user_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest_v3_%@loadtest.local');
-- SELECT COUNT(*) as sessions FROM auth_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest_v3_%@loadtest.local');
-- SELECT COUNT(*) as failures FROM login_failures WHERE email LIKE 'loadtest_v3_%@loadtest.local';
-- SELECT COUNT(*) as events FROM analytics_events WHERE session_id LIKE 'loadtest:%';
