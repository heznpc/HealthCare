import { useEffect, useRef, useSyncExternalStore } from 'react';
import { closeDialog, getDialog, subscribeDialogs } from '../../utils/dialogs';
import styles from './AppDialog.module.css';

export default function AppDialog() {
  const current = useSyncExternalStore(subscribeDialogs, getDialog, () => null);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!current || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('[data-dialog-focus="true"]')?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [current]);

  if (!current) return null;
  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby="app-dialog-title"
      aria-describedby="app-dialog-message" onCancel={event => {
        event.preventDefault();
        closeDialog(false);
      }}>
      <header className={styles.header}>
        <h2 id="app-dialog-title">{current.title}</h2>
        <button type="button" className={styles.close} aria-label="닫기" onClick={() => closeDialog(false)}>×</button>
      </header>
      <p id="app-dialog-message" className={styles.message}>{current.message}</p>
      {current.prompt && <input key={current.message} ref={inputRef} className={styles.input}
        aria-label={current.message} data-dialog-focus="true" autoFocus onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            closeDialog(inputRef.current.value);
          }
        }} />}
      <footer className={styles.actions}>
        {current.cancel && <button type="button" className={styles.secondary} onClick={() => closeDialog(false)}>취소</button>}
        <button type="button" className={current.actionHref ? styles.secondary : styles.primary}
          data-dialog-focus={!current.prompt ? "true" : undefined} autoFocus={!current.prompt} onClick={() => closeDialog(current.prompt ? inputRef.current.value : true)}>{current.confirmLabel || '확인'}</button>
        {current.actionHref && <a className={styles.primary} href={current.actionHref} onClick={() => closeDialog(true)}>{current.actionLabel}</a>}
      </footer>
    </dialog>
  );
}
