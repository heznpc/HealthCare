import { showAlert } from '../../../utils/dialogs';
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createRoot } from 'react-dom/client'; 
import HealthMapModal from './HealthMapModal';
import useUserLocation from '../hooks/useUserLocation';

const KakaoMap = forwardRef(({ userAddress, userCoords, facilities}, ref) => {
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [customOverlay, setCustomOverlay] = useState(null);
    const [overlayContainer, setOverlayContainer] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);

    const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_API_KEY;

    // useUserLocation 훅 사용 (날씨 위젯과 동일한 정확한 위치 서비스)
    const { 
        address: locationAddress, 
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

    // 주소를 좌표로 변환하는 함수 추가
    const getCoordsFromAddress = async (address) => {
        return new Promise((resolve) => {
            if (!window.kakao || !address) {
                resolve(null);
                return;
            }
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                    resolve({ lat: result[0].y, lng: result[0].x });
                } else {
                    resolve(null);
                }
            });
        });
    };

    // 특정 시설의 오버레이 표시
    const showFacilityOverlay = (facility) => {
        if (!mapInstance) {
            console.error('mapInstance가 없습니다');
            return;
        }

        // 기존 오버레이가 있다면 닫기
        closeOverlay();

        const lat = parseFloat(facility.lat);
        const lng = parseFloat(facility.lng);

        if (isNaN(lat) || isNaN(lng)) {
            console.error('유효하지 않은 좌표:', facility.lat, facility.lng);
            return;
        }

        const markerPosition = new window.kakao.maps.LatLng(lat, lng);

        // 지도 중심을 해당 위치로 이동
        mapInstance.setCenter(markerPosition);
        mapInstance.setLevel(3);

        // React 컴포넌트를 렌더링할 빈 div 엘리먼트 생성
        const container = document.createElement('div');
        container.className = 'map-api-pp custom-overlay-modal';

        // CustomOverlay 객체 생성
        const newOverlay = new window.kakao.maps.CustomOverlay({
            map: mapInstance,
            position: markerPosition,
            content: container,
            xAnchor: 0.5,
            yAnchor: 1.0,
        });

        const root = createRoot(container);

        // 닫기 함수
        const handleClose = () => {
            console.log('오버레이 닫기');
            root.unmount();
            newOverlay.setMap(null);
            setCustomOverlay(null);
            setOverlayContainer(null);
        };

        // React 컴포넌트 렌더링
        root.render(
            <HealthMapModal
                facility={facility}
                onClose={handleClose}
                onNavigate={() => {
                    handleClose();
                    window.location.href = `/healthlistinfo/${facility.ft_idx}`;
                }}
            />
        );

        setCustomOverlay(newOverlay);
        setOverlayContainer(container);
    };

    // 테이블 행 클릭 시 해당 시설을 지도에 표시하고 모달 띄우기
    const showFacilityOnMap = async (facility) => {
        console.log('테이블에서 시설 선택됨:', facility);
        
        let facilityWithCoords = facility;
        
        // 좌표가 없으면 주소로 변환 시도
        if (!facility.lat || !facility.lng || facility.lat === null || facility.lng === null) {
            console.log('좌표 변환 시도:', facility.address);
            
            if (!facility.address) {
                console.error('주소 정보도 없습니다:', facility);
                showAlert('해당 시설의 위치 정보를 찾을 수 없습니다.');
                return;
            }

            try {
                const coords = await getCoordsFromAddress(facility.address);
                if (coords) {
                    facilityWithCoords = { ...facility, lat: coords.lat, lng: coords.lng };
                    console.log('좌표 변환 성공:', coords);
                } else {
                    console.error('좌표 변환 실패:', facility.address);
                    showAlert('해당 시설의 위치를 찾을 수 없습니다.');
                    return;
                }
            } catch (error) {
                console.error('좌표 변환 오류:', error);
                showAlert('해당 시설의 위치를 찾을 수 없습니다.');
                return;
            }
        }

        // 좌표 유효성 검증
        const lat = parseFloat(facilityWithCoords.lat);
        const lng = parseFloat(facilityWithCoords.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.error('변환된 좌표가 유효하지 않음:', lat, lng);
            showAlert('좌표 정보가 올바르지 않습니다.');
            return;
        }

        // 기존 선택된 마커만 제거 (일반 마커들은 유지)
        if (selectedMarker) {
            selectedMarker.setMap(null);
        }

        // 오버레이만 닫기 (마커는 유지)
        closeOverlay();

        // 새로운 마커 생성 (선택된 시설용) - 기본 마커
        const position = new window.kakao.maps.LatLng(lat, lng);
        
        const newMarker = new window.kakao.maps.Marker({
            position: position,
            map: mapInstance,
            title: facilityWithCoords.title,
        });

        // 마커 클릭 이벤트 추가
        window.kakao.maps.event.addListener(newMarker, 'click', () => {
            showFacilityOverlay(facilityWithCoords);
        });

        setSelectedMarker(newMarker);

        // 지도 중심을 선택된 시설로 이동
        mapInstance.setCenter(position);
        mapInstance.setLevel(3);

        // 자동으로 모달 표시
        showFacilityOverlay(facilityWithCoords);
    };

    // 오버레이 닫기 함수
    const closeOverlay = () => {
        if (customOverlay) {
            customOverlay.setMap(null);
            setCustomOverlay(null);
        }
        if (overlayContainer && overlayContainer.parentNode) {
            overlayContainer.parentNode.removeChild(overlayContainer);
            setOverlayContainer(null);
        }
    };

    // 특정 시설로 지도 중심 이동
    const panToFacility = (facility) => {
        if (!mapInstance) return;

        const lat = parseFloat(facility.lat);
        const lng = parseFloat(facility.lng);
        const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
        mapInstance.setCenter(moveLatLon);
        mapInstance.setLevel(3);
    };

    // ref를 통해 부모 컴포넌트에서 호출할 수 있는 함수들 노출
    useImperativeHandle(ref, () => {
        return {
            showFacilityOverlay,
            showFacilityOnMap,
            closeOverlay,
            panToFacility,
            getMapInstance: () => mapInstance
        };
    }, [mapInstance, markers]);

    useEffect(() => {
        const kakaoApiKey = process.env.REACT_APP_KAKAO_API_KEY;
        if (!kakaoApiKey) {
            console.error('카카오 API 키가 없습니다!');
            return;
        }

        const loadKakaoMapScript = () => {
            return new Promise((resolve) => {
                if (window.kakao && window.kakao.maps) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services&autoload=false`;
                script.async = true;
                script.onload = () => window.kakao.maps.load(() => resolve());
                document.head.appendChild(script);
            });
        };

        const initMap = async () => {
            if (!mapRef.current || !window.kakao) return;

            // 우선순위: userCoords > userAddress > useUserLocation 훅
            let coords = null;
            let finalAddress = '내 위치';

            if (userCoords) {
                coords = new window.kakao.maps.LatLng(userCoords.lat, userCoords.lng);
                finalAddress = '설정된 위치';
            } else if (userAddress) {
                const geocoder = new window.kakao.maps.services.Geocoder();
                await new Promise(resolve => {
                    geocoder.addressSearch(userAddress, (result, status) => {
                        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                            coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                            finalAddress = userAddress;
                        }
                        resolve();
                    });
                });
            } else if (latitude !== null && longitude !== null) {
                coords = new window.kakao.maps.LatLng(latitude, longitude);
                finalAddress = locationAddress;
                console.log('useUserLocation 위치 사용:', { 
                    source: locationSource, 
                    address: locationAddress, 
                    coords: { lat: latitude, lng: longitude } 
                });
            }

            const mapOption = {
                center: coords || new window.kakao.maps.LatLng(37.5665, 126.9780),
                level: 5,
            };

            const map = new window.kakao.maps.Map(mapRef.current, mapOption);
            setMapInstance(map);

            if (coords) {
                // 사용자 위치 마커 추가
                new window.kakao.maps.Marker({
                    position: coords,
                    map: map,
                    title: finalAddress,
                });
            }
        };

        loadKakaoMapScript().then(initMap);
    }, []); // 초기 한 번만 실행

    // useUserLocation 훅에서 위치 데이터가 업데이트될 때 지도 업데이트
    useEffect(() => {
        if (!mapInstance || locationLoading) return;
        
        // userCoords나 userAddress가 있으면 우선 사용
        if (userCoords || userAddress) return;
        
        // useUserLocation 데이터로 지도 업데이트
        if (latitude !== null && longitude !== null) {
            const coords = new window.kakao.maps.LatLng(latitude, longitude);
            mapInstance.setCenter(coords);
            
            // 기존 사용자 위치 마커 제거 후 새로 추가
            new window.kakao.maps.Marker({
                position: coords,
                map: mapInstance,
                title: locationAddress || '현재 위치',
            });
            
            console.log('지도 위치 업데이트:', { 
                source: locationSource, 
                address: locationAddress, 
                coords: { lat: latitude, lng: longitude } 
            });
        }
    }, [mapInstance, latitude, longitude, locationAddress, locationSource, locationLoading, userCoords, userAddress]);

    // 위치 로딩 상태 표시 (개발용)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('KakaoMap 위치 정보:', {
                locationLoading,
                locationError,
                locationSource,
                latitude,
                longitude,
                locationAddress
            });
        }
    }, [locationLoading, locationError, locationSource, latitude, longitude, locationAddress]);

    // 다른 곳 클릭 시 오버레이 닫기
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!overlayContainer) return;
            if (!overlayContainer.contains(event.target)) {
                closeOverlay();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [overlayContainer]);

    // 🔥 좌표가 있는 시설만 지도에 마커 표시 (기존 로직 유지)
    useEffect(() => {
        if (!mapInstance || !facilities || facilities.length === 0) return;

        // 기존 선택된 마커가 아닌 일반 마커들만 제거
        markers.forEach(marker => {
            if (marker !== selectedMarker) {
                marker.setMap(null);
            }
        });

        const newMarkers = [];
        const bounds = new window.kakao.maps.LatLngBounds();
        
        // 좌표가 있는 시설만 필터링
        const facilitiesWithCoords = facilities.filter(facility => 
            facility.lat && facility.lng && 
            !isNaN(parseFloat(facility.lat)) && !isNaN(parseFloat(facility.lng))
        );

        console.log(`전체 시설: ${facilities.length}개, 좌표 있는 시설: ${facilitiesWithCoords.length}개`);

        facilitiesWithCoords.forEach(facility => {
            const lat = parseFloat(facility.lat);
            const lng = parseFloat(facility.lng);
            
            const markerPosition = new window.kakao.maps.LatLng(lat, lng);
            const marker = new window.kakao.maps.Marker({
                position: markerPosition,
                map: mapInstance,
                title: facility.title,
            });

            // 마커 클릭 이벤트
            window.kakao.maps.event.addListener(marker, 'click', () => {
                showFacilityOverlay(facility);
            });

            newMarkers.push(marker);
            bounds.extend(markerPosition);
        });

        // 선택된 마커가 있으면 유지
        if (selectedMarker) {
            newMarkers.push(selectedMarker);
        }

        setMarkers(newMarkers);

        // 마커들이 모두 보이도록 지도 범위 조정 (선택된 마커가 없을 때만)
        if (!selectedMarker && !bounds.isEmpty() && facilitiesWithCoords.length > 1) {
            mapInstance.setBounds(bounds);
        }
    }, [mapInstance, facilities]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            closeOverlay();
        };
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <div
                ref={mapRef}
                style={{ width: '100%', height: '600px', position: 'relative' }}
            />
        </div>
    );
});

export default KakaoMap;