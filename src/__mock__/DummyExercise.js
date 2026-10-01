import { localData } from "../utils/indexedStore.mjs";
// src/dev/seedExercise.js
export function seedExerciseDummy(userKey = 'user_1755651854587', count = 50) {
  const KEY = 'exerciseRecords';
  const FLAG = `__seeded_${userKey}`;
  if (localData.getItem(FLAG)) return; // 중복 방지

  const names = ['스쿼트','푸시업','런지','플랭크','데드리프트','벤치프레스','덤벨컬','버피',
                 '사이클','러닝','풀업','랫풀다운','숄더프레스','스텝업','케틀벨스윙'];
  const ri = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const pad = n=>String(n).padStart(2,'0');
  const dstr = d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const tstr = d=>`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  const store = JSON.parse(localData.getItem(KEY) || '{}');
  const list = Array.isArray(store[userKey]) ? store[userKey] : [];

  for (let i=0;i<count;i++){
    const d = new Date();
    d.setDate(d.getDate()-ri(0,59));              // 최근 60일
    d.setHours(ri(6,22),ri(0,59),ri(0,59),0);

    list.push({
      id: Number(`${Date.now()}${i}${ri(100,999)}`),
      date: dstr(d),
      time: tstr(d),
      name: names[ri(0,names.length-1)],
      reps: ri(8,20),
      minutes: ri(20,120),
      kcal: ri(80,600),
      imageUrl: ""
    });
  }

  list.sort((a,b)=> (a.date+a.time) < (b.date+b.time) ? 1 : -1);
  store[userKey] = list;
  localData.setItem(KEY, JSON.stringify(store));
  localData.setItem(FLAG, '1');
  console.log(`seeded ${count} exercise records for ${userKey}`);
}

// 필요 시 리셋용
export function unseedExerciseDummy(userKey = 'user_1755651854587') {
  const KEY = 'exerciseRecords';
  const FLAG = `__seeded_${userKey}`;
  const store = JSON.parse(localData.getItem(KEY) || '{}');
  delete store[userKey];
  localData.setItem(KEY, JSON.stringify(store));
  localData.removeItem(FLAG);
  console.log(`unseeded records for ${userKey}`);
}
