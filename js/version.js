// 版本信息配置
const VersionConfig = {
    // 当前版本号 (格式: 主版本.次版本.修订版本)
    VERSION: '1.0.1',
    
    // 版本类型
    VERSION_TYPE: 'release', // release, beta, alpha
    
    // 构建时间
    BUILD_TIME: new Date().toISOString(),
    
    // 版本历史
    VERSION_HISTORY: [
        {
            version: '1.0.0',
            date: '2025-09-08',
            changes: ['初始版本', '基础旅行记录功能', '照片管理系统', '深色模式', '移动端优化']
        }
    ],
    
    // 获取完整版本信息
    getFullVersion() {
        return `${this.VERSION}-${this.VERSION_TYPE}`;
    },
    
    // 获取版本显示文本
    getDisplayVersion() {
        return `v${this.VERSION}`;
    },
    
    // 获取构建信息
    getBuildInfo() {
        const buildDate = new Date(this.BUILD_TIME);
        return {
            version: this.getFullVersion(),
            buildTime: buildDate.toLocaleString('zh-CN'),
            buildDate: buildDate.toLocaleDateString('zh-CN')
        };
    }
};

// 导出版本配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VersionConfig;
}
