export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address?: string;
  location_id?: string; // ID từ latest.json để map với summary.json
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  cloudcover_pct: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  sunrise?: string;
  sunset?: string;
  icon: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  conditionCode: string;
  icon: string;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: string;
  conditionCode: string;
  icon: string;
  precipitation: number;
  windSpeed: number;
  humidity: number;
  sunrise: string;
  sunset: string;
  hourly: HourlyForecast[];
  // Thêm dữ liệu từ daily.json
  kind?: string; // 'past' | 'today' | 'future'
  temp_mean_c?: number; // Nhiệt độ trung bình
  hour_count?: number; // Tổng số giờ
  obs_hours?: number; // Số giờ quan sát
  fcst_hours?: number; // Số giờ dự báo
  missing_hours?: number; // Số giờ thiếu
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  type: 'thunderstorm' | 'rain' | 'snow' | 'wind' | 'fog' | 'heat' | 'cold' | 'other';
  startTime: string;
  endTime: string;
  area: string;
  urgency: 'immediate' | 'expected' | 'future' | 'past';
}

export interface WeatherData {
  location: Location;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  lastUpdated: string;
  cloudcover_pct: number; // Từ overview.json cloud_cover
  wind_dir_deg: number; // Từ overview.json wind_direction
  // Thêm dữ liệu từ summary.json
  todaySummary?: string; // Từ summary.json today.summary_text
  overallAlertLevel?: string; // Từ summary.json alerts.overall_level
  overallAlertComment?: string; // Từ summary.json alerts.overall_comment
}



