const publicKeys = [
  'REACT_APP_KAKAO_API_KEY', 'REACT_APP_SEOUL_API_KEY',
  'REACT_APP_WEATHER_API_KEY', 'REACT_APP_OPENAI_API_KEY',
  'REACT_APP_GOOGLE_SEARCH_KEY', 'REACT_APP_GOOGLE_CX_KEY',
];

export default {
  // Preserve the existing integration configuration during the CRA migration.
  env: Object.fromEntries(publicKeys.map(key => [key, process.env[key] || ''])),
};
