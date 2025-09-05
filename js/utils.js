// 工具函数集合
const Utils = {
    // HTML转义函数（防XSS攻击）
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    // 深拷贝对象
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    // 防抖函数
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 格式化相对时间
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 30) return `${days}天前`;
        return new Date(timestamp).toLocaleDateString('zh-CN');
    },
    
    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '未记录';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '无效日期';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'YYYY/MM/DD':
                return `${year}/${month}/${day}`;
            case 'MM-DD':
                return `${month}-${day}`;
            case 'zh-CN':
                return d.toLocaleDateString('zh-CN');
            default:
                return d.toLocaleDateString('zh-CN');
        }
    },
    
    // 验证数据格式
    validateTravelData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.provinces || !Array.isArray(data.provinces)) return false;
        
        return data.provinces.every(province => {
            if (!province.name || typeof province.name !== 'string') return false;
            if (!province.cities || !Array.isArray(province.cities)) return false;
            
            return province.cities.every(city => {
                if (!city.name || typeof city.name !== 'string') return false;
                if (!city.places || !Array.isArray(city.places)) return false;
                return city.places.every(place => typeof place === 'string');
            });
        });
    },
    
    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // 本地存储操作
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },
    
    // 数组操作工具
    array: {
        // 移除重复项
        unique(arr) {
            return [...new Set(arr)];
        },
        
        // 按属性分组
        groupBy(arr, key) {
            return arr.reduce((groups, item) => {
                const group = item[key];
                groups[group] = groups[group] || [];
                groups[group].push(item);
                return groups;
            }, {});
        },
        
        // 数组求和
        sum(arr, key) {
            return arr.reduce((sum, item) => {
                return sum + (key ? item[key] : item);
            }, 0);
        }
    },
    
    // 字符串操作工具
    string: {
        // 截断字符串
        truncate(str, length, suffix = '...') {
            if (!str || str.length <= length) return str;
            return str.substring(0, length) + suffix;
        },
        
        // 首字母大写
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        
        // 移除HTML标签
        stripHtml(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        }
    },
    
    // DOM操作工具
    dom: {
        // 创建元素
        createElement(tag, className, textContent) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (textContent) element.textContent = textContent;
            return element;
        },
        
        // 添加事件监听器（支持事件代理）
        on(element, event, selector, handler) {
            if (typeof selector === 'function') {
                handler = selector;
                element.addEventListener(event, handler);
            } else {
                element.addEventListener(event, (e) => {
                    if (e.target.matches(selector)) {
                        handler.call(e.target, e);
                    }
                });
            }
        },
        
        // 平滑滚动到元素
        scrollTo(element, offset = 0) {
            if (!element) return;
            const top = element.offsetTop - offset;
            window.scrollTo({
                top,
                behavior: 'smooth'
            });
        }
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
