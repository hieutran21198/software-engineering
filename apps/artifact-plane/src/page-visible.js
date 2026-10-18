import {useEffect, useState} from 'react';

// False while the browser tab is hidden. A hidden tab must not keep event
// streams open: the browser allows 6 HTTP/1.1 connections per host.
export function usePageVisible() {
  const read = () => document.visibilityState !== 'hidden';
  const [visible, setVisible] = useState(read);
  useEffect(() => {
    const update = () => setVisible(read());
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}
