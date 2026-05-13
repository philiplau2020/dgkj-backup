# 部署步骤

## 1. 后端部署

后端代码已构建完成，生成的文件在 `D:\DGKJ\server\dist`

请手动执行以下步骤：

```bash
# 1. 连接到服务器
ssh root@120.78.7.180

# 2. 进入后端目录
cd /opt/dgkj-server

# 3. 备份当前代码
cp -r dist dist.bak.$(date +%Y%m%d)

# 4. 替换后端代码（在本机执行上传）
# 将 D:\DGKJ\server\dist 目录下的所有文件上传到 /opt/dgkj-server/dist/

# 5. 重启后端服务
pm2 restart dgkj-server

# 6. 检查日志
pm2 logs dgkj-server --lines 20
```

## 2. 前端部署

前端构建完成，生成的文件在 `D:\DGKJ\dist`

请手动执行以下步骤：

```bash
# 在本机执行上传（需要手动输入密码）
scp -r D:\DGKJ\dist\* root@120.78.7.180:/www/dgkj/admin/
```

## 3. 验证

```bash
# 在服务器上执行
curl http://localhost:3000/basic-api/sys/config/list
```

## 修复内容

本次修复了系统配置保存不生效的问题：

1. **后端修复** (`server/src/modules/sys/`):
   - 新增 `POST /basic-api/sys/config` 新增配置接口
   - 修改 `PUT /basic-api/sys/config/:id` 按ID更新配置
   - 新增 `DELETE /basic-api/sys/config/:id` 删除配置接口
   - 修复 `getConfigList` 支持分页和搜索

2. **实体修复** (`server/src/database/entities/sys.entity.ts`):
   - 添加 `groupName` 和 `status` 字段

3. **前端修复** (`src/views/sys/config/index.vue`):
   - 编辑时使用正确的 PUT 接口和ID参数
   - 添加删除功能

4. **数据库更新**:
   需要在数据库中添加缺失的字段：

```sql
-- 连接到服务器数据库
mysql -u dgkj -p Dgkj@2024 dgkj

-- 为 sys_config 表添加缺失字段
ALTER TABLE sys_config ADD COLUMN group_name VARCHAR(64) DEFAULT NULL;
ALTER TABLE sys_config ADD COLUMN status INT DEFAULT 1;

-- 验证
DESCRIBE sys_config;
```
