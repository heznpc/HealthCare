export const fetchFoodList = async (foodName) => {
  const encodedFoodName = encodeURIComponent(foodName);
  const url = `https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02?serviceKey=%2BOiBfAcgXdPuMefa6xz%2BPbqrbTYxhwG8Z1FIqiiTTGAC%2B2sDPsRfWQyB%2BAaq6NKTG0T0%2BZIQCP4HHQ90F9GPuQ%3D%3D&FOOD_NM_KR=${encodedFoodName}&pageNo=1&numOfRows=10`;

  const response = await fetch(url);
  const text = await response.text();

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');

  const items = Array.from(xml.getElementsByTagName('item')).map((item) => ({
    name: item.getElementsByTagName('FOOD_NM_KR')[0]?.textContent ?? '',
    energy: item.getElementsByTagName('AMT_NUM1')[0]?.textContent ?? '0',   // 에너지
    protein: item.getElementsByTagName('AMT_NUM6')[0]?.textContent ?? '0', // 단백질
    fat: item.getElementsByTagName('AMT_NUM4')[0]?.textContent ?? '0',     // 지방
    carb: item.getElementsByTagName('AMT_NUM5')[0]?.textContent ?? '0',    // 탄수화물
  }));

  return items;
};
