# 🌦️ Vietnam Weather Forecast - ML Demo Compare

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c.svg)](https://pytorch.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

So sánh hiệu suất dự báo thời tiết của 5 mô hình Machine Learning/Deep Learning trên 20 tỉnh/thành phố Việt Nam.

## 📋 Tổng quan

Project này so sánh **5 mô hình** dự báo thời tiết:

| Model | Type | Description |
|-------|------|-------------|
| **Ridge Regression** | Linear ML | Lightweight, baseline model |
| **XGBoost** | Gradient Boosting | Ensemble với decision trees |
| **LightGBM** | Gradient Boosting | Tối ưu tốc độ và bộ nhớ |
| **GRU** | Deep Learning | Recurrent Neural Network |
| **TCN** | Deep Learning | Temporal Convolutional Network |

### 🎯 Targets dự báo (7 biến)
- `temp` - Nhiệt độ (°C)
- `rain` - Lượng mưa (mm)
- `u10` - Gió hướng Đông-Tây (m/s)
- `v10` - Gió hướng Bắc-Nam (m/s)
- `rh` - Độ ẩm tương đối (%)
- `press` - Áp suất (hPa)
- `cloud` - Độ che phủ mây (%)

### ⏱️ Horizon dự báo
- **LAG**: 49h (lookback window)
- **HORIZON**: 100h (~4 ngày forecast)
- **Bins**:
  - D1 (1-24h): Ngắn hạn
  - D2 (25-48h): Trung hạn
  - D3 (49-72h): Trung-dài
  - D4 (73-100h): Dài hạn

## 📁 Cấu trúc Project

```
AlterDemo/
├── 📓 Notebooks
│   ├── fetch-demo-data-singlekeys.ipynb    # 1️⃣ Fetch dữ liệu từ Open-Meteo
│   ├── train-demo-ridge-regression-*.ipynb  # 2️⃣ Train Ridge Regression
│   ├── train-demo-xgboost-*.ipynb           # 2️⃣ Train XGBoost
│   ├── train-demo-lightgbm-*.ipynb          # 2️⃣ Train LightGBM
│   ├── train-demo-gru-*.ipynb               # 2️⃣ Train GRU
│   ├── train-demo-tcn-*.ipynb               # 2️⃣ Train TCN
│   └── 04_verify_inference_all_models_v3.ipynb  # 3️⃣ So sánh tất cả models
│
├── 📂 Model Outputs (generated after training)
│   ├── ridge_out_singlekeys_fast/           # Ridge models + reports
│   ├── xgb_out_singlekeys/                  # XGBoost models + reports
│   ├── lgb_out_singlekeys/                  # LightGBM models + reports
│   ├── gru_weather_v3_out/                  # GRU models + reports
│   ├── tcn_weather_2step_out/               # TCN models + reports
│   └── verify_reports_v4/                   # Comparison reports
│
├── 📄 Config Files
│   ├── requirements.txt                     # Python dependencies
│   └── .gitignore                           # Git ignore rules
│
└── 📝 README.md                             # This file
```

## 🚀 Hướng dẫn cài đặt

### 1. Clone repository
```bash
git clone https://github.com/HuyTCoder/vietnam-weather-forecast.git
cd vietnam-weather-forecast
```

### 2. Tạo virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 4. Cài đặt PyTorch (cho GRU/TCN)
```bash
# CPU only
pip install torch torchvision torchaudio

# CUDA 11.8 (NVIDIA GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1 (NVIDIA GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## 📖 Hướng dẫn sử dụng

### Workflow tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│  1. FETCH DATA                                              │
│     fetch-demo-data-singlekeys.ipynb                        │
│     → Lấy dữ liệu 20 tỉnh/thành từ Open-Meteo API           │
│     → Output: weather_20loc/ (tabular + sequences)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. TRAIN MODELS (chọn 1 hoặc tất cả)                       │
│     • train-demo-ridge-regression-*.ipynb    → Ridge        │
│     • train-demo-xgboost-*.ipynb             → XGBoost      │
│     • train-demo-lightgbm-*.ipynb            → LightGBM     │
│     • train-demo-gru-*.ipynb                 → GRU          │
│     • train-demo-tcn-*.ipynb                 → TCN          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. COMPARE & VERIFY                                        │
│     04_verify_inference_all_models_v3.ipynb                 │
│     → Load tất cả models                                    │
│     → So sánh metrics (MAE, RMSE, Skill Score)              │
│     → Visualizations & Reports                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Fetch dữ liệu
```python
# Mở và chạy notebook
fetch-demo-data-singlekeys.ipynb
```
- Fetch dữ liệu từ Open-Meteo Historical API
- 20 tỉnh/thành phố Việt Nam
- Period: 2021-2024
- Output: `weather_20loc/` folder

### Step 2: Train models

#### Option A: Chạy trên Local
```python
# Chạy từng notebook train
train-demo-ridge-regression-kaggle-singlekeys-fastmultioutput.ipynb
train-demo-xgboost-kaggle-singlekeys-optimized-v2.ipynb
train-demo-lightgbm-kaggle-singlekeys-final.ipynb
train-demo-gru-kaggle-singlekeys-final.ipynb
train-demo-tcn-kaggle-singlekeys-final.ipynb
```

#### Option B: Chạy trên Kaggle (Recommended for GPU)
1. Upload `weather_20loc/` lên Kaggle Dataset
2. Create new notebook, add dataset
3. Copy code từ notebook tương ứng
4. Enable GPU (T4) nếu train GRU/TCN
5. Run all cells

### Step 3: So sánh models
```python
# Sau khi train xong tất cả models
04_verify_inference_all_models_v3.ipynb
```
- So sánh MAE, RMSE, Skill Score
- Baselines: Persistence, Climatology
- Export reports: CSV, PNG charts

## 📊 Metrics & Evaluation

### Metrics sử dụng
| Metric | Description |
|--------|-------------|
| **MAE** | Mean Absolute Error - Trung bình sai số tuyệt đối |
| **RMSE** | Root Mean Square Error - Căn bậc 2 trung bình bình phương sai số |
| **Skill Score** | So sánh với baseline (Persistence/Climatology) |

### Baselines
- **Persistence**: Giá trị hiện tại = giá trị dự báo
- **Climatology**: Trung bình lịch sử theo tháng/giờ

## 🔧 Cấu hình Models

### Tabular Models (Ridge, XGBoost, LightGBM)
```python
LAG = 49          # Lookback window (hours)
HORIZON = 100     # Forecast horizon (hours)
```

### Sequence Models (GRU, TCN)
```python
LAG = 49          # Input sequence length
HORIZON = 100     # Output sequence length
BATCH_SIZE = 96   # Optimized for T4 GPU
HIDDEN = 192      # Hidden layer size
```

### Rain 2-Stage Prediction
```
Stage 1: Classifier (có mưa / không mưa)
Stage 2: Regressor với log1p transform (lượng mưa nếu có)
```

## 🗺️ 20 Locations (Tỉnh/Thành phố)

| Region | Locations |
|--------|-----------|
| Bắc | Hà Nội, Hải Phòng, Lạng Sơn, Lào Cai, Thái Nguyên |
| Trung | Đà Nẵng, Huế, Vinh, Nha Trang, Quy Nhơn |
| Nam | TP.HCM, Cần Thơ, Đà Lạt, Vũng Tàu, Rạch Giá |
| Tây Nguyên | Buôn Ma Thuột, Pleiku, Kon Tum |
| Khác | Điện Biên Phủ, Cao Bằng |

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👨‍💻 Author

**HuyTCoder**
- GitHub: [@HuyTCoder](https://github.com/HuyTCoder)

## 🙏 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) - Free Weather API
- [Kaggle](https://www.kaggle.com/) - GPU/TPU resources for training
- [PyTorch](https://pytorch.org/) - Deep Learning framework
- [scikit-learn](https://scikit-learn.org/) - ML library
