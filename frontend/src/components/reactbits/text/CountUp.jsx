'use client';

import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * React Bits CountUp - Official implementation with backward-compatible props
 * Uses spring physics and IntersectionObserver for performant in-view transitions.
 */
export default function CountUp({
  to,
  end,
  from = 0,
  start = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  decimals,
  prefix = '',
  suffix = '',
  className = '',
  startWhen = true,
  separator = ',',
  onStart,
  onEnd
}) {
  const ref = useRef(null);
  
  // Support both official `to` and legacy `end`
  const targetEnd = Number(to !== undefined ? to : (end !== undefined ? end : 0));
  const targetStart = Number(from !== undefined && from !== 0 ? from : (start !== undefined ? start : 0));
  
  // Normalize duration: if duration > 10, treat as milliseconds
  const durationSec = duration > 10 ? duration / 1000 : duration;

  const motionValue = useMotionValue(direction === 'down' ? targetEnd : targetStart);

  const damping = 20 + 40 * (1 / Math.max(durationSec, 0.1));
  const stiffness = 100 * (1 / Math.max(durationSec, 0.1));

  const springValue = useSpring(motionValue, {
    damping,
    stiffness
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = num => {
    const str = num.toString();
    if (str.includes('.')) {
      const dec = str.split('.')[1];
      if (parseInt(dec, 10) !== 0) {
        return dec.length;
      }
    }
    return 0;
  };

  const maxDecimals = decimals !== undefined 
    ? decimals 
    : Math.max(getDecimalPlaces(targetStart), getDecimalPlaces(targetEnd));

  const formatValue = useCallback(
    latest => {
      const hasDecimals = maxDecimals > 0;

      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0
      };

      const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);
      const withSep = separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
      return `${prefix}${withSep}${suffix}`;
    },
    [maxDecimals, separator, prefix, suffix]
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? targetEnd : targetStart);
    }
  }, [targetStart, targetEnd, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === 'function') onStart();

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? targetStart : targetEnd);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === 'function') onEnd();
        },
        delay * 1000 + durationSec * 1000
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [isInView, startWhen, motionValue, direction, targetStart, targetEnd, delay, onStart, onEnd, durationSec]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', latest => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}
