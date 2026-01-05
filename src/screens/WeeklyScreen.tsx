import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, Dimensions, ScrollView, TouchableOpacity} from 'react-native';
import {useWeather} from '../providers/WeatherProvider';
import {useLocation} from '../providers/LocationProvider';
import {DailyForecastCard} from '../components/DailyForecastCard';
import {LoadingSpinner} from '../components/LoadingSpinner';
import {COLORS} from '../utils/colors';
import {SPACING, FONT_SIZE, BORDER_RADIUS} from '../utils/constants';
import {formatTime, formatDate} from '../utils/formatters';
import {DailyForecast, WeatherData} from '../models/Weather';
import {loadDailyData, loadSummaryData, loadTimeseriesData, mapWeatherDataFromJson} from '../utils/weatherDataApi';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DEFAULT_LOCATION_ID = '400a5792-7432-4ab5-a280-97dd91b21621';

type ModelProvider = 'XGBoost' | 'LightGBM' | 'RidgeRegression' | 'GRU';

export const WeeklyScreen: React.FC = () => {
  const {temperatureUnit} = useWeather();
  const {location} = useLocation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('XGBoost');
  const flatListRef = useRef<FlatList>(null);

  // Tìm index của ngày "today" - tính toán trước khi early return
  const todayIndex = weatherData?.daily.findIndex(day => day.kind === 'today') ?? -1;
  const initialIndex = todayIndex >= 0 ? todayIndex : 0;

  // Load data khi đổi model hoặc location
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const locationId = location?.location_id || DEFAULT_LOCATION_ID;
        
        const [summaryData, dailyData, timeseriesData] = await Promise.all([
          loadSummaryData(locationId),
          loadDailyData(locationId, selectedModel),
          loadTimeseriesData(locationId, selectedModel),
        ]);

        if (summaryData && location) {
          const data = mapWeatherDataFromJson(location, summaryData, dailyData, timeseriesData);
          setWeatherData(data);
        }
      } catch (error) {
        console.error('Error loading weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      loadData();
    }
  }, [location, selectedModel]);

  // Scroll đến ngày "today" khi component mount - phải đặt sau useEffect đầu tiên
  useEffect(() => {
    if (weatherData && weatherData.daily.length > 0 && todayIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: todayIndex,
          animated: false,
        });
        setCurrentIndex(todayIndex);
      }, 100);
    }
  }, [weatherData, todayIndex]);

  if (loading && !weatherData) {
    return <LoadingSpinner message="Đang tải dự báo theo ngày..." />;
  }

  if (!weatherData || weatherData.daily.length === 0) {
    return (
      <View style={styles.container}>
      </View>
    );
  }

  const renderDay = ({item: forecast, index}: {item: DailyForecast; index: number}) => {
    const isToday = forecast.kind === 'today';
    const dateObj = new Date(forecast.date);
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = dayNames[dateObj.getDay()];
    const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    return (
      <ScrollView style={styles.dayContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Dự báo theo ngày</Text>
            <Text style={styles.dateText}>
              {dayName}, {dateStr}
            </Text>
          </View>
          <View style={[styles.pageIndicatorBadge, isToday && styles.pageIndicatorBadgeToday]}>
            <Text style={[styles.pageIndicator, isToday && styles.pageIndicatorToday]}>
              {index + 1} / {weatherData.daily.length}
            </Text>
          </View>
        </View>
        
        <DailyForecastCard
          forecast={forecast}
          temperatureUnit={temperatureUnit}
        />
        
        <View style={[styles.detailsCard, isToday && styles.detailsCardToday]}>
          {/* Thông tin từ daily.json */}
          {forecast.kind && (
            <View style={[styles.kindBadge, isToday && styles.kindBadgeToday]}>
              <Text style={[styles.kindText, isToday && styles.kindTextToday]}>
                {forecast.kind === 'past' ? '📅 Quá khứ' : 
                 forecast.kind === 'today' ? '✨ Hôm nay' : '📅 Tương lai'}
              </Text>
            </View>
          )}
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cao nhất</Text>
              <Text style={styles.statValue}>🌡️ {forecast.high}°C</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Thấp nhất</Text>
              <Text style={styles.statValue}>🌡️ {forecast.low}°C</Text>
            </View>
            {forecast.temp_mean_c !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Trung bình</Text>
                <Text style={styles.statValue}>{forecast.temp_mean_c.toFixed(1)}°C</Text>
              </View>
            )}
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Thông tin thời tiết</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🌧️ Lượng mưa</Text>
              <Text style={styles.detailValue}>
                {forecast.precipitation?.toFixed(1)} mm
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>💨 Tốc độ gió</Text>
              <Text style={styles.detailValue}>{Math.round(forecast.windSpeed)} km/h</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>💧 Độ ẩm</Text>
              <Text style={styles.detailValue}>{forecast.humidity}%</Text>
            </View>
          </View>
          
          {/* Thông tin chi tiết từ daily.json */}
          {forecast.hour_count !== undefined && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Thông tin dữ liệu</Text>
                <View style={styles.dataGrid}>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataLabel}>⏰ Tổng số giờ</Text>
                    <Text style={styles.dataValue}>{forecast.hour_count}</Text>
                  </View>
                  {forecast.obs_hours !== undefined && (
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>👁️ Quan sát</Text>
                      <Text style={styles.dataValue}>{forecast.obs_hours}</Text>
                    </View>
                  )}
                  {forecast.fcst_hours !== undefined && (
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>🔮 Dự báo</Text>
                      <Text style={styles.dataValue}>{forecast.fcst_hours}</Text>
                    </View>
                  )}
                  {forecast.missing_hours !== undefined && forecast.missing_hours > 0 && (
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>⚠️ Thiếu</Text>
                      <Text style={styles.dataValue}>{forecast.missing_hours}</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.modelSelectorContainer}>
      </View>

      <FlatList
        ref={flatListRef}
        data={weatherData.daily}
        renderItem={renderDay}
        keyExtractor={(item, index) => `day-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 100);
        }}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      
      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {weatherData.daily.map((day, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
              day.kind === 'today' && styles.dotToday,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dayContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    color: COLORS.text,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pageIndicatorBadge: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: SPACING.md,
  },
  pageIndicatorBadgeToday: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pageIndicator: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pageIndicatorToday: {
    color: COLORS.textDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  detailsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsCardToday: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.shadowPrimary,
    shadowOpacity: 0.15,
  },
  kindBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  kindBadgeToday: {
    backgroundColor: COLORS.primary,
  },
  kindText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  kindTextToday: {
    color: COLORS.textDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  detailSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40',
  },
  detailLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '700',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dataItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  dataValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.primary,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  dotToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modelSelectorContainer: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modelSelectorTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  modelButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelButtonActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  modelButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modelButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

