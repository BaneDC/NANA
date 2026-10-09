import { buildPlan } from './carePlan';

// Past conversations. A thread keeps the answers it collected, so opening it
// replays the same question cards the live chat renders — just read only.
//
// Nothing invented: the nav and the Care plans page list only what this person
// has actually done in this session. A thread is filed here when they start a
// new chat after a plan exists (see App's newChat).
export const seedThreads = [];

// One list for every care plan the user has: the live one plus each past thread.
// The Care plans page, its detail page and the nav all read from this, so they
// can never disagree about what exists.
// Each entry carries the answers and notes it was built from, so the plan page
// can show the overview and every answer behind its "Pregled" switch.
export function planEntries({ plan, threads, caregiverCount, today, answers = {}, notes = [] }) {
  const live = plan
    ? {
        id: 'live',
        plan,
        title: `Plan nege · ${plan.name}`,
        date: today,
        status: 'Aktivan',
        summary: plan.summary,
        caregiverCount,
        archived: false,
        answers,
        notes,
      }
    : null;

  const past = threads.map((t) => ({
    id: t.id,
    plan: buildPlan(t.answers),
    title: `Plan nege · ${t.answers['about-person']?.values?.name ?? 'osoba o kojoj brinete'}`,
    date: t.date,
    status: 'Arhiviran',
    summary: t.summary,
    caregiverCount: t.caregivers,
    archived: true,
    answers: t.answers,
    notes: t.notes || [],
  }));

  return [live, ...past].filter(Boolean);
}
