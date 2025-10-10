import { useEffect } from 'react';
import { modalOpen, modalClose } from '../../helpers/modalLock';

export default function ModalLifecycleLock() {
  useEffect(() => { modalOpen(); return () => modalClose(); }, []);
  return null;
}
