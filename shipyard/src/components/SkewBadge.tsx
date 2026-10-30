import type { ReactNode } from 'react';

/** The skewed italic station / class badge (DESIGN: signal on cherry; cotton and muted variants). */
export function SkewBadge({ children, tone }: { children: ReactNode; tone?: 'signal' | 'cotton' | 'muted' }) {
  return (
    <span className="skew-badge" data-tone={tone ?? 'signal'}>
      {children}
    </span>
  );
}
