// API Configuration
// Base URL - có thể override bằng environment variable
// Nếu để trống ('') → sẽ dùng JSON file ngay, không gọi API
// Nếu set URL (vd: 'http://127.0.0.1:8000') → sẽ thử gọi API, nếu fail thì auto fallback về JSON
const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://localhost:8000/'; // Mặc định thử API, nếu không có thì auto fallback về JSON

// Kiểm tra xem có API URL hợp lệ không
export const isApiEnabled = (apiUrl?: string): boolean => {
  const url = apiUrl || API_BASE_URL;
  return url !== '' && 
         url !== 'https://api.example.com' && 
         url.startsWith('http');
};

// API timeout (milliseconds)
export const API_TIMEOUT = 10000; // 10 giây

// API Endpoints - 13 endpoints
export const API_ENDPOINTS = {
  // 1. Latest observations
  latest: () => `${API_BASE_URL}/api/obs/latest`,
  
  // 2. Nearest location
  nearest: (lat: number, lon: number) => 
    `${API_BASE_URL}/api/obs/nearest?lat=${lat}&lon=${lon}`,
  
  // 3. Summary by location_id
  summary: (locationId: string) => 
    `${API_BASE_URL}/api/obs/summary/${locationId}`,
  
  // 4-7. Timeseries by provider (back=48, fwd=96)
  timeseries: (locationId: string, provider: string, back: number = 48, fwd: number = 96) => 
    `${API_BASE_URL}/api/obs/timeseries/${locationId}`,
    // `${API_BASE_URL}/api/obs/timeseries/${locationId}?back=${back}&fwd=${fwd}&provider=${provider}`,
  
  // 8-11. Daily by provider
  daily: (locationId: string, provider: string) => 
    `${API_BASE_URL}/api/obs/daily/${locationId}`,
    // `${API_BASE_URL}/api/obs/daily/${locationId}?provider=${provider}`,
  
  // 12. Overview
  overview: () => `${API_BASE_URL}/api/obs/overview`,
  
  // 13. Flood risk latest
  floodRiskLatest: () => `${API_BASE_URL}/api/obs/flood_risk_latest`,
};

// Helper function để fetch với timeout
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = API_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};


