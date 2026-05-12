-- DGKJ Payment Platform Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS dgkj DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
  `remark` VARCHAR(255),
  INDEX `idx_username` (`username`),
  INDEX `idx_status` (`status`)
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

-- System Department Table
CREATE TABLE IF NOT EXISTS `sys_dept` (
  `id` VARCHAR(64) PRIMARY KEY,
  `parent_id` VARCHAR(64) DEFAULT '0',
  `dept_name` VARCHAR(64) NOT NULL,
  `dept_code` VARCHAR(64),
  `leader` VARCHAR(64),
  `phone` VARCHAR(32),
  `email` VARCHAR(128),
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

-- User Role Relation Table
CREATE TABLE IF NOT EXISTS `sys_user_role` (
  `user_id` VARCHAR(64) NOT NULL,
  `role_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Role Menu Relation Table
CREATE TABLE IF NOT EXISTS `sys_role_menu` (
  `role_id` VARCHAR(64) NOT NULL,
  `menu_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`role_id`, `menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dictionary Table
CREATE TABLE IF NOT EXISTS `sys_dict` (
  `id` VARCHAR(64) PRIMARY KEY,
  `dict_name` VARCHAR(64) NOT NULL,
  `dict_code` VARCHAR(64) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dictionary Data Table
CREATE TABLE IF NOT EXISTS `sys_dict_data` (
  `id` VARCHAR(64) PRIMARY KEY,
  `dict_id` VARCHAR(64) NOT NULL,
  `dict_label` VARCHAR(64) NOT NULL,
  `dict_value` VARCHAR(64) NOT NULL,
  `dict_type` VARCHAR(64),
  `sort` INT DEFAULT 0,
  `css_class` VARCHAR(64),
  `list_class` VARCHAR(64),
  `is_default` TINYINT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System Config Table
CREATE TABLE IF NOT EXISTS `sys_config` (
  `id` VARCHAR(64) PRIMARY KEY,
  `config_name` VARCHAR(64) NOT NULL,
  `config_key` VARCHAR(64) NOT NULL UNIQUE,
  `config_value` TEXT,
  `config_type` VARCHAR(32),
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System Log Table
CREATE TABLE IF NOT EXISTS `sys_log` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64),
  `username` VARCHAR(64),
  `operation` VARCHAR(64) NOT NULL,
  `method` VARCHAR(64),
  `url` VARCHAR(255),
  `ip` VARCHAR(64),
  `location` VARCHAR(128),
  `params` TEXT,
  `result` TEXT,
  `status` TINYINT DEFAULT 1,
  `error_msg` TEXT,
  `duration` INT,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System Notice Table
CREATE TABLE IF NOT EXISTS `sys_notice` (
  `id` VARCHAR(64) PRIMARY KEY,
  `notice_title` VARCHAR(128) NOT NULL,
  `notice_type` TINYINT NOT NULL,
  `notice_content` TEXT,
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Merchant Info Table
CREATE TABLE IF NOT EXISTS `mch_info` (
  `id` VARCHAR(64) PRIMARY KEY,
  `mch_no` VARCHAR(32) NOT NULL UNIQUE,
  `mch_name` VARCHAR(128) NOT NULL,
  `mch_short_name` VARCHAR(64),
  `mch_type` TINYINT DEFAULT 1,
  `agent_id` VARCHAR(64),
  `contact_name` VARCHAR(64) NOT NULL,
  `contact_phone` VARCHAR(32) NOT NULL,
  `contact_email` VARCHAR(128),
  `province` VARCHAR(32),
  `city` VARCHAR(32),
  `district` VARCHAR(32),
  `address` VARCHAR(255),
  `business_license` VARCHAR(255),
  `id_card_front` VARCHAR(255),
  `id_card_back` VARCHAR(255),
  `bank_name` VARCHAR(64),
  `bank_account` VARCHAR(32),
  `bank_username` VARCHAR(64),
  `status` TINYINT DEFAULT 2,
  `review_remark` VARCHAR(255),
  `review_time` DATETIME,
  `review_user_id` VARCHAR(64),
  `balance` DECIMAL(18,2) DEFAULT 0,
  `frozen_balance` DECIMAL(18,2) DEFAULT 0,
  `settle_balance` DECIMAL(18,2) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mch_no` (`mch_no`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Merchant App Table
CREATE TABLE IF NOT EXISTS `mch_app` (
  `id` VARCHAR(64) PRIMARY KEY,
  `app_id` VARCHAR(32) NOT NULL UNIQUE,
  `mch_no` VARCHAR(32) NOT NULL,
  `app_name` VARCHAR(64) NOT NULL,
  `app_secret` VARCHAR(64) NOT NULL,
  `notify_url` VARCHAR(255),
  `return_url` VARCHAR(255),
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Merchant Store Table
CREATE TABLE IF NOT EXISTS `mch_store` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_id` VARCHAR(32) NOT NULL UNIQUE,
  `mch_no` VARCHAR(32) NOT NULL,
  `store_name` VARCHAR(64) NOT NULL,
  `store_no` VARCHAR(32),
  `contact_name` VARCHAR(64),
  `contact_phone` VARCHAR(32),
  `province` VARCHAR(32),
  `city` VARCHAR(32),
  `district` VARCHAR(32),
  `address` VARCHAR(255),
  `latitude` DECIMAL(10,6),
  `longitude` DECIMAL(10,6),
  `device_count` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Merchant Rate Table
CREATE TABLE IF NOT EXISTS `mch_rate` (
  `id` VARCHAR(64) PRIMARY KEY,
  `mch_no` VARCHAR(32) NOT NULL,
  `pay_way` VARCHAR(32) NOT NULL,
  `rate_type` TINYINT DEFAULT 1,
  `rate` DECIMAL(6,4) NOT NULL,
  `min_fee` DECIMAL(18,2) DEFAULT 0,
  `max_fee` DECIMAL(18,2),
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Info Table
CREATE TABLE IF NOT EXISTS `agent_info` (
  `id` VARCHAR(64) PRIMARY KEY,
  `agent_no` VARCHAR(32) NOT NULL UNIQUE,
  `agent_name` VARCHAR(128) NOT NULL,
  `parent_id` VARCHAR(64),
  `level` INT DEFAULT 1,
  `contact_name` VARCHAR(64) NOT NULL,
  `contact_phone` VARCHAR(32) NOT NULL,
  `contact_email` VARCHAR(128),
  `province` VARCHAR(32),
  `city` VARCHAR(32),
  `district` VARCHAR(32),
  `address` VARCHAR(255),
  `id_card_front` VARCHAR(255),
  `id_card_back` VARCHAR(255),
  `bank_name` VARCHAR(64),
  `bank_account` VARCHAR(32),
  `bank_username` VARCHAR(64),
  `balance` DECIMAL(18,2) DEFAULT 0,
  `frozen_balance` DECIMAL(18,2) DEFAULT 0,
  `profit_balance` DECIMAL(18,2) DEFAULT 0,
  `status` TINYINT DEFAULT 2,
  `review_remark` VARCHAR(255),
  `review_time` DATETIME,
  `review_user_id` VARCHAR(64),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_agent_no` (`agent_no`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Profit Table
CREATE TABLE IF NOT EXISTS `agent_profit` (
  `id` VARCHAR(64) PRIMARY KEY,
  `agent_no` VARCHAR(32) NOT NULL,
  `order_no` VARCHAR(64),
  `mch_no` VARCHAR(32),
  `trade_type` VARCHAR(32) NOT NULL,
  `trade_amount` DECIMAL(18,2) NOT NULL,
  `profit_amount` DECIMAL(18,2) NOT NULL,
  `profit_rate` DECIMAL(6,4) NOT NULL,
  `profit_type` TINYINT DEFAULT 1,
  `status` TINYINT DEFAULT 1,
  `settle_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_agent_no` (`agent_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Withdraw Table
CREATE TABLE IF NOT EXISTS `agent_withdraw` (
  `id` VARCHAR(64) PRIMARY KEY,
  `withdraw_no` VARCHAR(32) NOT NULL UNIQUE,
  `agent_no` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `fee` DECIMAL(18,2) DEFAULT 0,
  `actual_amount` DECIMAL(18,2) NOT NULL,
  `bank_name` VARCHAR(64) NOT NULL,
  `bank_account` VARCHAR(32) NOT NULL,
  `bank_username` VARCHAR(64) NOT NULL,
  `status` TINYINT DEFAULT 0,
  `fail_reason` VARCHAR(255),
  `complete_time` DATETIME,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_agent_no` (`agent_no`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pay Order Table
CREATE TABLE IF NOT EXISTS `pay_order` (
  `id` VARCHAR(64) PRIMARY KEY,
  `order_no` VARCHAR(32) NOT NULL UNIQUE,
  `mch_no` VARCHAR(32) NOT NULL,
  `mch_name` VARCHAR(128),
  `app_id` VARCHAR(32) NOT NULL,
  `channel_code` VARCHAR(32),
  `pay_type` VARCHAR(32) NOT NULL,
  `trade_type` TINYINT DEFAULT 1,
  `amount` DECIMAL(18,2) NOT NULL,
  `coupon_amount` DECIMAL(18,2) DEFAULT 0,
  `actual_amount` DECIMAL(18,2) NOT NULL,
  `fee` DECIMAL(18,2) DEFAULT 0,
  `profit_amount` DECIMAL(18,2) DEFAULT 0,
  `subject` VARCHAR(128),
  `body` VARCHAR(255),
  `channel_order_no` VARCHAR(64),
  `pay_url` TEXT,
  `pay_time` DATETIME,
  `expire_time` DATETIME,
  `status` TINYINT DEFAULT 0,
  `notify_status` TINYINT DEFAULT 0,
  `notify_time` DATETIME,
  `notify_url` VARCHAR(255),
  `client_ip` VARCHAR(64),
  `attach` TEXT,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_mch_no` (`mch_no`),
  INDEX `idx_status` (`status`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Refund Order Table
CREATE TABLE IF NOT EXISTS `refund_order` (
  `id` VARCHAR(64) PRIMARY KEY,
  `refund_no` VARCHAR(32) NOT NULL UNIQUE,
  `order_no` VARCHAR(32) NOT NULL,
  `mch_no` VARCHAR(32) NOT NULL,
  `app_id` VARCHAR(32) NOT NULL,
  `channel_code` VARCHAR(32),
  `pay_type` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `refund_amount` DECIMAL(18,2) NOT NULL,
  `refund_reason` VARCHAR(255),
  `channel_refund_no` VARCHAR(64),
  `refund_time` DATETIME,
  `status` TINYINT DEFAULT 0,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transfer Order Table
CREATE TABLE IF NOT EXISTS `transfer_order` (
  `id` VARCHAR(64) PRIMARY KEY,
  `transfer_no` VARCHAR(32) NOT NULL UNIQUE,
  `mch_no` VARCHAR(32) NOT NULL,
  `app_id` VARCHAR(32) NOT NULL,
  `out_no` VARCHAR(64),
  `amount` DECIMAL(18,2) NOT NULL,
  `fee` DECIMAL(18,2) DEFAULT 0,
  `actual_amount` DECIMAL(18,2) NOT NULL,
  `pay_type` VARCHAR(32) NOT NULL,
  `account_type` TINYINT DEFAULT 1,
  `account_name` VARCHAR(64) NOT NULL,
  `account_no` VARCHAR(32) NOT NULL,
  `bank_name` VARCHAR(64),
  `bank_code` VARCHAR(32),
  `status` TINYINT DEFAULT 0,
  `channel_transfer_no` VARCHAR(64),
  `complete_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_transfer_no` (`transfer_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trade Notify Table
CREATE TABLE IF NOT EXISTS `trade_notify` (
  `id` VARCHAR(64) PRIMARY KEY,
  `notify_id` VARCHAR(64) NOT NULL,
  `order_no` VARCHAR(32) NOT NULL,
  `mch_no` VARCHAR(32) NOT NULL,
  `app_id` VARCHAR(32) NOT NULL,
  `notify_url` VARCHAR(255) NOT NULL,
  `notify_type` TINYINT NOT NULL,
  `status` TINYINT DEFAULT 0,
  `notify_count` INT DEFAULT 0,
  `last_notify_time` DATETIME,
  `next_notify_time` DATETIME,
  `response_result` TEXT,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Account Info Table
CREATE TABLE IF NOT EXISTS `account_info` (
  `id` VARCHAR(64) PRIMARY KEY,
  `account_no` VARCHAR(32) NOT NULL UNIQUE,
  `owner_no` VARCHAR(32) NOT NULL,
  `owner_name` VARCHAR(128) NOT NULL,
  `account_type` TINYINT NOT NULL,
  `balance` DECIMAL(18,2) DEFAULT 0,
  `frozen_balance` DECIMAL(18,2) DEFAULT 0,
  `available_balance` DECIMAL(18,2) DEFAULT 0,
  `total_income` DECIMAL(18,2) DEFAULT 0,
  `total_expense` DECIMAL(18,2) DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Account Record Table
CREATE TABLE IF NOT EXISTS `account_record` (
  `id` VARCHAR(64) PRIMARY KEY,
  `record_no` VARCHAR(32) NOT NULL UNIQUE,
  `account_no` VARCHAR(32) NOT NULL,
  `order_no` VARCHAR(32),
  `biz_no` VARCHAR(32),
  `biz_type` TINYINT NOT NULL,
  `biz_type_name` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `balance_before` DECIMAL(18,2) NOT NULL,
  `balance_after` DECIMAL(18,2) NOT NULL,
  `change_type` TINYINT NOT NULL,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_account_no` (`account_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Account Settlement Table
CREATE TABLE IF NOT EXISTS `account_settlement` (
  `id` VARCHAR(64) PRIMARY KEY,
  `settle_no` VARCHAR(32) NOT NULL UNIQUE,
  `account_no` VARCHAR(32) NOT NULL,
  `owner_no` VARCHAR(32) NOT NULL,
  `owner_name` VARCHAR(128) NOT NULL,
  `bank_name` VARCHAR(64) NOT NULL,
  `bank_account` VARCHAR(32) NOT NULL,
  `bank_username` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `fee` DECIMAL(18,2) DEFAULT 0,
  `actual_amount` DECIMAL(18,2) NOT NULL,
  `settle_type` TINYINT NOT NULL,
  `settle_cycle` VARCHAR(32),
  `status` TINYINT DEFAULT 0,
  `fail_reason` VARCHAR(255),
  `settle_time` DATETIME,
  `complete_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_account_no` (`account_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Account Withdraw Table
CREATE TABLE IF NOT EXISTS `account_withdraw` (
  `id` VARCHAR(64) PRIMARY KEY,
  `withdraw_no` VARCHAR(32) NOT NULL UNIQUE,
  `account_no` VARCHAR(32) NOT NULL,
  `owner_no` VARCHAR(32) NOT NULL,
  `owner_name` VARCHAR(128) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `fee` DECIMAL(18,2) DEFAULT 0,
  `actual_amount` DECIMAL(18,2) NOT NULL,
  `bank_name` VARCHAR(64) NOT NULL,
  `bank_account` VARCHAR(32) NOT NULL,
  `bank_username` VARCHAR(64) NOT NULL,
  `status` TINYINT DEFAULT 0,
  `fail_reason` VARCHAR(255),
  `complete_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Account Statement Table
CREATE TABLE IF NOT EXISTS `account_statement` (
  `id` VARCHAR(64) PRIMARY KEY,
  `statement_no` VARCHAR(32) NOT NULL UNIQUE,
  `account_no` VARCHAR(32) NOT NULL,
  `statement_date` DATE NOT NULL,
  `begin_balance` DECIMAL(18,2) NOT NULL,
  `total_income` DECIMAL(18,2) DEFAULT 0,
  `total_expense` DECIMAL(18,2) DEFAULT 0,
  `end_balance` DECIMAL(18,2) NOT NULL,
  `order_count` INT DEFAULT 0,
  `success_count` INT DEFAULT 0,
  `refund_count` INT DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- Channel Merchant Table
CREATE TABLE IF NOT EXISTS `channel_mch` (
  `id` VARCHAR(64) PRIMARY KEY,
  `channel_code` VARCHAR(32) NOT NULL,
  `channel_mch_id` VARCHAR(64) NOT NULL,
  `mch_no` VARCHAR(32) NOT NULL,
  `mch_name` VARCHAR(128) NOT NULL,
  `app_id` VARCHAR(128),
  `app_secret` VARCHAR(255),
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Channel Route Table
CREATE TABLE IF NOT EXISTS `channel_route` (
  `id` VARCHAR(64) PRIMARY KEY,
  `route_name` VARCHAR(64) NOT NULL,
  `route_code` VARCHAR(32) NOT NULL UNIQUE,
  `pay_type` VARCHAR(32) NOT NULL,
  `priority` INT DEFAULT 1,
  `channel_codes` TEXT NOT NULL,
  `route_type` TINYINT DEFAULT 1,
  `route_rule` JSON,
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pool Strategy Table
CREATE TABLE IF NOT EXISTS `pool_strategy` (
  `id` VARCHAR(64) PRIMARY KEY,
  `strategy_name` VARCHAR(64) NOT NULL,
  `strategy_code` VARCHAR(32) NOT NULL UNIQUE,
  `strategy_type` TINYINT NOT NULL,
  `channel_code` VARCHAR(32),
  `weight` INT DEFAULT 100,
  `max_amount` DECIMAL(18,2),
  `min_amount` DECIMAL(18,2),
  `time_range` JSON,
  `week_days` JSON,
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pool Channel Table
CREATE TABLE IF NOT EXISTS `pool_channel` (
  `id` VARCHAR(64) PRIMARY KEY,
  `pool_id` VARCHAR(64) NOT NULL,
  `channel_code` VARCHAR(32) NOT NULL,
  `weight` INT DEFAULT 100,
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pool Config Table
CREATE TABLE IF NOT EXISTS `pool_config` (
  `id` VARCHAR(64) PRIMARY KEY,
  `pool_name` VARCHAR(64) NOT NULL,
  `pool_code` VARCHAR(32) NOT NULL UNIQUE,
  `pool_type` TINYINT NOT NULL,
  `description` VARCHAR(255),
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Citic Account Table
CREATE TABLE IF NOT EXISTS `citic_account` (
  `id` VARCHAR(64) PRIMARY KEY,
  `account_no` VARCHAR(32) NOT NULL UNIQUE,
  `account_name` VARCHAR(128) NOT NULL,
  `account_type` TINYINT NOT NULL,
  `balance` DECIMAL(18,2) DEFAULT 0,
  `available_balance` DECIMAL(18,2) DEFAULT 0,
  `frozen_balance` DECIMAL(18,2) DEFAULT 0,
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Citic Card Table
CREATE TABLE IF NOT EXISTS `citic_card` (
  `id` VARCHAR(64) PRIMARY KEY,
  `card_no` VARCHAR(32) NOT NULL UNIQUE,
  `account_no` VARCHAR(32) NOT NULL,
  `card_type` TINYINT NOT NULL,
  `bank_name` VARCHAR(64) NOT NULL,
  `bank_code` VARCHAR(32) NOT NULL,
  `card_holder` VARCHAR(64) NOT NULL,
  `cert_no` VARCHAR(32),
  `phone` VARCHAR(32),
  `cvv2` VARCHAR(8),
  `expire_date` VARCHAR(8),
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Citic Settlement Table
CREATE TABLE IF NOT EXISTS `citic_settlement` (
  `id` VARCHAR(64) PRIMARY KEY,
  `settle_no` VARCHAR(32) NOT NULL UNIQUE,
  `account_no` VARCHAR(32) NOT NULL,
  `settle_type` TINYINT NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `fee` DECIMAL(18,2) DEFAULT 0,
  `actual_amount` DECIMAL(18,2) NOT NULL,
  `target_account` VARCHAR(32) NOT NULL,
  `target_bank` VARCHAR(64) NOT NULL,
  `status` TINYINT DEFAULT 0,
  `fail_reason` VARCHAR(255),
  `settle_time` DATETIME,
  `complete_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Citic Check Table
CREATE TABLE IF NOT EXISTS `citic_check` (
  `id` VARCHAR(64) PRIMARY KEY,
  `check_no` VARCHAR(32) NOT NULL UNIQUE,
  `check_date` DATE NOT NULL,
  `check_type` TINYINT NOT NULL,
  `total_count` INT DEFAULT 0,
  `total_amount` DECIMAL(18,2) DEFAULT 0,
  `success_count` INT DEFAULT 0,
  `success_amount` DECIMAL(18,2) DEFAULT 0,
  `fail_count` INT DEFAULT 0,
  `fail_amount` DECIMAL(18,2) DEFAULT 0,
  `diff_count` INT DEFAULT 0,
  `diff_amount` DECIMAL(18,2) DEFAULT 0,
  `status` TINYINT DEFAULT 0,
  `file_path` VARCHAR(255),
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Device Info Table
CREATE TABLE IF NOT EXISTS `device_info` (
  `id` VARCHAR(64) PRIMARY KEY,
  `device_no` VARCHAR(32) NOT NULL UNIQUE,
  `device_type` TINYINT NOT NULL,
  `device_name` VARCHAR(64) NOT NULL,
  `device_model` VARCHAR(64),
  `mch_no` VARCHAR(32),
  `store_id` VARCHAR(32),
  `sn` VARCHAR(64),
  `iccid` VARCHAR(64),
  `imei` VARCHAR(64),
  `status` TINYINT DEFAULT 1,
  `activate_time` DATETIME,
  `last_heartbeat` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_device_no` (`device_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Device Activation Code Table
CREATE TABLE IF NOT EXISTS `device_activation_code` (
  `id` VARCHAR(64) PRIMARY KEY,
  `code` VARCHAR(32) NOT NULL UNIQUE,
  `device_type` TINYINT NOT NULL,
  `batch_no` VARCHAR(32),
  `status` TINYINT DEFAULT 0,
  `used_time` DATETIME,
  `used_mch_no` VARCHAR(32),
  `expire_time` DATETIME,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Device Binding Table
CREATE TABLE IF NOT EXISTS `device_binding` (
  `id` VARCHAR(64) PRIMARY KEY,
  `device_no` VARCHAR(32) NOT NULL,
  `mch_no` VARCHAR(32) NOT NULL,
  `store_id` VARCHAR(32),
  `binding_type` TINYINT NOT NULL,
  `status` TINYINT DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Check Batch Table
CREATE TABLE IF NOT EXISTS `check_batch` (
  `id` VARCHAR(64) PRIMARY KEY,
  `batch_no` VARCHAR(32) NOT NULL UNIQUE,
  `check_date` DATE NOT NULL,
  `check_type` TINYINT NOT NULL,
  `channel_code` VARCHAR(32),
  `status` TINYINT DEFAULT 0,
  `total_count` INT DEFAULT 0,
  `success_count` INT DEFAULT 0,
  `fail_count` INT DEFAULT 0,
  `diff_count` INT DEFAULT 0,
  `complete_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Check Channel Bill Table
CREATE TABLE IF NOT EXISTS `check_channel_bill` (
  `id` VARCHAR(64) PRIMARY KEY,
  `bill_no` VARCHAR(64) NOT NULL UNIQUE,
  `batch_no` VARCHAR(32) NOT NULL,
  `channel_code` VARCHAR(32) NOT NULL,
  `channel_order_no` VARCHAR(64) NOT NULL,
  `mch_no` VARCHAR(32),
  `order_no` VARCHAR(64),
  `pay_type` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `fee` DECIMAL(18,2) DEFAULT 0,
  `status` TINYINT NOT NULL,
  `trade_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Check Diff Bill Table
CREATE TABLE IF NOT EXISTS `check_diff_bill` (
  `id` VARCHAR(64) PRIMARY KEY,
  `diff_no` VARCHAR(32) NOT NULL UNIQUE,
  `batch_no` VARCHAR(32) NOT NULL,
  `channel_code` VARCHAR(32) NOT NULL,
  `diff_type` TINYINT NOT NULL,
  `channel_order_no` VARCHAR(64),
  `order_no` VARCHAR(64),
  `mch_no` VARCHAR(32),
  `amount` DECIMAL(18,2) NOT NULL,
  `channel_amount` DECIMAL(18,2),
  `platform_amount` DECIMAL(18,2),
  `diff_amount` DECIMAL(18,2) NOT NULL,
  `status` TINYINT DEFAULT 0,
  `handle_remark` VARCHAR(255),
  `handle_time` DATETIME,
  `handle_user_id` VARCHAR(64),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profit Account Group Table
CREATE TABLE IF NOT EXISTS `profit_account_group` (
  `id` VARCHAR(64) PRIMARY KEY,
  `group_no` VARCHAR(32) NOT NULL UNIQUE,
  `group_name` VARCHAR(64) NOT NULL,
  `agent_no` VARCHAR(32),
  `mch_no` VARCHAR(32),
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profit Receiver Table
CREATE TABLE IF NOT EXISTS `profit_receiver` (
  `id` VARCHAR(64) PRIMARY KEY,
  `receiver_no` VARCHAR(32) NOT NULL UNIQUE,
  `group_no` VARCHAR(32) NOT NULL,
  `receiver_type` TINYINT NOT NULL,
  `receiver_name` VARCHAR(64) NOT NULL,
  `receiver_account` VARCHAR(32) NOT NULL,
  `bank_name` VARCHAR(64),
  `profit_ratio` DECIMAL(6,4) NOT NULL,
  `fixed_amount` DECIMAL(18,2),
  `status` TINYINT DEFAULT 1,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profit Record Table
CREATE TABLE IF NOT EXISTS `profit_record` (
  `id` VARCHAR(64) PRIMARY KEY,
  `profit_no` VARCHAR(32) NOT NULL UNIQUE,
  `order_no` VARCHAR(32) NOT NULL,
  `mch_no` VARCHAR(32) NOT NULL,
  `channel_code` VARCHAR(32),
  `trade_amount` DECIMAL(18,2) NOT NULL,
  `profit_amount` DECIMAL(18,2) NOT NULL,
  `profit_type` TINYINT NOT NULL,
  `status` TINYINT DEFAULT 0,
  `settle_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profit Rollback Table
CREATE TABLE IF NOT EXISTS `profit_rollback` (
  `id` VARCHAR(64) PRIMARY KEY,
  `rollback_no` VARCHAR(32) NOT NULL UNIQUE,
  `profit_no` VARCHAR(32) NOT NULL,
  `order_no` VARCHAR(32) NOT NULL,
  `mch_no` VARCHAR(32) NOT NULL,
  `receiver_no` VARCHAR(32) NOT NULL,
  `receiver_name` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `rollback_type` TINYINT NOT NULL,
  `reason` VARCHAR(255),
  `status` TINYINT DEFAULT 0,
  `complete_time` DATETIME,
  `remark` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Statistics Tables
CREATE TABLE IF NOT EXISTS `stat_trade` (
  `id` VARCHAR(64) PRIMARY KEY,
  `stat_date` DATE NOT NULL,
  `stat_type` TINYINT NOT NULL,
  `mch_no` VARCHAR(32),
  `agent_no` VARCHAR(32),
  `channel_code` VARCHAR(32),
  `pay_type` VARCHAR(32),
  `total_count` INT DEFAULT 0,
  `success_count` INT DEFAULT 0,
  `fail_count` INT DEFAULT 0,
  `total_amount` DECIMAL(18,2) DEFAULT 0,
  `success_amount` DECIMAL(18,2) DEFAULT 0,
  `fail_amount` DECIMAL(18,2) DEFAULT 0,
  `refund_count` INT DEFAULT 0,
  `refund_amount` DECIMAL(18,2) DEFAULT 0,
  `fee_amount` DECIMAL(18,2) DEFAULT 0,
  `profit_amount` DECIMAL(18,2) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `stat_mch` (
  `id` VARCHAR(64) PRIMARY KEY,
  `stat_date` DATE NOT NULL,
  `mch_no` VARCHAR(32) NOT NULL,
  `mch_name` VARCHAR(128),
  `agent_no` VARCHAR(32),
  `total_count` INT DEFAULT 0,
  `success_count` INT DEFAULT 0,
  `total_amount` DECIMAL(18,2) DEFAULT 0,
  `success_amount` DECIMAL(18,2) DEFAULT 0,
  `fee_amount` DECIMAL(18,2) DEFAULT 0,
  `refund_count` INT DEFAULT 0,
  `refund_amount` DECIMAL(18,2) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `stat_agent` (
  `id` VARCHAR(64) PRIMARY KEY,
  `stat_date` DATE NOT NULL,
  `agent_no` VARCHAR(32) NOT NULL,
  `agent_name` VARCHAR(128),
  `parent_id` VARCHAR(64),
  `mch_count` INT DEFAULT 0,
  `total_trade_count` INT DEFAULT 0,
  `success_trade_count` INT DEFAULT 0,
  `total_trade_amount` DECIMAL(18,2) DEFAULT 0,
  `success_trade_amount` DECIMAL(18,2) DEFAULT 0,
  `profit_amount` DECIMAL(18,2) DEFAULT 0,
  `withdraw_amount` DECIMAL(18,2) DEFAULT 0,
  `balance` DECIMAL(18,2) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `stat_channel` (
  `id` VARCHAR(64) PRIMARY KEY,
  `stat_date` DATE NOT NULL,
  `channel_code` VARCHAR(32) NOT NULL,
  `channel_name` VARCHAR(128),
  `pay_type` VARCHAR(32),
  `total_count` INT DEFAULT 0,
  `success_count` INT DEFAULT 0,
  `total_amount` DECIMAL(18,2) DEFAULT 0,
  `success_amount` DECIMAL(18,2) DEFAULT 0,
  `fee_amount` DECIMAL(18,2) DEFAULT 0,
  `success_rate` DECIMAL(6,4) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `stat_finance` (
  `id` VARCHAR(64) PRIMARY KEY,
  `stat_date` DATE NOT NULL,
  `total_income` DECIMAL(18,2) DEFAULT 0,
  `total_expense` DECIMAL(18,2) DEFAULT 0,
  `net_income` DECIMAL(18,2) DEFAULT 0,
  `total_balance` DECIMAL(18,2) DEFAULT 0,
  `settle_amount` DECIMAL(18,2) DEFAULT 0,
  `withdraw_amount` DECIMAL(18,2) DEFAULT 0,
  `profit_amount` DECIMAL(18,2) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: admin123)
INSERT INTO `sys_user` (`id`, `username`, `password`, `nickname`, `email`, `mobile`, `user_type`, `status`, `create_time`, `update_time`)
SELECT UUID(), 'admin', '$2a$10$Xz1KL1R6h6o5p6p6p6p6pOuJkIlNqXjKqKqKqKqKqKqKqKqKqKq', 'Administrator', 'admin@example.com', '13800138000', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `sys_user` WHERE `username` = 'admin');

-- Insert default role
INSERT INTO `sys_role` (`id`, `role_name`, `role_code`, `role_desc`, `status`, `sort`, `create_time`, `update_time`)
SELECT UUID(), 'Administrator', 'admin', 'System Administrator', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `sys_role` WHERE `role_code` = 'admin');

-- Insert sample channels
INSERT INTO `channel_info` (`id`, `channel_code`, `channel_name`, `channel_short_name`, `channel_type`, `provider`, `status`, `create_time`, `update_time`)
SELECT UUID(), 'WX_NATIVE', 'WeChat Native Pay', '微信Native', 'WX', 'WeChat Pay', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `channel_info` WHERE `channel_code` = 'WX_NATIVE');

INSERT INTO `channel_info` (`id`, `channel_code`, `channel_name`, `channel_short_name`, `channel_type`, `provider`, `status`, `create_time`, `update_time`)
SELECT UUID(), 'ALI_QR', 'Alipay QR Code', '支付宝扫码', 'ALI', 'Alipay', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `channel_info` WHERE `channel_code` = 'ALI_QR');

INSERT INTO `channel_info` (`id`, `channel_code`, `channel_name`, `channel_short_name`, `channel_type`, `provider`, `status`, `create_time`, `update_time`)
SELECT UUID(), 'UNION_QR', 'UnionPay QR Code', '银联扫码', 'UNION', 'China UnionPay', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `channel_info` WHERE `channel_code` = 'UNION_QR');
