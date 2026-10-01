import React from 'react';
import '../css/healthMapModal.css'; // 스타일시트 import

const HealthMapModal = ({ facility, onClose, onNavigate }) => {
    // facility 객체가 없거나 유효하지 않으면 렌더링하지 않음
    if (!facility) return null;

    // console.log('facility.ft_idx:', facility.ft_idx);

    return (
        <div className="map-api-pp" tabIndex="0">
            <div className="lmpp-hd">
                <div>
                    <h4>{facility.title || '시설 정보 없음'}</h4>
                    <button className="close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                        </svg>

                    </button>
                </div>
            </div>
            <div className="lmpp-con">
                <div className="lmpp-ctxp-item">
                    <div className="lmpp-ctxp-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p>{facility.address || '주소 정보 없음'}</p>
                </div>
                <div className="lmpp-ctxp-item">
                    <div className="lmpp-ctxp-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p>{facility.phone || '연락처 정보 없음'}</p>
                </div>
                <div className="lmpp-ctxp-item">
                    <div className="lmpp-ctxp-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p>
                        {facility.homepage ? (
                            <a href={facility.homepage} target="_blank" rel="noopener noreferrer">
                                {facility.homepage}
                            </a>
                        ) : (
                            '홈페이지 정보 없음'
                        )}
                    </p>
                </div>
                <div className="lmpp-ctxp-item">
                    <div className="lmpp-ctxp-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                        </svg>

                    </div>
                    <p>{facility.kind || '종목 정보 없음'}</p>
                </div>
                {facility.ft_idx && (
                    <a className="bk-btn" onClick={onNavigate} href={`/exercise/healthlistinfo/${facility.ft_idx}`}>
                        상세보기
                    </a>
                )}
            </div>
        </div>
    );
};

export default HealthMapModal;