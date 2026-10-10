// The care plan, as the plan page and the nav read it. One per person: a
// change rewrites it and is written in its history (src/data/planLog.js); a new
// plan is never started beside it. Each entry carries the answers and notes it
// was built from, so the plan page can show the overview and every answer
// behind its "Pregled" switch.
export function planEntries({ plan, caregiverCount, today, answers = {}, notes = [] }) {
  if (!plan) return [];
  return [
    {
      id: 'live',
      plan,
      title: `Plan nege · ${plan.name}`,
      date: today,
      summary: plan.summary,
      caregiverCount,
      answers,
      notes,
    },
  ];
}
