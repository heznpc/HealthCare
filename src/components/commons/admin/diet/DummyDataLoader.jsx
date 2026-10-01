import { showAlert, showConfirm } from '../../../../utils/dialogs';
import { localData } from "../../../../utils/indexedStore.mjs";
import React from 'react';
import DummyUsers from '__mock__/DummyUsers';
import { loadDummyDietData } from '__mock__/DummyDietRecords';



function DummyDataLoader() {
    const handleLoadDummyUsers = () => {
        // 기존 사용자 데이터 가져오기
        const existingUsers = JSON.parse(localData.getItem('users') || '{}');
        const existingUserIdIndex = JSON.parse(localData.getItem('userIdIndex') || '{}');
        const userGoals = {};
        
        // 더미 사용자들을 시스템에 맞는 형태로 변환
        DummyUsers.forEach(user => {
            const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const userKey = user.id; // 더미 데이터의 id를 userKey로 사용
            
            // 나이대별 체중과 키 범위 설정
            const age = parseInt(user.age);
            let weightRange, heightRange;
            
            if (age < 20) {
                weightRange = [45, 70];
                heightRange = [150, 180];
            } else if (age < 30) {
                weightRange = [50, 80];
                heightRange = [155, 185];
            } else if (age < 50) {
                weightRange = [55, 85];
                heightRange = [160, 180];
            } else {
                weightRange = [50, 80];
                heightRange = [155, 175];
            }
            
            // 성별에 따른 조정
            if (user.gender === 'female') {
                weightRange = [weightRange[0] - 10, weightRange[1] - 15];
                heightRange = [heightRange[0] - 10, heightRange[1] - 15];
            }
            
            // 랜덤 체중, 키, 활동 수준 생성
            const weight = Math.floor(Math.random() * (weightRange[1] - weightRange[0] + 1)) + weightRange[0];
            const height = Math.floor(Math.random() * (heightRange[1] - heightRange[0] + 1)) + heightRange[0];
            const activities = ['sedentary', 'light', 'moderate', 'active'];
            const activity = activities[Math.floor(Math.random() * activities.length)];

            // BMR 및 TDEE 계산 (Mifflin-St Jeor 공식)
            const bmr = (user.gender === "male" || user.gender === "남")
                ? 10 * weight + 6.25 * height - 5 * age + 5
                : 10 * weight + 6.25 * height - 5 * age - 161;
            
            const activityFactors = {
                'sedentary': 1.2,
                'light': 1.375,
                'moderate': 1.55,
                'active': 1.725
            };
            
            const tdee = Math.round(bmr * activityFactors[activity]);
            
            // 목표 체중 생성 (현재 체중 기준 ±5kg)
            const isLosing = Math.random() > 0.5; // 50% 확률로 감량 목표
            const goalWeight = isLosing 
                ? weight - Math.floor(Math.random() * 10 + 2) // 2~12kg 감량
                : weight + Math.floor(Math.random() * 5 + 1);  // 1~5kg 증량
            
            // 목표 칼로리 계산 (감량: -300~500kcal, 증량: +200~400kcal)
            const calorieAdjustment = isLosing 
                ? -Math.floor(Math.random() * 200 + 300) // -300 ~ -500
                : Math.floor(Math.random() * 200 + 200);  // +200 ~ +400
            const targetCalories = Math.max(1200, tdee + calorieAdjustment); // 최소 1200kcal

            const userData = {
                id: userId,
                userKey: userKey,
                profile: {
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    gender: user.gender,
                    age: age,
                    zipcode: user.zipcode,
                    address: user.address,
                    detailAddress: user.detailAddress
                },
                auth: {
                    passwordHash: btoa(user.password), // 간단한 인코딩
                    hintQuestion: user.hintQuestion,
                    hintAnswer: user.hintAnswer,
                    isDeleted: false
                },
                role: user.role === 'user' ? 'MEMBER' : user.role,
                // 목표 칼로리 계산을 위한 필드들 추가
                weight: weight,
                height: height,
                heightCm: height, // calculateNutritionTargets에서 사용
                age: age, // calculateNutritionTargets에서 사용
                activityKey: activity,
                sex: user.gender, // calculateNutritionTargets에서 사용
                // 목표 설정 데이터 추가
                startWeight: weight,
                goalWeight: goalWeight,
                targetCalories: targetCalories,
                bmr: Math.round(bmr),
                tdee: tdee,
                dietStyle: ['general', 'training', 'keto', 'vegan'][Math.floor(Math.random() * 4)],
                paceKgPerWeek: (Math.random() * 0.8 + 0.2).toFixed(2), // 0.2~1.0 kg/주
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            };
            
            // userGoals 데이터 생성 (GoalSection에서 사용)
            userGoals[userKey] = {
                userId: userId,
                username: user.username,
                activityKey: activity,
                activityFactor: activityFactors[activity],
                sex: user.gender === 'male' ? 'M' : 'F',
                age: age,
                heightCm: height,
                startWeight: weight,
                goalWeight: goalWeight,
                paceKgPerWeek: (Math.random() * 0.8 + 0.2).toFixed(2),
                bmr: Math.round(bmr),
                tdee: tdee,
                targetCalories: targetCalories,
                weeksNeeded: Math.ceil(Math.abs(goalWeight - weight) / ((Math.random() * 0.8 + 0.2))),
                dietStyle: ['general', 'training', 'keto', 'vegan'][Math.floor(Math.random() * 4)],
                createdAt: new Date().toISOString(),
            };
            
            existingUsers[userId] = userData;
            existingUserIdIndex[userKey] = userId;
        });
        
        // localStorage에 저장
        localData.setItem('users', JSON.stringify(existingUsers));
        localData.setItem('userIdIndex', JSON.stringify(existingUserIdIndex));
        localData.setItem('userGoals', JSON.stringify(userGoals));
        
        console.log('더미 사용자 데이터가 로드되었습니다!');
        console.log(`총 ${DummyUsers.length}명의 사용자 추가`);
        console.log(`총 ${Object.keys(userGoals).length}명의 사용자 목표 데이터 추가`);
    };
    
    const handleLoadDummyDietRecords = () => {
        loadDummyDietData();
    };
    
    const handleLoadAllDummyData = () => {
        handleLoadDummyUsers();
        handleLoadDummyDietRecords();
        showAlert('모든 더미 데이터가 로드되었습니다! 페이지를 새로고침하여 확인해보세요.');
    };
    
    const handleClearAllData = async () => {
        if (await showConfirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localData.removeItem('users');
            localData.removeItem('userIdIndex');
            localData.removeItem('dietRecords');
            localData.removeItem('currentAuth');
            showAlert('모든 데이터가 삭제되었습니다!');
        }
    };

    const styles = {
        container: {
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            margin: '20px',
            border: '1px solid #dee2e6'
        },
        title: {
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#495057'
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
        },
        button: {
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
        },
        primaryButton: {
            backgroundColor: '#68b457',
            color: 'white'
        },
        secondaryButton: {
            backgroundColor: '#6c757d',
            color: 'white'
        },
        dangerButton: {
            backgroundColor: '#dc3545',
            color: 'white'
        },
        description: {
            fontSize: '14px',
            color: '#6c757d',
            marginBottom: '16px',
            lineHeight: '1.5'
        }
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>🔧 관리자 테스트 도구</h3>
            <p style={styles.description}>
                관리자 모드 기능을 테스트하기 위한 더미 데이터를 로드할 수 있습니다.<br/>
                • 사용자: 100명의 기본 사용자 + 18명의 MEMBER 사용자<br/>
                • 식이 기록: 최근 30일간 다양한 식사 데이터<br/>
                • 차트와 통계에서 실제 데이터 확인 가능
            </p>
            <div style={styles.buttonGroup}>
                <button 
                    style={{...styles.button, ...styles.primaryButton}}
                    onClick={handleLoadAllDummyData}
                >
                    📊 모든 더미 데이터 로드
                </button>
                <button 
                    style={{...styles.button, ...styles.secondaryButton}}
                    onClick={handleLoadDummyUsers}
                >
                    👥 사용자 데이터만 로드
                </button>
                <button 
                    style={{...styles.button, ...styles.secondaryButton}}
                    onClick={handleLoadDummyDietRecords}
                >
                    🍽️ 식이 기록만 로드
                </button>
                <button 
                    style={{...styles.button, ...styles.dangerButton}}
                    onClick={handleClearAllData}
                >
                    🗑️ 모든 데이터 삭제
                </button>
            </div>
        </div>
    );
}

export default DummyDataLoader;