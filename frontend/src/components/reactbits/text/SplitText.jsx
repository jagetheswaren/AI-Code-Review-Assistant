'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap/dist/gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/dist/SplitText';
import { useGSAP } from '@gsap/react';
import { motion } from 'motion/react';

// Register GSAP plugins safely
if (typeof window !== 'undefined') {
  try {
    gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);
  } catch (_) {
    /* Safe fallback if running in test environment */
  }
}

/**
 * React Bits SplitText - Official implementation with robust environment fallback
 * Staggers characters, words, or lines into view using GSAP SplitText or Motion spring.
 */
export default function SplitText({
  text = '',
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 30 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-50px',
  textAlign = 'left',
  tag = 'span',
  onLetterAnimationComplete
}) {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [useGsapPlugin, setUseGsapPlugin] = useState(true);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      if (document.fonts.status === 'loaded') {
        setFontsLoaded(true);
      } else {
        document.fonts.ready.then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
      }
    } else {
      setFontsLoaded(true);
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded || !useGsapPlugin) return;
      if (animationCompletedRef.current) return;
      const el = ref.current;

      try {
        const startPct = (1 - threshold) * 100;
        const start = `top ${startPct}%`;

        let targets;
        const assignTargets = self => {
          if (splitType.includes('chars') && self.chars?.length) targets = self.chars;
          if (!targets && splitType.includes('words') && self.words?.length) targets = self.words;
          if (!targets && splitType.includes('lines') && self.lines?.length) targets = self.lines;
          if (!targets) targets = self.chars || self.words || self.lines;
        };

        const splitInstance = new GSAPSplitText(el, {
          type: splitType,
          smartWrap: true,
          autoSplit: splitType === 'lines',
          linesClass: 'split-line',
          wordsClass: 'split-word',
          charsClass: 'split-char',
          reduceWhiteSpace: false,
          onSplit: self => {
            assignTargets(self);
            if (!targets || !targets.length) return;
            return gsap.fromTo(
              targets,
              { ...from },
              {
                ...to,
                duration,
                ease,
                stagger: (delay > 1 ? delay / 1000 : delay) || 0.03,
                scrollTrigger: {
                  trigger: el,
                  start,
                  once: true,
                  fastScrollEnd: true
                },
                onComplete: () => {
                  animationCompletedRef.current = true;
                  onCompleteRef.current?.();
                },
                willChange: 'transform, opacity',
                force3D: true
              }
            );
          }
        });

        el._rbsplitInstance = splitInstance;

        return () => {
          ScrollTrigger.getAll().forEach(st => {
            if (st.trigger === el) st.kill();
          });
          try {
            splitInstance.revert();
          } catch (_) {}
          el._rbsplitInstance = null;
        };
      } catch (err) {
        // Fallback to motion rendering if DOM split fails
        setUseGsapPlugin(false);
      }
    },
    {
      dependencies: [text, delay, duration, ease, splitType, threshold, fontsLoaded, useGsapPlugin],
      scope: ref
    }
  );

  // If GSAP SplitText is not available or threw, fallback to motion words/letters
  if (!useGsapPlugin) {
    const words = String(text).split(' ');
    const Tag = tag || 'span';
    return (
      <Tag className={`inline-block ${className}`} style={{ textAlign }}>
        {words.map((word, wIdx) => (
          <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.25em]">
            {word.split('').map((char, cIdx) => (
              <motion.span
                key={cIdx}
                initial={{ opacity: from.opacity ?? 0, y: from.y ?? 14 }}
                animate={{ opacity: to.opacity ?? 1, y: to.y ?? 0 }}
                transition={{
                  duration: duration || 0.4,
                  delay: (wIdx * word.length + cIdx) * ((delay > 1 ? delay / 1000 : delay) || 0.03),
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </span>
        ))}
      </Tag>
    );
  }

  const Tag = tag || 'span';
  return (
    <Tag
      ref={ref}
      style={{
        textAlign,
        overflow: 'hidden',
        display: 'inline-block',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        willChange: 'transform, opacity'
      }}
      className={`split-parent ${className}`}
    >
      {text}
    </Tag>
  );
}
