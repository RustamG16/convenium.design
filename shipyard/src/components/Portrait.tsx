// The design sheet of a crew member, or its glyph when the body has no sheet. The still the Bridge
// shows without WebGL, and the loading state of the 3D turntable (T6, director defect 3): the sheet
// stands in the card until the model is ready, then fades, so the card is never empty and never moves.
import type { CSSProperties } from 'react';
import { withBase } from '../lib/baseUrl';
import type { SceneMember } from '../scene/crew';

export function PortraitFace({ member, eager = true }: { member: SceneMember; eager?: boolean }) {
  const sheet = member.model.sheet;
  return sheet ? (
    <img
      src={withBase(`/media/${sheet}-640.webp`)}
      srcSet={`${withBase(`/media/${sheet}-640.webp`)} 640w, ${withBase(`/media/${sheet}-1280.webp`)} 1280w`}
      sizes="320px"
      alt={`${member.name}: ${member.species}`}
      loading={eager ? 'eager' : 'lazy'}
    />
  ) : (
    <span className="ship-portrait-glyph" role="img" aria-label={`${member.name}, no design sheet`}>
      {member.glyph || member.name.slice(0, 1)}
    </span>
  );
}

export function Portrait({ member }: { member: SceneMember }) {
  return (
    <figure className="ship-turntable ship-portrait" data-testid="portrait" style={{ ['--c' as string]: member.pigment } as CSSProperties}>
      <PortraitFace member={member} />
    </figure>
  );
}
