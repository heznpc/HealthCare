// WeatherWidget.jsx
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloud,
  faSun,
  faCloudShowersHeavy,
  faSnowflake,
} from '@fortawesome/free-solid-svg-icons';
import useUserLocation from '../hooks/useUserLocation'

// 위도/경도 -> 기상청 격자(nx, ny)
const convertToGrid = (lat, lon) => {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
};

// 실황 기준 시간 계산: 매시 40분 이후 확정
const getUltraNow = () => {
  const now = new Date();
  const mm = now.getMinutes();
  if (mm < 40) now.setHours(now.getHours() - 1);
  const base_date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const base_time = `${String(now.getHours()).padStart(2, '0')}00`;
  return { base_date, base_time };
};

// 운동 추천
const recommendExercise = ({ pty, t1h }) => {
  const temp = typeof t1h === 'number' ? t1h : Number(t1h);
  if (pty && pty !== '0') {
    if (pty === '3') return '실내 스트레칭';
    return '홈트레이닝';
  }
  if (!Number.isNaN(temp)) {
    if (temp >= 30) return '실내 자전거';
    if (temp <= 0) return '실내 요가';
    return '가벼운 조깅';
  }
  return '스트레칭';
};

// 기상 상태 -> 아이콘과 설명
const describeWeather = ({ pty }) => {
  if (pty && pty !== '0') {
    if (pty === '1') return { icon: faCloudShowersHeavy, text: '비' };
    if (pty === '2') return { icon: faCloudShowersHeavy, text: '비/눈' };
    if (pty === '3') return { icon: faSnowflake, text: '눈' };
    if (pty === '4') return { icon: faCloudShowersHeavy, text: '소나기' };
  }
  return { icon: faSun, text: '강수 없음' };
};

const WeatherWidget = () => {
  const [temperature, setTemperature] = useState('—');
  const [weatherText, setWeatherText] = useState('확인 중');
  const [icon, setIcon] = useState(null);
  const [exercise, setExercise] = useState('스트레칭');

  const KMA_API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
  const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_API_KEY;

  // 커스텀 훅으로 위치 정보 가져오기
  const { 
    address: location, 
    latitude, 
    longitude, 
    loading: locationLoading, 
    error: locationError,
    source: locationSource 
  } = useUserLocation({
    kakaoApiKey: KAKAO_API_KEY,
    enableGPS: true,
    enableIP: true,
    enableStorage: true,
    storageKey: 'user'
  });

  // 기상청 호출
  const fetchKmaWeather = async (nx, ny) => {
    const { base_date, base_time } = getUltraNow();

    const qs = new URLSearchParams({
      pageNo: '1',
      numOfRows: '100',
      dataType: 'JSON',
      base_date,
      base_time,
      nx: String(nx),
      ny: String(ny),
    }).toString();

    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${KMA_API_KEY}&${qs}`;

    try {
      const res = await fetch(url);
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error('JSON 파싱 실패. 원본 응답:', raw);
        setWeatherText('날씨 정보 없음');
        setTemperature('—');
        setIcon(null);
        return;
      }

      const items = data?.response?.body?.items?.item || [];
      let t1h; // 기온
      let pty; // 강수 형태

      for (const it of items) {
        if (it.category === 'T1H') t1h = it.obsrValue;
        if (it.category === 'PTY') pty = it.obsrValue;
      }

      if (t1h !== undefined) {
        setTemperature(String(t1h));
      } else {
        setTemperature('—');
      }

      const desc = describeWeather({ pty });
      setWeatherText(desc.text);
      setIcon(desc.icon);
      setExercise(recommendExercise({ pty, t1h }));
    } catch (e) {
      console.error('기상청 API 에러:', e);
      setWeatherText('날씨 정보 없음');
      setTemperature('—');
      setIcon(null);
    }
  };

  // 위치 정보가 변경될 때마다 날씨 정보 가져오기
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      const { nx, ny } = convertToGrid(latitude, longitude);
      fetchKmaWeather(nx, ny);
    }
  }, [latitude, longitude, KMA_API_KEY]);

  // 로딩 상태 표시
  if (locationLoading) {
    return (
      <div className="weather-widget">
        <div className="weather-info">위치 확인 중...</div>
      </div>
    );
  }

  // 에러 상태 표시
  if (locationError) {
    return (
      <div className="weather-widget">
        <div className="weather-info">
          <span className="location">{location}</span>
          <span className="error">위치 오류</span>
        </div>
        <div className="weather-description">{locationError}</div>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-info" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="location">{location}</span>
        <span className="temperature">{temperature}°C</span>
        {icon && <FontAwesomeIcon icon={icon} className="weather-icon" />}
      </div>

      <div className="weather-description">{weatherText}</div>

      <div className="weather-exercise">추천 운동: {exercise}</div>
      
      {/* 개발/디버깅용 정보 (필요시) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
          위치 소스: {locationSource}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;