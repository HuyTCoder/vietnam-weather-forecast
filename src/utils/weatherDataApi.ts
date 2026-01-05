import {WeatherData, CurrentWeather, HourlyForecast, DailyForecast, WeatherAlert, Location} from '../models/Weather';
import {API_ENDPOINTS, isApiEnabled, fetchWithTimeout} from './apiConfig';

// Interfaces cho dữ liệu từ JSON files
interface SummaryData {
  found: boolean;
  location: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  };
  obs: {
    valid_at: string;
    temp_c: number;
    wind_ms: number;
    precip_mm: number;
    cloudcover_pct: number;
    surface_pressure_hpa: number;
  };
  today: {
    summary_text: string;
  };
  current: {
    summary_text: string;
  };
  alerts: {
    overall_level: string;
    overall_comment: string;
    hazards: Array<{
      type: string;
      level: string;
      comment: string;
    }>;
  };
}

interface DailyData {
  found: boolean;
  location: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  };
  timezone?: string;
  today?: string;
  provider?: string;
  days_back?: number;
  days_forward?: number;
  days: Array<{
    date: string;
    kind: string; // 'past' | 'today' | 'future'
    hour_count: number;
    obs_hours: number;
    fcst_hours: number;
    missing_hours: number;
    temp_min_c: number;
    temp_max_c: number;
    temp_mean_c: number;
    precip_sum_mm: number;
    wind_mean_ms: number;
    cloudcover_mean_pct: number;
  }>;
}

interface TimeseriesData {
  found: boolean;
  location: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  };
  steps: Array<{
    valid_at: string;
    source: string;
    temp_c: number | null;
    wind_ms: number | null;
    precip_mm: number | null;
    rel_humidity_pct: number | null;
    wind_dir_deg: number | null;
    cloudcover_pct: number | null;
    surface_pressure_hpa: number | null;
  }>;
}

// Helper function để get weather icon từ condition
function getWeatherIcon(condition: string, cloudcover?: number): string {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('nắng') || lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
    return '☀️';
  }
  if (lowerCondition.includes('mưa') || lowerCondition.includes('rain')) {
    return '🌧️';
  }
  if (lowerCondition.includes('mây') || lowerCondition.includes('cloud')) {
    return cloudcover && cloudcover > 50 ? '☁️' : '⛅';
  }
  if (lowerCondition.includes('sương') || lowerCondition.includes('fog')) {
    return '🌫️';
  }
  return '🌤️';
}

// Helper function để get condition code
function getConditionCode(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('nắng') || lowerCondition.includes('sunny')) return 'sunny';
  if (lowerCondition.includes('mưa') || lowerCondition.includes('rain')) return 'rainy';
  if (lowerCondition.includes('mây') || lowerCondition.includes('cloud')) return 'cloudy';
  if (lowerCondition.includes('sương') || lowerCondition.includes('fog')) return 'foggy';
  return 'partly-cloudy';
}

// Helper function để format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[date.getDay()];
}

// Location ID mặc định để fallback
const DEFAULT_LOCATION_ID = '400a5792-7432-4ab5-a280-97dd91b21621';

// Helper function để load daily JSON file - luôn dùng daily.json (không phân biệt provider cho JSON)
const loadDailyJsonFile = (): DailyData | null => {
  try {
    return require('../data/daily.json') as DailyData;
  } catch (e) {
    console.error('Error loading daily.json:', e);
    return null;
  }
};

// Helper function để load timeseries JSON file - luôn dùng timeseries.json (không phân biệt provider cho JSON)
const loadTimeseriesJsonFile = (): TimeseriesData | null => {
  try {
    return require('../data/timeseries.json') as TimeseriesData;
  } catch (e) {
    console.error('Error loading timeseries.json:', e);
    return null;
  }
};

// Load summary data từ API hoặc JSON file
export const loadSummaryData = async (locationId: string): Promise<SummaryData | null> => {
  // Nếu API không được enable, dùng JSON file luôn
  if (!isApiEnabled()) {
    try {
      const summaryData = require('../data/summary.json') as SummaryData;
      if (summaryData.location.id === locationId || summaryData.location.id === DEFAULT_LOCATION_ID) {
        return summaryData;
      }
    } catch (error) {
      console.error('Error loading summary data from JSON:', error);
    }
    return null;
  }

  // Thử gọi API trước
  const apiUrl = API_ENDPOINTS.summary(locationId);
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const summaryData = await response.json() as SummaryData;
    
    // Kiểm tra nếu location_id khớp
    if (summaryData.location.id === locationId) {
      return summaryData;
    }
    
    // Nếu không khớp, fallback về location_id mặc định
    if (summaryData.location.id === DEFAULT_LOCATION_ID) {
      return summaryData;
    }
    
    return null;
  } catch (error) {
    console.warn('API không phản hồi, sử dụng JSON file:', error);
    // Fallback về JSON file nếu API fail
    try {
      const summaryData = require('../data/summary.json') as SummaryData;
      if (summaryData.location.id === locationId || summaryData.location.id === DEFAULT_LOCATION_ID) {
        return summaryData;
      }
    } catch (fallbackError) {
      console.error('Error loading fallback summary data:', fallbackError);
    }
    return null;
  }
};

// Load daily data từ API hoặc JSON file với provider
export const loadDailyData = async (locationId: string, provider: string = 'XGBoost'): Promise<DailyData | null> => {
  // Nếu API không được enable, dùng JSON file luôn
  if (!isApiEnabled()) {
    try {
      const dailyData = loadDailyJsonFile();
      if (dailyData && (dailyData.location.id === locationId || dailyData.location.id === DEFAULT_LOCATION_ID)) {
        return dailyData;
      }
    } catch (error) {
      console.error('Error loading daily data from JSON:', error);
    }
    return null;
  }

  // Thử gọi API trước
  const apiUrl = API_ENDPOINTS.daily(locationId, provider);
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const dailyData = await response.json() as DailyData;
    
    // Kiểm tra nếu location_id khớp
    if (dailyData.location.id === locationId) {
      return dailyData;
    }
    
    // Fallback về location_id mặc định nếu không khớp
    if (dailyData.location.id === DEFAULT_LOCATION_ID) {
      return dailyData;
    }
    
    return null;
  } catch (error) {
    console.warn('API không phản hồi, sử dụng JSON file:', error);
    // Fallback về JSON file nếu API fail
    try {
      const dailyData = loadDailyJsonFile();
      if (dailyData && (dailyData.location.id === locationId || dailyData.location.id === DEFAULT_LOCATION_ID)) {
        return dailyData;
      }
    } catch (fallbackError) {
      console.error('Error loading fallback daily data:', fallbackError);
    }
    return null;
  }
};

// Load timeseries data từ API hoặc JSON file với provider
export const loadTimeseriesData = async (locationId: string, provider: string = 'XGBoost'): Promise<TimeseriesData | null> => {
  // Nếu API không được enable, dùng JSON file luôn
  if (!isApiEnabled()) {
    try {
      const timeseriesData = loadTimeseriesJsonFile();
      if (timeseriesData && (timeseriesData.location.id === locationId || timeseriesData.location.id === DEFAULT_LOCATION_ID)) {
        return timeseriesData;
      }
    } catch (error) {
      console.error('Error loading timeseries data from JSON:', error);
    }
    return null;
  }

  // Thử gọi API trước
  const apiUrl = API_ENDPOINTS.timeseries(locationId, provider, 48, 96);
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const timeseriesData = await response.json() as TimeseriesData;
    
    // Kiểm tra nếu location_id khớp
    if (timeseriesData.location.id === locationId) {
      return timeseriesData;
    }
    
    // Fallback về location_id mặc định nếu không khớp
    if (timeseriesData.location.id === DEFAULT_LOCATION_ID) {
      return timeseriesData;
    }
    
    return null;
  } catch (error) {
    console.warn('API không phản hồi, sử dụng JSON file:', error);
    // Fallback về JSON file nếu API fail
    try {
      const timeseriesData = loadTimeseriesJsonFile();
      if (timeseriesData && (timeseriesData.location.id === locationId || timeseriesData.location.id === DEFAULT_LOCATION_ID)) {
        return timeseriesData;
      }
    } catch (fallbackError) {
      console.error('Error loading fallback timeseries data:', fallbackError);
    }
    return null;
  }
};

// Map dữ liệu từ JSON files sang WeatherData
export const mapWeatherDataFromJson = (
  location: Location,
  summaryData: SummaryData,
  dailyData: DailyData | null,
  timeseriesData: TimeseriesData | null,
): WeatherData => {
  // Sử dụng dữ liệu từ summary.json
  const obs = summaryData.obs;
  const currentSummary = summaryData.current.summary_text;
  const todaySummary = summaryData.today.summary_text;
  
  // Lấy dữ liệu hiện tại từ timeseries nếu có (để bổ sung humidity, windDirection)
  const currentTimeseries = timeseriesData?.steps.find(
    step => step.valid_at === obs.valid_at && step.temp_c !== null
  ) || timeseriesData?.steps.find(
    step => step.temp_c !== null && new Date(step.valid_at) <= new Date(obs.valid_at)
  );

  // Map current weather - SỬ DỤNG DỮ LIỆU TỪ SUMMARY.JSON
  const current: CurrentWeather = {
    temperature: Math.round(obs.temp_c), // Từ summary.json obs.temp_c
    feelsLike: Math.round(obs.temp_c), // Có thể tính toán dựa trên wind và humidity
    condition: currentSummary, // Từ summary.json current.summary_text
    conditionCode: getConditionCode(currentSummary),
    cloudcover_pct: currentTimeseries?.cloudcover_pct ?? 1, // Từ timeseries (summary.json không có)
    humidity: currentTimeseries?.rel_humidity_pct || 70, // Từ timeseries (summary.json không có)
    windSpeed: currentTimeseries?.wind_ms || 1, // Từ summary.json obs.wind_ms, convert m/s to km/h
    windDirection: currentTimeseries?.wind_dir_deg || 0, // Từ timeseries (summary.json không có)
    pressure: Math.round(obs.surface_pressure_hpa), // Từ summary.json obs.surface_pressure_hpa
    visibility: 10, // Default (summary.json không có)
    uvIndex: 0, // Default (summary.json không có)
    icon: getWeatherIcon(currentSummary, obs.cloudcover_pct), // Sử dụng cloudcover từ summary.json obs.cloudcover_pct
  };

  // Map hourly forecast từ timeseries
  const hourly: HourlyForecast[] = [];
  if (timeseriesData && timeseriesData.steps) {
    const now = new Date();
    timeseriesData.steps
      .filter(step => step.temp_c !== null && new Date(step.valid_at) >= now)
      .slice(0, 24)
      .forEach(step => {
        const condition = step.cloudcover_pct && step.cloudcover_pct > 50 ? 'Nhiều mây' : 'Ít mây';
        hourly.push({
          time: step.valid_at,
          temperature: Math.round(step.temp_c || 0),
          condition: condition,
          conditionCode: getConditionCode(condition),
          icon: getWeatherIcon(condition, step.cloudcover_pct || 0),
          precipitation: step.precip_mm || 0,
          windSpeed: (step.wind_ms || 0) * 3.6,
          humidity: step.rel_humidity_pct || 0,
        });
      });
  }

  // Map daily forecast từ daily.json
  const daily: DailyForecast[] = [];
  if (dailyData && dailyData.days) {
    dailyData.days
      .filter(day => day.kind === 'future' || day.kind === 'today')
      .slice(0, 7)
      .forEach(day => {
        // Sử dụng today.summary_text cho ngày hôm nay, nếu không thì dùng cloudcover
        const condition = day.kind === 'today' && todaySummary 
          ? todaySummary 
          : (day.cloudcover_mean_pct > 50 ? 'Nhiều mây' : 'Ít mây');
        const dayHourly: HourlyForecast[] = [];
        
        // Lấy hourly data cho ngày này từ timeseries
        if (timeseriesData) {
          const dayDate = day.date;
          timeseriesData.steps
            .filter(step => {
              const stepDate = step.valid_at.split('T')[0];
              return stepDate === dayDate && step.temp_c !== null;
            })
            .slice(0, 24)
            .forEach(step => {
              dayHourly.push({
                time: step.valid_at,
                temperature: Math.round(step.temp_c || 0),
                condition: condition,
                conditionCode: getConditionCode(condition),
                icon: getWeatherIcon(condition, step.cloudcover_pct || 0),
                precipitation: step.precip_mm || 0,
                windSpeed: (step.wind_ms || 0) * 3.6,
                humidity: step.rel_humidity_pct || 0,
              });
            });
        }

        daily.push({
          date: day.date,
          dayName: formatDate(day.date),
          high: Math.round(day.temp_max_c),
          low: Math.round(day.temp_min_c),
          condition: condition,
          conditionCode: getConditionCode(condition),
          icon: getWeatherIcon(condition, day.cloudcover_mean_pct),
          precipitation: day.precip_sum_mm,
          windSpeed: day.wind_mean_ms * 3.6,
          humidity: 70, // Default
          sunrise: '06:00', // Default, có thể tính từ daily data
          sunset: '18:00', // Default
          hourly: dayHourly,
          // Thêm dữ liệu từ daily.json
          kind: day.kind, // Từ daily.json days[].kind
          temp_mean_c: Math.round(day.temp_mean_c), // Từ daily.json days[].temp_mean_c
          hour_count: day.hour_count, // Từ daily.json days[].hour_count
          obs_hours: day.obs_hours, // Từ daily.json days[].obs_hours
          fcst_hours: day.fcst_hours, // Từ daily.json days[].fcst_hours
          missing_hours: day.missing_hours, // Từ daily.json days[].missing_hours
        });
      });
  }

  // Map alerts - SỬ DỤNG DỮ LIỆU TỪ SUMMARY.JSON
  const alerts: WeatherAlert[] = [];
  
  // Nếu có hazards, map từng hazard
  if (summaryData.alerts.hazards && summaryData.alerts.hazards.length > 0) {
    summaryData.alerts.hazards.forEach((hazard, index) => {
      alerts.push({
        id: `alert_${index}`,
        title: `Cảnh báo ${hazard.type}`,
        description: hazard.comment, // Từ summary.json alerts.hazards[].comment
        severity: hazard.level === 'extreme' ? 'extreme' : 
                  hazard.level === 'severe' ? 'severe' :
                  hazard.level === 'moderate' ? 'moderate' : 'minor', // Từ summary.json alerts.hazards[].level
        type: 'other',
        startTime: obs.valid_at,
        endTime: obs.valid_at,
        area: location.city,
        urgency: 'expected',
      });
    });
  }
  
  // Nếu không có hazards nhưng có overall_comment, tạo alert tổng thể
  // (Chỉ tạo nếu overall_level không phải "none" hoặc có comment quan trọng)
  if (alerts.length === 0 && summaryData.alerts.overall_comment && 
      summaryData.alerts.overall_level !== 'none') {
    alerts.push({
      id: 'overall_alert',
      title: 'Thông tin thời tiết',
      description: summaryData.alerts.overall_comment, // Từ summary.json alerts.overall_comment
      severity: summaryData.alerts.overall_level === 'extreme' ? 'extreme' : 
                summaryData.alerts.overall_level === 'severe' ? 'severe' :
                summaryData.alerts.overall_level === 'moderate' ? 'moderate' : 'minor', // Từ summary.json alerts.overall_level
      type: 'other',
      startTime: obs.valid_at,
      endTime: obs.valid_at,
      area: location.city,
      urgency: 'expected',
    });
  }

  return {
    location: {
      ...location,
      location_id: summaryData.location.id, // Từ summary.json location.id
    },
    current, // Đã map từ summary.json obs và current
    hourly, // Từ timeseries.json
    daily, // Từ daily.json
    alerts, // Từ summary.json alerts
    lastUpdated: obs.valid_at, // Từ summary.json obs.valid_at
    wind_dir_deg: currentTimeseries?.wind_dir_deg || 0, // Từ timeseries (summary.json không có)
    cloudcover_pct: Math.round(obs.cloudcover_pct), // Từ summary.json obs.cloudcover_pct
    // Thêm dữ liệu từ summary.json
    todaySummary: todaySummary, // Từ summary.json today.summary_text
    overallAlertLevel: summaryData.alerts.overall_level, // Từ summary.json alerts.overall_level
    overallAlertComment: summaryData.alerts.overall_comment, // Từ summary.json alerts.overall_comment
  };
};

// Main function để fetch weather data từ JSON files với provider
export const fetchWeatherFromJson = async (location: Location): Promise<WeatherData> => {
  // Sử dụng location_id từ location hoặc fallback về mặc định
  const locationId = location.location_id || DEFAULT_LOCATION_ID;

  const [summaryData, dailyData, timeseriesData] = await Promise.all([
    loadSummaryData(locationId),
    loadDailyData(locationId),
    loadTimeseriesData(locationId),
  ]);

  // Nếu không tìm thấy dữ liệu, thử load với location_id mặc định
  if (!summaryData) {
    const [fallbackSummary, fallbackDaily, fallbackTimeseries] = await Promise.all([
      loadSummaryData(DEFAULT_LOCATION_ID),
      loadDailyData(DEFAULT_LOCATION_ID),
      loadTimeseriesData(DEFAULT_LOCATION_ID),
    ]);

    if (!fallbackSummary) {
      throw new Error('Không tìm thấy dữ liệu thời tiết');
    }

    // Sử dụng location gốc nhưng với dữ liệu từ location_id mặc định
    return mapWeatherDataFromJson(location, fallbackSummary, fallbackDaily, fallbackTimeseries);
  }

  return mapWeatherDataFromJson(location, summaryData, dailyData, timeseriesData);
};

