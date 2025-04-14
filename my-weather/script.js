// API Key
const apiKey = 'bd4ee39a1eb3966966604bee352d6f98';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const getLocationBtn = document.getElementById('getLocationBtn');
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
const analyticsBtn = document.getElementById('analytics-btn');
const analyticsModal = document.getElementById('analytics-modal');
const analyticsClose = document.querySelector('.analytics-close');

// Map variables
let map, weatherLayer, mapMarker;
let currentCity = '';
let forecastData = [];
let currentForecastPage = 0;
let userCoords = null;
let startTime = Date.now();
let apiCallCount = 0;
let lastSearchTime = null;

// Weather condition mapping
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

// Analytics tracking functions
function trackAPICall(endpoint, responseTime, status) {
    apiCallCount++;
    logEvent('api_call', {
        'endpoint': endpoint,
        'response_time_ms': responseTime,
        'status': status,
        'call_count': apiCallCount
    });
}

function trackSearch(query, resultCount, searchTime) {
    logEvent('search', {
        'search_term': query,
        'results_count': resultCount,
        'search_time_ms': searchTime
    });
}

function trackFeatureUsage(featureName, details = {}) {
    logEvent('feature_usage', {
        'feature_name': featureName,
        ...details
    });
}

function trackErrorOccurrence(errorType, errorMessage, source) {
    logEvent('error', {
        'error_type': errorType,
        'error_message': errorMessage,
        'error_source': source
    });
}

function trackUserAction(actionName, actionDetails = {}) {
    logEvent('user_action', {
        'action_name': actionName,
        ...actionDetails
    });
}



function trackWeatherData(city, country, weather_condition, temperature) {
    logEvent('weather_data_view', {
        'city': city,
        'country': country,
        'weather_condition': weather_condition,
        'temperature': temperature
    });
}

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

// Get the weather icon URL
function getWeatherIconUrl(iconCode) {
    // Make sure to use the daytime icon (replace any 'n' endings with 'd')
    if (!iconCode || typeof iconCode !== 'string') {
        iconCode = '01d'; // The default is the daytime sunny icon
    } else if (iconCode.endsWith('n')) {
       // Convert the night icon to the day icon
        iconCode = iconCode.slice(0, -1) + 'd';
    }
    
    // Use the OpenWeatherMap icon URL
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Get the formatted weather description
function getFormattedWeatherDescription(description) {
    if (!description) return '';
    const lowerDesc = description.toLowerCase();
    
    // Simple mapping - no distinction between day and night
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
    
    for (const key in mapping) {
        if (lowerDesc.includes(key)) {
            return mapping[key];
        }
    }
    
    // Default first letter is capitalized
    return description.charAt(0).toUpperCase() + description.slice(1);
}

// Update background by weather
function updateBackgroundByWeather(descriptionValue) {
    const body = document.body;
    // Remove any existing background classes
    body.classList.remove(...body.classList);
    
    const lowerDesc = descriptionValue.toLowerCase();
    
    // Try to find matching weather conditions
    for (const [key, value] of Object.entries(weatherConditions)) {
        if (lowerDesc.includes(key)) {
           // Add the appropriate background class
            if (value.bg) {
                body.classList.add(value.bg);
                return;
            }
        }
    }
    
    // If no match is found, use the default background
    body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
}

// Display the notification message
function showMessage(message, type = 'error') {
    messageElem.textContent = message;
    messageElem.style.display = 'block';
    
    if (type === 'success') {
        messageElem.classList.add('alert-success');
    } else {
        messageElem.classList.remove('alert-success');
    }
    
    // Track notification display
    logEvent('notification_displayed', {
        'message': message,
        'type': type
    });
    
    // Automatically hide after 5 seconds
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// Hide notification message
function hideMessage() {
    messageElem.style.display = 'none';
}

// Display loading animation
function showLoading() {
    loading.style.display = 'flex';
    
    // Track loading started
    logEvent('loading_started', {
        'timestamp': new Date().toISOString()
    });
}

// Hide the loading animation
function hideLoading() {
    loading.style.display = 'none';
    
    // Track loading ended with duration
    logEvent('loading_ended', {
        'timestamp': new Date().toISOString(),
        'duration_ms': Date.now() - startTime
    });
}

// Get the current weather by city name
function getWeather(city) {
    showLoading();
    const requestStartTime = Date.now();
    const units = unitSelect.value;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;
    
    // Track search start
    lastSearchTime = Date.now();
    
    // Track search attempt
    trackUserAction('', {
        'search_term': city,
        'units': units,
        'search_method': 'city_name'
    });
    
    fetch(url)
        .then((response) => {
            const responseTime = Date.now() - requestStartTime;
            
            // Track API call
            trackAPICall('current_weather', responseTime, response.status);
            
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
            
            // Track successful search
            const searchTime = Date.now() - lastSearchTime;
            trackSearch(city, 1, searchTime);
            
            // Track location data
            logEvent('location_data', {
                'city': data.name,
                'country': data.sys.country,
                'latitude': lat,
                'longitude': lon,
                'timezone': data.timezone
            });
            
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
            
            // Track error
            trackErrorOccurrence('api_error', error.message, 'getWeather');
        });
}

// Get the current weather by coordinates
function getCurrentWeatherByCoords(lat, lon) {
    showLoading();
    const requestStartTime = Date.now();
    const units = unitSelect.value;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    
    // Track search with coordinates
    lastSearchTime = Date.now();
    trackUserAction('search_weather', {
        'latitude': lat,
        'longitude': lon,
        'units': units,
        'search_method': 'coordinates'
    });
    
    fetch(url)
        .then((response) => {
            const responseTime = Date.now() - requestStartTime;
            
            // Track API call
            trackAPICall('current_weather_by_coords', responseTime, response.status);
            
            if (!response.ok) {
                throw new Error('Location not found or API error');
            }
            return response.json();
        })
        .then(data => {
            drawCurrentWeather(data);
            cityInput.value = data.name;
            currentCity = data.name;
            
            // Track successful search
            const searchTime = Date.now() - lastSearchTime;
            trackSearch(`coords(${lat},${lon})`, 1, searchTime);
            
            // Track location data
            logEvent('location_data', {
                'city': data.name,
                'country': data.sys.country,
                'latitude': lat,
                'longitude': lon,
                'timezone': data.timezone,
                'method': 'geolocation'
            });
            
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
            
            // Track error
            trackErrorOccurrence('api_error', error.message, 'getCurrentWeatherByCoords');
        });
}

// Get user location with geolocation API
function getUserLocation() {
    if (navigator.geolocation) {
        showLoading();
        showMessage("Getting your location...", "success");
        
        // Track geolocation request
        trackFeatureUsage('geolocation', {
            'action': 'request_permission'
        });
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                userCoords = { lat, lon };
                hideMessage();
                
                // Track successful geolocation
                trackFeatureUsage('geolocation', {
                    'action': 'permission_granted',
                    'accuracy': position.coords.accuracy
                });
                
                getCurrentWeatherByCoords(lat, lon);
            },
            (error) => {
                hideLoading();
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location services.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable. Try again later.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Try again.";
                        break;
                    default:
                        errorMessage = "Unknown location error occurred.";
                }
                showMessage(errorMessage);
                console.error("Geolocation error:", error);
                
                // Track geolocation error
                trackErrorOccurrence('geolocation_error', errorMessage, 'getUserLocation');
                
                // Fall back to default city
                getWeather('Hong Kong');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        showMessage("Geolocation not supported by your browser. Using default city.");
        
        // Track geolocation not supported
        trackErrorOccurrence('geolocation_not_supported', 'Browser does not support geolocation', 'getUserLocation');
        
        getWeather('Hong Kong');
    }
}

// Get 5-day weather forecast
function getForecast(lat, lon) {
    const requestStartTime = Date.now();
    const units = unitSelect.value;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    
    return fetch(url)
        .then((response) => {
            const responseTime = Date.now() - requestStartTime;
            
            // Track API call
            trackAPICall('forecast', responseTime, response.status);
            
            if (!response.ok) {
                throw new Error('Forecast data unavailable');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.list && data.list.length > 0) {
                processForecastData(data);
                
                // Track forecast data received
                trackFeatureUsage('forecast', {
                    'items_count': data.list.length,
                    'days_count': forecastData.length
                });
                
                return data;
            } else {
                throw new Error('Invalid forecast data');
            }
        })
        .catch(error => {
            console.error('Error fetching forecast:', error);
            
            // Track error
            trackErrorOccurrence('forecast_error', error.message, 'getForecast');
            
            forecastCarousel.innerHTML = `
                <div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.5); border-radius: 10px; width: 100%;">
                    <p style="color: #d32f2f; font-weight: 500;">Error loading forecast: ${error.message}</p>
                </div>
            `;
        });
}

// Process forecast data - optimize calculation of daily maximum/minimum temperatures and use data near noon as representative
function processForecastData(data) {
    forecastData = [];
    const dailyData = new Map();
    
    // Group forecasts by date and keep track of max/min temperatures
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString();
        
        if (!dailyData.has(day)) {
           // Initialize the data for this date
            dailyData.set(day, {
                date: date,
                temp_min: item.main.temp,
                temp_max: item.main.temp,
                forecasts: [item]
            });
        } else {
           // Update the max/min temperatures and add the forecast to the array
            const dayData = dailyData.get(day);
            dayData.temp_min = Math.min(dayData.temp_min, item.main.temp);
            dayData.temp_max = Math.max(dayData.temp_max, item.main.temp);
            dayData.forecasts.push(item);
        }
    });
    
    // Process daily data and find the forecast closest to noon as the representative
    dailyData.forEach((dayData, day) => {
        // Find the forecast closest to 12 noon
        let noonForecast = dayData.forecasts.reduce((closest, current) => {
            const currentHour = new Date(current.dt * 1000).getHours();
            const closestHour = new Date(closest.dt * 1000).getHours();
            return Math.abs(currentHour - 12) < Math.abs(closestHour - 12) ? current : closest;
        }, dayData.forecasts[0]);
        
       // Create a representative forecast for the day, combined with accurate max/min temperatures
        const dayForecast = {...noonForecast};  // Clone the midday forecast
        dayForecast.main.temp_min = Math.round(dayData.temp_min);
        dayForecast.main.temp_max = Math.round(dayData.temp_max);
        
        forecastData.push(dayForecast);
    });
    
    // Sort by date
    forecastData.sort((a, b) => a.dt - b.dt);
    
    //Limited to 5 days
    forecastData = forecastData.slice(0, 5);
    
    // Reset the carousel page
    currentForecastPage = 0;
    
    // Create forecast UI
    createForecastUI();
}

// Get air pollution data
function getAirPollution(lat, lon) {
    const requestStartTime = Date.now();
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    
    return fetch(url)
        .then((response) => {
            const responseTime = Date.now() - requestStartTime;
            
            // Track API call
            trackAPICall('air_pollution', responseTime, response.status);
            
            if (!response.ok) {
                throw new Error('Air quality data unavailable');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.list && data.list.length > 0) {
                drawAirPollution(data);
                
                // Track air quality data
                trackFeatureUsage('air_quality', {
                    'aqi_value': data.list[0].main.aqi,
                    'co': data.list[0].components.co,
                    'no2': data.list[0].components.no2,
                    'o3': data.list[0].components.o3,
                    'pm2_5': data.list[0].components.pm2_5,
                    'pm10': data.list[0].components.pm10
                });
                
                return data;
            } else {
                throw new Error('Invalid air quality data');
            }
        })
        .catch(error => {
            console.error('Error fetching air pollution data:', error);
            
            // Track error
            trackErrorOccurrence('air_quality_error', error.message, 'getAirPollution');
            
            airQualityContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.5); border-radius: 10px;">
                    <p style="color: #d32f2f; font-weight: 500;">Error loading air quality data: ${error.message}</p>
                </div>
            `;
        });
}

// Display the current weather
function drawCurrentWeather(data) {
    console.log('Current weather data:', data);
    
    // Extract data
    const tempValue = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const pressure = data.main.pressure;
    const descriptionValue = data.weather[0].description;
    const locationValue = `${data.name}, ${data.sys.country}`;
    const humidityValue = data.main.humidity;
    const windValue = data.wind.speed;
    const iconCode = data.weather[0].icon;
    const currentTime = data.dt;
    
    // Get the formatted description
    const formattedDescription = getFormattedWeatherDescription(descriptionValue);
    description.textContent = formattedDescription;
    
    // Use the daytime icon
    const dayIconCode = iconCode.slice(0, -1) + 'd';
    
    // Update DOM elements
    const unitLabel = unitSelect.value === 'metric' ? 'C' : 'F';
    temp.innerHTML = `${tempValue}°<span style="font-size: 2.5rem; font-weight: 600;">${unitLabel}</span>`;
    locationElem.textContent = locationValue;
    humidityElem.textContent = `${humidityValue}%`;
    windElem.textContent = `${windValue} ${unitSelect.value === 'metric' ? 'm/s' : 'mph'}`;
    feelsLikeElem.textContent = `${feelsLike}°${unitLabel}`;
    pressureElem.textContent = `${pressure} hPa`;
    
    // Set the weather icon - use the daytime icon
    const iconUrl = getWeatherIconUrl(dayIconCode);
    weatherIcon.src = iconUrl;
    weatherIcon.alt = formattedDescription;
    
    // Update time information
    currentUpdateTime.textContent = `Last updated: ${formatDateTime(currentTime)}`;
    
    // Update background - use daytime background uniformly
    updateBackgroundByWeather(descriptionValue);
    
    // Update the map
    initMap(data.coord.lat, data.coord.lon, locationValue);
    
    // Track weather data view
    trackWeatherData(
        data.name, 
        data.sys.country, 
        formattedDescription,
        tempValue
    );
    
   
}

// Create forecast UI
function createForecastUI() {
    // Clear the container
    forecastCarousel.innerHTML = '';
    
    try {
        // Check data
        if (forecastData.length === 0) {
            forecastCarousel.innerHTML = '<p style="text-align: center; color: #d32f2f; width: 100%;">No forecast data available</p>';
            return;
        }
        
        // Create forecast item
        forecastData.forEach((item, index) => {
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
            const dayDate = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
            
            // Get a unified daytime weather description
            const weatherDesc = getFormattedWeatherDescription(item.weather[0].description);
            
            // Use the daytime icon
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
                // Track forecast item click
                trackUserAction('view_forecast_detail', {
                    'day': dayName,
                    'date': dayDate,
                    'forecast_index': index
                });
                
                showForecastDetail(item, dayName, dayDate, iconCode, weatherDesc);
            });
            
            forecastCarousel.appendChild(forecastItem);
        });
        
        // Initially display the first page
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

// Display forecast details popup - simplified version, using daytime icons
function showForecastDetail(forecastItem, dayName, dayDate, iconCode, weatherDesc) {
    // Extract data from forecast items
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
    
    // Get the formatted date and time
    const dateTime = formatDateTime(forecastItem.dt);
    
    // Create the HTML for the details popup
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
    
    // Display the popup window
    forecastDetailModal.style.display = 'flex';
   
}

// Display the forecast page
function showForecastPage(page) {
    const itemsPerPage = 3;
    const totalPages = Math.ceil(forecastData.length / itemsPerPage);
    
    // Verify page number
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;
    
    // Update the current page
    currentForecastPage = page;
    
    // Get all forecast items
    const forecastItems = document.querySelectorAll('.forecast-item');
    
    // Hide all items first
    forecastItems.forEach(item => {
        item.style.display = 'none';
    });
    
    // Display the items of the current page
    const startIndex = page * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, forecastData.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        if (forecastItems[i]) {
            forecastItems[i].style.display = 'block';
        }
    }
    
    // Update navigation button visibility
    forecastNavPrev.style.display = page > 0 ? 'flex' : 'none';
    forecastNavNext.style.display = page < totalPages - 1 ? 'flex' : 'none';
    
    // Track forecast pagination
    if (page > 0) {
        trackUserAction('forecast_pagination', {
            'page': page,
            'total_pages': totalPages,
            'items_per_page': itemsPerPage
        });
    }
}

// Display air pollution data
function drawAirPollution(data) {
    try {
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        const aqiData = aqiInfo[aqi] || { color: '#78909C', text: 'Unknown' };
        
        // Calculate the AQI marker position (1-5 ratio converted to 0-100%)
        const aqiPosition = ((aqi - 1) / 4) * 100;
        
        // Build the air quality UI
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
        
        // Add pollutant data
        const pollutants = {
            co: { name: 'CO', unit: 'μg/m³', value: components.co.toFixed(1) },
            no2: { name: 'NO₂', unit: 'μg/m³', value: components.no2.toFixed(1) },
            o3: { name: 'O₃', unit: 'μg/m³', value: components.o3.toFixed(1) },
            pm2_5: { name: 'PM2.5', unit: 'μg/m³', value: components.pm2_5.toFixed(1) },
            pm10: { name: 'PM10', unit: 'μg/m³', value: components.pm10.toFixed(1) },
            so2: { name: 'SO₂', unit: 'μg/m³', value: components.so2.toFixed(1) }
        };
        
        // Create pollutant items
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
        
        // Track error
        trackErrorOccurrence('air_quality_rendering_error', error.message, 'drawAirPollution');
        
        airQualityContainer.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p style="color: #777;">Air quality data not available for this location</p>
            </div>
        `;
    }
}

// Initialize the map
function initMap(lat, lon, locationName) {
    try {
        // If the map already exists, remove it first
        if (map) {
            map.remove();
            map = null;
        }
        
        // Create a map instance
        map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView([lat, lon], 8);
        
        // Track map initialization
        trackFeatureUsage('map', {
            'action': 'initialize',
            'latitude': lat,
            'longitude': lon,
            'zoom': 8
        });
        
        // Add base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
            maxZoom: 19
        }).addTo(map);
        
        // Add the activated weather layer
        const activeBtn = document.querySelector('.map-btn.active');
        const selectedLayer = activeBtn ? activeBtn.dataset.layer : 'precipitation_new';
        
        weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/${selectedLayer}/{z}/{x}/{y}.png?appid=${apiKey}`, {
            attribution: 'Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
            opacity: 0.7
        }).addTo(map);
        
        // Add position marker
        mapMarker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${locationName || 'Current Location'}</b>`)
            .openPopup();
        
        // Fix map size after loading
        setTimeout(() => {
            map.invalidateSize();
        }, 500);
        
         
        
    } catch (error) {
        console.error('Error initializing map:', error);
        
        // Track error
        trackErrorOccurrence('map_error', error.message, 'initMap');
        
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

// Show Analytics Modal
function showAnalyticsModal() {
    analyticsModal.style.display = 'flex';
    
   
}

// Hide Analytics Modal
function hideAnalyticsModal() {
    analyticsModal.style.display = 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    startTime = Date.now();
    showMessage("Loading weather information...", "success");
    
    
    
    // Use geographic location first
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                hideMessage();
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                userCoords = { lat, lon };
                getCurrentWeatherByCoords(lat, lon);
            },
            (error) => {
                console.error("Geolocation error:", error);
                
                // Track geolocation error on initial load
                trackErrorOccurrence('initial_geolocation_error', error.message, 'DOMContentLoaded');
                
                // If there is a city in the input box, use it
                const defaultCity = cityInput.value.trim();
                if (defaultCity) {
                    showMessage(`Location access failed. Using ${defaultCity} instead.`);
                    getWeather(defaultCity);
                } else {
                    // Otherwise use Hong Kong as the default
                    showMessage("Using default city: Hong Kong");
                    getWeather('Hong Kong');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        // The browser does not support positioning
        const defaultCity = cityInput.value.trim() || 'Hong Kong';
        showMessage(`Geolocation not supported. Using ${defaultCity}.`);
        
        // Track geolocation not supported on initial load
        trackErrorOccurrence('geolocation_not_supported', 'Browser does not support geolocation', 'DOMContentLoaded');
        
        getWeather(defaultCity);
    }
});

// Button click - search
getWeatherBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        hideMessage();
        
       
        
        getWeather(city);
        currentCity = city;
    } else {
        showMessage('Please enter a city name');
        
        // Track empty search attempt
        trackErrorOccurrence('search_error', 'Empty search term', 'getWeatherBtn_click');
    }
});

// Button click - My location
getLocationBtn.addEventListener('click', () => {
    // Track location button click
    trackUserAction('location_button_click');
    
    getUserLocation();
});

// Enter key in search input
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            hideMessage();
            
            // Track search via enter key
            trackUserAction('search_enter_key', {
                'search_term': city
            });
            
            getWeather(city);
            currentCity = city;
        } else {
            showMessage('Please enter a city name');
            
            // Track empty search attempt
            trackErrorOccurrence('search_error', 'Empty search term', 'enter_key');
        }
    }
});

// Unit switching
unitSelect.addEventListener('change', () => {
    // Track unit change
    trackUserAction('unit_change', {
        'new_unit': unitSelect.value,
        'from_unit': unitSelect.value === 'metric' ? 'imperial' : 'metric'
    });
    
    if (currentCity) {
        getWeather(currentCity);
    } else if (userCoords) {
        getCurrentWeatherByCoords(userCoords.lat, userCoords.lon);
    } else if (map) {
        const center = map.getCenter();
        getCurrentWeatherByCoords(center.lat, center.lng);
    }
});

// Map layer selection
document.querySelectorAll('.map-btn').forEach((btn) => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.map-btn').forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        
        // Track map layer change
        trackUserAction('map_layer_change', {
            'layer': this.dataset.layer
        });
        
        if (map && weatherLayer) {
            const selectedLayer = this.dataset.layer;
            map.removeLayer(weatherLayer);
            weatherLayer = L.tileLayer(
                `https://tile.openweathermap.org/map/${selectedLayer}/{z}/{x}/{y}.png?appid=${apiKey}`,
                {
                    attribution: 'Weather data &copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
                    opacity: 0.7
                }
            ).addTo(map);
        }
    });
});

// Forecast paging
forecastNavPrev.addEventListener('click', () => {
    // Track forecast navigation
    trackUserAction('forecast_nav', {
        'direction': 'prev',
        'current_page': currentForecastPage
    });
    
    showForecastPage(currentForecastPage - 1);
});

forecastNavNext.addEventListener('click', () => {
    // Track forecast navigation
    trackUserAction('forecast_nav', {
        'direction': 'next',
        'current_page': currentForecastPage
    });
    
    showForecastPage(currentForecastPage + 1);
});

// Close the forecast details pop-up window
forecastDetailClose.addEventListener('click', () => {
    forecastDetailModal.style.display = 'none';
    
    // Track forecast modal close
    trackUserAction('close_forecast_modal', {
        'method': 'close_button'
    });
});

// Click outside the pop-up window to close
forecastDetailModal.addEventListener('click', (e) => {
    if (e.target === forecastDetailModal) {
        forecastDetailModal.style.display = 'none';
        
        // Track forecast modal close
        trackUserAction('close_forecast_modal', {
            'method': 'outside_click'
        });
    }
});

// Analytics button and modal
analyticsBtn.addEventListener('click', () => {
    // Track analytics button click
    trackUserAction('analytics_button_click');
    
    showAnalyticsModal();
});

analyticsClose.addEventListener('click', () => {
    hideAnalyticsModal();
    
    // Track analytics modal close
    trackUserAction('close_analytics_modal', {
        'method': 'close_button'
    });
});

analyticsModal.addEventListener('click', (e) => {
    if (e.target === analyticsModal) {
        hideAnalyticsModal();
        
        // Track analytics modal close
        trackUserAction('close_analytics_modal', {
            'method': 'outside_click'
        });
    }
});

// Track all link clicks for navigation analysis
document.addEventListener('click', function(e) {
    const target = e.target.closest('a');
    if (target && target.href) {
        trackUserAction('link_click', {
            'href': target.href,
            'text': target.textContent.trim(),
            'id': target.id || 'unnamed_link'
        });
    }
});

// Track scrolling behavior
let lastKnownScrollPosition = 0;
let ticking = false;

document.addEventListener('scroll', function() {
    lastKnownScrollPosition = window.scrollY;
    
    if (!ticking) {
        window.requestAnimationFrame(function() {
            // Only track significant scrolls (more than 20% of viewport)
            if (Math.abs(lastKnownScrollPosition - window.scrollY) > window.innerHeight * 0.2) {
                trackUserAction('significant_scroll', {
                    'scroll_position': window.scrollY,
                    'scroll_percentage': (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100).toFixed(1)
                });
            }
            ticking = false;
        });
        ticking = true;
    }
});

// Track session duration periodically
let sessionStartTime = Date.now();
setInterval(function() {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    // Track every minute
    if (sessionDuration % 60 === 0) {
        logEvent('session_duration_reached', {
            'duration_seconds': sessionDuration,
            'duration_minutes': Math.floor(sessionDuration / 60)
        });
    }
}, 5000); // Check every 5 seconds
