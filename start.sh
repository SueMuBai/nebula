#!/bin/bash

# Nebula Application Startup Script

echo "=== Nebula 星云应用启动脚本 ==="

# 检查 Java 环境
if ! command -v java &> /dev/null; then
    echo "❌ Java 未安装，请安装 Java 21 或更高版本"
    echo "   Ubuntu/Debian: sudo apt install openjdk-21-jdk"
    echo "   CentOS/RHEL: sudo yum install java-21-openjdk"
    exit 1
fi

# 检查 Maven 环境
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven 未安装，请安装 Maven"
    echo "   Ubuntu/Debian: sudo apt install maven"
    echo "   CentOS/RHEL: sudo yum install maven"
    exit 1
fi

echo "✅ 环境检查通过"

# 编译项目
echo "📦 正在编译项目..."
mvn clean compile

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

echo "✅ 编译成功"

# 启动应用
echo "🚀 正在启动 Nebula 应用..."
echo "   访问地址: http://localhost:8080"
echo "   前端页面: http://localhost:8080/index.html"
echo ""
echo "按 Ctrl+C 停止应用"
echo ""

mvn spring-boot:run