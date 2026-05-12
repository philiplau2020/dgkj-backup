package com.dgkj.server.controller;

import com.dgkj.server.demo.Result;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> req) {
        String username = req.get("username");
        String password = req.get("password");
        
        if ("admin".equals(username) && "admin123".equals(password)) {
            Map<String, Object> data = new HashMap<>();
            data.put("token", "mock-jwt-token-" + UUID.randomUUID());
            data.put("userInfo", Map.of(
                "id", 1,
                "username", "admin",
                "nickname", "管理员",
                "avatar", "",
                "roles", new String[]{"admin"}
            ));
            return Result.ok(data);
        }
        return Result.error(401, "用户名或密码错误");
    }

    @GetMapping("/userinfo")
    public Result<Map<String, Object>> getUserInfo() {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", 1);
        userInfo.put("username", "admin");
        userInfo.put("nickname", "管理员");
        userInfo.put("avatar", "");
        userInfo.put("roles", new String[]{"admin"});
        return Result.ok(userInfo);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.ok();
    }
}
