import { useEffect } from 'react';

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.classList.add('shell-drawer-open');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('shell-drawer-open');
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
