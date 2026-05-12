-- 创建数据库
CREATE DATABASE IF NOT EXISTS dgkj DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dgkj;

-- 用户表
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT '' COMMENT '头像',
  `email` varchar(100) DEFAULT '' COMMENT '邮箱',
  `mobile` varchar(20) DEFAULT '' COMMENT '手机号',
  `status` tinyint DEFAULT '1' COMMENT '状态: 0-禁用 1-正常',
  `dept_id` bigint DEFAULT NULL COMMENT '部门ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 商户表
CREATE TABLE IF NOT EXISTS `mch_merchant` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mch_no` varchar(20) NOT NULL COMMENT '商户号',
  `mch_name` varchar(100) NOT NULL COMMENT '商户名称',
  `mch_type` tinyint DEFAULT '2' COMMENT '商户类型: 1-个体 2-企业',
  `status` tinyint DEFAULT '1' COMMENT '状态: 0-停用 1-正常',
  `audit_status` tinyint DEFAULT '0' COMMENT '审核状态: 0-待审核 1-审核通过 2-审核拒绝',
  `balance` decimal(12,2) DEFAULT '0.00' COMMENT '账户余额',
  `rate` decimal(6,4) DEFAULT '0.0060' COMMENT '费率',
  `contact_name` varchar(50) DEFAULT '' COMMENT '联系人',
  `contact_mobile` varchar(20) DEFAULT '' COMMENT '联系电话',
  `contact_email` varchar(100) DEFAULT '' COMMENT '邮箱',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mch_no` (`mch_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商户表';

-- 支付订单表
CREATE TABLE IF NOT EXISTS `pay_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `mch_no` varchar(20) NOT NULL COMMENT '商户号',
  `mch_name` varchar(100) DEFAULT '' COMMENT '商户名称',
  `amount` decimal(12,2) NOT NULL COMMENT '订单金额',
  `currency` varchar(10) DEFAULT 'CNY' COMMENT '货币',
  `status` tinyint DEFAULT '0' COMMENT '状态: 0-待支付 1-支付中 2-已支付 3-已取消 4-已退款',
  `pay_channel` varchar(20) DEFAULT '' COMMENT '支付渠道',
  `channel_order_no` varchar(64) DEFAULT '' COMMENT '渠道订单号',
  `pay_time` datetime DEFAULT NULL COMMENT '支付时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_mch_no` (`mch_no`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付订单表';

-- 初始化数据
INSERT INTO sys_user (username, password, nickname) VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员');
INSERT INTO mch_merchant (mch_no, mch_name, mch_type, status, audit_status, balance, rate) VALUES 
('M00001', '测试商户1', 2, 1, 1, 10000.00, 0.0060),
('M00002', '测试商户2', 2, 1, 1, 20000.00, 0.0060),
('M00003', '测试商户3', 1, 1, 1, 15000.00, 0.0065);
