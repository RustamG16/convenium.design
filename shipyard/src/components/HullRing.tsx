import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { easeDefault, isReducedMotion, MOTION, recordMotion } from '../lib/motion';

/**
 * A number that counts to its new value in 400 ms when it changes while on screen, and is simply
 * the value on first paint and under reduced motion. The text is managed here, not by React children,
 * so a tween can write it; `data-value` always holds the real value.
 */
export function CountUp({ value, className, ...rest }: { value: number; className?: string; style?: React.CSSProperties; 'data-testid'?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  useGSAP(
    () => {
      const node = el.current;
      if (!node) return;
      const from = shown.current;
      shown.current = value;
      if (from === null || from === value || isReducedMotion()) {
        node.textContent = String(value);
        return;
      }
      const o = { v: from };
      const tween = gsap.to(o, {
        v: value,
        duration: MOTION.checkFlip.ms / 1000,
        ease: easeDefault,
        onUpdate: () => {
          node.textContent = String(Math.round(o.v));
        },
        onComplete: () => {
          node.textContent = String(value);
        },
      });
      recordMotion('check-flip-count', MOTION.checkFlip.ms, { from, to: value });
      return () => {
        tween.kill();
        node.textContent = String(value);
      };
    },
    { dependencies: [value] },
  );
  return <span ref={el} className={className} data-value={value} {...rest} />;
}

/** Hull integrity: passed / applicable pre-flight checks as a 0-100 ring (06 section 7.4). Truth: Verified. */
export function HullRing({ percent, passed, applicable, size = 56, blockers = 0 }: { percent: number; passed: number; applicable: number; size?: number; blockers?: number }) {
  const stroke = size >= 100 ? 7 : 4;
  const r = size / 2 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  const label = `Hull integrity ${percent} percent, ${passed} of ${applicable} checks passed${blockers > 0 ? `, ${blockers} ${blockers === 1 ? 'blocker' : 'blockers'} cap it at 99` : ''}`;
  const arc = useRef<SVGCircleElement>(null);
  const was = useRef<number | null>(null);
  const offsetFor = (p: number) => c * (1 - p / 100);
  // When the percent changes on screen the arc fills (or drains) to it in 400 ms; reduced motion shows the final state.
  useGSAP(
    () => {
      const node = arc.current;
      if (!node) return;
      const from = was.current;
      was.current = percent;
      if (from === null || from === percent || isReducedMotion()) {
        gsap.set(node, { clearProps: 'strokeDashoffset' });
        return;
      }
      const tween = gsap.fromTo(node, { strokeDashoffset: offsetFor(from) }, { strokeDashoffset: offsetFor(percent), duration: MOTION.checkFlip.ms / 1000, ease: easeDefault });
      recordMotion('ring-fill', MOTION.checkFlip.ms, { from, to: percent });
      return () => {
        tween.kill();
        node.setAttribute('stroke-dashoffset', String(offsetFor(percent)));
      };
    },
    { dependencies: [percent] },
  );
  return (
    <div className="ring" data-testid="hull-ring" data-size={size} role="img" aria-label={label} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          ref={arc}
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cotton)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offsetFor(percent)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <CountUp className="ring-num" value={percent} style={size >= 100 ? { fontSize: 32, fontWeight: 700 } : undefined} />
    </div>
  );
}
