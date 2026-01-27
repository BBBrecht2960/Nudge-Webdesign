-- Update admin wachtwoorden naar Nudge2026!!
-- Run dit script in Supabase SQL Editor

UPDATE admin_users 
SET password_hash = '$2b$10$ul2Q533CWTo7dDA7h76JW.F4UEaZ8ypEruiSbtHLYVSDOwGiN9abq' 
WHERE email = 'brecht.leap@gmail.com';

UPDATE admin_users 
SET password_hash = '$2b$10$ul2Q533CWTo7dDA7h76JW.F4UEaZ8ypEruiSbtHLYVSDOwGiN9abq' 
WHERE email = 'yinthe.gaens@gmail.com';

-- Verifieer dat de updates zijn doorgevoerd
SELECT email, created_at FROM admin_users WHERE email IN ('brecht.leap@gmail.com', 'yinthe.gaens@gmail.com');
