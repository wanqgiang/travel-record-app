#!/bin/bash

# 便捷提交脚本 - 自动版本递增
# 使用方法: ./commit.sh "提交信息" [版本类型]

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}错误: 请提供提交信息${NC}"
    echo -e "${BLUE}使用方法: $0 \"提交信息\" [版本类型]${NC}"
    echo -e "${BLUE}版本类型: patch(默认), minor, major${NC}"
    exit 1
fi

COMMIT_MSG="$1"
VERSION_TYPE="${2:-patch}"

echo -e "${BLUE}🚀 开始提交流程...${NC}"
echo -e "${BLUE}提交信息: $COMMIT_MSG${NC}"
echo -e "${BLUE}版本类型: $VERSION_TYPE${NC}"

# 检查工作区状态
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  没有更改需要提交${NC}"
    exit 0
fi

# 显示当前状态
echo -e "${BLUE}📋 当前Git状态:${NC}"
git status --short

# 添加所有更改
echo -e "${BLUE}📦 添加所有更改到暂存区...${NC}"
git add .

# 根据版本类型手动更新版本号
if [ -f "./update_version.sh" ]; then
    echo -e "${BLUE}🔢 更新版本号 ($VERSION_TYPE)...${NC}"
    ./update_version.sh "$VERSION_TYPE"
else
    echo -e "${YELLOW}⚠️  版本更新脚本不存在，使用默认递增${NC}"
fi

# 提交更改
echo -e "${BLUE}💾 提交更改...${NC}"
git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 提交成功!${NC}"
    
    # 显示最新提交信息
    echo -e "${BLUE}📝 最新提交:${NC}"
    git log --oneline -1
    
    # 询问是否推送到远程
    echo -e "${BLUE}是否推送到远程仓库? (y/n)${NC}"
    read -r PUSH_REMOTE
    
    if [ "$PUSH_REMOTE" = "y" ] || [ "$PUSH_REMOTE" = "Y" ]; then
        echo -e "${BLUE}🚀 推送到远程仓库...${NC}"
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 推送成功!${NC}"
            echo -e "${BLUE}🌐 在线地址: https://wanqgiang.github.io/travel-record-app${NC}"
        else
            echo -e "${RED}❌ 推送失败${NC}"
        fi
    fi
else
    echo -e "${RED}❌ 提交失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 提交流程完成!${NC}"
