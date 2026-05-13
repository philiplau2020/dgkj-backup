SELECT id, username, LEFT(password, 30) as pwd_prefix FROM sys_user WHERE username='admin';
