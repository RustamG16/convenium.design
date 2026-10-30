/** Hull integrity: passed / applicable pre-flight checks as a 0-100 ring (06 section 7.4). Truth: Verified. */
export function HullRing({ percent, passed, applicable, size = 56, blockers = 0 }: { percent: number; passed: number; applicable: number; size?: number; blockers?: number }) {
  const stroke = size >= 100 ? 7 : 4;
  const r = size / 2 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  const label = `Hull integrity ${percent} percent, ${passed} of ${applicable} checks passed${blockers > 0 ? `, ${blockers} ${blockers === 1 ? 'blocker' : 'blockers'} cap it at 99` : ''}`;
  return (
    <div className="ring" data-testid="hull-ring" data-size={size} role="img" aria-label={label} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cotton)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * percent) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-num" style={size >= 100 ? { fontSize: 32, fontWeight: 700 } : undefined}>
        {percent}
      </span>
    </div>
  );
}
