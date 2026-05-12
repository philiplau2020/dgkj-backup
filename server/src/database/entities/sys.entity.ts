import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1,
}

export enum UserType {
  SUPER_ADMIN = 0,
  ADMIN = 1,
  AGENT = 2,
  MERCHANT = 3,
}

@Entity('sys_user')
export class SysUser {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'username', length: 64, unique: true })
  username: string;

  @Column({ name: 'password', length: 255 })
  password: string;

  @Column({ name: 'nickname', length: 64 })
  nickname: string;

  @Column({ name: 'email', length: 128, nullable: true })
  email: string;

  @Column({ name: 'mobile', length: 32, nullable: true })
  mobile: string;

  @Column({ name: 'avatar', length: 255, nullable: true })
  avatar: string;

  @Column({ name: 'dept_id', length: 64, nullable: true })
  deptId: string;

  @Column({ name: 'user_type', type: 'tinyint', default: UserType.ADMIN })
  userType: UserType;

  @Column({ name: 'status', type: 'tinyint', default: UserStatus.ENABLED })
  status: UserStatus;

  @Column({ name: 'last_login_ip', length: 64, nullable: true })
  lastLoginIp: string;

  @Column({ name: 'last_login_time', nullable: true })
  lastLoginTime: Date;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('sys_role')
export class SysRole {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'role_name', length: 64 })
  roleName: string;

  @Column({ name: 'role_code', length: 64, unique: true })
  roleCode: string;

  @Column({ name: 'role_desc', length: 255, nullable: true })
  roleDesc: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('sys_dept')
export class SysDept {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'parent_id', length: 64, default: '0' })
  parentId: string;

  @Column({ name: 'dept_name', length: 64 })
  deptName: string;

  @Column({ name: 'dept_code', length: 64, nullable: true })
  deptCode: string;

  @Column({ name: 'leader', length: 64, nullable: true })
  leader: string;

  @Column({ name: 'phone', length: 32, nullable: true })
  phone: string;

  @Column({ name: 'email', length: 128, nullable: true })
  email: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('sys_menu')
export class SysMenu {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'parent_id', length: 64, default: '0' })
  parentId: string;

  @Column({ name: 'menu_name', length: 64 })
  menuName: string;

  @Column({ name: 'menu_code', length: 64, nullable: true })
  menuCode: string;

  @Column({ name: 'icon', length: 64, nullable: true })
  icon: string;

  @Column({ name: 'path', length: 255, nullable: true })
  path: string;

  @Column({ name: 'component', length: 255, nullable: true })
  component: string;

  @Column({ name: 'redirect', length: 255, nullable: true })
  redirect: string;

  @Column({ name: 'menu_type', type: 'tinyint', default: 1 })
  menuType: number;

  @Column({ name: 'visible', type: 'tinyint', default: 1 })
  visible: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'perms', length: 255, nullable: true })
  perms: string;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @Column({ name: 'keep_alive', type: 'tinyint', default: 1 })
  keepAlive: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('sys_user_role')
export class SysUserRole {
  @PrimaryColumn({ name: 'user_id', length: 64 })
  userId: string;

  @PrimaryColumn({ name: 'role_id', length: 64 })
  roleId: string;
}

@Entity('sys_role_menu')
export class SysRoleMenu {
  @PrimaryColumn({ name: 'role_id', length: 64 })
  roleId: string;

  @PrimaryColumn({ name: 'menu_id', length: 64 })
  menuId: string;
}

@Entity('sys_dict')
export class SysDict {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'dict_name', length: 64 })
  dictName: string;

  @Column({ name: 'dict_code', length: 64, unique: true })
  dictCode: string;

  @Column({ name: 'description', length: 255, nullable: true })
  description: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('sys_dict_data')
export class SysDictData {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'dict_id', length: 64 })
  dictId: string;

  @Column({ name: 'dict_label', length: 64 })
  dictLabel: string;

  @Column({ name: 'dict_value', length: 64 })
  dictValue: string;

  @Column({ name: 'dict_type', length: 64, nullable: true })
  dictType: string;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @Column({ name: 'css_class', length: 64, nullable: true })
  cssClass: string;

  @Column({ name: 'list_class', length: 64, nullable: true })
  listClass: string;

  @Column({ name: 'is_default', type: 'tinyint', default: 0 })
  isDefault: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('sys_config')
export class SysConfig {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'config_name', length: 64 })
  configName: string;

  @Column({ name: 'config_key', length: 64, unique: true })
  configKey: string;

  @Column({ name: 'config_value', type: 'text' })
  configValue: string;

  @Column({ name: 'config_type', length: 32, nullable: true })
  configType: string;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('sys_log')
export class SysLog {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'user_id', length: 64, nullable: true })
  userId: string;

  @Column({ name: 'username', length: 64, nullable: true })
  username: string;

  @Column({ name: 'operation', length: 64 })
  operation: string;

  @Column({ name: 'method', length: 64 })
  method: string;

  @Column({ name: 'url', length: 255 })
  url: string;

  @Column({ name: 'ip', length: 64, nullable: true })
  ip: string;

  @Column({ name: 'location', length: 128, nullable: true })
  location: string;

  @Column({ name: 'params', type: 'text', nullable: true })
  params: string;

  @Column({ name: 'result', type: 'text', nullable: true })
  result: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'error_msg', type: 'text', nullable: true })
  errorMsg: string;

  @Column({ name: 'duration', type: 'int', nullable: true })
  duration: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('sys_notice')
export class SysNotice {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'notice_title', length: 128 })
  noticeTitle: string;

  @Column({ name: 'notice_type', type: 'tinyint' })
  noticeType: number;

  @Column({ name: 'notice_content', type: 'text' })
  noticeContent: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
