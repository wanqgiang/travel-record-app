#!/bin/bash

# 旅行记录应用部署脚本
# 使用方法: ./deploy.sh

echo "🚀 开始部署旅行记录应用..."

# 检查是否在项目根目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查Git是否已初始化
if [ ! -d ".git" ]; then
    echo "📦 初始化Git仓库..."
    git init
fi

# 添加所有文件
echo "📁 添加文件到Git..."
git add .


# 提交更改
echo "💾 提交更改..."
read -p "请输入提交消息 (默认: 更新旅行记录应用): " commit_message
commit_message=${commit_message:-"更新旅行记录应用"}
git commit -m "$commit_message"

# 检查是否已设置远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 设置GitHub远程仓库..."
    read -p "请输入您的GitHub用户名: " github_username
    read -p "请输入仓库名 (默认: travel-record-app): " repo_name
    repo_name=${repo_name:-"travel-record-app"}
    
    git remote add origin "https://github.com/$github_username/$repo_name.git"
    echo "✅ 远程仓库已设置: https://github.com/$github_username/$repo_name.git"
fi

# 推送到GitHub
echo "🚀 推送到GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 下一步操作："
echo "1. 访问您的GitHub仓库"
echo "2. 进入 Settings > Pages"
echo "3. 选择 Source: Deploy from a branch"
echo "4. 选择 Branch: main"
echo "5. 等待5-10分钟后访问您的网站"
echo ""
echo "🌐 您的网站将在以下地址可用:"
if git remote get-url origin > /dev/null 2>&1; then
    origin_url=$(git remote get-url origin)
    if [[ $origin_url == *"github.com"* ]]; then
        username=$(echo $origin_url | sed -n 's/.*github\.com[:/]\([^/]*\)\/.*/\1/p')
        repo=$(echo $origin_url | sed -n 's/.*\/\([^/]*\)\.git$/\1/p')
        echo "   https://$username.github.io/$repo"
    fi
fi
echo ""
echo "✨ 感谢使用旅行记录应用！"
