import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Splash (onboarding/0, Q40): fondo rosso pieno, logo bianco 180 al centro, a ogni apertura dell'app;
 * resta meno di 1 s e poi si dissolve nella prima schermata. Durante i test automatici (webdriver) non compare,
 * a meno di ?splash nell'indirizzo.
 */
const skip = typeof navigator !== 'undefined' && navigator.webdriver && !new URLSearchParams(location.search).has('splash');

export function Splash({ onVisible }: { onVisible: (v: boolean) => void }) {
  const [on, setOn] = useState(!skip);
  useEffect(() => {
    onVisible(on);
    if (!on) return;
    const t = setTimeout(() => setOn(false), 750);
    return () => clearTimeout(t);
  }, [on, onVisible]);
  return (
    <AnimatePresence>
      {on && (
        <motion.div className="splash" aria-label="Movitae" role="img" exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <svg width="180" height="119" viewBox="0 0 180 119" aria-hidden="true">
            <path fill="#fff" d="M76.3407 78.7856C73.5445 70.0668 74.7727 62.0696 79.786 54.6131C82.1739 51.0614 85.742 49.0764 90.0187 48.256C91.6723 47.9387 93.3849 47.961 94.5906 49.3609C95.7788 50.7403 94.6892 51.9903 94.1556 53.2389C93.1453 55.6033 92.0657 57.9464 91.9674 61.0094C93.2503 59.9699 93.5109 58.872 94.0147 57.9188C102.443 41.9701 111.616 26.4555 124.439 13.256C129.733 7.80587 135.473 2.77014 143.394 0.768281C150.422 -1.00795 156.904 1.141 161.041 6.83869C163.906 10.7841 165.689 15.2078 167.035 19.7641C171.2 33.8607 174.504 48.1626 177.088 62.5849C179.114 73.8902 181.365 85.2669 178.961 96.8345C178.113 100.916 176.375 104.607 173.661 107.84C169.56 112.725 162.634 113.796 156.52 110.384C148.4 105.853 143.225 98.8839 139.153 90.9969C135.662 84.2332 134.152 76.9995 133.133 69.6224C133.022 68.8124 133.129 67.9171 131.973 67.3624C130.007 68.2923 128.809 70.126 127.374 71.6798C121.047 78.5323 114.453 85.1289 105.809 89.3485C97.86 93.2292 89.9426 93.5643 82.5289 87.978C79.4416 85.6516 77.6669 82.4774 76.3407 78.7856Z" />
            <path fill="#fff" d="M72.406 0.786643C83.5331 2.25525 87.7119 6.96752 87.8862 17.5066C88.0479 27.2922 85.005 36.3977 81.3166 45.2686C75.4379 59.407 68.9056 73.2813 60.0199 86.0161C53.3158 95.6242 46.134 104.855 36.3453 111.865C30.6497 115.943 24.3855 118.718 16.9739 118.459C8.83256 118.174 2.95864 113.482 0.957022 105.904C-1.45947 96.7549 1.09087 88.1824 4.26916 79.8105C13.801 54.7026 28.6198 32.651 47.8855 13.3366C52.7849 8.42486 58.4715 4.32218 65.293 1.93321C67.5089 1.15714 69.7906 0.760875 72.406 0.786643Z" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
