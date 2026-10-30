/** Every number shown carries where it comes from (06 section 7.6). */
export type Truth = 'Verified' | 'Simulated' | 'User-reported';

const MEANING: Record<Truth, string> = {
  Verified: 'Computed from the library or a file you exported',
  Simulated: 'A narrative or a curiosity count, not a measurement of skill',
  'User-reported': 'Pasted by you; not checked here',
};

export function TruthLabel({ truth }: { truth: Truth }) {
  return (
    <span className="truth" data-truth={truth} title={MEANING[truth]}>
      {truth}
    </span>
  );
}
