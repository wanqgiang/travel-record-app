// 旅游记录应用主文件
class TravelRecordApp {
    constructor() {
        // 使用过滤后的数据（根据环境决定是否包含测试数据）
        this.currentData = Utils.deepClone(getFilteredTravelData());
        this.filteredData = [];
        this.currentDetailRecord = null;
        this.searchTimeout = null;
        this.currentTab = 'domestic'; // 当前标签页：domestic, foreign, all
        this.preferences = Utils.storage.get(AppConfig.STORAGE_KEYS.USER_PREFERENCES, AppConfig.DEFAULT_PREFERENCES);
        this.uploadedPhotos = []; // 当前上传的照片
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupEnvironmentIndicator();
        this.initTheme();
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
        
        // 主题切换功能
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 照片管理功能
        this.setupPhotoManagement();

        // 点击模态框外部关闭（优化版）
        document.addEventListener('click', (e) => {
            // 检查是否点击了模态框的背景区域
            if (e.target.classList.contains('modal')) {
                this.hideAddModal();
                this.hideDetailModal();
            }
        });
        
        // 防止模态框内容区域的点击事件冒泡
        document.addEventListener('click', (e) => {
            // 如果点击的是模态框内容区域，阻止事件冒泡
            if (e.target.closest('.modal-content')) {
                e.stopPropagation();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
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
                        ${city.places.map((place, placeIndex) => {
                            const placeName = typeof place === 'object' ? place.name : place;
                            const placePhotos = typeof place === 'object' ? place.photos : null;
                            const hasPhotos = placePhotos && placePhotos.length > 0;
                            
                            return `
                                <div class="place-item" onclick="app.showPlaceDetail(${provinceIndex}, ${cityIndex}, ${placeIndex})" title="点击查看详情">
                                    ${hasPhotos ? `
                                        <div class="place-photo-thumb">
                                            <img src="${placePhotos[0].dataUrl}" alt="${this.escapeHtml(placeName)}" class="place-thumb-img">
                                            ${placePhotos.length > 1 ? `<span class="photo-count-badge">${placePhotos.length}</span>` : ''}
                            </div>
                                    ` : ''}
                                    <span class="place-name">${this.escapeHtml(placeName)}</span>
                                    ${hasPhotos ? '<i class="fas fa-camera place-photo-icon"></i>' : ''}
                                </div>
                            `;
                        }).join('')}
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
        const filteredRegionLists = getFilteredRegionLists();
        const regionList = isDomestic ? filteredRegionLists.domestic : filteredRegionLists.foreign;
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
        const filteredRegionLists = getFilteredRegionLists();
        const isDomestic = filteredRegionLists.domestic.includes(province);
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
        
        // 处理景点数据（支持照片）
        const placesWithPhotos = places.split(',').map((p, index) => {
            const placeName = p.trim();
            if (!placeName) return null;
            
            // 如果有上传的照片，关联到景点
            const placePhotos = this.uploadedPhotos.filter(photo => 
                photo.name.toLowerCase().includes(placeName.toLowerCase()) ||
                index < this.uploadedPhotos.length
            );
            
            return {
                name: placeName,
                photos: placePhotos.length > 0 ? placePhotos : undefined
            };
        }).filter(Boolean);
        
        if (cityIndex === -1) {
            // 创建新城市
            targetData[targetKey][regionIndex].cities.push({
                name: city,
                places: placesWithPhotos,
                visitDate: visitDate,
                notes: notes,
                photos: this.uploadedPhotos // 城市级别的照片
            });
        } else {
            // 更新现有城市
            const existingCity = targetData[targetKey][regionIndex].cities[cityIndex];
            
            // 合并景点数据
            const existingPlaceNames = existingCity.places.map(p => 
                typeof p === 'object' ? p.name : p
            );
            const newPlaceNames = placesWithPhotos.map(p => p.name);
            
            // 去重合并
            const allPlaces = [...existingCity.places];
            placesWithPhotos.forEach(newPlace => {
                if (!existingPlaceNames.includes(newPlace.name)) {
                    allPlaces.push(newPlace);
                }
            });
            
            existingCity.places = allPlaces;
            if (visitDate) existingCity.visitDate = visitDate;
            if (notes) existingCity.notes = notes;
            
            // 合并照片
            if (this.uploadedPhotos.length > 0) {
                existingCity.photos = [...(existingCity.photos || []), ...this.uploadedPhotos];
            }
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
    
    // 设置环境指示器
    setupEnvironmentIndicator() {
        const indicator = document.getElementById('envIndicator');
        if (!indicator) return;
        
        const isLocal = AppConfig.DEVELOPMENT && AppConfig.DEVELOPMENT.IS_LOCAL;
        
        if (isLocal) {
            indicator.textContent = '开发环境';
            indicator.className = 'env-indicator local';
            indicator.title = '本地开发环境，显示测试数据';
        } else {
            indicator.textContent = '线上版本';
            indicator.className = 'env-indicator production';
            indicator.title = '生产环境，不显示测试数据';
        }
    }
    
    // 初始化主题
    initTheme() {
        // 从本地存储获取主题偏好
        const savedTheme = Utils.storage.get('theme');
        
        // 检测系统主题偏好
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 决定使用的主题
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        this.setTheme(theme);
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!Utils.storage.get('theme')) { // 只有在用户没有手动设置时才自动切换
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    // 设置主题
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeIcon = document.getElementById('themeIcon');
        const themeToggle = document.getElementById('themeToggle');
        
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
            themeToggle.title = '切换到浅色模式';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeToggle.title = '切换到深色模式';
        }
        
        this.currentTheme = theme;
    }
    
    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // 添加切换动画
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.classList.add('switching');
        
        setTimeout(() => {
            this.setTheme(newTheme);
            // 保存用户偏好
            Utils.storage.set('theme', newTheme);
            
            // 移除动画类
            setTimeout(() => {
                themeToggle.classList.remove('switching');
            }, 150);
        }, 150);
        
        // 显示切换成功消息
        this.showMessage(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式`, 'success');
    }
    
    // 初始化主题
    initTheme() {
        // 从本地存储获取主题偏好
        const savedTheme = Utils.storage.get('theme');
        
        // 检测系统主题偏好
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 决定使用的主题
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        this.setTheme(theme);
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!Utils.storage.get('theme')) { // 只有在用户没有手动设置时才自动切换
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    // 设置主题
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeIcon = document.getElementById('themeIcon');
        const themeToggle = document.getElementById('themeToggle');
        
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
            themeToggle.title = '切换到浅色模式';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeToggle.title = '切换到深色模式';
        }
        
        this.currentTheme = theme;
    }
    
    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // 添加切换动画
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.classList.add('switching');
        
        setTimeout(() => {
            this.setTheme(newTheme);
            // 保存用户偏好
            Utils.storage.set('theme', newTheme);
            
            // 移除动画类
            setTimeout(() => {
                themeToggle.classList.remove('switching');
            }, 150);
        }, 150);
        
        // 显示切换成功消息
        this.showMessage(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式`, 'success');
    }
    
    // 设置照片管理功能
    setupPhotoManagement() {
        const uploadArea = document.getElementById('photoUploadArea');
        const fileInput = document.getElementById('photoUpload');
        const previewGrid = document.getElementById('photoPreviewGrid');
        const placeholder = document.getElementById('uploadPlaceholder');
        
        // 相册按钮事件
        const galleryBtn = document.getElementById('galleryBtn');
        const cameraBtn = document.getElementById('cameraBtn');
        const cameraInput = document.getElementById('cameraCapture');
        
        if (galleryBtn) {
            galleryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }
        
        if (cameraBtn) {
            cameraBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 检测是否为移动设备
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
                
                if (isMobile && cameraInput) {
                    cameraInput.click(); // 移动设备直接调用相机
                    this.showMessage('正在打开相机...', 'info');
                } else {
                    fileInput.click(); // 桌面设备使用文件选择
                    this.showMessage('桌面端请使用相册选择功能', 'info');
                }
            });
        }
        
        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handlePhotoFiles(e.target.files);
        });
        
        // 相机拍照事件
        if (cameraInput) {
            cameraInput.addEventListener('change', (e) => {
                this.handlePhotoFiles(e.target.files);
            });
        }
        
        // 拖拽上传事件
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handlePhotoFiles(e.dataTransfer.files);
        });
        
        // 照片全屏浏览
        document.getElementById('lightboxClose').addEventListener('click', () => {
            this.closeLightbox();
        });
        
        document.getElementById('photoLightbox').addEventListener('click', (e) => {
            if (e.target.id === 'photoLightbox') {
                this.closeLightbox();
            }
        });
    }
    
    // 处理照片文件
    handlePhotoFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                this.showMessage('请选择图片文件', 'error');
                return false;
            }
            
            // 检查文件大小 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showMessage(`${file.name} 超过 5MB，请压缩后上传`, 'error');
                return false;
            }
            
            return true;
        });
        
        if (validFiles.length === 0) return;
        
        // 处理每个有效文件
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = {
                    id: Utils.generateId(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: e.target.result,
                    uploadTime: new Date().toISOString()
                };
                
                this.uploadedPhotos.push(photoData);
                this.updatePhotoPreview();
            };
            reader.readAsDataURL(file);
        });
        
        this.showMessage(`已选择 ${validFiles.length} 张照片`, 'success');
    }
    
    // 更新照片预览
    updatePhotoPreview() {
        const previewGrid = document.getElementById('photoPreviewGrid');
        const placeholder = document.getElementById('uploadPlaceholder');
        
        if (this.uploadedPhotos.length === 0) {
            placeholder.style.display = 'flex';
            previewGrid.innerHTML = '';
            return;
        }
        
        placeholder.style.display = 'none';
        
        previewGrid.innerHTML = this.uploadedPhotos.map((photo, index) => `
            <div class="photo-preview-item">
                <img src="${photo.dataUrl}" alt="${photo.name}" class="photo-preview-img" 
                     onclick="app.openLightbox('${photo.dataUrl}', '${photo.name}')">
                <button class="photo-remove-btn" onclick="app.removePhoto(${index})">
                    <i class="fas fa-times"></i>
                </button>
                ${photo.size > 1024 * 1024 ? 
                    `<span class="photo-count-badge" title="大文件">•</span>` : ''}
            </div>
        `).join('');
    }
    
    // 移除照片
    removePhoto(index) {
        this.uploadedPhotos.splice(index, 1);
        this.updatePhotoPreview();
        this.showMessage('照片已移除', 'info');
    }
    
    // 打开照片全屏浏览
    openLightbox(imageSrc, imageName) {
        const lightbox = document.getElementById('photoLightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        
        lightboxImg.src = imageSrc;
        lightboxImg.alt = imageName;
        lightbox.classList.add('show');
        
        // 禁止页面滚动
        document.body.style.overflow = 'hidden';
    }
    
    // 关闭照片全屏浏览
    closeLightbox() {
        const lightbox = document.getElementById('photoLightbox');
        lightbox.classList.remove('show');
        
        // 恢复页面滚动
        document.body.style.overflow = 'auto';
    }
    
    // 重置表单时清理照片
    resetForm() {
        document.getElementById('provinceSelect').value = '';
        document.getElementById('cityInput').value = '';
        document.getElementById('placesInput').value = '';
        document.getElementById('notesInput').value = '';
        
        // 清理照片数据
        this.uploadedPhotos = [];
        this.updatePhotoPreview();
        
        this.setDefaultDate();
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
        background: var(--bg-primary);
        border-radius: 8px;
        border-left: 4px solid var(--primary-color);
        border: 1px solid var(--border-color);
    }
    
    .detail-section h4 {
        margin-bottom: 10px;
        color: var(--primary-color);
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
        color: var(--text-primary);
    }
    
    .other-places {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
    }
    
    .place-tag {
        background: var(--primary-color);
        color: var(--text-inverse);
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
        color: var(--text-secondary);
        font-size: 12px;
    }
    
    .success-message.error {
        background: var(--error-color);
    }
    
    .success-message.info {
        background: var(--info-color);
    }
    
    .success-message.warning {
        background: var(--warning-color);
        color: var(--text-inverse);
    }
`;

document.head.appendChild(style);

