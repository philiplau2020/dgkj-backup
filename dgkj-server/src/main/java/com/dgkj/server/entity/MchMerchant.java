package com.dgkj.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("mch_merchant")
public class MchMerchant {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String mchNo;
    private String mchName;
    private Integer mchType;
    private Integer status;
    private Integer auditStatus;
    private BigDecimal balance;
    private BigDecimal rate;
    private String contactName;
    private String contactMobile;
    private String contactEmail;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
