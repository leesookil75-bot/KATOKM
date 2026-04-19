import { useEffect } from 'react';

export default function usePullToRefresh() {
    useEffect(() => {
        let startY = 0;
        let isAtTop = true;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                isAtTop = true;
                startY = e.touches[0].clientY;
            } else {
                isAtTop = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isAtTop) return;
            const y = e.touches[0].clientY;
            // Optionally could add a visual indicator here
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!isAtTop) return;
            const y = e.changedTouches[0].clientY;
            // If pulled down more than 150px while at the top
            if (y > startY + 150) {
                window.location.reload();
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);
}
