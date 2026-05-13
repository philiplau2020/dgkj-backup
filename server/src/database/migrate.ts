/**
 * DGKJ 支付平台 - 数据库迁移脚本
 * 
 * 用于创建完整的数据库表结构
 * 
 * 使用方法:
 *   npx ts-node src/database/migrate.ts
 *   或者在服务器上执行
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

// 数据库连接配置
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'dgkj',
  synchronize: false,
  logging: true,
});

// SQL 创建表语句
const createTablesSQL = `
-- ========================================
-- DGKJ 支付平台 - 数据库初始化脚本
-- ========================================

-- 创建数据库 (如果不存在)
CREATE DATABASE IF NOT EXISTS dgkj DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dgkj;

-- ========================================
-- 1. 系统管理相关表
-- ========================================

-- 系统用户表
CREATE TABLE IF NOT EXISTS sys_user (
  id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  nick_name VARCHAR(50) COMMENT '昵称',
  email VARCHAR(100) COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '手机号',
  avatar VARCHAR(255) COMMENT '头像',
  sex TINYINT DEFAULT 0 COMMENT '性别: 0-未知, 1-男, 2-女',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  user_type VARCHAR(20) DEFAULT 'system' COMMENT '用户类型',
  dept_id VARCHAR(36) COMMENT '部门ID',
  last_login_ip VARCHAR(50) COMMENT '最后登录IP',
  last_login_time DATETIME COMMENT '最后登录时间',
  create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  INDEX idx_username (username),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- 系统角色表
CREATE TABLE IF NOT EXISTS sys_role (
  id VARCHAR(36) PRIMARY KEY COMMENT '角色ID',
  role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
  role_key VARCHAR(100) NOT NULL UNIQUE COMMENT '角色标识',
  role_sort INT DEFAULT 0 COMMENT '显示顺序',
  data_scope VARCHAR(50) DEFAULT '1' COMMENT '数据范围',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  INDEX idx_role_key (role_key),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统角色表';

-- 系统菜单表
CREATE TABLE IF NOT EXISTS sys_menu (
  id VARCHAR(36) PRIMARY KEY COMMENT '菜单ID',
  menu_name VARCHAR(50) NOT NULL COMMENT '菜单名称',
  parent_id VARCHAR(36) DEFAULT '0' COMMENT '父菜单ID',
  order_num INT DEFAULT 0 COMMENT '显示顺序',
  path VARCHAR(200) DEFAULT '' COMMENT '路由地址',
  component VARCHAR(255) DEFAULT NULL COMMENT '组件路径',
  menu_type CHAR(1) DEFAULT '' COMMENT '菜单类型: M-目录, C-菜单, F-按钮',
  visible TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  perms VARCHAR(100) DEFAULT NULL COMMENT '权限标识',
  icon VARCHAR(100) DEFAULT '#' COMMENT '菜单图标',
  keep_alive TINYINT DEFAULT 1 COMMENT '是否缓存: 0-否, 1-是',
  always_show TINYINT DEFAULT 1 COMMENT '是否一直显示根菜单',
  create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统菜单表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS sys_user_role (
  id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
  user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
  role_id VARCHAR(36) NOT NULL COMMENT '角色ID',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_user_role (user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户和角色关联表';

-- 角色菜单权限关联表
CREATE TABLE IF NOT EXISTS sys_role_menu (
  id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
  role_id VARCHAR(36) NOT NULL COMMENT '角色ID',
  menu_id VARCHAR(36) NOT NULL COMMENT '菜单ID',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_role_menu (role_id, menu_id),
  INDEX idx_role_id (role_id),
  INDEX idx_menu_id (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色和菜单关联表';

-- 部门表
CREATE TABLE IF NOT EXISTS sys_dept (
  id VARCHAR(36) PRIMARY KEY COMMENT '部门ID',
  parent_id VARCHAR(36) DEFAULT '0' COMMENT '父部门ID',
  dept_name VARCHAR(50) NOT NULL COMMENT '部门名称',
  order_num INT DEFAULT 0 COMMENT '显示顺序',
  leader VARCHAR(50) DEFAULT NULL COMMENT '负责人',
  phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-正常',
  create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- 字典类型表
CREATE TABLE IF NOT EXISTS sys_dict_type (
  id VARCHAR(36) PRIMARY KEY COMMENT '字典ID',
  dict_name VARCHAR(100) NOT NULL COMMENT '字典名称',
  dict_type VARCHAR(100) NOT NULL UNIQUE COMMENT '字典类型',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-正常',
  create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  INDEX idx_dict_type (dict_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类型表';

-- 字典数据表
CREATE TABLE IF NOT EXISTS sys_dict_data (
  id VARCHAR(36) PRIMARY KEY COMMENT '字典ID',
  dict_sort INT DEFAULT 0 COMMENT '字典排序',
  dict_label VARCHAR(100) DEFAULT '' COMMENT '字典标签',
  dict_value VARCHAR(100) DEFAULT '' COMMENT '字典键值',
  dict_type VARCHAR(100) DEFAULT '' COMMENT '字典类型',
  css_class VARCHAR(100) DEFAULT NULL COMMENT '样式属性',
  list_class VARCHAR(100) DEFAULT NULL COMMENT '表格回显样式',
  is_default TINYINT DEFAULT 0 COMMENT '是否默认: 0-否, 1-是',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-正常',
  create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  INDEX idx_dict_type (dict_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典数据表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS sys_config (
  id VARCHAR(36) PRIMARY KEY COMMENT '主键',
  config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键名',
  config_name VARCHAR(100) NOT NULL COMMENT '配置名称',
  config_value TEXT NOT NULL COMMENT '配置值',
  config_type VARCHAR(20) DEFAULT 'N' COMMENT '类型: Y-是系统内置, N-否',
  create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  INDEX idx_config_key (config_key),
  INDEX idx_config_type (config_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 系统日志表
CREATE TABLE IF NOT EXISTS sys_log (
  id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
  title VARCHAR(200) DEFAULT '' COMMENT '操作模块',
  business_type VARCHAR(20) DEFAULT '' COMMENT '业务类型',
  method VARCHAR(200) DEFAULT '' COMMENT '请求方法',
  request_method VARCHAR(10) DEFAULT '' COMMENT '请求方式',
  operator_type VARCHAR(20) DEFAULT '' COMMENT '操作人类别',
  user_id VARCHAR(36) DEFAULT '' COMMENT '操作人员',
  username VARCHAR(50) DEFAULT '' COMMENT '操作人员名称',
  url VARCHAR(500) DEFAULT '' COMMENT '请求URL',
  ip VARCHAR(128) DEFAULT '' COMMENT '主机地址',
  location VARCHAR(255) DEFAULT '' COMMENT '操作地点',
  request_params TEXT COMMENT '请求参数',
  response_params TEXT COMMENT '返回参数',
  status TINYINT DEFAULT 1 COMMENT '操作状态: 0-异常, 1-正常',
  error_msg TEXT COMMENT '错误消息',
  operate_time INT DEFAULT 0 COMMENT '操作耗时(毫秒)',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX idx_user_id (user_id),
  INDEX idx_business_type (business_type),
  INDEX idx_status (status),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表';

-- ========================================
-- 2. 商户管理相关表
-- ========================================

-- 商户信息表
CREATE TABLE IF NOT EXISTS mch_info (
  id VARCHAR(36) PRIMARY KEY COMMENT '商户ID',
  mch_no VARCHAR(20) NOT NULL UNIQUE COMMENT '商户号',
  mch_name VARCHAR(100) NOT NULL COMMENT '商户名称',
  mch_type TINYINT DEFAULT 1 COMMENT '商户类型: 1-个人, 2-企业',
  mch_status TINYINT DEFAULT 1 COMMENT '商户状态: 0-停用, 1-正常, 2-审核中',
  contact_name VARCHAR(50) COMMENT '联系人',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  contact_email VARCHAR(100) COMMENT '联系邮箱',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  district VARCHAR(50) COMMENT '区县',
  address VARCHAR(255) COMMENT '详细地址',
  logo_url VARCHAR(255) COMMENT 'Logo地址',
  license_no VARCHAR(50) COMMENT '营业执照号',
  license_url VARCHAR(255) COMMENT '营业执照图片',
  audit_time DATETIME COMMENT '审核时间',
  audit_remark VARCHAR(255) COMMENT '审核备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_mch_no (mch_no),
  INDEX idx_mch_status (mch_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户信息表';

-- 商户应用表
CREATE TABLE IF NOT EXISTS mch_app (
  id VARCHAR(36) PRIMARY KEY COMMENT '应用ID',
  app_id VARCHAR(32) NOT NULL UNIQUE COMMENT '应用ID',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  app_name VARCHAR(100) NOT NULL COMMENT '应用名称',
  app_status TINYINT DEFAULT 1 COMMENT '应用状态: 0-停用, 1-正常',
  app_secret VARCHAR(64) COMMENT '应用密钥',
  notify_url VARCHAR(255) COMMENT '支付回调地址',
  return_url VARCHAR(255) COMMENT '支付返回地址',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_app_id (app_id),
  INDEX idx_mch_no (mch_no),
  INDEX idx_app_status (app_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户应用表';

-- 商户门店表
CREATE TABLE IF NOT EXISTS mch_store (
  id VARCHAR(36) PRIMARY KEY COMMENT '门店ID',
  store_id VARCHAR(20) NOT NULL UNIQUE COMMENT '门店编号',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  store_name VARCHAR(100) NOT NULL COMMENT '门店名称',
  store_status TINYINT DEFAULT 1 COMMENT '门店状态: 0-停用, 1-正常',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  district VARCHAR(50) COMMENT '区县',
  address VARCHAR(255) COMMENT '详细地址',
  contact_name VARCHAR(50) COMMENT '联系人',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  latitude DECIMAL(10, 6) COMMENT '纬度',
  longitude DECIMAL(10, 6) COMMENT '经度',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_store_id (store_id),
  INDEX idx_mch_no (mch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户门店表';

-- 商户费率表
CREATE TABLE IF NOT EXISTS mch_rate (
  id VARCHAR(36) PRIMARY KEY COMMENT '费率ID',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  pay_way VARCHAR(20) NOT NULL COMMENT '支付方式',
  rate DECIMAL(6, 4) NOT NULL COMMENT '费率',
  min_fee INT DEFAULT 0 COMMENT '最低手续费(分)',
  max_fee INT DEFAULT 0 COMMENT '最高手续费(分)',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_mch_payway (mch_no, pay_way),
  INDEX idx_mch_no (mch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户费率表';

-- ========================================
-- 3. 代理管理相关表
-- ========================================

-- 代理商信息表
CREATE TABLE IF NOT EXISTS agent_info (
  id VARCHAR(36) PRIMARY KEY COMMENT '代理商ID',
  agent_no VARCHAR(20) NOT NULL UNIQUE COMMENT '代理商编号',
  agent_name VARCHAR(100) NOT NULL COMMENT '代理商名称',
  agent_level INT DEFAULT 1 COMMENT '代理级别',
  parent_id VARCHAR(36) COMMENT '上级代理商ID',
  contact_name VARCHAR(50) COMMENT '联系人',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  contact_email VARCHAR(100) COMMENT '联系邮箱',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  balance DECIMAL(15, 2) DEFAULT 0 COMMENT '账户余额',
  freeze_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '冻结金额',
  profit_rate DECIMAL(5, 4) DEFAULT 0 COMMENT '分润比例',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-正常',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_agent_no (agent_no),
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代理商信息表';

-- 代理商分润表
CREATE TABLE IF NOT EXISTS agent_profit (
  id VARCHAR(36) PRIMARY KEY COMMENT '分润ID',
  agent_no VARCHAR(20) NOT NULL COMMENT '代理商编号',
  order_no VARCHAR(50) NOT NULL COMMENT '订单号',
  order_amount DECIMAL(15, 2) NOT NULL COMMENT '订单金额',
  profit_amount DECIMAL(15, 2) NOT NULL COMMENT '分润金额',
  profit_rate DECIMAL(5, 4) NOT NULL COMMENT '分润比例',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待确认, 1-已确认, 2-已结算',
  settle_time DATETIME COMMENT '结算时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_agent_no (agent_no),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代理商分润表';

-- 代理商提现表
CREATE TABLE IF NOT EXISTS agent_withdraw (
  id VARCHAR(36) PRIMARY KEY COMMENT '提现ID',
  withdraw_no VARCHAR(30) NOT NULL UNIQUE COMMENT '提现单号',
  agent_no VARCHAR(20) NOT NULL COMMENT '代理商编号',
  amount DECIMAL(15, 2) NOT NULL COMMENT '提现金额',
  fee DECIMAL(15, 2) DEFAULT 0 COMMENT '手续费',
  actual_amount DECIMAL(15, 2) NOT NULL COMMENT '实际到账',
  bank_name VARCHAR(100) COMMENT '银行名称',
  bank_account VARCHAR(50) COMMENT '银行账号',
  account_name VARCHAR(50) COMMENT '开户名',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待审核, 1-审核通过, 2-已打款, 3-已拒绝',
  audit_remark VARCHAR(255) COMMENT '审核备注',
  audit_time DATETIME COMMENT '审核时间',
  pay_time DATETIME COMMENT '打款时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_withdraw_no (withdraw_no),
  INDEX idx_agent_no (agent_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代理商提现表';

-- ========================================
-- 4. 交易相关表
-- ========================================

-- 支付订单表
CREATE TABLE IF NOT EXISTS pay_order (
  id VARCHAR(36) PRIMARY KEY COMMENT '订单ID',
  order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  mch_name VARCHAR(100) COMMENT '商户名称',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  channel_code VARCHAR(20) NOT NULL COMMENT '通道编码',
  pay_type VARCHAR(20) NOT NULL COMMENT '支付类型',
  amount INT NOT NULL COMMENT '订单金额(分)',
  actual_amount INT NOT NULL COMMENT '实际金额(分)',
  fee INT DEFAULT 0 COMMENT '手续费(分)',
  subject VARCHAR(200) NOT NULL COMMENT '商品标题',
  body VARCHAR(500) COMMENT '商品描述',
  client_ip VARCHAR(50) COMMENT '客户端IP',
  attach VARCHAR(500) COMMENT '附加数据',
  notify_url VARCHAR(255) COMMENT '通知地址',
  return_url VARCHAR(255) COMMENT '返回地址',
  channel_order_no VARCHAR(100) COMMENT '通道订单号',
  status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态: PENDING-待支付, SUCCESS-成功, FAILED-失败, CLOSED-关闭, REFUNDING-退款中, REFUNDED-已退款',
  pay_time DATETIME COMMENT '支付时间',
  expire_time DATETIME COMMENT '过期时间',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_order_no (order_no),
  INDEX idx_mch_no (mch_no),
  INDEX idx_channel_code (channel_code),
  INDEX idx_status (status),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付订单表';

-- 退款订单表
CREATE TABLE IF NOT EXISTS refund_order (
  id VARCHAR(36) PRIMARY KEY COMMENT '退款ID',
  refund_no VARCHAR(50) NOT NULL UNIQUE COMMENT '退款单号',
  order_no VARCHAR(50) NOT NULL COMMENT '原订单号',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  channel_code VARCHAR(20) NOT NULL COMMENT '通道编码',
  pay_type VARCHAR(20) NOT NULL COMMENT '支付类型',
  amount INT NOT NULL COMMENT '原订单金额(分)',
  refund_amount INT NOT NULL COMMENT '退款金额(分)',
  refund_reason VARCHAR(500) COMMENT '退款原因',
  channel_refund_no VARCHAR(100) COMMENT '通道退款单号',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待处理, 1-成功, 2-失败',
  refund_time DATETIME COMMENT '退款时间',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_refund_no (refund_no),
  INDEX idx_order_no (order_no),
  INDEX idx_mch_no (mch_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款订单表';

-- 转账订单表
CREATE TABLE IF NOT EXISTS transfer_order (
  id VARCHAR(36) PRIMARY KEY COMMENT '转账ID',
  transfer_no VARCHAR(50) NOT NULL UNIQUE COMMENT '转账单号',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  channel_code VARCHAR(20) NOT NULL COMMENT '通道编码',
  account_type VARCHAR(20) NOT NULL COMMENT '账户类型',
  payee_account VARCHAR(100) NOT NULL COMMENT '收款账户',
  payee_name VARCHAR(50) COMMENT '收款人姓名',
  amount INT NOT NULL COMMENT '转账金额(分)',
  fee INT DEFAULT 0 COMMENT '手续费(分)',
  actual_amount INT NOT NULL COMMENT '实际到账(分)',
  remark VARCHAR(500) COMMENT '转账备注',
  channel_transfer_no VARCHAR(100) COMMENT '通道转账单号',
  status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态: PENDING-处理中, SUCCESS-成功, FAILED-失败',
  transfer_time DATETIME COMMENT '转账时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_transfer_no (transfer_no),
  INDEX idx_mch_no (mch_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='转账订单表';

-- 交易通知表
CREATE TABLE IF NOT EXISTS trade_notify (
  id VARCHAR(36) PRIMARY KEY COMMENT '通知ID',
  notify_id VARCHAR(50) NOT NULL UNIQUE COMMENT '通知标识',
  order_no VARCHAR(50) NOT NULL COMMENT '订单号',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  notify_url VARCHAR(255) NOT NULL COMMENT '通知地址',
  notify_type TINYINT NOT NULL COMMENT '通知类型: 1-支付, 2-退款, 3-转账',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待通知, 1-成功, -1-失败',
  notify_count INT DEFAULT 0 COMMENT '通知次数',
  last_notify_time DATETIME COMMENT '最后通知时间',
  next_notify_time DATETIME COMMENT '下次通知时间',
  response_result VARCHAR(500) COMMENT '响应结果',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_notify_id (notify_id),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易通知表';

-- ========================================
-- 5. 财务相关表
-- ========================================

-- 账户信息表
CREATE TABLE IF NOT EXISTS account_info (
  id VARCHAR(36) PRIMARY KEY COMMENT '账户ID',
  account_no VARCHAR(30) NOT NULL UNIQUE COMMENT '账户号',
  account_name VARCHAR(100) NOT NULL COMMENT '账户名称',
  account_type TINYINT NOT NULL COMMENT '账户类型: 1-商户, 2-代理, 3-平台',
  owner_id VARCHAR(36) NOT NULL COMMENT '所属者ID',
  balance DECIMAL(15, 2) DEFAULT 0 COMMENT '账户余额',
  available_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '可用余额',
  freeze_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '冻结金额',
  pending_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '待结金额',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-冻结, 1-正常',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_account_no (account_no),
  INDEX idx_owner_id (owner_id),
  INDEX idx_account_type (account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户信息表';

-- 账户流水表
CREATE TABLE IF NOT EXISTS account_record (
  id VARCHAR(36) PRIMARY KEY COMMENT '流水ID',
  record_no VARCHAR(50) NOT NULL UNIQUE COMMENT '流水号',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  biz_type TINYINT NOT NULL COMMENT '业务类型: 1-充值, 2-消费, 3-提现, 4-退款, 5-归集, 6-分润, 7-代付, 8-结算',
  biz_type_name VARCHAR(50) COMMENT '业务类型名称',
  amount DECIMAL(15, 2) NOT NULL COMMENT '变动金额',
  balance_before DECIMAL(15, 2) NOT NULL COMMENT '变动前余额',
  balance_after DECIMAL(15, 2) NOT NULL COMMENT '变动后余额',
  order_no VARCHAR(50) COMMENT '关联订单号',
  opposite_account_no VARCHAR(30) COMMENT '对方账户号',
  opposite_account_name VARCHAR(100) COMMENT '对方账户名',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_record_no (record_no),
  INDEX idx_account_no (account_no),
  INDEX idx_biz_type (biz_type),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户流水表';

-- 账户结算表
CREATE TABLE IF NOT EXISTS account_settlement (
  id VARCHAR(36) PRIMARY KEY COMMENT '结算ID',
  settle_no VARCHAR(50) NOT NULL UNIQUE COMMENT '结算单号',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  account_name VARCHAR(100) NOT NULL COMMENT '账户名称',
  settle_type TINYINT NOT NULL COMMENT '结算类型: 1-D+0, 2-T+1',
  amount DECIMAL(15, 2) NOT NULL COMMENT '结算金额',
  fee DECIMAL(15, 2) NOT NULL COMMENT '手续费',
  actual_amount DECIMAL(15, 2) NOT NULL COMMENT '实际到账',
  target_card_no VARCHAR(30) COMMENT '目标卡号',
  target_bank VARCHAR(100) COMMENT '目标银行',
  target_bank_code VARCHAR(20) COMMENT '目标银行编码',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待处理, 1-处理中, 2-成功, 3-失败',
  arrive_time DATETIME COMMENT '到账时间',
  fail_reason VARCHAR(255) COMMENT '失败原因',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_settle_no (settle_no),
  INDEX idx_account_no (account_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户结算表';

-- 账户提现表
CREATE TABLE IF NOT EXISTS account_withdraw (
  id VARCHAR(36) PRIMARY KEY COMMENT '提现ID',
  withdraw_no VARCHAR(50) NOT NULL UNIQUE COMMENT '提现单号',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  amount DECIMAL(15, 2) NOT NULL COMMENT '提现金额',
  fee DECIMAL(15, 2) DEFAULT 0 COMMENT '手续费',
  actual_amount DECIMAL(15, 2) NOT NULL COMMENT '实际到账',
  bank_name VARCHAR(100) COMMENT '银行名称',
  bank_account VARCHAR(50) COMMENT '银行账号',
  account_name VARCHAR(50) COMMENT '开户名',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待审核, 1-审核通过, 2-已打款, 3-已拒绝',
  audit_remark VARCHAR(255) COMMENT '审核备注',
  audit_time DATETIME COMMENT '审核时间',
  pay_time DATETIME COMMENT '打款时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_withdraw_no (withdraw_no),
  INDEX idx_account_no (account_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户提现表';

-- ========================================
-- 6. 通道相关表
-- ========================================

-- 通道信息表
CREATE TABLE IF NOT EXISTS channel_info (
  id VARCHAR(36) PRIMARY KEY COMMENT '通道ID',
  channel_code VARCHAR(20) NOT NULL UNIQUE COMMENT '通道编码',
  channel_name VARCHAR(100) NOT NULL COMMENT '通道名称',
  channel_type TINYINT DEFAULT 1 COMMENT '通道类型: 1-微信, 2-支付宝, 3-银联',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  config_data TEXT COMMENT '配置数据(JSON)',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_channel_code (channel_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通道信息表';

-- 商户通道配置表
CREATE TABLE IF NOT EXISTS channel_mch (
  id VARCHAR(36) PRIMARY KEY COMMENT '配置ID',
  channel_code VARCHAR(20) NOT NULL COMMENT '通道编码',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  mch_name VARCHAR(100) COMMENT '商户名称',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  config_data TEXT COMMENT '配置数据(JSON)',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_channel_mch (channel_code, mch_no),
  INDEX idx_mch_no (mch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户通道配置表';

-- 通道路由表
CREATE TABLE IF NOT EXISTS channel_route (
  id VARCHAR(36) PRIMARY KEY COMMENT '路由ID',
  route_name VARCHAR(100) NOT NULL COMMENT '路由名称',
  pay_way VARCHAR(20) NOT NULL COMMENT '支付方式',
  channel_code VARCHAR(20) NOT NULL COMMENT '通道编码',
  mch_no VARCHAR(20) COMMENT '商户号(为空表示通用)',
  min_amount INT DEFAULT 0 COMMENT '最小金额',
  max_amount INT DEFAULT 0 COMMENT '最大金额',
  priority INT DEFAULT 100 COMMENT '优先级(越小越优先)',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_pay_way (pay_way),
  INDEX idx_channel_code (channel_code),
  INDEX idx_mch_no (mch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通道路由表';

-- ========================================
-- 7. 中信银行相关表
-- ========================================

-- 中信账户表
CREATE TABLE IF NOT EXISTS citic_account (
  id VARCHAR(36) PRIMARY KEY COMMENT '账户ID',
  biz_user_id VARCHAR(50) NOT NULL COMMENT '业务用户ID',
  account_no VARCHAR(30) NOT NULL UNIQUE COMMENT '子账户号',
  account_name VARCHAR(100) NOT NULL COMMENT '账户名称',
  account_type TINYINT NOT NULL COMMENT '账户类型: 1-个人, 2-企业',
  mch_no VARCHAR(20) COMMENT '商户号',
  agent_no VARCHAR(20) COMMENT '代理商号',
  balance DECIMAL(15, 2) DEFAULT 0 COMMENT '账户余额',
  available_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '可用余额',
  frozen_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '冻结金额',
  pending_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '待结金额',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-正常',
  audit_status TINYINT DEFAULT 0 COMMENT '审核状态: 0-待审核, 1-通过, 2-拒绝',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_account_no (account_no),
  INDEX idx_mch_no (mch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信子账户表';

-- 中信银行卡表
CREATE TABLE IF NOT EXISTS citic_card (
  id VARCHAR(36) PRIMARY KEY COMMENT '卡ID',
  biz_user_id VARCHAR(50) DEFAULT '' COMMENT '业务用户ID',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  card_no VARCHAR(50) NOT NULL COMMENT '卡号',
  card_type TINYINT NOT NULL COMMENT '卡类型: 1-借记卡, 2-贷记卡',
  bank_name VARCHAR(100) NOT NULL COMMENT '银行名称',
  bank_code VARCHAR(20) NOT NULL COMMENT '银行编码',
  card_holder VARCHAR(50) NOT NULL COMMENT '持卡人',
  cert_no VARCHAR(50) COMMENT '身份证号(加密)',
  phone VARCHAR(20) COMMENT '手机号(加密)',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-绑定中, 1-已绑定, 2-已解绑',
  bind_time DATETIME COMMENT '绑定时间',
  unbind_time DATETIME COMMENT '解绑时间',
  unbind_reason VARCHAR(255) COMMENT '解绑原因',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_account_no (account_no),
  INDEX idx_card_no (card_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信银行卡表';

-- 中信资金归集表
CREATE TABLE IF NOT EXISTS citic_collection (
  id VARCHAR(36) PRIMARY KEY COMMENT '归集ID',
  collection_no VARCHAR(50) NOT NULL UNIQUE COMMENT '归集单号',
  from_account_no VARCHAR(30) NOT NULL COMMENT '转出账户号',
  from_account_name VARCHAR(100) COMMENT '转出账户名称',
  to_account_no VARCHAR(30) NOT NULL COMMENT '转入账户号',
  to_account_name VARCHAR(100) COMMENT '转入账户名称',
  collection_type TINYINT NOT NULL COMMENT '归集类型: 1-全额, 2-定额, 3-保留余额',
  collection_amount DECIMAL(15, 2) COMMENT '定额归集金额',
  reserved_amount DECIMAL(15, 2) COMMENT '保留余额',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待执行, 1-执行中, 2-成功, 3-失败',
  relation_status TINYINT DEFAULT 1 COMMENT '关系状态: 1-有效, 0-无效',
  collection_amount_real DECIMAL(15, 2) COMMENT '实际归集金额',
  complete_time DATETIME COMMENT '完成时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_collection_no (collection_no),
  INDEX idx_from_account (from_account_no),
  INDEX idx_to_account (to_account_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信资金归集表';

-- 中信分账表
CREATE TABLE IF NOT EXISTS citic_profit_share (
  id VARCHAR(36) PRIMARY KEY COMMENT '分账ID',
  share_no VARCHAR(50) NOT NULL UNIQUE COMMENT '分账单号',
  order_no VARCHAR(50) NOT NULL COMMENT '订单号',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  account_name VARCHAR(100) COMMENT '账户名称',
  receiver_account_no VARCHAR(30) NOT NULL COMMENT '接收方账户号',
  receiver_name VARCHAR(100) COMMENT '接收方名称',
  share_type TINYINT NOT NULL COMMENT '分账类型: 1-比例, 2-金额',
  share_rate DECIMAL(6, 4) COMMENT '分账比例',
  share_amount DECIMAL(15, 2) NOT NULL COMMENT '分账金额',
  order_amount DECIMAL(15, 2) COMMENT '订单金额',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待分账, 1-分账中, 2-成功, 3-失败',
  share_time DATETIME COMMENT '分账时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_share_no (share_no),
  INDEX idx_order_no (order_no),
  INDEX idx_account_no (account_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信分账表';

-- 中信代付表
CREATE TABLE IF NOT EXISTS citic_transfer (
  id VARCHAR(36) PRIMARY KEY COMMENT '代付ID',
  transfer_no VARCHAR(50) NOT NULL UNIQUE COMMENT '代付单号',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  account_name VARCHAR(100) COMMENT '账户名称',
  receiver_card_no VARCHAR(50) NOT NULL COMMENT '收款卡号',
  receiver_name VARCHAR(50) NOT NULL COMMENT '收款人姓名',
  receiver_bank VARCHAR(100) NOT NULL COMMENT '收款银行',
  receiver_bank_code VARCHAR(20) NOT NULL COMMENT '收款银行编码',
  amount DECIMAL(15, 2) NOT NULL COMMENT '代付金额',
  fee DECIMAL(15, 2) DEFAULT 0 COMMENT '手续费',
  actual_amount DECIMAL(15, 2) NOT NULL COMMENT '实际到账',
  transfer_type TINYINT DEFAULT 1 COMMENT '代付类型: 1-代发',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待处理, 1-处理中, 2-成功, 3-失败',
  success_time DATETIME COMMENT '成功时间',
  fail_reason VARCHAR(255) COMMENT '失败原因',
  notify_time DATETIME COMMENT '回调时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_transfer_no (transfer_no),
  INDEX idx_account_no (account_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信代付表';

-- 中信结算表
CREATE TABLE IF NOT EXISTS citic_settlement (
  id VARCHAR(36) PRIMARY KEY COMMENT '结算ID',
  settle_no VARCHAR(50) NOT NULL UNIQUE COMMENT '结算单号',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  account_name VARCHAR(100) COMMENT '账户名称',
  settle_type TINYINT NOT NULL COMMENT '结算类型: 1-D+0, 2-T+1',
  amount DECIMAL(15, 2) NOT NULL COMMENT '结算金额',
  fee DECIMAL(15, 2) NOT NULL COMMENT '手续费',
  actual_amount DECIMAL(15, 2) NOT NULL COMMENT '实际到账',
  target_card_no VARCHAR(50) COMMENT '目标卡号',
  target_bank VARCHAR(100) COMMENT '目标银行',
  target_bank_code VARCHAR(20) COMMENT '目标银行编码',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待处理, 1-处理中, 2-成功, 3-失败',
  success_time DATETIME COMMENT '成功时间',
  fail_reason VARCHAR(255) COMMENT '失败原因',
  notify_time DATETIME COMMENT '回调时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_settle_no (settle_no),
  INDEX idx_account_no (account_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信结算表';

-- 中信对账表
CREATE TABLE IF NOT EXISTS citic_check (
  id VARCHAR(36) PRIMARY KEY COMMENT '对账ID',
  check_date VARCHAR(8) NOT NULL COMMENT '对账日期',
  channel_code VARCHAR(20) NOT NULL COMMENT '通道编码',
  order_count INT DEFAULT 0 COMMENT '订单数量',
  total_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '总金额',
  refund_count INT DEFAULT 0 COMMENT '退款数量',
  refund_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '退款金额',
  fee DECIMAL(15, 2) DEFAULT 0 COMMENT '手续费',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-未处理, 1-已对账, 2-有差异',
  diff_count INT DEFAULT 0 COMMENT '差异数量',
  diff_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '差异金额',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_date_channel (check_date, channel_code),
  INDEX idx_check_date (check_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信对账表';

-- 中信账户流水表
CREATE TABLE IF NOT EXISTS citic_account_record (
  id VARCHAR(36) PRIMARY KEY COMMENT '流水ID',
  record_no VARCHAR(50) NOT NULL UNIQUE COMMENT '流水号',
  account_no VARCHAR(30) NOT NULL COMMENT '账户号',
  biz_type TINYINT NOT NULL COMMENT '业务类型',
  biz_type_name VARCHAR(50) COMMENT '业务类型名称',
  amount DECIMAL(15, 2) NOT NULL COMMENT '变动金额',
  balance_before DECIMAL(15, 2) NOT NULL COMMENT '变动前余额',
  balance_after DECIMAL(15, 2) NOT NULL COMMENT '变动后余额',
  order_no VARCHAR(50) COMMENT '关联订单号',
  opposite_account_no VARCHAR(30) COMMENT '对方账户号',
  opposite_account_name VARCHAR(100) COMMENT '对方账户名',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_record_no (record_no),
  INDEX idx_account_no (account_no),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中信账户流水表';

-- ========================================
-- 8. 分润相关表
-- ========================================

-- 分润账户组表
CREATE TABLE IF NOT EXISTS profit_account_group (
  id VARCHAR(36) PRIMARY KEY COMMENT '分组ID',
  group_name VARCHAR(100) NOT NULL COMMENT '分组名称',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_mch_status (mch_no, status),
  INDEX idx_mch_no (mch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分润账户组表';

-- 分润接收方表
CREATE TABLE IF NOT EXISTS profit_receiver (
  id VARCHAR(36) PRIMARY KEY COMMENT '接收方ID',
  group_id VARCHAR(36) NOT NULL COMMENT '分组ID',
  receiver_name VARCHAR(100) NOT NULL COMMENT '接收方名称',
  receiver_type TINYINT NOT NULL COMMENT '接收方类型: 1-代理, 2-商户, 3-个人, 4-商户分润, 5-平台',
  receiver_account VARCHAR(50) NOT NULL COMMENT '接收方账户',
  share_type TINYINT NOT NULL COMMENT '分润类型: 1-比例, 2-金额',
  share_rate DECIMAL(6, 4) DEFAULT 0 COMMENT '分润比例',
  share_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '分润金额',
  priority INT DEFAULT 100 COMMENT '优先级',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分润接收方表';

-- 分润记录表
CREATE TABLE IF NOT EXISTS profit_record (
  id VARCHAR(36) PRIMARY KEY COMMENT '记录ID',
  record_no VARCHAR(50) NOT NULL UNIQUE COMMENT '分润单号',
  order_no VARCHAR(50) NOT NULL COMMENT '订单号',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  receiver_id VARCHAR(36) COMMENT '接收方ID',
  receiver_name VARCHAR(100) NOT NULL COMMENT '接收方名称',
  receiver_type TINYINT NOT NULL COMMENT '接收方类型',
  receiver_account VARCHAR(50) NOT NULL COMMENT '接收方账户',
  order_amount INT NOT NULL COMMENT '订单金额(分)',
  order_fee INT NOT NULL COMMENT '订单手续费(分)',
  share_type TINYINT NOT NULL COMMENT '分润类型',
  share_rate DECIMAL(6, 4) DEFAULT 0 COMMENT '分润比例',
  share_amount INT NOT NULL COMMENT '分润金额(分)',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-待分润, 1-已计算, 2-分账中, 3-成功, 4-失败, 5-已回滚',
  share_time DATETIME COMMENT '分润时间',
  channel_share_no VARCHAR(50) COMMENT '通道分账单号',
  fail_reason VARCHAR(255) COMMENT '失败原因',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_record_no (record_no),
  INDEX idx_order_no (order_no),
  INDEX idx_mch_no (mch_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分润记录表';

-- 分润回滚表
CREATE TABLE IF NOT EXISTS profit_rollback (
  id VARCHAR(36) PRIMARY KEY COMMENT '回滚ID',
  rollback_no VARCHAR(50) NOT NULL UNIQUE COMMENT '回滚单号',
  record_no VARCHAR(50) NOT NULL COMMENT '原分润单号',
  order_no VARCHAR(50) NOT NULL COMMENT '订单号',
  mch_no VARCHAR(20) NOT NULL COMMENT '商户号',
  receiver_id VARCHAR(36) COMMENT '接收方ID',
  receiver_name VARCHAR(100) NOT NULL COMMENT '接收方名称',
  receiver_type TINYINT NOT NULL COMMENT '接收方类型',
  receiver_account VARCHAR(50) NOT NULL COMMENT '接收方账户',
  original_share_amount INT NOT NULL COMMENT '原分润金额(分)',
  rollback_amount INT NOT NULL COMMENT '回滚金额(分)',
  reason VARCHAR(255) NOT NULL COMMENT '回滚原因',
  status TINYINT DEFAULT 1 COMMENT '状态: 1-处理中, 2-成功, 3-失败',
  complete_time DATETIME COMMENT '完成时间',
  fail_reason VARCHAR(255) COMMENT '失败原因',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_rollback_no (rollback_no),
  INDEX idx_record_no (record_no),
  INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分润回滚表';

-- ========================================
-- 9. 对账相关表
-- ========================================

-- 对账批次表
CREATE TABLE IF NOT EXISTS check_batch (
  id VARCHAR(36) PRIMARY KEY COMMENT '批次ID',
  batch_no VARCHAR(50) NOT NULL UNIQUE COMMENT '批次号',
  check_date VARCHAR(8) NOT NULL COMMENT '对账日期',
  channel_code VARCHAR(20) DEFAULT '' COMMENT '通道编码',
  channel_name VARCHAR(100) COMMENT '通道名称',
  platform_order_count INT DEFAULT 0 COMMENT '平台订单数',
  platform_total_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '平台总金额',
  channel_order_count INT DEFAULT 0 COMMENT '通道订单数',
  channel_total_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '通道总金额',
  diff_order_count INT DEFAULT 0 COMMENT '差异订单数',
  diff_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '差异金额',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-处理中, 1-成功, 2-有差异, 3-失败',
  complete_time DATETIME COMMENT '完成时间',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_date_channel (check_date, channel_code),
  INDEX idx_check_date (check_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对账批次表';

-- 通道对账单表
CREATE TABLE IF NOT EXISTS check_channel_bill (
  id VARCHAR(36) PRIMARY KEY COMMENT '账单ID',
  batch_no VARCHAR(50) COMMENT '批次号',
  channel_code VARCHAR(20) NOT NULL COMMENT '通道编码',
  order_no VARCHAR(50) NOT NULL COMMENT '订单号',
  channel_order_no VARCHAR(100) COMMENT '通道订单号',
  amount DECIMAL(15, 2) NOT NULL COMMENT '订单金额',
  fee DECIMAL(15, 2) DEFAULT 0 COMMENT '手续费',
  status VARCHAR(20) NOT NULL COMMENT '状态',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_batch_no (batch_no),
  INDEX idx_channel_code (channel_code),
  INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通道对账单表';

-- 对账差异表
CREATE TABLE IF NOT EXISTS check_diff_bill (
  id VARCHAR(36) PRIMARY KEY COMMENT '差异ID',
  batch_no VARCHAR(50) NOT NULL COMMENT '批次号',
  order_no VARCHAR(50) NOT NULL COMMENT '订单号',
  channel_order_no VARCHAR(100) COMMENT '通道订单号',
  diff_type TINYINT NOT NULL COMMENT '差异类型: 1-平台多, 2-通道多, 3-金额差异, 4-状态差异',
  platform_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '平台金额',
  channel_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '通道金额',
  diff_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '差异金额',
  platform_status VARCHAR(20) DEFAULT '' COMMENT '平台状态',
  channel_status VARCHAR(20) DEFAULT '' COMMENT '通道状态',
  handle_status TINYINT DEFAULT 0 COMMENT '处理状态: 0-未处理, 1-平台补调, 2-通道补调, 3-人工处理, 4-确认无误',
  handle_remark VARCHAR(255) COMMENT '处理备注',
  handle_time DATETIME COMMENT '处理时间',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_batch_no (batch_no),
  INDEX idx_diff_type (diff_type),
  INDEX idx_handle_status (handle_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对账差异表';

-- ========================================
-- 10. 设备相关表
-- ========================================

-- 设备信息表
CREATE TABLE IF NOT EXISTS device_info (
  id VARCHAR(36) PRIMARY KEY COMMENT '设备ID',
  device_sn VARCHAR(50) NOT NULL UNIQUE COMMENT '设备序列号',
  device_name VARCHAR(100) COMMENT '设备名称',
  device_type VARCHAR(20) NOT NULL COMMENT '设备类型: POS-刷卡, SCANNER-扫码, PRINTER-打印, SPEAKER-语音, FACE-刷脸',
  device_model VARCHAR(50) COMMENT '设备型号',
  manufacturer VARCHAR(50) COMMENT '厂商',
  mch_no VARCHAR(20) COMMENT '商户号',
  store_id VARCHAR(20) COMMENT '门店ID',
  status TINYINT DEFAULT 0 COMMENT '状态: 0-未激活, 1-已激活, 2-已禁用, 3-已报损',
  activate_code VARCHAR(20) COMMENT '激活码',
  device_secret VARCHAR(64) COMMENT '设备密钥',
  firmware_version VARCHAR(50) COMMENT '固件版本',
  battery_level INT COMMENT '电池电量',
  last_heartbeat DATETIME COMMENT '最后心跳时间',
  last_ip VARCHAR(50) COMMENT '最后IP地址',
  activate_time DATETIME COMMENT '激活时间',
  remark VARCHAR(500) COMMENT '备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_device_sn (device_sn),
  INDEX idx_mch_no (mch_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备信息表';

-- ========================================
-- 11. 开放平台相关表
-- ========================================

-- 开发者信息表
CREATE TABLE IF NOT EXISTS op_developer (
  id VARCHAR(36) PRIMARY KEY COMMENT '自增ID',
  developer_id VARCHAR(64) NOT NULL UNIQUE COMMENT '开发者ID',
  developer_name VARCHAR(100) NOT NULL COMMENT '开发者名称/公司名',
  username VARCHAR(64) NOT NULL UNIQUE COMMENT '登录账号',
  password VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
  email VARCHAR(64) NOT NULL UNIQUE COMMENT '邮箱',
  mobile VARCHAR(20) COMMENT '手机号',
  company VARCHAR(255) DEFAULT '' COMMENT '公司名称',
  business_license VARCHAR(18) DEFAULT '' COMMENT '统一社会信用代码',
  business_license_url TEXT COMMENT '营业执照图片URL',
  contact_person VARCHAR(255) DEFAULT '' COMMENT '联系人姓名',
  contact_phone VARCHAR(20) DEFAULT '' COMMENT '联系人电话',
  description TEXT COMMENT '开发者简介',
  website VARCHAR(500) DEFAULT '' COMMENT '官网地址',
  status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending-待审核, active-已激活, suspended-已停用, rejected-已拒绝',
  level VARCHAR(20) DEFAULT 'trial' COMMENT '开发者等级: trial-试用, basic-基础, professional-专业, enterprise-企业',
  app_count INT DEFAULT 0 COMMENT '已创建应用数',
  total_call_count INT DEFAULT 0 COMMENT '累计API调用次数',
  last_login_time DATETIME COMMENT '最后登录时间',
  last_login_ip VARCHAR(50) COMMENT '最后登录IP',
  review_time DATETIME COMMENT '审核时间',
  review_by VARCHAR(64) COMMENT '审核人',
  review_remark TEXT COMMENT '审核备注',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_developer_id (developer_id),
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开发者信息表';

-- 开发者应用表
CREATE TABLE IF NOT EXISTS op_app (
  id VARCHAR(36) PRIMARY KEY COMMENT '自增ID',
  app_id VARCHAR(64) NOT NULL UNIQUE COMMENT '应用ID',
  app_key VARCHAR(32) NOT NULL UNIQUE COMMENT '应用Key(AppKey)',
  app_secret VARCHAR(255) NOT NULL COMMENT '应用密钥(AppSecret)',
  developer_id VARCHAR(64) NOT NULL COMMENT '所属开发者ID',
  mch_no VARCHAR(64) NOT NULL COMMENT '商户号(关联)',
  app_name VARCHAR(128) NOT NULL COMMENT '应用名称',
  app_type VARCHAR(20) DEFAULT 'web' COMMENT '应用类型: web-网页, mobile-移动, miniapp-小程序, api-API',
  description TEXT COMMENT '应用描述',
  app_scenario TEXT COMMENT '应用场景说明',
  app_icon VARCHAR(500) COMMENT '应用图标URL',
  domain VARCHAR(500) COMMENT '正式域名',
  notify_url VARCHAR(500) COMMENT '回调地址(支付通知)',
  refund_notify_url VARCHAR(500) COMMENT '退款回调地址',
  transfer_notify_url VARCHAR(500) COMMENT '转账回调地址',
  enabled_pay_types TEXT COMMENT '已授权支付方式(JSON数组)',
  enabled_apis TEXT COMMENT '已授权API接口列表(JSON数组)',
  status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending-待审核, active-已激活, suspended-已停用, deleted-已删除',
  today_call_count INT DEFAULT 0 COMMENT '今日API调用次数',
  total_call_count INT DEFAULT 0 COMMENT '累计API调用次数',
  month_call_count INT DEFAULT 0 COMMENT '当月API调用次数',
  month_trade_amount DECIMAL(15,2) DEFAULT 0 COMMENT '本月累计交易金额(元)',
  ip_whitelist_count INT DEFAULT 0 COMMENT 'IP白名单数量',
  ip_whitelist TEXT COMMENT 'IP白名单(JSON数组)',
  secret_update_time DATETIME COMMENT '秘钥最后更新时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_app_id (app_id),
  INDEX idx_developer_id (developer_id),
  INDEX idx_mch_no (mch_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开发者应用表';

-- API密钥表
CREATE TABLE IF NOT EXISTS op_api_key (
  id VARCHAR(36) PRIMARY KEY COMMENT '密钥ID',
  key_id VARCHAR(32) NOT NULL UNIQUE COMMENT '密钥ID',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  dev_no VARCHAR(20) NOT NULL COMMENT '开发者编号',
  key_value VARCHAR(64) NOT NULL COMMENT '密钥Key',
  key_secret VARCHAR(128) NOT NULL COMMENT '密钥Secret(加密)',
  sign_type VARCHAR(20) DEFAULT 'hmac_sha256' COMMENT '签名类型: hmac_sha256, rsa_2048, sm2',
  alias VARCHAR(100) COMMENT '密钥别名',
  bound_ip VARCHAR(255) COMMENT '绑定IP',
  status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active-激活, disabled-禁用',
  expire_time DATETIME COMMENT '过期时间',
  last_used_time DATETIME COMMENT '最后使用时间',
  last_used_ip VARCHAR(50) COMMENT '最后使用IP',
  used_count INT DEFAULT 0 COMMENT '使用次数',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_key_id (key_id),
  INDEX idx_app_id (app_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API密钥表';

-- Webhook配置表
CREATE TABLE IF NOT EXISTS op_webhook (
  id VARCHAR(36) PRIMARY KEY COMMENT 'Webhook ID',
  webhook_id VARCHAR(32) NOT NULL UNIQUE COMMENT 'Webhook标识',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  dev_no VARCHAR(20) NOT NULL COMMENT '开发者编号',
  name VARCHAR(100) NOT NULL COMMENT 'Webhook名称',
  url VARCHAR(500) NOT NULL COMMENT '回调地址',
  secret VARCHAR(128) COMMENT '加密密钥',
  event_types VARCHAR(500) COMMENT '订阅事件类型(JSON数组)',
  status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active-启用, disabled-停用',
  sign_type VARCHAR(20) DEFAULT 'hmac_sha256' COMMENT '签名类型',
  retry_count INT DEFAULT 3 COMMENT '重试次数',
  timeout INT DEFAULT 30 COMMENT '超时时间(秒)',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_webhook_id (webhook_id),
  INDEX idx_app_id (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Webhook配置表';

-- API调用日志表
CREATE TABLE IF NOT EXISTS op_api_log (
  id VARCHAR(36) PRIMARY KEY COMMENT '日志ID',
  log_id VARCHAR(64) NOT NULL UNIQUE COMMENT '日志标识',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  dev_no VARCHAR(20) NOT NULL COMMENT '开发者编号',
  api_path VARCHAR(200) NOT NULL COMMENT 'API路径',
  api_method VARCHAR(10) NOT NULL COMMENT '请求方法',
  request_body TEXT COMMENT '请求体',
  response_body TEXT COMMENT '响应体',
  client_ip VARCHAR(50) COMMENT '客户端IP',
  user_agent VARCHAR(500) COMMENT '用户代理',
  result VARCHAR(20) DEFAULT 'success' COMMENT '结果: success-成功, error-失败, timeout-超时',
  error_code VARCHAR(50) COMMENT '错误码',
  error_msg VARCHAR(500) COMMENT '错误信息',
  response_time INT DEFAULT 0 COMMENT '响应时间(毫秒)',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_app_id (app_id),
  INDEX idx_api_path (api_path),
  INDEX idx_result (result),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API调用日志表';

-- API配额表
CREATE TABLE IF NOT EXISTS op_api_quota (
  id VARCHAR(36) PRIMARY KEY COMMENT '配额ID',
  app_id VARCHAR(32) NOT NULL COMMENT '应用ID',
  dev_no VARCHAR(20) NOT NULL COMMENT '开发者编号',
  quota_type VARCHAR(20) NOT NULL COMMENT '配额类型: daily-日配额, monthly-月配额',
  quota_used INT DEFAULT 0 COMMENT '已使用配额',
  quota_limit INT DEFAULT 1000 COMMENT '配额上限',
  quota_reset_time DATETIME COMMENT '配额重置时间',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_app_quota_type (app_id, quota_type),
  INDEX idx_app_id (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API配额表';

-- ========================================
-- 12. 统计相关表 (可选，根据需求创建)
-- ========================================

-- 交易统计表
CREATE TABLE IF NOT EXISTS stat_trade (
  id VARCHAR(36) PRIMARY KEY COMMENT '统计ID',
  stat_date VARCHAR(8) NOT NULL COMMENT '统计日期',
  stat_type VARCHAR(20) NOT NULL COMMENT '统计类型: DAY-日, MONTH-月',
  mch_no VARCHAR(20) COMMENT '商户号',
  channel_code VARCHAR(20) COMMENT '通道编码',
  pay_way VARCHAR(20) COMMENT '支付方式',
  order_count INT DEFAULT 0 COMMENT '订单数量',
  order_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '订单金额',
  success_count INT DEFAULT 0 COMMENT '成功数量',
  success_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '成功金额',
  refund_count INT DEFAULT 0 COMMENT '退款数量',
  refund_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '退款金额',
  fee DECIMAL(15, 2) DEFAULT 0 COMMENT '手续费',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_date_type_mch_channel_payway (stat_date, stat_type, mch_no, channel_code, pay_way),
  INDEX idx_stat_date (stat_date),
  INDEX idx_mch_no (mch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易统计表';
`;

/**
 * 执行迁移
 */
async function runMigration() {
  try {
    console.log('开始数据库迁移...');
    console.log(`连接数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`);

    await dataSource.initialize();
    console.log('数据库连接成功');

    // 执行创建表语句
    const statements = createTablesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await dataSource.query(statement);
        console.log('✓ 执行成功:', statement.slice(0, 80) + '...');
      } catch (error: any) {
        // 忽略表已存在的错误
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⊘ 表已存在，跳过');
        } else {
          console.error('✗ 执行失败:', error.message);
        }
      }
    }

    // 插入默认数据
    await insertDefaultData();

    console.log('\n数据库迁移完成!');
    await dataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('迁移失败:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

/**
 * 插入默认数据
 */
async function insertDefaultData() {
  console.log('\n插入默认数据...');

  // 插入管理员用户 (密码: admin123)
  const adminPassword = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH';
  
  try {
    await dataSource.query(`
      INSERT IGNORE INTO sys_user (id, username, password, nick_name, email, status, user_type, create_time, update_time)
      VALUES ('1', 'admin', '${adminPassword}', '管理员', 'admin@dgkj.com', 1, 'system', NOW(), NOW())
    `);
    console.log('✓ 管理员用户已创建 (admin/admin123)');

    // 插入默认角色
    await dataSource.query(`
      INSERT IGNORE INTO sys_role (id, role_name, role_key, role_sort, status, create_time)
      VALUES 
        ('1', '超级管理员', 'superadmin', 1, 1, NOW()),
        ('2', '运营管理员', 'admin', 2, 1, NOW()),
        ('3', '商户', 'mch', 3, 1, NOW()),
        ('4', '代理商', 'agent', 4, 1, NOW())
    `);
    console.log('✓ 默认角色已创建');

    // 插入默认支付通道
    await dataSource.query(`
      INSERT IGNORE INTO channel_info (id, channel_code, channel_name, channel_type, status, create_time)
      VALUES 
        ('1', 'WECHAT', '微信支付', 1, 1, NOW()),
        ('2', 'ALIPAY', '支付宝', 2, 1, NOW()),
        ('3', 'UNIONPAY', '银联支付', 3, 1, NOW())
    `);
    console.log('✓ 默认支付通道已创建');

  } catch (error: any) {
    console.error('插入默认数据失败:', error.message);
  }
}

// 执行迁移
runMigration();
