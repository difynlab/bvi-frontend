import { useEffect, useRef } from 'react';

// Module-level counter for concurrent locks
let LOCK_COUNT = 0;

function addLock() {
  if (LOCK_COUNT === 0) {
    document.body.classList.add('modal-open'); // class controls overflow via SCSS
  }
  LOCK_COUNT += 1;
}

function removeLock() {
  LOCK_COUNT = Math.max(0, LOCK_COUNT - 1);
  if (LOCK_COUNT === 0) {
    document.body.classList.remove('modal-open');
  }
}

// isActive: boolean. When true, lock; when false, release (if this instance was holding it).
export function useBodyScrollLock(isActive) {
  const isLockedByThis = useRef(false);

  useEffect(() => {
    if (isActive && !isLockedByThis.current) {
      addLock();
      isLockedByThis.current = true;
    } else if (!isActive && isLockedByThis.current) {
      removeLock();
      isLockedByThis.current = false;
    }
    return () => {
      if (isLockedByThis.current) {
        removeLock();
        isLockedByThis.current = false;
      }
    };
  }, [isActive]);
}
