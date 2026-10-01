import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/healthListInfo.css';
import LoadingSpinner from './LoadingSpinner';

const HealthListInfo = () => {
    const { ft_idx } = useParams();
    const navigate = useNavigate();
    const [facility, setFacility] = useState(null);
    const [activeTab, setActiveTab] = useState('tab-1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_KEY = process.env.REACT_APP_SEOUL_API_KEY;
    const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/xml/facilities/1/828/`;

    // XML에서 텍스트 추출하는 헬퍼 함수
    const getTextContent = (element, tagName) => {
        const node = element.getElementsByTagName(tagName)[0];
        return node ? node.textContent : '';
    };

    // 주소를 좌표로 변환하는 함수
    const getCoordsFromAddress = async (address) => {
        return new Promise((resolve) => {
            if (!window.kakao || !address) {
                resolve(null);
                return;
            }
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                    resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
                } else {
                    resolve(null);
                }
            });
        });
    };

    // 카카오맵 스크립트 로드
    const loadKakaoMapScript = () => {
        return new Promise((resolve) => {
            if (window.kakao?.maps) {
                resolve();
                return;
            }
            const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_API_KEY;
            const script = document.createElement('script');
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services&autoload=false`;
            script.async = true;
            script.onload = () => window.kakao.maps.load(resolve);
            document.head.appendChild(script);
        });
    };

    // 시설 데이터 가져오기
    useEffect(() => {
        const fetchFacility = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!API_KEY) {
                    throw new Error('API 키가 설정되지 않았습니다.');
                }

                await loadKakaoMapScript();

                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const str = await res.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(str, "application/xml");
                
                // API 에러 체크
                const result = xml.getElementsByTagName("RESULT")[0];
                if (result) {
                    const code = getTextContent(result, "CODE");
                    if (code !== "INFO-000") {
                        throw new Error(`API Error: ${getTextContent(result, "MESSAGE")}`);
                    }
                }

                const rows = Array.from(xml.getElementsByTagName("row"));

                // 모든 시설 데이터를 파싱하여 ft_idx에 맞는 것 찾기
                const targetRow = rows.find(row => 
                    getTextContent(row, "FT_IDX") === ft_idx
                );

                if (!targetRow) {
                    throw new Error('해당 시설을 찾을 수 없습니다.');
                }

                // 완전한 시설 정보 객체 생성
                const facilityData = {
                    // 기본 정보
                    ft_idx: getTextContent(targetRow, "FT_IDX"),
                    borough: getTextContent(targetRow, "AR_CD_NAME"), // 자치구
                    title: getTextContent(targetRow, "FT_TITLE"), // 시설명
                    facilityType: getTextContent(targetRow, "BK_CD_NAME"), // 시설유형
                    postcode: getTextContent(targetRow, "FT_POST"), // 우편번호
                    address: getTextContent(targetRow, "FT_ADDR"), // 주소
                    detailAddress: getTextContent(targetRow, "FT_ADDR_DETAIL"), // 상세주소
                    size: getTextContent(targetRow, "FT_SIZE"), // 시설규모
                    organization: getTextContent(targetRow, "FT_ORG"), // 운영기관
                    phone: getTextContent(targetRow, "FT_PHONE"), // 연락처
                    
                    // 운영시간 정보
                    weekdayTime: getTextContent(targetRow, "FT_WD_TIME"), // 평일 운영시간
                    weekendTime: getTextContent(targetRow, "FT_WE_TIME"), // 주말 운영시간
                    holidayTime: getTextContent(targetRow, "FT_INFO_TIME"), // 공휴일 운영시간
                    
                    // 시설 정보
                    rental: getTextContent(targetRow, "RT_CD_NAME"), // 대관여부
                    fee: getTextContent(targetRow, "FT_MONEY"), // 사용료
                    parking: getTextContent(targetRow, "FT_PARK"), // 주차정보
                    homepage: getTextContent(targetRow, "FT_HOMEPAGE"), // 홈페이지
                    kind: getTextContent(targetRow, "FT_KIND_NAME"), // 시설종류 (종목)
                    operationStatus: getTextContent(targetRow, "FT_OPERATION_NAME"), // 운영상태
                    amenities: getTextContent(targetRow, "FT_SI"), // 편의시설
                    note: getTextContent(targetRow, "FT_BIGO"), // 비고
                };

                // 주소 → 좌표 변환
                if (facilityData.address) {
                    const coords = await getCoordsFromAddress(facilityData.address);
                    facilityData.lat = coords?.lat;
                    facilityData.lng = coords?.lng;
                }

                setFacility(facilityData);

            } catch (error) {
                console.error("시설 데이터를 불러오는 중 오류 발생:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (ft_idx) {
            fetchFacility();
        }
    }, [ft_idx, API_KEY, url]);

    // 카카오맵 초기화
    useEffect(() => {
        if (!facility?.lat || !facility?.lng) return;

        const initializeMap = () => {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) return;

            const mapOption = {
                center: new window.kakao.maps.LatLng(facility.lat, facility.lng),
                level: 3,
            };
            const map = new window.kakao.maps.Map(mapContainer, mapOption);

            const markerPosition = new window.kakao.maps.LatLng(facility.lat, facility.lng);
            const marker = new window.kakao.maps.Marker({
                position: markerPosition,
                map,
                title: facility.title || '',
            });

            // 인포윈도우 추가
            const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;">${facility.title}</div>`
            });

            // 마커 클릭시 인포윈도우 표시
            window.kakao.maps.event.addListener(marker, 'click', () => {
                infowindow.open(map, marker);
            });
        };

        // 약간의 지연을 두고 맵 초기화 (DOM 준비 대기)
        const timer = setTimeout(initializeMap, 100);
        return () => clearTimeout(timer);
    }, [facility]);

    // 탭 클릭 핸들러
    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
    };

    // 목록으로 돌아가기
    const handleBackToList = () => {
        navigate('/exercise/healthmap'); // 실제 목록 페이지 경로로 수정
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="facility-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <LoadingSpinner 
                        message="시설 정보를 불러오는 중입니다..." />
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="facility-container">
                <div className="error-container">
                    <h3>오류가 발생했습니다</h3>
                    <p>{error}</p>
                    <button onClick={handleBackToList} className="button-md">목록으로 돌아가기</button>
                </div>
            </div>
        );
    }

    // 시설 데이터가 없는 경우
    if (!facility) {
        return (
            <div className="facility-container">
                <div className="no-data-container">
                    <p>시설 정보를 찾을 수 없습니다.</p>
                    <button onClick={handleBackToList} className="button-md">목록으로 돌아가기</button>
                </div>
            </div>
        );
    }

    return (
        <div className="facility-container">
            <div className="left-menu">
                <div className="menu-title">
                    <h2>우리동네 생활체육</h2>
                </div>
            </div>

            <div className="content-area">
                <div className="content-header">
                    <h3 className="page-title">{facility.title} 상세정보</h3>
                    <ul className="social-links">
                        <li><a href="#none" className="print" onClick={() => window.print()}>프린트</a></li>
                    </ul>
                </div>
                <p className="info-text">* 체육시설 정보는 참고용이며, 자세한 사항은 해당 시설에 문의 부탁드립니다.</p>

                <div className="contents">
                    <div className="section-map">
                        {/* <h4 className="section-title">{facility.title}</h4> */}
                        <div className="facility-basic-info">
                            <div className="info-item">
                                <span className="info-label">자치구:</span>
                                <span className="info-value">{facility.borough || '정보 없음'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">운영종목:</span>
                                <span className="info-value">{facility.kind || '정보 없음'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">운영상태:</span>
                                <span className={`info-value status ${facility.operationStatus?.includes('정상') ? 'active' : 'inactive'}`}>
                                    {facility.operationStatus || '정보 없음'}
                                </span>
                            </div>
                        </div>

                        <div className="map-container">
                            <div id="map" style={{ width: '100%', height: '400px', border: '1px solid #ddd' }}></div>
                        </div>

                        {/* 탭 메뉴 */}
                        <div className="tabs">
                            <ul className="tab-list">
                                <li 
                                    className={`tab-item ${activeTab === 'tab-1' ? 'current' : ''}`} 
                                    onClick={() => handleTabClick('tab-1')}
                                >
                                    <a href="#n">시설안내</a>
                                </li>
                                <li 
                                    className={`tab-item ${activeTab === 'tab-2' ? 'current' : ''}`} 
                                    onClick={() => handleTabClick('tab-2')}
                                >
                                    <a href="#n">운영안내</a>
                                </li>
                            </ul>
                        </div>

                        {/* 탭 콘텐츠 - 시설안내 */}
                        {activeTab === 'tab-1' && (
                            <div className="tab-content current">
                                <table className="info-table">
                                    <tbody>
                                        <tr>
                                            <th>위치</th>
                                            <td>
                                                {facility.address && (
                                                    <div>
                                                        <div>{facility.address}</div>
                                                        {facility.detailAddress && (
                                                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                                                                {facility.detailAddress}
                                                            </div>
                                                        )}
                                                        {facility.postcode && (
                                                            <div style={{ fontSize: '0.8em', color: '#999' }}>
                                                                우편번호: {facility.postcode}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {!facility.address && '정보 없음'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>시설유형</th>
                                            <td>{facility.facilityType || '정보 없음'}</td>
                                        </tr>
                                        <tr>
                                            <th>시설규모</th>
                                            <td>{facility.size || '정보 없음'}</td>
                                        </tr>
                                        <tr>
                                            <th>사용료</th>
                                            <td>
                                                <span className={facility.fee?.includes('무료') ? 'free-fee' : 'paid-fee'}>
                                                    {facility.fee || '정보 없음'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>시설대관</th>
                                            <td>
                                                <span className={`rental-status ${facility.rental?.includes('가능') ? 'available' : 'unavailable'}`}>
                                                    {facility.rental || '정보 없음'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>관리/운영기관</th>
                                            <td>{facility.organization || '정보 없음'}</td>
                                        </tr>
                                        <tr>
                                            <th>편의시설</th>
                                            <td>
                                                {facility.amenities ? (
                                                    <div className="amenities-list">
                                                        {facility.amenities.split(',').map((amenity, index) => (
                                                            <span key={index} className="amenity-tag">
                                                                {amenity.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : '정보 없음'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>시설운영상태</th>
                                            <td>
                                                <span className={`operation-status ${facility.operationStatus?.includes('정상') ? 'active' : 'inactive'}`}>
                                                    {facility.operationStatus || '정보 없음'}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 탭 콘텐츠 - 운영안내 */}
                        {activeTab === 'tab-2' && (
                            <div className="tab-content current">
                                <table className="info-table">
                                    <tbody>
                                        <tr>
                                            <th>연락처</th>
                                            <td>
                                                {facility.phone ? (
                                                    <a href={`tel:${facility.phone}`} className="phone-link">
                                                        {facility.phone}
                                                    </a>
                                                ) : '정보 없음'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>주차정보</th>
                                            <td>
                                                <span className={`parking-info ${facility.parking?.includes('가능') ? 'available' : 'unavailable'}`}>
                                                    {facility.parking || '정보 없음'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>운영시간</th>
                                            <td>
                                                <div className="operation-hours">
                                                    {facility.weekdayTime && (
                                                        <div className="hours-item">
                                                            <strong>평일:</strong> {facility.weekdayTime}
                                                        </div>
                                                    )}
                                                    {facility.weekendTime && (
                                                        <div className="hours-item">
                                                            <strong>주말:</strong> {facility.weekendTime}
                                                        </div>
                                                    )}
                                                    {facility.holidayTime && (
                                                        <div className="hours-item">
                                                            <strong>공휴일:</strong> {facility.holidayTime}
                                                        </div>
                                                    )}
                                                    {!facility.weekdayTime && !facility.weekendTime && !facility.holidayTime && (
                                                        <div>정보 없음</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>홈페이지</th>
                                            <td>
                                                {facility.homepage ? (
                                                    <a 
                                                        href={facility.homepage.startsWith('http') ? facility.homepage : `http://${facility.homepage}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="homepage-link"
                                                    >
                                                        {facility.homepage}
                                                    </a>
                                                ) : '정보 없음'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>

                    <div className="action-buttons">
                        <button onClick={handleBackToList} className="button-md">목록으로</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthListInfo;