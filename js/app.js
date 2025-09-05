// 旅游记录应用主文件
class TravelRecordApp {
    constructor() {
        this.currentData = Utils.deepClone(travelData); // 使用工具函数深拷贝
        this.filteredData = [];
        this.currentDetailRecord = null;
        this.searchTimeout = null;
        this.currentTab = 'domestic'; // 当前标签页：domestic, foreign, all
        this.preferences = Utils.storage.get(AppConfig.STORAGE_KEYS.USER_PREFERENCES, AppConfig.DEFAULT_PREFERENCES);
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderContent();
        this.updateStats();
        this.populateRegionSelect();
        this.setDefaultDate();
    }

    // 绑定事件
    bindEvents() {
        // 添加记录按钮
        document.getElementById('addBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        // 关闭模态框
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideAddModal();
        });

        document.getElementById('closeDetailModal').addEventListener('click', () => {
            this.hideDetailModal();
        });

        // 取消按钮
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddModal();
        });

        // 保存按钮
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveRecord();
        });

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
            this.toggleClearButton(e.target.value);
        });
        
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.handleSearch('');
            this.toggleClearButton('');
        });

        // 详情模态框按钮
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteRecord();
        });
        
        document.getElementById('editBtn').addEventListener('click', () => {
            this.editRecord();
        });

        document.getElementById('closeDetailBtn').addEventListener('click', () => {
            this.hideDetailModal();
        });
        
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 新增功能按钮
        document.getElementById('regionFilterBtn').addEventListener('click', () => {
            this.showRegionFilter();
        });
        
        document.getElementById('sortBtn').addEventListener('click', () => {
            this.showSortOptions();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAddModal();
                this.hideDetailModal();
            }
        });
    }

    // 根据当前标签页获取对应数据
    getCurrentRegions() {
        switch (this.currentTab) {
            case 'domestic':
                return this.currentData.domestic.provinces;
            case 'foreign':
                return this.currentData.foreign.countries;
            case 'all':
                return [
                    ...this.currentData.domestic.provinces,
                    ...this.currentData.foreign.countries
                ];
            default:
                return this.currentData.domestic.provinces;
        }
    }
    
    // 标签页切换
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 更新当前标签
        this.currentTab = tabName;
        
        // 清除搜索
        document.getElementById('searchInput').value = '';
        this.filteredData = [];
        this.toggleClearButton('');
        
        // 重新渲染内容
        this.renderContent();
        this.updateStats();
    }
    
    // 渲染内容（统一入口）
    renderContent() {
        const container = document.getElementById('provincesContainer');
        const dataToRender = this.filteredData.length > 0 ? this.filteredData : this.getCurrentRegions();
        
        if (dataToRender.length === 0) {
            const emptyMessage = this.currentTab === 'foreign' ? 
                '没有国外旅行记录' : 
                this.currentTab === 'domestic' ? '没有国内旅行记录' : '没有找到相关记录';
            
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>${emptyMessage}</h3>
                    <p>尝试调整搜索条件或添加新的旅行记录</p>
                </div>
            `;
            return;
        }

        // 使用DocumentFragment提高性能
        const fragment = document.createDocumentFragment();
        
        dataToRender.forEach((region, index) => {
            const cityCount = region.cities.length;
            const totalPlaces = region.cities.reduce((sum, city) => sum + city.places.length, 0);
            
            const regionDiv = document.createElement('div');
            regionDiv.className = 'province-card';
            regionDiv.setAttribute('data-province-index', index);
            
            const regionLabel = this.currentTab === 'foreign' || 
                (this.currentTab === 'all' && !this.currentData.domestic.provinces.includes(region)) ? '城' : '城';
            
            regionDiv.innerHTML = `
                <div class="province-header" onclick="app.toggleProvince(${index})">
                    <span class="province-name">${this.escapeHtml(region.name)}</span>
                    <span class="province-count">${cityCount}${regionLabel} ${totalPlaces}景</span>
                </div>
                <div class="province-content" id="province-${index}">
                    ${this.renderCities(region.cities, index)}
                </div>
            `;
            
            fragment.appendChild(regionDiv);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);

        // 添加城市展开/收起事件
        this.bindCityEvents();
    }
    
    // 兼容性方法（保持旧代码正常工作）
    renderProvinces() {
        this.renderContent();
    }

    // 渲染城市列表（优化点击区域）
    renderCities(cities, provinceIndex) {
        return cities.map((city, cityIndex) => {
            const placeCount = city.places.length;
            const visitDate = city.visitDate ? new Date(city.visitDate).toLocaleDateString('zh-CN') : '未记录';
            
            return `
                <div class="city-item">
                    <div class="city-header" onclick="app.toggleCity(${provinceIndex}, ${cityIndex})">
                        <div class="city-name">
                            <span>${this.escapeHtml(city.name)}</span>
                            <div class="city-info">
                                <small>访问时间: ${visitDate}</small>
                                <small>景点数量: ${placeCount}</small>
                            </div>
                        </div>
                        <div class="expand-btn">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    <div class="places-list" id="places-${provinceIndex}-${cityIndex}" style="display: none;">
                        ${city.places.map((place, placeIndex) => `
                            <div class="place-item" onclick="app.showPlaceDetail(${provinceIndex}, ${cityIndex}, ${placeIndex})" title="点击查看详情">
                                ${this.escapeHtml(place)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 绑定城市事件
    bindCityEvents() {
        // 城市展开/收起事件已在renderCities中通过onclick绑定
    }

    // 切换省份展开/收起
    toggleProvince(provinceIndex) {
        const content = document.getElementById(`province-${provinceIndex}`);
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
        }
    }

    // 切换城市展开/收起
    toggleCity(provinceIndex, cityIndex) {
        const placesList = document.getElementById(`places-${provinceIndex}-${cityIndex}`);
        const expandBtn = placesList.previousElementSibling.querySelector('.expand-btn i');
        
        if (placesList.style.display === 'none') {
            placesList.style.display = 'block';
            expandBtn.className = 'fas fa-chevron-up';
            // 添加展开动画
            placesList.style.maxHeight = 'none';
        } else {
            placesList.style.display = 'none';
            expandBtn.className = 'fas fa-chevron-down';
            placesList.style.maxHeight = '0';
        }
    }

    // 显示景点详情
    showPlaceDetail(provinceIndex, cityIndex, placeIndex) {
        // 根据当前标签页获取正确的数据
        const currentRegions = this.getCurrentRegions();
        const region = currentRegions[provinceIndex];
        const city = region.cities[cityIndex];
        const place = city.places[placeIndex];
        
        this.currentDetailRecord = { provinceIndex, cityIndex, placeIndex, province: region, city, place };
        
        const detailBody = document.getElementById('detailBody');
        const detailTitle = document.getElementById('detailTitle');
        
        detailTitle.textContent = `${place} - ${city.name}`;
        
        // 根据当前标签页显示不同的标签
        const regionLabel = this.currentTab === 'foreign' ? '国家' : '省份';
        
        detailBody.innerHTML = `
            <div class="detail-content">
                <div class="detail-section">
                    <h4><i class="fas fa-map-marker-alt"></i> 位置信息</h4>
                    <p><strong>${regionLabel}:</strong> ${this.escapeHtml(region.name)}</p>
                    <p><strong>城市:</strong> ${this.escapeHtml(city.name)}</p>
                    <p><strong>景点:</strong> ${this.escapeHtml(place)}</p>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-calendar-alt"></i> 访问信息</h4>
                    <p><strong>访问日期:</strong> ${city.visitDate ? new Date(city.visitDate).toLocaleDateString('zh-CN') : '未记录'}</p>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-sticky-note"></i> 备注</h4>
                    <p>${this.escapeHtml(city.notes || '暂无备注')}</p>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-list"></i> 同城其他景点</h4>
                    <div class="other-places">
                        ${city.places.filter(p => p !== place).map(p => 
                            `<span class="place-tag">${this.escapeHtml(p)}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.showDetailModal();
    }

    // 显示添加记录模态框
    showAddModal() {
        // 更新地区选择器以匹配当前标签页
        this.populateRegionSelect();
        document.getElementById('addModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // 隐藏添加记录模态框
    hideAddModal() {
        document.getElementById('addModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    // 显示详情模态框
    showDetailModal() {
        document.getElementById('detailModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // 隐藏详情模态框
    hideDetailModal() {
        document.getElementById('detailModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentDetailRecord = null;
    }

    // 填充地区选择器（省份或国家）
    populateRegionSelect() {
        const select = document.getElementById('provinceSelect');
        const isDomestic = this.currentTab !== 'foreign';
        const regionList = isDomestic ? regionLists.domestic : regionLists.foreign;
        const placeholder = isDomestic ? '请选择省份' : '请选择国家';
        
        select.innerHTML = `<option value="">${placeholder}</option>` + 
            regionList.map(region => `<option value="${region}">${region}</option>`).join('');
    }

    // 设置默认日期
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('visitDate').value = today;
    }

    // 重置表单
    resetForm() {
        document.getElementById('provinceSelect').value = '';
        document.getElementById('cityInput').value = '';
        document.getElementById('placesInput').value = '';
        document.getElementById('notesInput').value = '';
        this.setDefaultDate();
    }

    // 保存记录
    saveRecord() {
        const province = document.getElementById('provinceSelect').value;
        const city = document.getElementById('cityInput').value.trim();
        const places = document.getElementById('placesInput').value.trim();
        const visitDate = document.getElementById('visitDate').value;
        const notes = document.getElementById('notesInput').value.trim();

        if (!province || !city || !places) {
            this.showMessage(AppConfig.MESSAGES.VALIDATION_ERROR, 'error');
            return;
        }

        // 确定是国内还是国外
        const isDomestic = regionLists.domestic.includes(province);
        const targetData = isDomestic ? this.currentData.domestic : this.currentData.foreign;
        const targetKey = isDomestic ? 'provinces' : 'countries';
        
        // 检查地区是否已存在
        let regionIndex = targetData[targetKey].findIndex(r => r.name === province);
        
        if (regionIndex === -1) {
            // 创建新地区
            targetData[targetKey].push({
                name: province,
                cities: []
            });
            regionIndex = targetData[targetKey].length - 1;
        }

        // 检查城市是否已存在
        const cityIndex = targetData[targetKey][regionIndex].cities.findIndex(c => c.name === city);
        
        if (cityIndex === -1) {
            // 创建新城市
            targetData[targetKey][regionIndex].cities.push({
                name: city,
                places: places.split(',').map(p => p.trim()).filter(p => p),
                visitDate: visitDate,
                notes: notes
            });
        } else {
            // 更新现有城市
            const existingCity = targetData[targetKey][regionIndex].cities[cityIndex];
            existingCity.places = [...new Set([...existingCity.places, ...places.split(',').map(p => p.trim()).filter(p => p)])];
            if (visitDate) existingCity.visitDate = visitDate;
            if (notes) existingCity.notes = notes;
        }

        // 保存到本地存储
        this.saveToLocalStorage();
        
        // 重新渲染
        this.renderContent();
        this.updateStats();
        
        // 关闭模态框并显示成功消息
        this.hideAddModal();
        this.showMessage(AppConfig.MESSAGES.SAVE_SUCCESS, 'success');
    }

    // 删除记录
    deleteRecord() {
        if (!this.currentDetailRecord) return;
        
        if (confirm('确定要删除这条记录吗？')) {
            const { provinceIndex, cityIndex, placeIndex, city } = this.currentDetailRecord;
            
            // 从景点列表中删除
            city.places.splice(placeIndex, 1);
            
            // 如果城市没有景点了，删除城市
            if (city.places.length === 0) {
                this.currentData.provinces[provinceIndex].cities.splice(cityIndex, 1);
                
                // 如果省份没有城市了，删除省份
                if (this.currentData.provinces[provinceIndex].cities.length === 0) {
                    this.currentData.provinces.splice(provinceIndex, 1);
                }
            }
            
            // 保存到本地存储
            this.saveToLocalStorage();
            
            // 重新渲染
            this.renderContent();
            this.updateStats();
            
            // 关闭模态框并显示成功消息
            this.hideDetailModal();
            this.showMessage(AppConfig.MESSAGES.DELETE_SUCCESS, 'success');
        }
    }

    // 搜索功能（使用配置化防抖）
    handleSearch(query) {
        // 清除之前的定时器
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // 使用配置中的防抖延迟
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, AppConfig.UI.SEARCH_DEBOUNCE_DELAY);
    }
    
    // 实际执行搜索的方法
    performSearch(query) {
        if (!query.trim()) {
            this.filteredData = [];
            this.renderContent();
            return;
        }

        const searchTerm = query.toLowerCase();
        const currentRegions = this.getCurrentRegions();
        
        this.filteredData = currentRegions.map(region => {
            // 搜索地区名称（省份或国家）
            const regionMatches = region.name.toLowerCase().includes(searchTerm);
            
            // 搜索城市和景点
            const matchingCities = region.cities.filter(city => 
                city.name.toLowerCase().includes(searchTerm) ||
                city.places.some(place => place.toLowerCase().includes(searchTerm)) ||
                (city.notes && city.notes.toLowerCase().includes(searchTerm))
            );
            
            // 如果地区匹配，返回所有城市；否则只返回匹配的城市
            if (regionMatches || matchingCities.length > 0) {
                return {
                    ...region,
                    cities: regionMatches ? region.cities : matchingCities
                };
            }
            
            return null;
        }).filter(Boolean);

        this.renderContent();
    }

    // 更新统计信息
    updateStats() {
        const currentRegions = this.getCurrentRegions();
        const totalRegions = currentRegions.length;
        const totalCities = currentRegions.reduce((sum, region) => sum + region.cities.length, 0);
        const totalPlaces = currentRegions.reduce((sum, region) => 
            sum + region.cities.reduce((citySum, city) => citySum + city.places.length, 0), 0
        );
        
        // 获取最后更新时间
        const timestamp = Utils.storage.get(AppConfig.STORAGE_KEYS.TIMESTAMP);
        const lastUpdate = timestamp ? this.formatRelativeTime(timestamp) : '今日';
        
        // 更新标签文本
        const regionLabel = this.currentTab === 'foreign' ? '国家' : 
                           this.currentTab === 'all' ? '地区' : '省份';
        
        document.getElementById('totalProvinces').textContent = totalRegions;
        document.getElementById('totalCities').textContent = totalCities;
        document.getElementById('totalPlaces').textContent = totalPlaces;
        document.getElementById('lastUpdate').textContent = lastUpdate;
        document.getElementById('provincesLabel').textContent = regionLabel;
    }

    // 使用工具函数保存数据
    saveToLocalStorage() {
        const success = Utils.storage.set(AppConfig.STORAGE_KEYS.TRAVEL_DATA, this.currentData);
        if (success) {
            Utils.storage.set(AppConfig.STORAGE_KEYS.TIMESTAMP, Date.now());
        } else {
            this.showMessage(AppConfig.MESSAGES.STORAGE_QUOTA_ERROR, 'error');
        }
    }

    // 使用工具函数加载数据
    loadFromLocalStorage() {
        const savedData = Utils.storage.get(AppConfig.STORAGE_KEYS.TRAVEL_DATA);
        if (savedData && Utils.validateTravelData(savedData)) {
            this.currentData = savedData;
        } else if (savedData) {
            console.warn('本地存储数据格式错误，使用默认数据');
            this.showMessage('数据格式错误，已重置为默认数据', 'warning');
        }
    }

    // 使用工具函数进行HTML转义
    escapeHtml(unsafe) {
        return Utils.escapeHtml(unsafe);
    }
    
    // 显示消息（优化动画）
    showMessage(message, type = 'info') {
        // 移除已存在的消息
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `success-message ${type}`;
        messageDiv.textContent = message;
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'message-close-btn';
        closeBtn.onclick = () => messageDiv.remove();
        messageDiv.appendChild(closeBtn);
        
        document.body.appendChild(messageDiv);
        
        // 使用配置中的延迟时间
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, AppConfig.UI.MESSAGE_AUTO_HIDE_DELAY);
    }
    
    // 切换清除搜索按钮显示
    toggleClearButton(value) {
        const clearBtn = document.getElementById('clearSearch');
        if (value.trim()) {
            clearBtn.classList.add('show');
        } else {
            clearBtn.classList.remove('show');
        }
    }
    
    // 使用工具函数格式化时间
    formatRelativeTime(timestamp) {
        return Utils.formatRelativeTime(timestamp);
    }
    
    // 显示排序选项
    showSortOptions() {
        const options = [
            { text: '按省份名称排序', value: 'province' },
            { text: '按城市数量排序', value: 'cities' },
            { text: '按景点数量排序', value: 'places' },
            { text: '按访问时间排序', value: 'date' }
        ];
        
        const selected = prompt('选择排序方式:\n' + 
            options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n'));
        
        if (selected && selected >= 1 && selected <= options.length) {
            this.sortData(options[selected - 1].value);
        }
    }
    
    // 排序数据
    sortData(sortBy) {
        const provinces = [...this.currentData.provinces];
        
        switch (sortBy) {
            case 'province':
                provinces.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'cities':
                provinces.sort((a, b) => b.cities.length - a.cities.length);
                break;
            case 'places':
                provinces.sort((a, b) => {
                    const aPlaces = a.cities.reduce((sum, city) => sum + city.places.length, 0);
                    const bPlaces = b.cities.reduce((sum, city) => sum + city.places.length, 0);
                    return bPlaces - aPlaces;
                });
                break;
            case 'date':
                provinces.sort((a, b) => {
                    const aDate = Math.max(...a.cities.map(city => 
                        city.visitDate ? new Date(city.visitDate).getTime() : 0));
                    const bDate = Math.max(...b.cities.map(city => 
                        city.visitDate ? new Date(city.visitDate).getTime() : 0));
                    return bDate - aDate;
                });
                break;
        }
        
        this.currentData.provinces = provinces;
        this.renderContent();
        this.showMessage(AppConfig.MESSAGES.SORT_SUCCESS, 'success');
    }
    
    // 导出数据
    exportData() {
        try {
            const dataStr = JSON.stringify(this.currentData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `travel-records-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showMessage(AppConfig.MESSAGES.EXPORT_SUCCESS, 'success');
        } catch (error) {
            console.error('导出失败:', error);
            this.showMessage(AppConfig.MESSAGES.EXPORT_ERROR, 'error');
        }
    }
    
    // 导入数据
    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!importedData.provinces || !Array.isArray(importedData.provinces)) {
                    throw new Error('数据格式不正确');
                }
                
                if (confirm('导入数据将覆盖现有数据，确定要继续吗？')) {
                    this.currentData = importedData;
                    this.saveToLocalStorage();
                    this.renderContent();
                    this.updateStats();
                    this.showMessage(AppConfig.MESSAGES.IMPORT_SUCCESS, 'success');
                }
            } catch (error) {
                console.error('导入失败:', error);
                this.showMessage(AppConfig.MESSAGES.IMPORT_ERROR, 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // 显示地区筛选菜单
    showRegionFilter() {
        const options = [
            { text: '显示国内旅行', value: 'domestic' },
            { text: '显示国外旅行', value: 'foreign' },
            { text: '显示全部旅行', value: 'all' }
        ];
        
        const selected = prompt('选择显示内容:\n' + 
            options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n'));
        
        if (selected && selected >= 1 && selected <= options.length) {
            this.switchTab(options[selected - 1].value);
        }
    }
    
    // 编辑记录
    editRecord() {
        if (!this.currentDetailRecord) return;
        
        const { province, city } = this.currentDetailRecord;
        
        // 先切换到对应的标签页
        const isDomestic = this.currentData.domestic.provinces.some(p => p.name === province.name);
        if (isDomestic && this.currentTab === 'foreign') {
            this.switchTab('domestic');
        } else if (!isDomestic && this.currentTab === 'domestic') {
            this.switchTab('foreign');
        }
        
        // 更新地区选择器
        this.populateRegionSelect();
        
        // 填充编辑表单
        document.getElementById('provinceSelect').value = province.name;
        document.getElementById('cityInput').value = city.name;
        document.getElementById('placesInput').value = city.places.join(', ');
        document.getElementById('visitDate').value = city.visitDate || '';
        document.getElementById('notesInput').value = city.notes || '';
        
        // 关闭详情模态框，打开编辑模态框
        this.hideDetailModal();
        this.showAddModal();
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TravelRecordApp();
    
    // 从本地存储加载数据
    window.app.loadFromLocalStorage();
    
    // 重新渲染和更新统计
    window.app.renderProvinces();
    window.app.updateStats();
});

// 添加一些CSS样式到详情模态框
const style = document.createElement('style');
style.textContent = `
    .detail-content {
        padding: 10px 0;
    }
    
    .detail-section {
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #667eea;
    }
    
    .detail-section h4 {
        margin-bottom: 10px;
        color: #667eea;
        font-size: 16px;
    }
    
    .detail-section h4 i {
        margin-right: 8px;
    }
    
    .detail-section p {
        margin-bottom: 8px;
        line-height: 1.6;
    }
    
    .detail-section strong {
        color: #333;
    }
    
    .other-places {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
    }
    
    .place-tag {
        background: #667eea;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    
    .city-info {
        display: flex;
        gap: 15px;
        margin-top: 8px;
    }
    
    .city-info small {
        color: #666;
        font-size: 12px;
    }
    
    .success-message.error {
        background: #dc3545;
    }
    
    .success-message.info {
        background: #17a2b8;
    }
`;

document.head.appendChild(style);

