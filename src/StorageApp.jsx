import AppDialog from './components/commons/AppDialog';
import { useEffect, useState } from 'react';
import App from './App';
import { initializeStorage, retryStorage, storageStatus } from './utils/indexedStore.mjs';

export default function StorageApp() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const onStatus = () => {
      const status = storageStatus();
      setSaving(status.pending > 0);
      setError(status.error);
    };
    window.addEventListener('healthcare-storage-status', onStatus);
    initializeStorage().then(() => { if (active) setReady(true); })
      .catch(e => { if (active) setError(e); });
    return () => {
      active = false;
      window.removeEventListener('healthcare-storage-status', onStatus);
    };
  }, []);

  const retry = async () => {
    setError(null);
    try {
      await initializeStorage();
      await retryStorage();
      setReady(true);
    } catch (e) { setError(e); }
  };

  return (
    <>
      <AppDialog />
      {error && <div role="alert" style={{ padding: 16, background: '#fff0f0', color: '#8a1515' }}>
        데이터를 저장할 수 없습니다. 브라우저의 저장 공간과 접근 권한을 확인해 주세요.
        <button onClick={retry}>다시 시도</button>
      </div>}
      {ready ? <App /> : !error && <p role="status">저장된 데이터를 불러오는 중입니다…</p>}
      {ready && saving && !error && <span role="status" style={{ position: 'fixed', bottom: 12, right: 12, background: 'white', padding: 8, zIndex: 10000 }}>저장 중…</span>}
    </>
  );
}
