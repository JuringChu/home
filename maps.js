
window.HomeMaps = (() => {
  const LANDMARK_QUERIES = [
    { zone: "竹北", label: "竹北高鐵", query: "高鐵新竹站 新竹縣竹北市" },
    { zone: "新莊", label: "新莊車站", query: "新莊車站 新竹市" },
    { zone: "好市多", label: "新竹好市多", query: "Costco 新竹店" },
    { zone: "新竹", label: "新竹車站", query: "新竹車站 新竹市" }
  ];

  let landmarks = null;
  let readyPromise = null;

  function keyIsConfigured() {
    const key = window.HOME_MAPS_CONFIG?.apiKey || "";
    return key && key !== "YOUR_GOOGLE_MAPS_API_KEY";
  }

  function loadGoogleMaps() {
    if (!keyIsConfigured()) {
      return Promise.reject(new Error("Google Maps API Key 尚未設定"));
    }
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    if (readyPromise) return readyPromise;

    readyPromise = new Promise((resolve, reject) => {
      const callbackName = "__homeMapsLoaded";
      window[callbackName] = () => {
        delete window[callbackName];
        resolve();
      };
      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: window.HOME_MAPS_CONFIG.apiKey,
        loading: "async",
        v: "weekly",
        callback: callbackName
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => reject(new Error("Google Maps 載入失敗"));
      document.head.appendChild(script);
    });
    return readyPromise;
  }

  async function resolveLandmarks() {
    const cached = localStorage.getItem("home-landmarks-v1");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === 4) {
          landmarks = parsed;
          return landmarks;
        }
      } catch {}
    }

    await loadGoogleMaps();
    const { Place } = await google.maps.importLibrary("places");
    const results = [];

    for (const item of LANDMARK_QUERIES) {
      const response = await Place.searchByText({
        textQuery: item.query,
        fields: ["displayName", "formattedAddress", "location"],
        region: "tw",
        language: "zh-TW",
        maxResultCount: 1
      });

      const place = response.places?.[0];
      if (!place?.location) throw new Error(`找不到據點：${item.label}`);

      results.push({
        zone: item.zone,
        label: item.label,
        query: item.query,
        lat: place.location.lat(),
        lng: place.location.lng()
      });
    }

    landmarks = results;
    localStorage.setItem("home-landmarks-v1", JSON.stringify(results));
    return results;
  }

  function haversineMeters(a, b) {
    const R = 6371008.8;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  async function classifyLocation(lat, lng) {
    const refs = landmarks || await resolveLandmarks();
    const origin = { lat: Number(lat), lng: Number(lng) };

    const ranked = refs
      .map(ref => ({ ...ref, distanceMeters: haversineMeters(origin, ref) }))
      .sort((a,b) => a.distanceMeters - b.distanceMeters);

    return ranked[0];
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return "—";
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
  }

  function mapsUrl(item) {
    if (!item?.lat || !item?.lng) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.lat + "," + item.lng)}`;
  }

  async function mountAutocomplete({
    mountId,
    onSelect,
    statusId
  }) {
    const mount = document.getElementById(mountId);
    const status = document.getElementById(statusId);
    if (!mount) return;

    if (!keyIsConfigured()) {
      mount.innerHTML = `<div class="maps-placeholder">請先在 config.js 設定 Google Maps API Key</div>`;
      status.textContent = "API Key 尚未設定，因此地址自動分類目前不會啟用。";
      status.classList.add("maps-status-error");
      return;
    }

    try {
      await loadGoogleMaps();
      await resolveLandmarks();
      const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

      const autocomplete = new PlaceAutocompleteElement({
        includedRegionCodes: ["tw"],
        requestedLanguage: "zh-TW",
        requestedRegion: "tw"
      });
      autocomplete.placeholder = "搜尋房屋完整地址";
      mount.replaceChildren(autocomplete);

      autocomplete.addEventListener("gmp-select", async (event) => {
        try {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location"]
          });

          if (!place.location) throw new Error("這個地點沒有座標");

          const selected = {
            formattedAddress: place.formattedAddress || place.displayName || "",
            lat: place.location.lat(),
            lng: place.location.lng()
          };

          const nearest = await classifyLocation(selected.lat, selected.lng);
          onSelect?.({
            ...selected,
            nearest: {
              zone: nearest.zone,
              label: nearest.label,
              distanceMeters: nearest.distanceMeters
            }
          });
        } catch (err) {
          status.textContent = "地址辨識失敗，請重新選擇 Google 建議項目。";
          status.classList.add("maps-status-error");
        }
      });

      status.textContent = "選擇 Google 建議地址後，會自動判斷最近據點。";
      status.classList.remove("maps-status-error");
    } catch (err) {
      mount.innerHTML = `<div class="maps-placeholder">Google 地址搜尋載入失敗</div>`;
      status.textContent = String(err?.message || err);
      status.classList.add("maps-status-error");
    }
  }

  return {
    mountAutocomplete,
    classifyLocation,
    formatDistance,
    mapsUrl,
    resolveLandmarks
  };
})();
