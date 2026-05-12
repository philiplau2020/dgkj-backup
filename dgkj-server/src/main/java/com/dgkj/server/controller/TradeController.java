package com.dgkj.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dgkj.server.demo.Result;
import com.dgkj.server.entity.PayOrder;
import com.dgkj.server.mapper.PayOrderMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/trade/pay/order")
public class TradeController {

    @Autowired
    private PayOrderMapper orderMapper;

    @GetMapping("/list")
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String mchNo,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) Integer status) {
        
        Page<PayOrder> page = new Page<>(pageNo, pageSize);
        QueryWrapper<PayOrder> wrapper = new QueryWrapper<>();
        if (mchNo != null && !mchNo.isEmpty()) {
            wrapper.eq("mch_no", mchNo);
        }
        if (orderNo != null && !orderNo.isEmpty()) {
            wrapper.like("order_no", orderNo);
        }
        if (status != null) {
            wrapper.eq("status", status);
        }
        wrapper.orderByDesc("create_time");
        
        Page<PayOrder> result = orderMapper.selectPage(page, wrapper);
        
        Map<String, Object> data = new HashMap<>();
        data.put("list", result.getRecords());
        data.put("total", result.getTotal());
        data.put("pageNo", result.getCurrent());
        data.put("pageSize", result.getSize());
        return Result.ok(data);
    }

    @GetMapping("/{id}")
    public Result<PayOrder> getById(@PathVariable Long id) {
        PayOrder order = orderMapper.selectById(id);
        return Result.ok(order);
    }
}
