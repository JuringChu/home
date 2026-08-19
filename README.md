# 買房清單 — Google Maps 自動分類版

這版已將「手動選區域」改成：

1. 新增房屋
2. 用 Google Place Autocomplete 搜尋完整地址
3. 取得地址經緯度
4. 自動比較四個基準點
5. 自動歸類到最近的區域
6. 顯示最近據點與直線距離
7. 房屋詳情可直接開 Google Maps

## 四個分類基準

- 竹北 → 高鐵新竹站（竹北高鐵）
- 新莊 → 新莊車站（新竹市）
- 好市多 → Costco 新竹店
- 新竹 → 新竹車站

程式會透過 Places API (New) 的 Text Search 第一次取得這四個據點座標，之後存在 localStorage 快取，不會每次開網站都重新查詢。

## Google Cloud 設定

### 1. 建立 Google Cloud Project
前往 Google Cloud Console，建立或選擇一個 Project。

### 2. 啟用 API
啟用：
- Maps JavaScript API
- Places API (New)

### 3. 建立 API Key
建立 Browser API Key。

### 4. 修改 config.js
把：

YOUR_GOOGLE_MAPS_API_KEY

換成你的 API Key。

### 5. 限制 API Key（非常重要）

Application restrictions：
- Websites / HTTP referrers

加入你的 GitHub Pages 網址，例如：
- https://你的帳號.github.io/*
- https://你的帳號.github.io/你的repository/*

API restrictions：
- Maps JavaScript API
- Places API (New)

## 距離怎麼算？

目前使用房屋與四個基準點的經緯度計算「地球表面直線距離」。

這個距離非常適合拿來做：
- 最近哪個生活圈
- 自動分類
- 快速比較

它不是實際開車距離。

如果未來要顯示：
「開車 8 分鐘 / 3.4 km」
可以再接 Routes API。

## GitHub Pages
整包上傳到 Repository 根目錄即可。

必要檔案：
- index.html
- styles.css
- app.js
- maps.js
- config.js
