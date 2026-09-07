// Canonical D1 schema map. The executable migration lives in drizzle/0000_accounts_analytics.sql.
export const tables = {
  users: ['id','name','email','password_hash','password_salt','avatar_key','avatar_type','role','plan','created_at','updated_at','last_login_at','last_activity_at'],
  auth_sessions: ['id','user_id','token_hash','created_at','expires_at'],
  password_reset_tokens: ['id','user_id','token_hash','created_at','expires_at','used_at'],
  user_progress: ['user_id','state_json','client_saved_at','updated_at'],
  analytics_events: ['id','user_id','event_type','metadata_json','created_at'],
  question_reports: ['id','user_id','question_id','subject_id','topic_id','reason','comment','status','created_at','updated_at'],
  suggestions: ['id','user_id','category','message','status','created_at','updated_at'],
  admin_audit_logs: ['id','actor_user_id','action','target_type','target_id','metadata_json','created_at']
} as const;

