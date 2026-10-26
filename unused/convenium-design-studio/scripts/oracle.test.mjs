import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerOracleQuestion,
  buildOracleContext,
  classifyProject,
  createOracleIntake,
  removeOracleToken,
  setOracleMode,
} from '../public/legacy/modules/oracle.js';

test('context tokens follow page and selection while removable optional tokens stay dismissed', () => {
  const initial = buildOracleContext({ project: { id: 'p1', name: 'Atlas' }, route: { id: 'work', trail: ['Work'] }, selection: { kind: 'artifact', id: 'a1', label: 'Homepage brief' } });
  assert.deepEqual(initial.tokens.map(token => [token.kind, token.label, token.removable]), [
    ['project', 'Atlas', false], ['page', 'Work', false], ['selection', 'Homepage brief', true],
  ]);
  const dismissed = removeOracleToken(initial, 'selection:a1');
  const changed = buildOracleContext({ project: { id: 'p1', name: 'Atlas' }, route: { id: 'brief', trail: ['Brief'] }, selection: { kind: 'artifact', id: 'a1', label: 'Homepage brief' }, dismissed: dismissed.dismissed });
  assert.deepEqual(changed.tokens.map(token => token.label), ['Atlas', 'Brief']);
});

test('voice mode reports unavailable without claiming capture and text mode remains usable', () => {
  assert.deepEqual(setOracleMode({ inputMode: 'text' }, 'voice', { voiceAvailable: false }), { inputMode: 'text', notice: 'Voice input is unavailable. Continue with text.' });
  assert.deepEqual(setOracleMode({ inputMode: 'voice' }, 'text', { voiceAvailable: true }), { inputMode: 'text', notice: null });
});

test('classification is deterministic from the stated goal', () => {
  assert.deepEqual(classifyProject('Redesign our restaurant website and improve reservations'), { kind: 'website', confidence: 'high', signals: ['website', 'redesign'] });
  assert.deepEqual(classifyProject('Help me make something useful'), { kind: 'general', confidence: 'low', signals: [] });
});

test('intake asks one unanswered question at a time and explains consequential questions', () => {
  let intake = createOracleIntake('Redesign our restaurant website');
  assert.equal(intake.current.id, 'outcome');
  assert.equal(intake.current.purpose, null);
  intake = answerOracleQuestion(intake, 'outcome', 'Increase qualified reservation requests');
  assert.equal(intake.current.id, 'audience');
  intake = answerOracleQuestion(intake, 'audience', 'People planning a special dinner');
  assert.equal(intake.current.id, 'constraints');
  assert.match(intake.current.purpose, /change what Convenium.Design is allowed to propose/i);
  assert.throws(() => answerOracleQuestion(intake, 'outcome', 'A different answer'), /already answered/i);
});

test('completed intake produces reviewable brief and Design DNA without implementation state', () => {
  let intake = createOracleIntake('Redesign our restaurant website');
  for (const [id, value] of [['outcome', 'Increase reservations'], ['audience', 'Local diners'], ['constraints', 'Keep the logo and booking provider'], ['references', 'Existing photography'], ['assets', 'Logo and licensed photography']]) intake = answerOracleQuestion(intake, id, value);
  assert.equal(intake.status, 'review');
  assert.equal(intake.brief.goal, 'Increase reservations');
  assert.deepEqual(intake.designDna, { direction: 'evidence-led', density: 'operational', media: 'supplied-assets', motion: 'feedback-only' });
  assert.equal('implementation' in intake, false);
  assert.deepEqual(intake.choiceCards.map(card => card.id), ['review-brief', 'revise-answer', 'cancel-intake']);
});
