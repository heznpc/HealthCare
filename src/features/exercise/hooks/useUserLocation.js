import { localData } from "../../../utils/indexedStore.mjs";
// hooks/useUserLocation.js
import { useState, useEffect, useCallback } from 'react';

/**
 * 사용자의 위치 정보를 가져오는 커스텀 훅
 * GPS, IP, localData 순서로 시도하며 Kakao Maps API를 사용하여 주소를 변환합니다.
 * 
 * @param {Object} options - 설정 옵션
 * @param {string} options.kakaoApiKey - Kakao Maps API 키
 * @param {boolean} options.enableGPS - GPS 사용 여부 (기본값: true)
 * @param {boolean} options.enableIP - IP 기반 위치 사용 여부 (기본값: true)
 * @param {boolean} options.enableStorage - localData 사용 여부 (기본값: true)
 * @param {string} options.storageKey - localStorage에서 사용할 키 (기본값: 'user')
 * @param {boolean} options.autoFetch - 컴포넌트 마운트 시 자동으로 위치를 가져올지 여부 (기본값: true)
 * 
 * @returns {Object} 위치 정보 객체
 * @returns {string} return.address - 주소 문자열
 * @returns {number|null} return.latitude - 위도
 * @returns {number|null} return.longitude - 경도
 * @returns {boolean} return.loading - 로딩 상태
 * @returns {string|null} return.error - 에러 메시지
 * @returns {string} return.source - 위치 정보 소스 ('gps', 'ip', 'storage', 'unknown')
 * @returns {Function} return.refetch - 수동으로 위치 정보 다시 가져오기
 */
const useUserLocation = (options = {}) => {
    const {
        kakaoApiKey,
        enableGPS = true,
        enableIP = true,
        enableStorage = true,
        storageKey = 'user',
        autoFetch = true
    } = options;

    const [location, setLocation] = useState({
        address: '위치 확인 중',
        latitude: null,
        longitude: null,
        loading: true,
        error: null,
        source: 'unknown'
    });

    // IP 기반 위치 정보 가져오기 - 성능 최적화
    const fetchLocationByIP = async () => {
        try {
            // 가장 빠른 서비스 하나만 시도
            const response = await Promise.race([
                fetch('https://ipapi.co/json/', { timeout: 5000 }),
                fetch('http://ip-api.com/json/', { timeout: 5000 }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('IP 위치 서비스 타임아웃')), 5000)
                )
            ]);

            if (!response.ok) {
                throw new Error('IP 위치 서비스 응답 오류');
            }

            const data = await response.json();

            // ipapi.co 응답 처리
            if (data.latitude && data.longitude) {
                return {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    address: data.city ? `${data.city}, ${data.region || data.country_name}` : '위치 확인됨'
                };
            }

            // ip-api.com 응답 처리
            if (data.lat && data.lon) {
                return {
                    latitude: data.lat,
                    longitude: data.lon,
                    address: data.city ? `${data.city}, ${data.regionName || data.country}` : '위치 확인됨'
                };
            }

            throw new Error('위치 데이터를 찾을 수 없음');
        } catch (error) {
            console.warn('IP 기반 위치 확인 실패:', error);
            // 기본 서울 좌표 반환 (성능상 이유로)
            return {
                latitude: 37.5665,
                longitude: 126.9780,
                address: '서울시 (IP 위치 확인 실패)'
            };
        }
    };

    // 좌표를 주소로 변환 (Kakao Maps API) - 성능 최적화
    const reverseGeocode = (latitude, longitude) => {
        return new Promise((resolve, reject) => {
            // 타임아웃 추가
            const timeout = setTimeout(() => {
                reject(new Error('주소 변환 시간 초과'));
            }, 3000);

            if (!window.kakao?.maps?.services) {
                clearTimeout(timeout);
                reject(new Error('Kakao Maps API를 사용할 수 없습니다'));
                return;
            }

            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2Address(longitude, latitude, (result, status) => {
                clearTimeout(timeout);
                if (status === window.kakao.maps.services.Status.OK && result?.[0]?.address?.address_name) {
                    resolve(result[0].address.address_name);
                } else {
                    // 실패해도 기본 주소 반환
                    resolve('현재 위치');
                }
            });
        });
    };

    // 주소를 좌표로 변환 (Kakao Maps API)
    const geocodeAddress = (address) => {
        return new Promise((resolve, reject) => {
            if (!window.kakao?.maps?.services) {
                reject(new Error('Kakao Maps API를 사용할 수 없습니다'));
                return;
            }

            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                    resolve({
                        latitude: Number(result[0].y),
                        longitude: Number(result[0].x)
                    });
                } else {
                    reject(new Error('주소 검색에 실패했습니다'));
                }
            });
        });
    };

    // localStorage에서 사용자 정보 가져오기
    const getStoredLocation = async () => {
        try {
            const stored = localData.getItem(storageKey);
            if (!stored) throw new Error('저장된 위치 정보가 없습니다');

            const user = JSON.parse(stored);
            if (!user?.address) throw new Error('저장된 주소 정보가 없습니다');

            const coords = await geocodeAddress(user.address);
            return {
                address: user.address,
                latitude: coords.latitude,
                longitude: coords.longitude
            };
        } catch (error) {
            console.warn('저장된 위치 정보 사용 실패:', error);
            throw error;
        }
    };

    // GPS로 현재 위치 가져오기 - 성능 최적화
    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation을 지원하지 않는 브라우저입니다'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        // 역지오코딩을 시도하되 실패해도 좌표는 반환
                        const address = await Promise.race([
                            reverseGeocode(latitude, longitude),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('주소 변환 타임아웃')), 2000)
                            )
                        ]);
                        resolve({
                            latitude,
                            longitude,
                            address
                        });
                    } catch (geocodeError) {
                        // 역지오코딩이 실패해도 좌표는 반환 (성능상 이유)
                        resolve({
                            latitude,
                            longitude,
                            address: '현재 위치'
                        });
                    }
                },
                (error) => {
                    let errorMessage = 'GPS 위치 확인에 실패했습니다';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = '위치 권한이 거부되었습니다';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = '위치 정보를 사용할 수 없습니다';
                            break;
                        case error.TIMEOUT:
                            errorMessage = '위치 확인 시간이 초과되었습니다';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    timeout: 5000,        // 5초로 단축
                    enableHighAccuracy: false, // 정확도보다 속도 우선
                    maximumAge: 300000    // 5분간 캐시 사용
                }
            );
        });
    };

    // 위치 정보 가져오기 (순서: GPS → IP → localData)
    const fetchLocation = useCallback(async () => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        // 1. GPS 시도
        if (enableGPS) {
            try {
                const gpsLocation = await getCurrentPosition();
                setLocation({
                    ...gpsLocation,
                    loading: false,
                    error: null,
                    source: 'gps'
                });
                return;
            } catch (gpsError) {
                console.warn('GPS 위치 확인 실패:', gpsError.message);
            }
        }

        // 2. IP 기반 위치 시도
        if (enableIP) {
            try {
                const ipLocation = await fetchLocationByIP();
                setLocation({
                    ...ipLocation,
                    loading: false,
                    error: null,
                    source: 'ip'
                });
                return;
            } catch (ipError) {
                console.warn('IP 기반 위치 확인 실패:', ipError.message);
            }
        }

        // 3. localData 시도
        if (enableStorage) {
            try {
                const storedLocation = await getStoredLocation();
                setLocation({
                    ...storedLocation,
                    loading: false,
                    error: null,
                    source: 'storage'
                });
                return;
            } catch (storageError) {
                console.warn('저장된 위치 사용 실패:', storageError.message);
            }
        }

        // 모든 방법 실패
        setLocation({
            address: '위치 정보를 확인할 수 없습니다',
            latitude: null,
            longitude: null,
            loading: false,
            error: '위치 정보를 가져올 수 없습니다',
            source: 'unknown'
        });
    }, [enableGPS, enableIP, enableStorage, storageKey]);

    // Kakao Maps SDK 로드
    const loadKakaoMaps = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (window.kakao?.maps?.services) {
                resolve();
                return;
            }

            if (!kakaoApiKey) {
                reject(new Error('Kakao API 키가 필요합니다'));
                return;
            }

            const script = document.createElement('script');
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services&autoload=false`;
            script.async = true;

            script.onload = () => {
                window.kakao.maps.load(() => {
                    resolve();
                });
            };

            script.onerror = () => {
                reject(new Error('Kakao Maps SDK 로드에 실패했습니다'));
            };

            document.head.appendChild(script);
        });
    }, [kakaoApiKey]);

    // 초기화
    useEffect(() => {
        if (!autoFetch) return;

        const initializeLocation = async () => {
            try {
                await loadKakaoMaps();
                await fetchLocation();
            } catch (error) {
                console.error('위치 정보 초기화 실패:', error);
                setLocation(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
            }
        };

        initializeLocation();
    }, [loadKakaoMaps, fetchLocation, autoFetch]);

    return {
        ...location,
        refetch: fetchLocation
    };
};

export default useUserLocation;