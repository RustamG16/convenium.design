/** Every number shown carries where it comes from (06 section 7.6). */
export type Truth = 'Verified' | 'Simulated' | 'User-reported';

const MEANING: Record<Truth, string> = {
  Verified: 'Computed from the library or a file you exported',
  Simulated: 'A narrative or a curiosity count, not a measurement of skill',
  'User-reported': 'Pasted by you; not checked here',
};

/** `detail` is the evidence in a few words, shown after the label (for example the agent the row comes from). */
export function TruthLabel({ truth, detail }: { truth: Truth; detail?: string }) {
  return (
    <span className="truth" data-truth={truth} title={detail ? `${MEANING[truth]}: ${detail}` : MEANING[truth]}>
      {truth}
      {detail && <span className="truth-detail"> · {detail}</span>}
    </span>
  );
}
