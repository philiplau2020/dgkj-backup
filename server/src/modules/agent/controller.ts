import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { AgentInfo, AgentProfit, AgentWithdraw } from '../../database/entities/agent.entity';

export class AgentController {
  private agentRepo = AppDataSource.getRepository(AgentInfo);
  private profitRepo = AppDataSource.getRepository(AgentProfit);
  private withdrawRepo = AppDataSource.getRepository(AgentWithdraw);

  // ============== Agent Info ==============
  async getAgentList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, agentNo, agentName, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.agentRepo.createQueryBuilder('agent');

      if (agentNo) queryBuilder.andWhere('agent.agentNo LIKE :agentNo', { agentNo: `%${agentNo}%` });
      if (agentName) queryBuilder.andWhere('agent.agentName LIKE :agentName', { agentName: `%${agentName}%` });
      if (status !== undefined) queryBuilder.andWhere('agent.status = :status', { status });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('agent.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getAgentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agent = await this.agentRepo.findOne({ where: { id } });
      if (!agent) return res.status(404).json({ code: 404, message: '代理商不存在', data: null, timestamp: new Date().toISOString() });
      res.json({ code: 0, message: 'success', data: agent, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentName, parentId, level, contactName, contactPhone, contactEmail, province, city, district, address, bankName, bankAccount, bankUsername } = req.body;

      const agentNo = 'A' + Date.now();
      const agent = this.agentRepo.create({
        id: uuidv4(),
        agentNo,
        agentName,
        parentId,
        level: level || 1,
        contactName,
        contactPhone,
        contactEmail,
        province,
        city,
        district,
        address,
        bankName,
        bankAccount,
        bankUsername,
        status: 2, // Pending review
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.agentRepo.save(agent);
      res.json({ code: 0, message: '创建成功', data: agent, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.agentRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async reviewAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reviewRemark } = req.body;
      await this.agentRepo.update(id, {
        status,
        reviewRemark,
        reviewTime: new Date(),
        reviewUserId: req.user?.userId,
        updateTime: new Date(),
      });
      res.json({ code: 0, message: '审核成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Profit Management ==============
  async getProfitList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, agentNo, tradeType } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.profitRepo.createQueryBuilder('profit');
      if (agentNo) queryBuilder.andWhere('profit.agentNo = :agentNo', { agentNo });
      if (tradeType) queryBuilder.andWhere('profit.tradeType = :tradeType', { tradeType });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('profit.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Withdraw Management ==============
  async getWithdrawList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, agentNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.withdrawRepo.createQueryBuilder('withdraw');
      if (agentNo) queryBuilder.andWhere('withdraw.agentNo = :agentNo', { agentNo });
      if (status !== undefined) queryBuilder.andWhere('withdraw.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('withdraw.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createWithdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentNo, amount, bankName, bankAccount, bankUsername } = req.body;

      const withdrawNo = 'W' + Date.now();
      const fee = amount * 0.006; // 0.6% fee
      const actualAmount = amount - fee;

      const withdraw = this.withdrawRepo.create({
        id: uuidv4(),
        withdrawNo,
        agentNo,
        amount,
        fee,
        actualAmount,
        bankName,
        bankAccount,
        bankUsername,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.withdrawRepo.save(withdraw);

      // Freeze the amount
      const agent = await this.agentRepo.findOne({ where: { agentNo } });
      if (agent) {
        await this.agentRepo.update(agent.id, {
          balance: agent.balance - amount,
          frozenBalance: agent.frozenBalance + amount,
          updateTime: new Date(),
        });
      }

      res.json({ code: 0, message: '申请成功', data: withdraw, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async reviewWithdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, failReason } = req.body;

      const withdraw = await this.withdrawRepo.findOne({ where: { id } });
      if (!withdraw) return res.status(404).json({ code: 404, message: '提现记录不存在', data: null, timestamp: new Date().toISOString() });

      if (status === 2) { // Success
        await this.withdrawRepo.update(id, {
          status: 2,
          completeTime: new Date(),
          updateTime: new Date(),
        });

        const agent = await this.agentRepo.findOne({ where: { agentNo: withdraw.agentNo } });
        if (agent) {
          await this.agentRepo.update(agent.id, {
            frozenBalance: agent.frozenBalance - withdraw.amount,
            updateTime: new Date(),
          });
        }
      } else if (status === 3) { // Failed
        await this.withdrawRepo.update(id, {
          status: 3,
          failReason,
          updateTime: new Date(),
        });

        const agent = await this.agentRepo.findOne({ where: { agentNo: withdraw.agentNo } });
        if (agent) {
          await this.agentRepo.update(agent.id, {
            balance: agent.balance + withdraw.amount,
            frozenBalance: agent.frozenBalance - withdraw.amount,
            updateTime: new Date(),
          });
        }
      }

      res.json({ code: 0, message: '审核成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Audit List ==============
  async getAuditList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.agentRepo.createQueryBuilder('agent');
      if (status !== undefined) queryBuilder.andWhere('agent.status = :status', { status });
      else queryBuilder.andWhere('agent.status = 2'); // Default to pending

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('agent.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Agent Info (for current user) ==============
  async getAgentInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ code: 401, message: '未登录', data: null });

      const agent = await this.agentRepo.findOne({ where: { id: userId } });
      if (!agent) return res.status(404).json({ code: 404, message: '代理商不存在', data: null });

      res.json({ code: 0, message: 'success', data: agent, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Agent Stats ==============
  async getAgentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      let agentNo: string | undefined;

      if (userId) {
        const agent = await this.agentRepo.findOne({ where: { id: userId } });
        agentNo = agent?.agentNo;
      }

      const whereCondition = agentNo ? { agentNo } : {};

      const totalProfit = await this.profitRepo.count({ where: whereCondition });
      const totalWithdraw = await this.withdrawRepo.count({ where: { ...whereCondition, status: 2 } });
      const pendingWithdraw = await this.withdrawRepo.count({ where: { ...whereCondition, status: 0 } });

      res.json({
        code: 0,
        message: 'success',
        data: {
          totalProfit,
          totalWithdraw,
          pendingWithdraw,
          totalAmount: 0,
          totalCount: 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentController();
