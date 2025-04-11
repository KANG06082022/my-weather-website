// API Key
const apiKey = 'bd4ee39a1eb3966966604bee352d6f98';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const unitSelect = document.getElementById('unitSelect');
const description = document.getElementById('description');
const temp = document.getElementById('temp');
const locationElem = document.getElementById('location');
const humidityElem = document.getElementById('humidity');
const windElem = document.getElementById('wind');
const feelsLikeElem = document.getElementById('feelsLike');
const pressureElem = document.getElementById('pressure');
const weatherIcon = document.getElementById('weatherIcon');
const messageElem = document.getElementById('message');
const loading = document.getElementById('loading');
const currentUpdateTime = document.getElementById('currentUpdateTime');
const forecastCarousel = document.querySelector('.forecast-carousel');
const forecastNavPrev = document.querySelector('.forecast-nav-prev');
const forecastNavNext = document.querySelector('.forecast-nav-next');
const airQualityContainer = document.getElementById('airQualityContainer');
const forecastDetailModal = document.getElementById('forecast-detail-modal');
const forecastDetailClose = document.querySelector('.forecast-detail-close');
const forecastDetailBody = document.getElementById('forecast-detail-body');

// Map variables
let map;
let weatherLayer;
let currentCity = '';
let mapMarker;
let forecastData = [];
let currentForecastPage = 0;

// 简化的天气条件映射，不区分日夜
const weatherConditions = {
    // Clear skies
    'clear sky': { 
        bg: 'bg-clear-day', 
        description: 'Clear sky',
        gradient: 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)',
        icon: '01d'
    },
    // Clouds
    'few clouds': { 
        bg: 'bg-few-clouds-day', 
        description: 'Few clouds',
        gradient: 'linear-gradient(135deg, #82addb 0%, #6097D3 100%)',
        icon: '02d'
    },
    'scattered clouds': { 
        bg: 'bg-clouds', 
        description: 'Scattered clouds',
        gradient: 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
        icon: '03d'
    },
    'broken clouds': { 
        bg: 'bg-broken-clouds', 
        description: 'Broken clouds',
        gradient: 'linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%)',
        icon: '04d'
    },
    'overcast clouds': { 
        bg: 'bg-overcast', 
        description: 'Overcast',
        gradient: 'linear-gradient(135deg, #4B6CB7 0%, #182848 100%)',
        icon: '04d'
    },
    // Rain
    'light rain': { 
        bg: 'bg-rain', 
        description: 'Light rain',
        gradient: 'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)',
        icon: '10d'
    },
    'moderate rain': { 
        bg: 'bg-rain', 
        description: 'Moderate rain',
        gradient: 'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)',
        icon: '10d'
    },
    'heavy rain': { 
        bg: 'bg-heavy-rain', 
        description: 'Heavy rain',
        gradient: 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
        icon: '09d'
    },
    'shower rain': { 
        bg: 'bg-rain', 
        description: 'Shower rain',
        gradient: 'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)',
        icon: '09d'
    },
    // Thunderstorms
    'thunderstorm': { 
        bg: 'bg-thunderstorm', 
        description: 'Thunderstorm',
        gradient: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)',
        icon: '11d'
    },
    // Snow
    'snow': { 
        bg: 'bg-snow', 
        description: 'Snow',
        gradient: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)',
        icon: '13d'
    },
    'light snow': { 
        bg: 'bg-snow', 
        description: 'Light snow',
        gradient: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)',
        icon: '13d'
    },
    // Atmospheric
    'mist': { 
        bg: 'bg-mist', 
        description: 'Mist',
        gradient: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
        icon: '50d'
    },
    'fog': { 
        bg: 'bg-mist', 
        description: 'Fog',
        gradient: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
        icon: '50d'
    },
    'haze': { 
        bg: 'bg-mist', 
        description: 'Haze',
        gradient: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
        icon: '50d'
    }
};

// Air Quality Index colors and descriptions
const aqiInfo = {
    1: { color: '#4CAF50', text: 'Good' },
    2: { color: '#FFC107', text: 'Fair' },
    3: { color: '#FF9800', text: 'Moderate' },
    4: { color: '#F44336', text: 'Poor' },
    5: { color: '#9C27B0', text: 'Very Poor' }
};

// Format date and time
function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// 获取天气图标URL - 统一使用白天的图标
function getWeatherIconUrl(iconCode) {
    // 确保使用白天图标（将任何'n'结尾替换为'd'）
    if (!iconCode || typeof iconCode !== 'string') {
        iconCode = '01d'; // 默认为白天晴天图标
    } else if (iconCode.endsWith('n')) {
        // 将夜间图标转换为白天图标
        iconCode = iconCode.slice(0, -1) + 'd';
    }
    
    // 使用OpenWeatherMap图标URL
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// 获取格式化的天气描述 - 不区分日夜
function getFormattedWeatherDescription(description) {
    if (!description) return '';
    const lowerDesc = description.toLowerCase();
    
    // 简化的天气描述映射
    const mapping = {
        'clear sky': 'Clear sky',
        'few clouds': 'Few clouds',
        'scattered clouds': 'Scattered clouds',
        'broken clouds': 'Broken clouds',
        'overcast clouds': 'Overcast',
        'light rain': 'Light rain',
        'moderate rain': 'Moderate rain',
        'heavy rain': 'Heavy rain',
        'shower rain': 'Shower rain',
        'thunderstorm': 'Thunderstorm',
        'snow': 'Snow',
        'light snow': 'Light snow',
        'mist': 'Mist',
        'fog': 'Fog',
        'haze': 'Haze'
    };
    
    // 查找映射
    for (const key in mapping) {
        if (lowerDesc.includes(key)) {
            return mapping[key];
        }
    }
    
    // 默认首字母大写
    return description.charAt(0).toUpperCase() + description.slice(1);
}

// 更新背景 - 简化，统一使用白天背景
function updateBackgroundByWeather(descriptionValue) {
    const body = document.body;
    // 删除所有现有的背景类
    body.classList.remove(...body.classList);
    
    const lowerDesc = descriptionValue.toLowerCase();
    
    // 尝试找到匹配的天气条件
    for (const [key, value] of Object.entries(weatherConditions)) {
        if (lowerDesc.includes(key)) {
            // 添加适当的背景类
            if (value.bg) {
                body.classList.add(value.bg);
                return;
            }
        }
    }
    
    // 如果没有匹配，使用默认背景
    body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
}

// 显示通知消息
function showMessage(message, type = 'error') {
    messageElem.textContent = message;
    messageElem.style.display = 'block';
    
    if (type === 'success') {
        messageElem.classList.add('alert-success');
    } else {
        messageElem.classList.remove('alert-success');
    }
    
    // 5秒后自动隐藏
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// 隐藏通知消息
function hideMessage() {
    messageElem.style.display = 'none';
}

// 显示加载动画
function showLoading() {
    loading.style.display = 'flex';
}

// 隐藏加载动画
function hideLoading() {
    loading.style.display = 'none';
}

// 通过城市名获取当前天气
function getWeather(city) {
    showLoading();
    const units = unitSelect.value;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found. Please check the spelling.');
                } else {
                    throw new Error('API error: ' + response.status);
                }
            }
            return response.json();
        })
        .then(data => {
            drawCurrentWeather(data);
            const lat = data.coord.lat;
            const lon = data.coord.lon;
            currentCity = data.name;
            return Promise.all([
                getForecast(lat, lon),
                getAirPollution(lat, lon)
            ]);
        })
        .then(() => {
            hideLoading();
            showMessage(`Weather updated for ${currentCity}`, 'success');
        })
        .catch(error => {
            hideLoading();
            showMessage(error.message);
            console.error('Error fetching weather:', error);
        });
}

// 通过坐标获取当前天气
function getCurrentWeatherByCoords(lat, lon) {
    showLoading();
    const units = unitSelect.value;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Location not found or API error');
            }
            return response.json();
        })
        .then(data => {
            drawCurrentWeather(data);
            cityInput.value = data.name;
            currentCity = data.name;
            return Promise.all([
                getForecast(lat, lon),
                getAirPollution(lat, lon)
            ]);
        })
        .then(() => {
            hideLoading();
            showMessage(`Weather updated for your location: ${currentCity}`, 'success');
        })
        .catch(error => {
            hideLoading();
            showMessage('Error fetching weather: ' + error.message);
            console.error('Error fetching weather by coords:', error);
        });
}

// 获取5天天气预报
function getForecast(lat, lon) {
    const units = unitSelect.value;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Forecast data unavailable');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.list && data.list.length > 0) {
                console.log('Forecast data received:', data);
                processForecastData(data, units);
                return data;
            } else {
                throw new Error('Invalid forecast data');
            }
        })
        .catch(error => {
            console.error('Error fetching forecast:', error);
            forecastCarousel.innerHTML = `
                <div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.5); border-radius: 10px; width: 100%;">
                    <p style="color: #d32f2f; font-weight: 500;">Error loading forecast: ${error.message}</p>
                </div>
            `;
        });
}

// 处理预报数据 - 优化计算每日的最高/最低温度，并使用中午附近的数据作为代表
function processForecastData(data, units) {
    // 处理预报数据 - 计算每日真实的最高/最低温度
    forecastData = [];
    const dailyData = new Map();
    
    // 按日期分组预报并跟踪最高/最低温度
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString();
        
        if (!dailyData.has(day)) {
            // 初始化该日期的数据
            dailyData.set(day, {
                date: date,
                temp_min: item.main.temp,
                temp_max: item.main.temp,
                forecasts: [item]
            });
        } else {
            // 更新最高/最低温度并添加预报到数组
            const dayData = dailyData.get(day);
            dayData.temp_min = Math.min(dayData.temp_min, item.main.temp);
            dayData.temp_max = Math.max(dayData.temp_max, item.main.temp);
            dayData.forecasts.push(item);
        }
    });
    
    // 处理每日数据，找到最接近中午12点的预报作为代表
    dailyData.forEach((dayData, day) => {
        // 找到最接近中午12点的预报
        let noonForecast = dayData.forecasts.reduce((closest, current) => {
            const currentHour = new Date(current.dt * 1000).getHours();
            const closestHour = new Date(closest.dt * 1000).getHours();
            return Math.abs(currentHour - 12) < Math.abs(closestHour - 12) ? current : closest;
        }, dayData.forecasts[0]);
        
        // 创建日代表预报，结合准确的最高/最低温度
        const dayForecast = {...noonForecast};  // 克隆中午的预报
        dayForecast.main.temp_min = Math.round(dayData.temp_min);
        dayForecast.main.temp_max = Math.round(dayData.temp_max);
        
        forecastData.push(dayForecast);
    });
    
    // 按日期排序
    forecastData.sort((a, b) => a.dt - b.dt);
    
    // 限制为5天
    forecastData = forecastData.slice(0, 5);
    
    // 重置轮播页
    currentForecastPage = 0;
    
    // 创建预报UI
    createForecastUI();
}

// 获取空气污染数据
function getAirPollution(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Air quality data unavailable');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.list && data.list.length > 0) {
                drawAirPollution(data);
                return data;
            } else {
                throw new Error('Invalid air quality data');
            }
        })
        .catch(error => {
            console.error('Error fetching air pollution data:', error);
            airQualityContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.5); border-radius: 10px;">
                    <p style="color: #d32f2f; font-weight: 500;">Error loading air quality data: ${error.message}</p>
                </div>
            `;
        });
}

// 显示当前天气 - 简化版，不区分日夜
function drawCurrentWeather(data) {
    console.log('Current weather data:', data);
    
    // 提取数据
    const tempValue = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const pressure = data.main.pressure;
    const descriptionValue = data.weather[0].description;
    const locationValue = `${data.name}, ${data.sys.country}`;
    const humidityValue = data.main.humidity;
    const windValue = data.wind.speed;
    const iconCode = data.weather[0].icon;
    const currentTime = data.dt;
    
    // 获取格式化的描述 - 不区分日夜
    const formattedDescription = getFormattedWeatherDescription(descriptionValue);
    description.textContent = formattedDescription;
    
    // 使用白天图标
    const dayIconCode = iconCode.slice(0, -1) + 'd';
    
    // 更新DOM元素
    temp.innerHTML = `${tempValue}°<span style="font-size: 2.5rem; font-weight: 600;">${unitSelect.value === 'metric' ? 'C' : 'F'}</span>`;
    locationElem.textContent = locationValue;
    humidityElem.textContent = `${humidityValue}%`;
    windElem.textContent = `${windValue} ${unitSelect.value === 'metric' ? 'm/s' : 'mph'}`;
    feelsLikeElem.textContent = `${feelsLike}°${unitSelect.value === 'metric' ? 'C' : 'F'}`;
    pressureElem.textContent = `${pressure} hPa`;
    
    // 设置天气图标 - 使用白天图标
    const iconUrl = getWeatherIconUrl(dayIconCode);
    weatherIcon.src = iconUrl;
    weatherIcon.alt = formattedDescription;
    
    // 更新时间信息
    currentUpdateTime.textContent = `Last updated: ${formatDateTime(currentTime)}`;
    
    // 更新背景 - 统一使用白天背景
    updateBackgroundByWeather(descriptionValue);
    
    // 更新地图
    initMap(data.coord.lat, data.coord.lon, locationValue);
}

// 创建预报UI - 简化版，统一使用白天预报
function createForecastUI() {
    // 清空容器
    forecastCarousel.innerHTML = '';
    
    try {
        // 检查数据
        if (forecastData.length === 0) {
            forecastCarousel.innerHTML = '<p style="text-align: center; color: #d32f2f; width: 100%;">No forecast data available</p>';
            return;
        }
        
        // 创建预报项
        forecastData.forEach((item, index) => {
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
            const dayDate = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
            
            // 获取统一的白天天气描述
            const weatherDesc = getFormattedWeatherDescription(item.weather[0].description);
            
            // 使用白天图标 
            const iconCode = item.weather[0].icon.slice(0, -1) + 'd';
            
            const tempMax = Math.round(item.main.temp_max);
            const tempMin = Math.round(item.main.temp_min);
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.dataset.index = index;
            
            forecastItem.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${dayDate}</div>
                <img src="${getWeatherIconUrl(iconCode)}" alt="${weatherDesc}" class="forecast-icon">
                <div style="font-size: 0.9rem; margin: 8px 0; color: #555;">${weatherDesc}</div>
                <div class="forecast-temps">
                    <div class="forecast-max">
                        ${tempMax}°
                        <span class="forecast-temp-label">High</span>
                    </div>
                    <div class="forecast-min">
                        ${tempMin}°
                        <span class="forecast-temp-label">Low</span>
                    </div>
                </div>
            `;
            
            forecastItem.addEventListener('click', () => {
                showForecastDetail(item, dayName, dayDate, iconCode, weatherDesc);
            });
            
            forecastCarousel.appendChild(forecastItem);
        });
        
        // 初始显示第一页
        showForecastPage(0);
        
    } catch (error) {
        console.error('Error creating forecast UI:', error);
        forecastCarousel.innerHTML = `
            <div style="padding: 20px; text-align: center; width: 100%;">
                <p style="color: #d32f2f;">Error displaying forecast: ${error.message}</p>
            </div>
        `;
    }
}

// 显示预报详情弹窗 - 简化版，使用白天图标
function showForecastDetail(forecastItem, dayName, dayDate, iconCode, weatherDesc) {
    // 从预报项提取数据
    const timestamp = forecastItem.dt;
    const temp = Math.round(forecastItem.main.temp);
    const tempMax = Math.round(forecastItem.main.temp_max);
    const tempMin = Math.round(forecastItem.main.temp_min);
    const feelsLike = Math.round(forecastItem.main.feels_like);
    const humidity = forecastItem.main.humidity;
    const pressure = forecastItem.main.pressure;
    const windSpeed = forecastItem.wind.speed;
    const clouds = forecastItem.clouds.all;
    const unit = unitSelect.value === 'metric' ? '°C' : '°F';
    const windUnit = unitSelect.value === 'metric' ? 'm/s' : 'mph';
    
    // 获取格式化的日期时间
    const dateTime = formatDateTime(forecastItem.dt);
    
    // 创建详情弹窗的HTML
    forecastDetailBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 1.5rem; margin-bottom: 5px;">${dayName} - ${dayDate}</h2>
            <p style="color: #666; font-size: 0.9rem;">${dateTime}</p>
        </div>
        
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
            <img src="${getWeatherIconUrl(iconCode)}" alt="${weatherDesc}" style="width: 100px; height: 100px;">
            <div style="margin-left: 20px;">
                <div style="font-size: 2.5rem; font-weight: 700;">${temp}${unit}</div>
                <div style="font-size: 1.1rem; color: #555;">${weatherDesc}</div>
            </div>
        </div>
        
        <div style="background-color: rgba(240, 240, 240, 0.6); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div>
                    <span style="font-weight: 600; font-size: 1.1rem;">${tempMax}${unit}</span>
                    <div style="font-size: 0.8rem; color: #777;">High</div>
                </div>
                <div>
                    <span style="font-weight: 600; font-size: 1.1rem;">${tempMin}${unit}</span>
                    <div style="font-size: 0.8rem; color: #777;">Low</div>
                </div>
                <div>
                    <span style="font-weight: 600; font-size: 1.1rem;">${feelsLike}${unit}</span>
                    <div style="font-size: 0.8rem; color: #777;">Feels Like</div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background-color: rgba(240, 240, 240, 0.6); border-radius: 12px; padding: 15px;">
                <div style="font-size: 0.9rem; color: #777; margin-bottom: 5px;">HUMIDITY</div>
                <div style="font-size: 1.3rem; font-weight: 600; color: #222;">${humidity}%</div>
            </div>
            <div style="background-color: rgba(240, 240, 240, 0.6); border-radius: 12px; padding: 15px;">
                <div style="font-size: 0.9rem; color: #777; margin-bottom: 5px;">WIND</div>
                <div style="font-size: 1.3rem; font-weight: 600; color: #222;">${windSpeed} ${windUnit}</div>
            </div>
            <div style="background-color: rgba(240, 240, 240, 0.6); border-radius: 12px; padding: 15px;">
                <div style="font-size: 0.9rem; color: #777; margin-bottom: 5px;">PRESSURE</div>
                <div style="font-size: 1.3rem; font-weight: 600; color: #222;">${pressure} hPa</div>
            </div>
            <div style="background-color: rgba(240, 240, 240, 0.6); border-radius: 12px; padding: 15px;">
                <div style="font-size: 0.9rem; color: #777; margin-bottom: 5px;">CLOUDINESS</div>
                <div style="font-size: 1.3rem; font-weight: 600; color: #222;">${clouds}%</div>
            </div>
        </div>
    `;
    
    // 显示弹窗
    forecastDetailModal.style.display = 'flex';
}

// 显示预报页面
function showForecastPage(page) {
    const itemsPerPage = 3;
    const totalPages = Math.ceil(forecastData.length / itemsPerPage);
    
    // 验证页码
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;
    
    // 更新当前页
    currentForecastPage = page;
    
    // 获取所有预报项
    const forecastItems = document.querySelectorAll('.forecast-item');
    
    // 先隐藏所有项
    forecastItems.forEach(item => {
        item.style.display = 'none';
    });
    
    // 显示当前页的项
    const startIndex = page * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, forecastData.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        if (forecastItems[i]) {
            forecastItems[i].style.display = 'block';
        }
    }
    
    // 更新导航按钮可见性
    forecastNavPrev.style.display = page > 0 ? 'flex' : 'none';
    forecastNavNext.style.display = page < totalPages - 1 ? 'flex' : 'none';
}

// 显示空气污染数据
function drawAirPollution(data) {
    try {
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        const aqiData = aqiInfo[aqi] || { color: '#78909C', text: 'Unknown' };
        
        // 计算AQI标记位置（1-5比例转为0-100%）
        const aqiPosition = ((aqi - 1) / 4) * 100;
        
        // 构建空气质量UI
        let html = `
            <div class="aqi-display">
                <span class="aqi-label" style="background-color:${aqiData.color}">
                    ${aqiData.text}
                </span>
                <div class="aqi-scale">
                    <div class="aqi-marker" style="left: ${aqiPosition}%"></div>
                </div>
            </div>
            <div style="margin-bottom: 15px; font-size: 0.9rem; color: #555;">
                Air Quality Index: ${aqi}/5
            </div>
            <div class="pollutant-grid">
        `;
        
        // 添加污染物数据
        const pollutants = {
            co: { name: 'CO', unit: 'μg/m³', value: components.co.toFixed(1) },
            no2: { name: 'NO₂', unit: 'μg/m³', value: components.no2.toFixed(1) },
            o3: { name: 'O₃', unit: 'μg/m³', value: components.o3.toFixed(1) },
            pm2_5: { name: 'PM2.5', unit: 'μg/m³', value: components.pm2_5.toFixed(1) },
            pm10: { name: 'PM10', unit: 'μg/m³', value: components.pm10.toFixed(1) },
            so2: { name: 'SO₂', unit: 'μg/m³', value: components.so2.toFixed(1) }
        };
        
        // 创建污染物项
        for (const [key, data] of Object.entries(pollutants)) {
            html += `
                <div class="pollutant-item">
                    <div class="pollutant-name">${data.name}</div>
                    <div class="pollutant-value">${data.value} ${data.unit}</div>
                </div>
            `;
        }
        
        html += `
            </div>
            <div class="last-updated">Updated: ${formatDateTime(data.list[0].dt)}</div>
        `;
        
        airQualityContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error rendering air quality data:', error);
        airQualityContainer.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p style="color: #777;">Air quality data not available for this location</p>
            </div>
        `;
    }
}

// 初始化地图
function initMap(lat, lon, locationName) {
    try {
        // 如果地图已存在，先移除
        if (map) {
            map.remove();
            map = null;
        }
        
        // 创建地图实例
        map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView([lat, lon], 8);
        
        // 添加基础图层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
            maxZoom: 19
        }).addTo(map);
        
        // 添加激活的天气图层
        const activeBtn = document.querySelector('.map-btn.active');
        const selectedLayer = activeBtn ? activeBtn.dataset.layer : 'precipitation_new';
        
        weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/${selectedLayer}/{z}/{x}/{y}.png?appid=${apiKey}`, {
            attribution: 'Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
            opacity: 0.7
        }).addTo(map);
        
        // 添加位置标记
        mapMarker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${locationName || 'Current Location'}</b>`)
            .openPopup();
        
        // 加载后修复地图大小
        setTimeout(() => {
            map.invalidateSize();
        }, 500);
        
    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = `
            <div style="padding: 30px; text-align: center; background-color: rgba(255,255,255,0.9); border-radius: 10px;">
                <p style="color: #d32f2f; font-weight: bold; margin-bottom: 15px;">Error loading map: ${error.message}</p>
                <div style="padding: 8px; background-color: #f8f9fa; border-radius: 5px; font-size: 12px;">
                    Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,
                    Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>
                </div>
            </div>
        `;
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    showMessage("Loading weather information...", "success");
    
    // 先尝试加载输入框中默认城市的天气
    const defaultCity = cityInput.value.trim();
    if (defaultCity) {
        getWeather(defaultCity);
    }
    // 如果没有默认城市，则尝试自动使用地理位置
    else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                hideMessage();
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getCurrentWeatherByCoords(lat, lon);
            },
            error => {
                console.error("Geolocation error:", error);
                showMessage("Using default city: Hong Kong");
                getWeather('Hong Kong');
            }
        );
    } else {
        showMessage("Geolocation not supported by your browser. Using default city.");
        getWeather('Hong Kong');
    }
});

// 点击天气按钮的事件监听器
getWeatherBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        hideMessage();
        getWeather(city);
        currentCity = city;
    } else {
        showMessage('Please enter a city name');
    }
});

// 输入框中按Enter键的事件监听器
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            hideMessage();
            getWeather(city);
            currentCity = city;
        } else {
            showMessage('Please enter a city name');
        }
    }
});

// 更改温度单位的事件监听器
unitSelect.addEventListener('change', () => {
    if (currentCity) {
        getWeather(currentCity);
    } else if (map) {
        const center = map.getCenter();
        getCurrentWeatherByCoords(center.lat, center.lng);
    }
});

// 地图图层按钮
document.querySelectorAll('.map-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // 移除所有按钮的活动类
        document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
        
        // 给点击的按钮添加活动类
        this.classList.add('active');
        
        // 更改天气图层
        if (map && weatherLayer) {
            const selectedLayer = this.dataset.layer;
            map.removeLayer(weatherLayer);
            weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/${selectedLayer}/{z}/{x}/{y}.png?appid=${apiKey}`, {
                attribution: 'Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
                opacity: 0.7
            }).addTo(map);
        }
    });
});

// 预报导航按钮
forecastNavPrev.addEventListener('click', () => {
    showForecastPage(currentForecastPage - 1);
});

forecastNavNext.addEventListener('click', () => {
    showForecastPage(currentForecastPage + 1);
});

// 关闭预报详情弹窗
forecastDetailClose.addEventListener('click', () => {
    forecastDetailModal.style.display = 'none';
});

// 点击弹窗外部关闭
forecastDetailModal.addEventListener('click', (e) => {
    if (e.target === forecastDetailModal) {
        forecastDetailModal.style.display = 'none';
    }
});