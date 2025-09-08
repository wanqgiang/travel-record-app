#!/bin/bash

# 智能版本自动递增脚本
# 根据提交信息自动判断版本递增类型

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

# 获取提交信息
COMMIT_MSG="$1"

# 根据提交信息判断版本递增类型
if [[ -z "$COMMIT_MSG" ]]; then
    # 如果没有提供提交信息，默认增加修订版本
    INCREMENT_TYPE="patch"
    echo -e "${YELLOW}未提供提交信息，默认增加修订版本号${NC}"
else
    # 检查提交信息中的关键词
    if [[ "$COMMIT_MSG" =~ (重大更新|重大变更|breaking|BREAKING|major) ]]; then
        INCREMENT_TYPE="major"
        echo -e "${YELLOW}检测到重大更新，增加主版本号${NC}"
    elif [[ "$COMMIT_MSG" =~ (新功能|新特性|feature|feat|minor|功能) ]]; then
        INCREMENT_TYPE="minor"
        echo -e "${YELLOW}检测到新功能，增加次版本号${NC}"
    else
        INCREMENT_TYPE="patch"
        echo -e "${YELLOW}检测到修复或优化，增加修订版本号${NC}"
    fi
fi

# 根据类型递增版本号
case $INCREMENT_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

# 生成新版本号
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo -e "${GREEN}版本递增: $CURRENT_VERSION → $NEW_VERSION (${INCREMENT_TYPE})${NC}"

# 更新版本文件
sed -i.bak "s/VERSION: '$CURRENT_VERSION'/VERSION: '$NEW_VERSION'/" "$VERSION_FILE"

# 更新构建时间
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
sed -i.bak "s/BUILD_TIME: new Date('[^']*')/BUILD_TIME: new Date('$CURRENT_TIME')/" "$VERSION_FILE"

# 清理备份文件
rm -f "$VERSION_FILE.bak"

echo -e "${GREEN}版本更新完成!${NC}"
echo -e "${BLUE}新版本: $NEW_VERSION${NC}"
echo -e "${BLUE}构建时间: $CURRENT_TIME${NC}"

# 输出新版本号供其他脚本使用
echo "$NEW_VERSION"
