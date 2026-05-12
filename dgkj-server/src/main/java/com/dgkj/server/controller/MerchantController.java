package com.dgkj.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dgkj.server.demo.Result;
import com.dgkj.server.entity.MchMerchant;
import com.dgkj.server.mapper.MchMerchantMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mch/merchant")
public class MerchantController {

    @Autowired
    private MchMerchantMapper merchantMapper;

    @GetMapping("/list")
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String mchName,
            @RequestParam(required = false) String status) {
        
        Page<MchMerchant> page = new Page<>(pageNo, pageSize);
        QueryWrapper<MchMerchant> wrapper = new QueryWrapper<>();
        if (mchName != null && !mchName.isEmpty()) {
            wrapper.like("mch_name", mchName);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq("status", status);
        }
        
        Page<MchMerchant> result = merchantMapper.selectPage(page, wrapper);
        
        Map<String, Object> data = new HashMap<>();
        data.put("list", result.getRecords());
        data.put("total", result.getTotal());
        data.put("pageNo", result.getCurrent());
        data.put("pageSize", result.getSize());
        return Result.ok(data);
    }

    @GetMapping("/{id}")
    public Result<MchMerchant> getById(@PathVariable Long id) {
        MchMerchant merchant = merchantMapper.selectById(id);
        return Result.ok(merchant);
    }
}
