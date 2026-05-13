import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SysUser, SysRole, SysDept, SysMenu, SysUserRole, SysRoleMenu, SysDict, SysDictData, SysConfig, SysLog, SysNotice } from '../database/entities/sys.entity';
import { AgentInfo, AgentProfit, AgentWithdraw } from '../database/entities/agent.entity';
import { MchInfo, MchApp, MchStore, MchRate } from '../database/entities/mch.entity';
import { PayOrder, RefundOrder, TransferOrder, TradeNotify } from '../database/entities/trade.entity';
import { AccountInfo, AccountRecord, AccountSettlement, AccountWithdraw, AccountStatement } from '../database/entities/finance.entity';
import { ChannelInfo, ChannelMch, ChannelRoute, PoolStrategy, PoolChannel, PoolConfig } from '../database/entities/channel.entity';
import { CiticAccount, CiticCard, CiticCollection, CiticProfitShare, CiticTransfer, CiticSettlement, CiticCheck, CiticAccountRecord } from '../database/entities/citic.entity';
import { StatTrade, StatMch, StatAgent, StatChannel, StatFinance } from '../database/entities/statistics.entity';
import { DeviceInfo, DeviceActivationCode, DeviceBinding } from '../database/entities/device.entity';
import { CheckBatch, CheckChannelBill, CheckDiffBill } from '../database/entities/check.entity';
import { ProfitAccountGroup, ProfitReceiver, ProfitRecord, ProfitRollback } from '../database/entities/profit.entity';
import { OpDeveloper } from '../modules/open/entity/developer.entity';
import { OpApp } from '../modules/open/entity/app.entity';
import { OpApiKey } from '../modules/open/entity/api-key.entity';
import { OpWebhook } from '../modules/open/entity/webhook.entity';
import { OpApiLog } from '../modules/open/entity/api-log.entity';
import { OpApiQuota } from '../modules/open/entity/quota.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'dgkj',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    SysUser, SysRole, SysDept, SysMenu, SysUserRole, SysRoleMenu, SysDict, SysDictData, SysConfig, SysLog, SysNotice,
    AgentInfo, AgentProfit, AgentWithdraw,
    MchInfo, MchApp, MchStore, MchRate,
    PayOrder, RefundOrder, TransferOrder, TradeNotify,
    AccountInfo, AccountRecord, AccountSettlement, AccountWithdraw, AccountStatement,
    ChannelInfo, ChannelMch, ChannelRoute, PoolStrategy, PoolChannel, PoolConfig,
    CiticAccount, CiticCard, CiticCollection, CiticProfitShare, CiticTransfer, CiticSettlement, CiticCheck, CiticAccountRecord,
    StatTrade, StatMch, StatAgent, StatChannel, StatFinance,
    DeviceInfo, DeviceActivationCode, DeviceBinding,
    CheckBatch, CheckChannelBill, CheckDiffBill,
    ProfitAccountGroup, ProfitReceiver, ProfitRecord, ProfitRollback,
    OpDeveloper, OpApp, OpApiKey, OpWebhook, OpApiLog, OpApiQuota,
  ],
  migrations: [__dirname + '/../database/migrations/**/*.ts'],
  subscribers: [],
});
