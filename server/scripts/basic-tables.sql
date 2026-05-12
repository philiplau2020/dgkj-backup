USE dgkj;

-- System User Table
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(64) NOT NULL,
  `email` VARCHAR(128),
  `mobile` VARCHAR(32),
  `avatar` VARCHAR(255),
  `dept_id` VARCHAR(64),
  `user_type` TINYINT DEFAULT 1,
  `status` TINYINT DEFAULT 1,
  `last_login_ip` VARCHAR(64),
  `last_login_time` DATETIME,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by` VARCHAR(64),
  `update_by` VARCHAR(64),
  `remark` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System Role Table
CREATE TABLE IF NOT EXISTS `sys_role` (
  `id` VARCHAR(64) PRIMARY KEY,
  `role_name` VARCHAR(64) NOT NULL,
  `role_code` VARCHAR(64) NOT NULL UNIQUE,
  `role_desc` VARCHAR(255),
  `status` TINYINT DEFAULT 1,
  `sort` INT DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System Menu Table
CREATE TABLE IF NOT EXISTS `sys_menu` (
  `id` VARCHAR(64) PRIMARY KEY,
  `parent_id` VARCHAR(64) DEFAULT '0',
  `menu_name` VARCHAR(64) NOT NULL,
  `menu_code` VARCHAR(64),
  `icon` VARCHAR(64),
  `path` VARCHAR(255),
  `component` VARCHAR(255),
  `redirect` VARCHAR(255),
  `menu_type` TINYINT DEFAULT 1,
  `visible` TINYINT DEFAULT 1,
  `status` TINYINT DEFAULT 1,
  `perms` VARCHAR(255),
  `sort` INT DEFAULT 0,
  `keep_alive` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Channel Info Table
CREATE TABLE IF NOT EXISTS `channel_info` (
  `id` VARCHAR(64) PRIMARY KEY,
  `channel_code` VARCHAR(32) NOT NULL UNIQUE,
  `channel_name` VARCHAR(128) NOT NULL,
  `channel_short_name` VARCHAR(64),
  `channel_type` VARCHAR(32) NOT NULL,
  `provider` VARCHAR(64),
  `app_id` VARCHAR(128),
  `app_secret` VARCHAR(255),
  `mch_id` VARCHAR(64),
  `api_key` VARCHAR(255),
  `public_key` TEXT,
  `private_key` TEXT,
  `pay_url` VARCHAR(255),
  `notify_url` VARCHAR(255),
  `query_url` VARCHAR(255),
  `settle_url` VARCHAR(255),
  `logo` VARCHAR(255),
  `config` JSON,
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
