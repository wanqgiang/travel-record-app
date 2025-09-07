#!/bin/bash

# 优化记录脚本
# 使用方法: ./log_optimization.sh

echo "📝 旅行记录应用 - 优化记录工具"
echo "================================"

# 获取当前日期和时间
CURRENT_DATE=$(date "+%Y-%m-%d")
CURRENT_TIME=$(date "+%H:%M")
CURRENT_DATETIME="$CURRENT_DATE $CURRENT_TIME"

# 获取最新的commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

echo ""
echo "📊 当前状态："
echo "时间: $CURRENT_DATETIME"
echo "提交: $COMMIT_HASH"
echo ""

# 优化记录输入
echo "🎯 请输入优化信息："
echo ""

read -p "优化名称 (例如: 深色模式支持): " OPT_NAME
echo ""

read -p "优化目的 (为什么要做这个优化): " OPT_PURPOSE
echo ""

read -p "主要优化内容 (用逗号分隔): " OPT_CONTENT
echo ""

read -p "采用的技术方法: " OPT_METHOD
echo ""

read -p "预期效果评估: " OPT_EFFECT
echo ""

# 生成优化记录
OPTIMIZATION_RECORD="
---

### 🎯 优化$(date +%s | tail -c 2)：$OPT_NAME
**优化时间：** $CURRENT_DATETIME
**提交哈希：** $COMMIT_HASH

#### 🎯 优化目的
$OPT_PURPOSE

#### 🔧 优化内容
$OPT_CONTENT

#### 🛠️ 优化方法
$OPT_METHOD

#### 📊 效果评估
$OPT_EFFECT

#### 📁 涉及文件
$(git diff --name-only HEAD~1 HEAD | sed 's/^/- /')

#### 🔍 代码变更统计
$(git diff --stat HEAD~1 HEAD)

"

# 追加到优化历史文件
echo "$OPTIMIZATION_RECORD" >> OPTIMIZATION_HISTORY.md

echo "✅ 优化记录已添加到 OPTIMIZATION_HISTORY.md"
echo ""

# 询问是否要提交记录
read -p "是否要提交这次优化记录? (y/n): " COMMIT_CHOICE

if [[ $COMMIT_CHOICE =~ ^[Yy]$ ]]; then
    git add OPTIMIZATION_HISTORY.md
    git commit -m "📝 记录优化: $OPT_NAME

优化目的: $OPT_PURPOSE
优化时间: $CURRENT_DATETIME"
    
    echo "✅ 优化记录已提交到Git"
    echo ""
    
    read -p "是否要推送到远程仓库? (y/n): " PUSH_CHOICE
    if [[ $PUSH_CHOICE =~ ^[Yy]$ ]]; then
        git push
        echo "🚀 优化记录已推送到远程仓库"
    fi
else
    echo "ℹ️ 优化记录已保存到本地文件"
fi

echo ""
echo "📖 查看完整优化历程："
echo "cat OPTIMIZATION_HISTORY.md"
echo ""
echo "🎉 优化记录完成！继续保持优秀的开发习惯！"
