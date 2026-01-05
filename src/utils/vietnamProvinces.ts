// Dữ liệu từ latest.json - các điểm thời tiết với tọa độ
export interface WeatherLocation {
  location_id: string;
  lat: number;
  lon: number;
  temp_c?: number;
  wind_ms?: number;
  precip_mm?: number;
}

// Interface cho location với tên tỉnh được map
export interface VietnamProvince {
  id: string;
  nameEn: string; // Chỉ dùng tiếng Anh
  latitude: number;
  longitude: number;
  location_id: string; // ID từ latest.json
}

// Danh sách tỉnh cũ để map tọa độ (chỉ dùng để tìm tên tỉnh)
const provinceMapping: Array<{nameEn: string; latitude: number; longitude: number}> = [
  {nameEn: 'Hanoi', latitude: 21.0285, longitude: 105.8542},
  {nameEn: 'Haiphong', latitude: 20.8449, longitude: 106.6881},
  {nameEn: 'Ho Chi Minh City', latitude: 10.8231, longitude: 106.6297},
  {nameEn: 'Da Nang', latitude: 16.0544, longitude: 108.2022},
  {nameEn: 'Can Tho', latitude: 10.0452, longitude: 105.7469},
  {nameEn: 'An Giang', latitude: 10.5216, longitude: 105.1259},
  {nameEn: 'Ba Ria - Vung Tau', latitude: 10.5414, longitude: 107.2424},
  {nameEn: 'Bac Lieu', latitude: 9.2942, longitude: 105.7278},
  {nameEn: 'Bac Kan', latitude: 22.1470, longitude: 105.8348},
  {nameEn: 'Bac Giang', latitude: 21.2734, longitude: 106.1946},
  {nameEn: 'Bac Ninh', latitude: 21.1861, longitude: 106.0763},
  {nameEn: 'Ben Tre', latitude: 10.2415, longitude: 106.3759},
  {nameEn: 'Binh Dinh', latitude: 13.7750, longitude: 109.2233},
  {nameEn: 'Binh Phuoc', latitude: 11.6476, longitude: 106.6056},
  {nameEn: 'Binh Thuan', latitude: 10.9287, longitude: 108.1021},
  {nameEn: 'Ca Mau', latitude: 9.1776, longitude: 105.1527},
  {nameEn: 'Cao Bang', latitude: 22.6657, longitude: 106.2577},
  {nameEn: 'Dak Lak', latitude: 12.6662, longitude: 108.0505},
  {nameEn: 'Dak Nong', latitude: 12.0046, longitude: 107.6877},
  {nameEn: 'Dien Bien', latitude: 21.3860, longitude: 103.0230},
  {nameEn: 'Dong Nai', latitude: 10.9574, longitude: 106.8429},
  {nameEn: 'Dong Thap', latitude: 10.4930, longitude: 105.7469},
  {nameEn: 'Gia Lai', latitude: 13.9833, longitude: 108.0000},
  {nameEn: 'Ha Giang', latitude: 22.8233, longitude: 104.9833},
  {nameEn: 'Ha Nam', latitude: 20.5433, longitude: 105.9139},
  {nameEn: 'Ha Tinh', latitude: 18.3330, longitude: 105.9000},
  {nameEn: 'Hai Duong', latitude: 20.9373, longitude: 106.3146},
  {nameEn: 'Hoa Binh', latitude: 20.8136, longitude: 105.3383},
  {nameEn: 'Hung Yen', latitude: 20.6464, longitude: 106.0512},
  {nameEn: 'Khanh Hoa', latitude: 12.2388, longitude: 109.1967},
  {nameEn: 'Kien Giang', latitude: 9.9580, longitude: 105.1327},
  {nameEn: 'Kon Tum', latitude: 14.3545, longitude: 108.0076},
  {nameEn: 'Lai Chau', latitude: 22.3864, longitude: 103.4567},
  {nameEn: 'Lam Dong', latitude: 11.9404, longitude: 108.4583},
  {nameEn: 'Lang Son', latitude: 21.8537, longitude: 106.7613},
  {nameEn: 'Lao Cai', latitude: 22.4856, longitude: 103.9700},
  {nameEn: 'Long An', latitude: 10.7395, longitude: 106.4144},
  {nameEn: 'Nam Dinh', latitude: 20.4207, longitude: 106.1683},
  {nameEn: 'Nghe An', latitude: 18.6796, longitude: 105.6813},
  {nameEn: 'Ninh Binh', latitude: 20.2506, longitude: 105.9744},
  {nameEn: 'Ninh Thuan', latitude: 11.5640, longitude: 108.9886},
  {nameEn: 'Phu Tho', latitude: 21.3087, longitude: 105.3117},
  {nameEn: 'Phu Yen', latitude: 13.0884, longitude: 109.0927},
  {nameEn: 'Quang Binh', latitude: 17.4687, longitude: 106.6227},
  {nameEn: 'Quang Nam', latitude: 15.8801, longitude: 108.3380},
  {nameEn: 'Quang Ngai', latitude: 15.1167, longitude: 108.8000},
  {nameEn: 'Quang Ninh', latitude: 21.0064, longitude: 107.2925},
  {nameEn: 'Quang Tri', latitude: 16.7470, longitude: 107.1924},
  {nameEn: 'Soc Trang', latitude: 9.6025, longitude: 105.9739},
  {nameEn: 'Son La', latitude: 21.3257, longitude: 103.9167},
  {nameEn: 'Tay Ninh', latitude: 11.3131, longitude: 106.0963},
  {nameEn: 'Thai Binh', latitude: 20.4463, longitude: 106.3366},
  {nameEn: 'Thai Nguyen', latitude: 21.5942, longitude: 105.8482},
  {nameEn: 'Thanh Hoa', latitude: 19.8067, longitude: 105.7850},
  {nameEn: 'Thua Thien Hue', latitude: 16.4637, longitude: 107.5909},
  {nameEn: 'Tien Giang', latitude: 10.3600, longitude: 106.3600},
  {nameEn: 'Tra Vinh', latitude: 9.9347, longitude: 106.3453},
  {nameEn: 'Tuyen Quang', latitude: 21.8233, longitude: 105.2183},
  {nameEn: 'Vinh Long', latitude: 10.2537, longitude: 105.9722},
  {nameEn: 'Vinh Phuc', latitude: 21.3087, longitude: 105.5972},
  {nameEn: 'Yen Bai', latitude: 21.7050, longitude: 104.8696},
];

// Tính khoảng cách giữa 2 tọa độ (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Tìm tỉnh gần nhất với tọa độ
function findNearestProvince(lat: number, lon: number): string {
  let minDistance = Infinity;
  let nearestProvince = 'Unknown';

  for (const province of provinceMapping) {
    const distance = calculateDistance(lat, lon, province.latitude, province.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestProvince = province.nameEn;
    }
  }

  return nearestProvince;
}

// Load dữ liệu từ API latest hoặc latest.json và map với tỉnh
let cachedProvinces: VietnamProvince[] | null = null;

export const loadVietnamProvinces = async (): Promise<VietnamProvince[]> => {
  if (cachedProvinces) {
    return cachedProvinces;
  }

  try {
    let latestData: {count: number; data: WeatherLocation[]} | null = null;
    
    // Thử gọi API trước
    const {API_ENDPOINTS, isApiEnabled, fetchWithTimeout} = await import('./apiConfig');
    if (isApiEnabled()) {
      try {
        const response = await fetchWithTimeout(API_ENDPOINTS.latest());
        if (response.ok) {
          latestData = await response.json();
        }
      } catch (apiError) {
        console.warn('API không phản hồi, sử dụng JSON file:', apiError);
      }
    }
    
    // Fallback về JSON file
    if (!latestData) {
      latestData = require('../data/latest.json');
    }
    
    if (!latestData) {
      return [];
    }
    
    const locations: WeatherLocation[] = latestData.data || [];

    cachedProvinces = locations.map((location, index) => {
      const provinceName = findNearestProvince(location.lat, location.lon);
      return {
        id: `loc_${index}`,
        nameEn: provinceName,
        latitude: location.lat,
        longitude: location.lon,
        location_id: location.location_id,
      };
    });

    return cachedProvinces;
  } catch (error) {
    console.error('Error loading latest data:', error);
    return [];
  }
};

// Lấy danh sách tỉnh (sync)
export const getVietnamProvinces = (): VietnamProvince[] => {
  if (cachedProvinces) {
    return cachedProvinces;
  }
  // Nếu chưa load, trả về mảng rỗng (sẽ load async)
  return [];
};

// Tìm kiếm tỉnh theo tên (tiếng Anh)
export const searchVietnamProvinces = (query: string): VietnamProvince[] => {
  const provinces = getVietnamProvinces();
  if (!query || query.length < 1 || provinces.length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return provinces.filter(province =>
    province.nameEn.toLowerCase().includes(lowerQuery) ||
    province.nameEn.toLowerCase().includes(lowerQuery.replace(/\s/g, '')),
  );
};

// Lấy tỉnh theo ID
export const getProvinceById = (id: string): VietnamProvince | undefined => {
  return getVietnamProvinces().find(p => p.id === id);
};

// Lấy tỉnh theo location_id
export const getProvinceByLocationId = (locationId: string): VietnamProvince | undefined => {
  return getVietnamProvinces().find(p => p.location_id === locationId);
};

// Lấy tỉnh theo tọa độ (tìm điểm gần nhất)
export const getProvinceByCoordinates = (lat: number, lon: number): VietnamProvince | undefined => {
  const provinces = getVietnamProvinces();
  if (provinces.length === 0) {
    return undefined;
  }

  let minDistance = Infinity;
  let nearestProvince: VietnamProvince | undefined;

  for (const province of provinces) {
    const distance = calculateDistance(lat, lon, province.latitude, province.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestProvince = province;
    }
  }

  return nearestProvince;
};



