// 应用配置文件
const AppConfig = {
    // 应用信息
    APP_NAME: '我的旅行战绩',
    VERSION: '2.0.0',
    
    // 开发环境配置
    DEVELOPMENT: {
        // 检测是否为本地开发环境
        IS_LOCAL: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' || 
                 window.location.hostname === '',
        SHOW_TEST_DATA: true // 本地开发时显示测试数据
    },
    
    // 存储配置
    STORAGE_KEYS: {
        TRAVEL_DATA: 'travelRecordData',
        TIMESTAMP: 'travelRecordDataTimestamp',
        USER_PREFERENCES: 'travelAppPreferences'
    },
    
    // UI配置
    UI: {
        SEARCH_DEBOUNCE_DELAY: 300,
        MESSAGE_AUTO_HIDE_DELAY: 5000,
        ANIMATION_DURATION: 300,
        MAX_MESSAGE_LENGTH: 500
    },
    
    // 数据验证配置
    VALIDATION: {
        MAX_PROVINCE_NAME_LENGTH: 20,
        MAX_CITY_NAME_LENGTH: 30,
        MAX_PLACE_NAME_LENGTH: 50,
        MAX_NOTES_LENGTH: 500,
        MIN_SEARCH_LENGTH: 1
    },
    
    // 导出配置
    EXPORT: {
        FILE_PREFIX: 'travel-records-',
        FILE_EXTENSION: '.json',
        MIME_TYPE: 'application/json'
    },
    
    // 错误消息
    MESSAGES: {
        SAVE_SUCCESS: '记录保存成功！',
        DELETE_SUCCESS: '记录删除成功！',
        EXPORT_SUCCESS: '数据导出成功',
        IMPORT_SUCCESS: '数据导入成功',
        SORT_SUCCESS: '数据已重新排序',
        SAVE_ERROR: '保存失败，请重试',
        DELETE_ERROR: '删除失败，请重试',
        EXPORT_ERROR: '数据导出失败',
        IMPORT_ERROR: '数据导入失败，请检查文件格式',
        STORAGE_QUOTA_ERROR: '存储空间不足，请清理浏览器数据后重试',
        VALIDATION_ERROR: '请填写完整信息',
        NETWORK_ERROR: '网络连接异常'
    },
    
    // 默认用户偏好设置
    DEFAULT_PREFERENCES: {
        theme: 'light',
        sortBy: 'province',
        autoSave: true,
        showAnimations: true
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
