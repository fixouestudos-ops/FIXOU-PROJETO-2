-- =============================================
-- FIXOU LOAD TEST CLEANUP SQL
-- Execute via: npx wrangler d1 execute fixou-db --remote --file=<path>
-- =============================================

-- 1. Analytics events (loadtest: prefix)
DELETE FROM analytics_events WHERE session_id LIKE 'loadtest:%';

-- 2. User progress (loadtest accounts)
DELETE FROM user_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest_v2_%@loadtest.local');

-- 3. Auth sessions (loadtest accounts)
DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest_v2_%@loadtest.local');

-- 4. Login failures (loadtest accounts)
DELETE FROM login_failures WHERE email LIKE 'loadtest_v2_%@loadtest.local';

-- 5. Test accounts themselves
DELETE FROM users WHERE email LIKE 'loadtest_v2_%@loadtest.local';

-- Verify counts after cleanup
-- SELECT COUNT(*) as remaining_loadtest_users FROM users WHERE email LIKE 'loadtest_v2_%@loadtest.local';
-- SELECT COUNT(*) as remaining_loadtest_events FROM analytics_events WHERE session_id LIKE 'loadtest:%';
-- SELECT COUNT(*) as remaining_loadtest_progress FROM user_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest_v2_%@loadtest.local');
