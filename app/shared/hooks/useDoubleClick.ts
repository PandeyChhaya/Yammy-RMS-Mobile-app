import { useCallback, useRef } from 'react';

interface UseDoubleClickOptions {
    /**
     * Callback fired on single tap/click
     */
    onSingleClick?: () => void;
    /**
     * Callback fired on double tap/click
     */
    onDoubleClick?: () => void;
    /**
     * Delay in milliseconds to distinguish between single and double clicks
     * @default 300
     */
    delay?: number;
}

/**
 * Custom hook to handle single and double tap/click events
 * Works on both web and React Native platforms
 * 
 * @example
 * ```tsx
 * const handlePress = useDoubleClick({
 *   onSingleClick: () => console.log('Single tap'),
 *   onDoubleClick: () => console.log('Double tap'),
 *   delay: 300
 * });
 * 
 * // In React Native:
 * <TouchableOpacity onPress={handlePress}>
 *   <Text>Tap me</Text>
 * </TouchableOpacity>
 * 
 * // On web:
 * <button onClick={handlePress}>
 *   Click me
 * </button>
 * ```
 */
export function useDoubleClick({
    onSingleClick,
    onDoubleClick,
    delay = 300
}: UseDoubleClickOptions) {
    const clickCount = useRef(0);
    const timeoutRef = useRef<number | null>(null);

    const handleClick = useCallback(() => {
        clickCount.current += 1;

        if (clickCount.current === 1) {
            // Start timer for single click
            timeoutRef.current = setTimeout(() => {
                if (clickCount.current === 1 && onSingleClick) {
                    onSingleClick();
                }
                clickCount.current = 0;
            }, delay) as unknown as number;
        } else if (clickCount.current === 2) {
            // Clear single click timer and fire double click
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
            if (onDoubleClick) {
                onDoubleClick();
            }
            clickCount.current = 0;
        }
    }, [onSingleClick, onDoubleClick, delay]);

    return handleClick;
}

/**
 * Alias for mobile-friendly naming
 * Identical to useDoubleClick but with more intuitive naming for React Native
 */
export const useDoubleTap = useDoubleClick;