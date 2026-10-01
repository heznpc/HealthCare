import React, { useEffect, useRef, useState } from 'react';
import KakaoMap from './KakaoMap';
import '../css/healthMap.css';
import WeatherWidget from './WeatherWidget';
import LoadingSpinner from './LoadingSpinner';
import { storage } from '../../../utils/storage'; 
import printBtnImg from '../../img/printBtnImg.png'; 

// 서울시 전체 자치구 목록
const seoulBoroughs = [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구'
];

// 컴포넌트 외부에서 Kakao 스크립트 로딩 최적화
let kakaoMapPromise = null;

const loadKakaoMapScript = () => {
    if (kakaoMapPromise) return kakaoMapPromise;
    
    kakaoMapPromise = new Promise((resolve) => {
        if (window.kakao && window.kakao.maps) {
            resolve();
            return;
        }
        const kakaoApiKey = process.env.REACT_APP_KAKAO_API_KEY;
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => window.kakao.maps.load(() => resolve());
        document.head.appendChild(script);
    });
    
    return kakaoMapPromise;
};

const HealthMap = () => {
    const [keyword, setKeyword] = useState('');
    const [selectedBorough, setSelectBorough] = useState('');
    const [selectedByItem, setSelectByItem] = useState('');
    const [data, setData] = useState([]);
    const [userAddress, setUserAddress] = useState(null);
    const [userCoords, setUserCoords] = useState(null);
    const [isAddressLoaded, setIsAddressLoaded] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [showAllList, setShowAllList] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isDetailSearchOpen, setIsDetailSearchOpen] = useState(false);
    const [detailSearchForm, setDetailSearchForm] = useState({
        지역: '',
        종목: '',
        시설구분: '',
        시설사용료: '',
        시설대관여부: '',
        주차여부: ''
    });
    const [currentUser, setCurrentUser] = useState(null);

    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);

    const API_KEY = process.env.REACT_APP_SEOUL_API_KEY;
    const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/xml/facilities/1/897/`;

    // Haversine 공식을 사용한 두 지점 간 거리 계산 (단위: km)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
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
                    resolve({ lat: result[0].y, lng: result[0].x });
                } else {
                    resolve(null);
                }
            });
        });
    };

    // 필요할 때만 좌표를 로드하는 함수
    const loadCoordinatesForFacilities = async (facilitiesToLoad) => {
        console.log('좌표 로딩 시작:', facilitiesToLoad.length, '개');
        const updatedFacilities = await Promise.all(
            facilitiesToLoad.map(async (facility) => {
                if (!facility.lat || !facility.lng) {
                    try {
                        const coords = await getCoordsFromAddress(facility.address);
                        if (coords) {
                            console.log('좌표 로드 성공:', facility.title, coords);
                            return { ...facility, lat: coords.lat, lng: coords.lng };
                        } else {
                            console.log('좌표 로드 실패:', facility.title, facility.address);
                        }
                    } catch (error) {
                        console.error('좌표 로드 오류:', facility.title, error);
                    }
                }
                return facility;
            })
        );
        return updatedFacilities;
    };

    // 상세검색 폼 값 변경 핸들러
    const handleDetailFormChange = (field, value) => {
        setDetailSearchForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 상세검색 실행
    const handleDetailSearch = () => {
        if (detailSearchForm.지역) {
            setSelectBorough(detailSearchForm.지역);
        }
        if (detailSearchForm.종목) {
            setSelectByItem(detailSearchForm.종목);
        }

        console.log('상세검색 조건:', detailSearchForm);
        setIsDetailSearchOpen(false);
    };

    // 상세검색 폼 초기화
    const resetDetailForm = () => {
        setDetailSearchForm({
            지역: '',
            종목: '',
            시설구분: '',
            시설사용료: '',
            시설대관여부: '',
            주차여부: ''
        });
    };

    // 현재 로그인한 사용자 정보를 가져오는 함수
    const getCurrentUser = () => {
        const currentAuth = storage.get('currentAuth', 'local');
        if (!currentAuth || !currentAuth.userKey) return null;

        const users = storage.get('users', 'local');
        if (!users || !users[currentAuth.userKey]) return null;

        return users[currentAuth.userKey];
    };

    // 사용자별 즐겨찾기 키 생성
    const getFavoritesKey = (user) => {
        const userIdentifier = user ? (user.userKey || user.id) : 'guest';
        return `healthmap_favorites_${userIdentifier}`;
    };

    // 즐겨찾기만 보기 토글
    const handleToggleFavorites = () => {
        setShowFavoritesOnly(!showFavoritesOnly);
        setShowAllList(false);
        setCurrentPage(1);
    };

    // 전체 리스트 보기 토글
    const handleToggleAllList = () => {
        setShowAllList(!showAllList);
        setShowFavoritesOnly(false);
        setCurrentPage(1);
    };

    // 즐겨찾기 추가/제거
    const toggleFavorite = (facility) => {
        const facilityInfo = {
            ft_idx: facility.ft_idx,
            title: facility.title,
            address: facility.address,
            phone: facility.phone,
            type: facility.type,
            kind: facility.kind,
            savedAt: new Date().toISOString()
        };

        const isAlreadyFavorite = favorites.some(fav =>
            typeof fav === 'object' ? fav.ft_idx === facility.ft_idx : fav ===     
    facility.ft_idx
        );

        let newFavorites;
        if (isAlreadyFavorite) {
            newFavorites = favorites.filter(fav =>
                typeof fav === 'object' ? fav.ft_idx !== facility.ft_idx : fav     
    !== facility.ft_idx
            );
        } else {
            newFavorites = [...favorites, facilityInfo];
        }

        setFavorites(newFavorites);

        const favoritesKey = getFavoritesKey(currentUser);
        if (favoritesKey) {
            storage.set(favoritesKey, newFavorites, 'local');
        }
    };

    // 즐겨찾기 여부 확인
    const isFavorite = (facility) => {
        return favorites.some(fav =>
            typeof fav === 'object' ? fav.ft_idx === 
    facility.ft_idx : fav ===
    facility.ft_idx
        );
    };

    // 페이지 변경 핸들러
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // 현재 페이지에 표시할 데이터 계산
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    // 총 페이지 수 계산
    const getTotalPages = () => {
        return Math.ceil(filteredData.length / itemsPerPage);
    };

    // 페이지네이션 버튼 생성
    const renderPaginationButtons = () => {
        const totalPages = getTotalPages();
        const buttons = [];
        
        if (currentPage > 1) {
            buttons.push(
                <button 
                    key="prev" 
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    이전
                </button>
            );
        }

        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    className={`pagination-button ${i === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        if (currentPage < totalPages) {
            buttons.push(
                <button 
                    key="next" 
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    다음
                </button>
            );
        }

        return buttons;
    };

    // 검색 조건이 있는지 확인하는 함수
    const hasSearchConditions = () => {
        return keyword !== '' || 
                selectedBorough !== '' || 
                selectedByItem !== '' ||
                detailSearchForm.시설구분 !== '' ||
                detailSearchForm.시설사용료 !== '' ||
                detailSearchForm.시설대관여부 !== '' ||
                detailSearchForm.주차여부 !== '';
    };

    const hasSearchResults = () => {
        return filteredData.length > 0;
    };

    // 최적화된 데이터 로딩 로직
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. 현재 로그인한 사용자 정보 먼저 가져오기
                const user = getCurrentUser();
                setCurrentUser(user);

                // 2. 사용자별 즐겨찾기 데이터 로드
                if (user) {
                    const favoritesKey = getFavoritesKey(user);
                    if (favoritesKey) {
                        const storedFavorites = storage.get(favoritesKey, 'local');
                        setFavorites(storedFavorites || []);
                    }
                } else {
                    setFavorites([]);
                }

                // 3. API 데이터 먼저 가져오기 (좌표 없이)
                if (!API_KEY) {
                    console.error('API 키가 없습니다!');
                    setIsDataLoaded(true);
                    return;
                }

                const res = await fetch(url);
                const str = await res.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(str, "application/xml");
                const rows = Array.from(xml.getElementsByTagName("row"));
                
                // 좌표 없이 먼저 데이터 설정하여 빠른 렌더링
                const facilities = rows.map((row) => {
                    const address = row.getElementsByTagName("FT_ADDR")[0]?.textContent || '';
                    return {
                        ft_idx: row.getElementsByTagName("FT_IDX")[0]?.textContent || '',
                        title: row.getElementsByTagName("FT_TITLE")[0]?.textContent || '',
                        kind: row.getElementsByTagName("FT_KIND_NAME")[0]?.textContent || '',
                        type: row.getElementsByTagName("BK_CD_NAME")[0]?.textContent || '',
                        fee: row.getElementsByTagName("FT_MONEY")[0]?.textContent || '',
                        rental: row.getElementsByTagName("RT_CD_NAME")[0]?.textContent || '',
                        parking: row.getElementsByTagName("FT_PARK")[0]?.textContent || '',
                        phone: row.getElementsByTagName("FT_PHONE")[0]?.textContent || '',
                        address: address,
                        lat: null,
                        lng: null,
                    };
                });
                
                setData(facilities);
                setIsDataLoaded(true);

                // 4. 그 다음 Kakao 스크립트 로드 (백그라운드에서)
                await loadKakaoMapScript();

                // 5. 사용자 주소 처리 - 비회원 IP 위치 지원
                if (user && user.profile && user.profile.address) {
                    setUserAddress(user.profile.address);
                    const coords = await getCoordsFromAddress(user.profile.address);
                    if (coords) {
                        setUserCoords(coords);
                    }
                } else {
                    // 비회원인 경우 IP 기반 위치 가져오기
                    try {
                        const response = await fetch('https://ipapi.co/json/');
                        const ipLocationData = await response.json();
                        
                        if (ipLocationData && ipLocationData.latitude && ipLocationData.longitude) {
                            // 좌표를 직접 사용
                            const ipCoords = {
                                lat: ipLocationData.latitude,
                                lng: ipLocationData.longitude
                            };
                            setUserCoords(ipCoords);
                            
                            // 주소도 설정 (한국어 주소가 있으면 사용, 없으면 영어 주소)
                            const ipAddress = ipLocationData.region && ipLocationData.city 
                                ? `${ipLocationData.region} ${ipLocationData.city}`
                                : `${ipLocationData.country_name}`;
                            setUserAddress(ipAddress);
                            
                            console.log('IP 기반 위치 설정 완료:', ipAddress, ipCoords);
                        }
                    } catch (error) {
                        console.warn('IP 기반 위치 가져오기 실패:', error);
                        
                        // 기존 localData 방식 시도
                        const storedUserData = storage.get('users', 'local');
                        if (storedUserData && storedUserData.address) {
                            setUserAddress(storedUserData.address);
                            const coords = await getCoordsFromAddress(storedUserData.address);
                            if (coords) {
                                setUserCoords(coords);
                            }
                        }
                    }
                }
                setIsAddressLoaded(true);

                // 6. 일부 시설만 좌표 로드하여 지도 표시 가능하게 처리
                const sampleFacilities = facilities.slice(0, 10);
                if (sampleFacilities.length > 0) {
                    try {
                        const facilitiesWithCoords = await loadCoordinatesForFacilities(sampleFacilities);
                        
                        const mixedData = facilities.map(facility => {
                            const withCoords = facilitiesWithCoords.find(f => f.ft_idx === facility.ft_idx);
                            return withCoords || facility;
                        });
                        
                        setData(mixedData);
                        console.log('좌표 포함 데이터 업데이트 완료');
                    } catch (error) {
                        console.error('좌표 로딩 중 오류:', error);
                        setData(facilities);
                    }
                } else {
                    setData(facilities);
                }

            } catch (err) {
                console.error("데이터 로딩 에러:", err);
                setIsDataLoaded(true);
                setIsAddressLoaded(true);
            }
        };

        fetchData();
    }, [API_KEY, url]);

    // 로그인 상태가 변경되었을 때 즐겨찾기 데이터 다시 불러오기
    useEffect(() => {
        if (currentUser) {
            const favoritesKey = getFavoritesKey(currentUser);
            if (favoritesKey) {
                const storedFavorites = storage.get(favoritesKey, 'local');
                setFavorites(storedFavorites || []);
            }
        } else {
            setFavorites([]);
            setShowFavoritesOnly(false);
        }
    }, [currentUser]);

    // 검색 및 반경 필터링 로직 - 비회원 IP 위치 지원
    useEffect(() => {
        let tempFilteredData = data.filter(item => {
            const matchesBorough = selectedBorough === '' || item.address.includes(selectedBorough);
            const matchesKind = selectedByItem === '' || item.kind.includes(selectedByItem);
            const matchesKeyword = keyword === '' ||
                (item.title && item.title.includes(keyword)) ||
                (item.address && item.address.includes(keyword));

            const matchesType = detailSearchForm.시설구분 === '' || (item.type && item.type.includes(detailSearchForm.시설구분));
            const matchesFee = detailSearchForm.시설사용료 === '' || (item.fee && item.fee.includes(detailSearchForm.시설사용료));
            const matchesRental = detailSearchForm.시설대관여부 === '' || (item.rental && item.rental.includes(detailSearchForm.시설대관여부));
            const matchesParking = detailSearchForm.주차여부 === '' ||
                (detailSearchForm.주차여부 === '주차가능' ? item.parking?.includes('가능') : true);

            const matchesFavorites = !showFavoritesOnly || favorites.some(fav =>
                typeof fav === 'object' ? fav.ft_idx === item.ft_idx : fav ===
            item.ft_idx
            );

            let withinRadius = true;
            if (!showAllList && !showFavoritesOnly && !hasSearchConditions() && userCoords) {
                // 좌표가 있는 시설만 거리 계산
                if (item.lat && item.lng && !isNaN(parseFloat(item.lat)) && !isNaN(parseFloat(item.lng))) {
                    const distance = calculateDistance(
                        parseFloat(userCoords.lat),
                        parseFloat(userCoords.lng),
                        parseFloat(item.lat),
                        parseFloat(item.lng)
                    );
                    withinRadius = distance <= 1;
                } else {
                    // 좌표가 없는 시설은 주변 보기에서 포함
                    withinRadius = true;
                }
            }

            return matchesBorough && matchesKind && matchesKeyword &&
                matchesType && matchesFee && matchesRental && matchesParking &&
                matchesFavorites && withinRadius;
        });
        setFilteredData(tempFilteredData);
        setCurrentPage(1);

    }, [data, selectedBorough, selectedByItem, keyword, userCoords, detailSearchForm, showAllList, showFavoritesOnly, favorites]);

    const handleTableRowClick = async (facility) => {
        console.log('선택된 시설:', facility);
        
        // 지도 영역으로 부드럽게 스크롤
        if (mapContainerRef.current) {
            mapContainerRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
        
        // 좌표가 없는 경우 즉시 로드하여 완전한 데이터 생성 (원본 데이터는 변경하지 않음)
        let completeFacility = facility;
        if ((!facility.lat || !facility.lng) && facility.address) {
            console.log('좌표 로딩 중...', facility.title);
            try {
                const coords = await getCoordsFromAddress(facility.address);
                if (coords) {
                    completeFacility = {
                        ...facility,
                        lat: coords.lat,
                        lng: coords.lng
                    };
                    console.log('좌표 로드 성공:', coords);
                } else {
                    console.warn('좌표 변환 실패:', facility.address);
                }
            } catch (error) {
                console.error('좌표 변환 오류:', error);
            }
        }

        setSelectedFacility(completeFacility);
        setIsModalOpen(true);

        // 약간의 딜레이 후 지도에 시설 표시 (스크롤 완료 후)
        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.showFacilityOnMap(completeFacility); 
            }
        }, 300);
    };

    return (
        <div className="healthmap-area">
            <WeatherWidget />

            <div className="healthmap-title">
                <h3>체육시설</h3>
                <ul>
                    <li onClick={() => window.print()}>
                        <img src={printBtnImg} alt="Print" style={{width:30, height:30}} />
                    </li>
                </ul>
            </div>

            <h4>* 체육시설 정보는 참고용이며, 자세한 사항은 해당 시설에 문의 부탁드립니다.</h4>

            <div className="select-box">
                <div className='select-container'>
                    <select
                        onChange={(e) => setSelectBorough(e.target.value)}
                        value={selectedBorough}
                    >
                        <option value="">자치구</option>
                        {seoulBoroughs.map(borough => (
                            <option key={borough} value={borough}>{borough}</option>
                        ))}
                    </select>
                </div>

                <div className='select-container'>
                    <select
                        onChange={(e) => setSelectByItem(e.target.value)}
                        value={selectedByItem}
                    >
                        <option value="">종목별</option>
                        <option value="풋살">풋살</option>
                        <option value="축구">축구</option>
                        <option value="족구">족구</option>
                        <option value="야구">야구</option>
                        <option value="농구">농구</option>
                        <option value="배구">배구</option>
                        <option value="골프">골프</option>
                        <option value="수영">수영</option>
                        <option value="빙상">빙상</option>
                        <option value="테니스">테니스</option>
                        <option value="게이트볼">게이트볼</option>
                        <option value="배드민턴">배드민턴</option>
                        <option value="기타">기타</option>
                    </select>
                </div>

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="검색어를 입력하세요"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <a href="#none" className="search-link">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </a>
                </div>

                <a
                    href='#none'
                    className="search-link-info"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsDetailSearchOpen(true);
                    }}
                >
                    상세검색열기
                </a>
            </div>

            <div style={{
                backgroundColor: hasSearchConditions() && hasSearchResults() ? '#e7f3ff' : '#f9e7e7',
                border: '1px solid #b3d7ff',
                borderRadius: '4px',
                padding: '10px',
                margin: '10px 0',
                fontSize: '14px',
                color: hasSearchConditions() && hasSearchResults() ? '#0066cc' : '#cc0000',
            }}>
                {hasSearchConditions() && hasSearchResults()
                ?
                '✓ 검색 조건이 적용되어 전체 데이터에서 검색합니다.'
                : 
                '✗ 검색 조건이 없습니다.'
                }
            </div>

            {/* 상세검색 모달 */}
            {isDetailSearchOpen && (
                <div 
                    className="modal-overlay" 
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsDetailSearchOpen(false);
                        }
                    }}
                >
                    <div className="detail-search-modal">
                        <div className="modal-header">
                            <h2>상세검색</h2>
                            <button
                                className="modal-close-button"
                                onClick={() => setIsDetailSearchOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="form-field">
                                <label className="field-label">시설구분</label>
                                <div className="radio-group">
                                    {['공공체육시설', '학교체육시설', '기타'].map((option) => (
                                        <label key={option} className="radio-option">
                                            <input
                                                type="radio"
                                                name="시설구분"
                                                value={option}
                                                checked={detailSearchForm.시설구분 === option}
                                                onChange={(e) => handleDetailFormChange('시설구분', e.target.value)}
                                                className="radio-input"
                                            />
                                            <span className="radio-label">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="field-label">시설사용료</label>
                                <div className="radio-group">
                                    {['유료', '무료'].map((option) => (
                                        <label key={option} className="radio-option">
                                            <input
                                                type="radio"
                                                name="시설사용료"
                                                value={option}
                                                checked={detailSearchForm.시설사용료 === option}
                                                onChange={(e) => handleDetailFormChange('시설사용료', e.target.value)}
                                                className="radio-input"
                                            />
                                            <span className="radio-label">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="field-label">시설대관여부</label>
                                <div className="radio-group">
                                    {['가능', '불가능'].map((option) => (
                                        <label key={option} className="radio-option">
                                            <input
                                                type="radio"
                                                name="시설대관여부"
                                                value={option}
                                                checked={detailSearchForm.시설대관여부 === option}
                                                onChange={(e) => handleDetailFormChange('시설대관여부', e.target.value)}
                                                className="radio-input"
                                            />
                                            <span className="radio-label">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="field-label">주차여부</label>
                                <div className="radio-group">
                                    {['주차가능', '무관'].map((option) => (
                                        <label key={option} className="radio-option">
                                            <input
                                                type="radio"
                                                name="주차여부"
                                                value={option}
                                                checked={detailSearchForm.주차여부 === option}
                                                onChange={(e) => handleDetailFormChange('주차여부', e.target.value)}
                                                className="radio-input"
                                            />
                                            <span className="radio-label">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="reset-button"
                                onClick={resetDetailForm}
                            >
                                초기화
                            </button>
                            <button
                                className="search-submit-button"
                                onClick={handleDetailSearch}
                            >
                                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                검색
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='map-wrapper'>
                <div className='map-container' ref={mapContainerRef}>
                    {!isDataLoaded ? (
                        <LoadingSpinner 
                            message='체육시설 데이터를 불러오는 중입니다....'/>
                    ) : (
                        <KakaoMap
                            ref={mapRef}
                            userAddress={userAddress}
                            userCoords={userCoords}
                            facilities={filteredData}
                        />
                    )}

                    <div className='result-container'>
                        <div className='total-cont'>
                            <p>총</p>
                            <span className='count'>{filteredData.length}</span>개
                            <button 
                                className="toggle-all-list-button"
                                onClick={handleToggleAllList}
                                style={{
                                    marginLeft: '5px',
                                    padding: '5px 10px',
                                    backgroundColor: showAllList ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {showAllList ? '주변만 보기' : '전체 보기'}
                            </button>

                            <button 
                                className="toggle-favorites-button"
                                onClick={handleToggleFavorites}
                                style={{
                                    marginLeft: '5px',
                                    padding: '5px 10px',
                                    backgroundColor: showFavoritesOnly ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {showFavoritesOnly ? '전체 보기' : '즐겨찾기만 보기'}
                            </button>
                            {!currentUser && (
                                <span style={{ 
                                    marginLeft: '10px', 
                                    fontSize: '12px', 
                                    color: '#666' 
                                }}>
                                    (비회원 즐겨찾기 - 로그인하면 계정별로 관리됩니다)
                                </span>
                            )}
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>번호</th>
                                    <th>시설명</th>
                                    <th>종목</th>
                                    <th>전화번호</th>
                                    <th>즐겨찾기</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getCurrentPageData().map((item, idx) => (
                                    <tr key={idx} onClick={() => handleTableRowClick(item)}>
                                        <td data-label="번호">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                        <td 
                                            data-label="시설명" 
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {item.title}
                                        </td>
                                        <td data-label="종목">{item.kind}</td>
                                        <td data-label="전화번호">{item.phone}</td>
                                        <td data-label="즐겨찾기">
                                            <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(item);
                                            }}

                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                padding: '0',
                                                transition: 'color 0.2s ease'
                                            }}
                                            title={isFavorite(item) ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                                            >
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    viewBox="0 0 24 24" 
                                                    fill={isFavorite(item) ? "#ffd700" : "rgba(121, 118, 117, 1)"}
                                                    style={{ width: "24px", height: "24px" }}  
                                                    className="w-6 h-6"
                                                >
                                                    <path 
                                                        fillRule="evenodd" 
                                                        clipRule="evenodd" 
                                                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" 
                                                    />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 페이지네이션 */}
                        {filteredData.length > itemsPerPage && (
                            <div className="pagination">
                                {renderPaginationButtons()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthMap;