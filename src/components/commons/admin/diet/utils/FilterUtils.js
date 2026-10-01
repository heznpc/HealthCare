export const AGE_GROUPS = {
    '전체': [0, 100],
    '10대': [10, 19],
    '20대': [20, 29],
    '30대': [30, 39],
    '40대': [40, 49],
    '50대': [50, 59],
    '60대+': [60, 100]
};

export const GENDER_MATCH = {
    '남성': ['male', 'M', '남'],
    '여성': ['female', 'F', '여']
};

export const AGE_OPTIONS = [
    { value: '전체', label: '전체' },
    { value: '10대', label: '10대' },
    { value: '20대', label: '20대' },
    { value: '30대', label: '30대' },
    { value: '40대', label: '40대' },
    { value: '50대', label: '50대' },
    { value: '60대+', label: '60대+' }
];

export const GENDER_OPTIONS = [
    { value: '전체', label: '전체' },
    { value: '남성', label: '남성' },
    { value: '여성', label: '여성' }
];

export const filterUsers = (users, ageGroup = '전체', gender = '전체') => {
    return users.filter(user => {
        // 연령대 필터
        if (ageGroup !== '전체') {
            const age = parseInt(user.age) || parseInt(user.profile?.age) || 0;
            const [min, max] = AGE_GROUPS[ageGroup] || [0, 100];
            if (age < min || age > max) return false;
        }

        // 성별 필터
        if (gender !== '전체') {
            const userGender = user.gender || user.profile?.gender || user.sex;
            if (!GENDER_MATCH[gender]?.includes(userGender)) return false;
        }

        return true;
    });
};