import { describe, expect, it } from 'vitest';
import { remainingQuestions, resumeAt, toAnswer } from './conversation';
import { SHORT_PATH, fullRemaining, isShortPlan } from './path';
import { planQuestions } from './planEdits';
import { demoAnswers } from './demoCase';

const aboutYou = { 'about-you': { values: { 'your-name': 'Anna', 'your-phone': '+358 40 1' } } };

describe('resuming the onboarding', () => {
  it('a first visit starts on the blank page', () => {
    expect(resumeAt({})).toBeNull();
    expect(resumeAt(aboutYou)).toBeNull();
  });
  it('coming back, the first question not answered yet', () => {
    const first = remainingQuestions(aboutYou)[0].id;
    const answers = { ...aboutYou, [first]: { values: { name: 'Aino', age: '84', city: 'Espoo' } } };
    expect(resumeAt(answers)).toBe(remainingQuestions(answers)[0].id);
    expect(resumeAt(answers)).not.toBe(first);
  });
});

const whole = (o) => ({ ...o, 'about-you': { values: { 'your-name': 'Anna', relation: 'Ćerka', 'your-phone': '+358 40 1' } } });
const short = whole({
  'about-person': { values: { name: 'Aino', age: '84', city: 'Espoo' } },
  'care-needs': { optionIds: ['meals', 'company'] },
  'care-schedule': { values: { days: 'pon, sre, pet', slots: 'pre podne', hours: '3' } },
  mobility: { optionId: 'stick' },
});

describe('the short path', () => {
  it('asks its five questions, in its order', () => {
    expect(remainingQuestions({}, 'caregiver').map((q) => q.id)).toEqual(SHORT_PATH);
    expect(remainingQuestions(short, 'caregiver')).toEqual([]);
  });
  it('the full plan never asks what is needed, and asks when only after daily life', () => {
    expect(remainingQuestions({}, 'plan').map((q) => q.id)).not.toContain('care-needs');
    expect(remainingQuestions({}, 'plan').map((q) => q.id)).not.toContain('care-schedule');
    expect(remainingQuestions(demoAnswers, 'plan').map((q) => q.id)).toEqual(['care-schedule']);
  });
  it('still asks who she is when registration gave only where she lives, and only for what is missing', () => {
    const fromSignUp = { ...aboutYou, 'about-person': { values: { city: 'Niš' } } };
    expect(resumeAt(fromSignUp, 'caregiver')).toBeNull();
    expect(resumeAt(fromSignUp, 'caregiver', { straight: true })).toBe('about-person');
    const [person, you] = remainingQuestions(fromSignUp, 'caregiver');
    expect(person.polja.map((f) => f.id)).toEqual(['name', 'age']);
    expect(you.polja.map((f) => f.id)).toEqual(['relation']);
  });
  it('a field said later is added to those already there', () => {
    expect(toAnswer({ questionId: 'about-person', values: { name: 'Aino', age: '84' } }, { values: { city: 'Niš' } })).toEqual({
      values: { city: 'Niš', name: 'Aino', age: '84' },
    });
  });
});

describe('a small plan', () => {
  it('is one made on the short path, until the full plan is whole', () => {
    expect(isShortPlan(short)).toBe(true);
    expect(isShortPlan(demoAnswers)).toBe(false);
    expect(fullRemaining(demoAnswers)).toEqual([]);
    expect(isShortPlan({ ...demoAnswers, 'care-needs': short['care-needs'], 'care-schedule': short['care-schedule'] })).toBe(false);
    // half of the rest answered: still small
    expect(isShortPlan({ ...short, household: { optionId: 'alone' }, falls: { optionId: 'once' } })).toBe(true);
  });
  it('lists only what was asked, nothing unanswered', () => {
    const all = planQuestions(short).flatMap((s) => s.questions);
    expect(all.map(({ q }) => q.id).sort()).toEqual([...SHORT_PATH].sort());
    expect(all.every(({ answer }) => answer)).toBe(true);
  });
  it('a full plan from before lists no question about when she is asked for', () => {
    expect(planQuestions(demoAnswers).flatMap((s) => s.questions).map(({ q }) => q.id)).not.toContain('care-schedule');
  });
});
