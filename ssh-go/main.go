package main

import (
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"os/exec"

	"golang.org/x/crypto/ssh"
)

func main() {
	host := "120.78.7.180"
	port := "22"
	user := "root"
	pass := "Dogootech88"

	// SSH client configuration
	config := &ssh.ClientConfig{
		User: user,
		HostKeyCallback: func(hostname string, remote net.Addr) (ssh.PublicKey, error) {
			return nil, nil
		},
		Auth: []ssh.AuthMethod{
			ssh.Password(pass),
		},
	}

	// Connect to SSH server
	addr := fmt.Sprintf("%s:%s", host, port)
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		log.Fatalf("连接失败: %v", err)
	}
	defer client.Close()

	// Create session
	session, err := client.NewSession()
	if err != nil {
		log.Fatalf("创建会话失败: %v", err)
	}
	defer session.Close()

	// Run commands
	cmds := []string{
		"uname -a",
		"java -version 2>&1",
		"mysql --version 2>&1",
		"free -h",
	}

	for _, cmd := range cmds {
		fmt.Printf("\n=== 执行: %s ===\n", cmd)
		output, err := session.CombinedOutput(cmd)
		if err != nil {
			fmt.Printf("错误: %v\n", err)
		}
		fmt.Print(string(output))
	}
}
