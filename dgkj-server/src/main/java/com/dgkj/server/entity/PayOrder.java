package com.dgkj.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("pay_order")
public class PayOrder {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String orderNo;
    private String mchNo;
    private String mchName;
    private BigDecimal amount;
    private String currency;
    private Integer status;
    private String payChannel;
    private String channelOrderNo;
    private String payTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
