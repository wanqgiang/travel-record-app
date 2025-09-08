#!/bin/bash

# 版本自动递增脚本
# 使用方法: ./update_version.sh [major|minor|patch]

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 版本文件路径
VERSION_FILE="js/version.js"

# 检查版本文件是否存在
if [ ! -f "$VERSION_FILE" ]; then
    echo -e "${RED}错误: 版本文件 $VERSION_FILE 不存在${NC}"
    exit 1
fi

# 获取当前版本号
CURRENT_VERSION=$(grep -o "VERSION: '[^']*'" "$VERSION_FILE" | cut -d"'" -f2)
echo -e "${BLUE}当前版本: $CURRENT_VERSION${NC}"

# 解析版本号
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# 确定版本递增类型
INCREMENT_TYPE=${1:-patch}

case $INCREMENT_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        echo -e "${YELLOW}主版本号递增${NC}"
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        echo -e "${YELLOW}次版本号递增${NC}"
        ;;
    patch)
        PATCH=$((PATCH + 1))
        echo -e "${YELLOW}修订版本号递增${NC}"
        ;;
    *)
        echo -e "${RED}错误: 无效的版本递增类型 '$INCREMENT_TYPE'${NC}"
        echo -e "${BLUE}使用方法: $0 [major|minor|patch]${NC}"
        exit 1
        ;;
esac

# 生成新版本号
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo -e "${GREEN}新版本: $NEW_VERSION${NC}"

# 更新版本文件
sed -i.bak "s/VERSION: '$CURRENT_VERSION'/VERSION: '$NEW_VERSION'/" "$VERSION_FILE"

# 更新构建时间
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
sed -i.bak "s/BUILD_TIME: new Date('[^']*')/BUILD_TIME: new Date('$CURRENT_TIME')/" "$VERSION_FILE"

# 添加版本历史记录
echo -e "${BLUE}是否添加版本历史记录? (y/n)${NC}"
read -r ADD_HISTORY

if [ "$ADD_HISTORY" = "y" ] || [ "$ADD_HISTORY" = "Y" ]; then
    echo -e "${BLUE}请输入版本更新说明 (用逗号分隔多个说明):${NC}"
    read -r CHANGES
    
    # 生成版本历史条目
    HISTORY_ENTRY="        {
            version: '$NEW_VERSION',
            date: '$(date +%Y-%m-%d)',
            changes: ['$(echo "$CHANGES" | sed "s/,/','/g")']
        },"
    
    # 在版本历史数组中添加新条目
    sed -i.bak "/VERSION_HISTORY: \[/a\\
$HISTORY_ENTRY" "$VERSION_FILE"
    
    echo -e "${GREEN}版本历史记录已添加${NC}"
fi

# 清理备份文件
rm -f "$VERSION_FILE.bak"

echo -e "${GREEN}版本更新完成!${NC}"
echo -e "${BLUE}新版本: $NEW_VERSION${NC}"
echo -e "${BLUE}构建时间: $CURRENT_TIME${NC}"

# 显示git状态
echo -e "${YELLOW}Git 状态:${NC}"
git status --porcelain

# 询问是否自动提交
echo -e "${BLUE}是否自动提交版本更新? (y/n)${NC}"
read -r AUTO_COMMIT

if [ "$AUTO_COMMIT" = "y" ] || [ "$AUTO_COMMIT" = "Y" ]; then
    git add "$VERSION_FILE"
    git commit -m "📦 版本更新: $CURRENT_VERSION → $NEW_VERSION

🔧 更新内容:
- 版本号: $CURRENT_VERSION → $NEW_VERSION
- 构建时间: $CURRENT_TIME
- 版本类型: $INCREMENT_TYPE 递增"
    
    echo -e "${GREEN}版本更新已提交到Git${NC}"
    
    # 询问是否推送到远程
    echo -e "${BLUE}是否推送到远程仓库? (y/n)${NC}"
    read -r PUSH_REMOTE
    
    if [ "$PUSH_REMOTE" = "y" ] || [ "$PUSH_REMOTE" = "Y" ]; then
        git push origin main
        echo -e "${GREEN}版本更新已推送到远程仓库${NC}"
    fi
fi

echo -e "${GREEN}版本更新脚本执行完成!${NC}"
