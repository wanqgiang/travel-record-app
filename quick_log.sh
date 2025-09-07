#!/bin/bash

# 快速优化记录脚本
# 使用方法: ./quick_log.sh "优化名称" "优化目的" "主要方法"

if [ $# -eq 0 ]; then
    echo "📝 快速优化记录"
    echo "使用方法: ./quick_log.sh \"优化名称\" \"优化目的\" \"主要方法\""
    echo "例如: ./quick_log.sh \"深色模式\" \"提升夜间使用体验\" \"CSS变量+主题切换\""
    exit 1
fi

OPT_NAME="$1"
OPT_PURPOSE="$2"
OPT_METHOD="$3"

CURRENT_DATETIME=$(date "+%Y-%m-%d %H:%M")
COMMIT_HASH=$(git rev-parse --short HEAD)

# 简化的记录格式
QUICK_RECORD="
### 🎯 $OPT_NAME
**时间：** $CURRENT_DATETIME | **提交：** $COMMIT_HASH
**目的：** $OPT_PURPOSE
**方法：** $OPT_METHOD
**文件：** $(git diff --name-only HEAD~1 HEAD | tr '\n' ', ' | sed 's/,$//')

---
"

# 追加到文件开头（最新记录在顶部）
if [ -f "OPTIMIZATION_HISTORY.md" ]; then
    # 在标题后插入新记录
    sed -i '' '/^## 📅.*优化记录$/r /dev/stdin' OPTIMIZATION_HISTORY.md <<< "$QUICK_RECORD"
else
    echo "❌ OPTIMIZATION_HISTORY.md 文件不存在"
    exit 1
fi

echo "✅ 快速记录已添加: $OPT_NAME"
echo "📖 查看记录: head -20 OPTIMIZATION_HISTORY.md"
