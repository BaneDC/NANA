import { useState } from 'react';
import { useShowMore } from '@/hooks/use-show-more';
import { allVisits, dayOf, monthOf, todayOf } from '../data/familyCare';

// Every visit, newest first, across everyone who has come, as the page "Posete"
// and the drawer "Sve posete" both list them: picked by who came, ten at a
// time (docs/patterns.md §8a), grouped by month, because that is how a family
// looks something up ("what happened in April").
export function useVisitHistory(care) {
  const [who, setWho] = useState('all');
  const today = todayOf(care);

  const all = allVisits(care)
    .filter((v) => v.status !== 'cancelled' || v.cancelledBy)
    .sort((a, b) => dayOf(b.date, today) - dayOf(a.date, today));
  const picked = who === 'all' ? all : all.filter((v) => v.caregiver.id === who);
  const list = useShowMore(picked, { reset: who });

  // what is booked past tomorrow stands on its own at the top: by month it
  // split the month in two, either side of "Ove nedelje"
  const tomorrow = dayOf('sutra', today);
  const groups = [];
  for (const v of list.visible) {
    const month = dayOf(v.date, today) > tomorrow ? 'Zakazano' : monthOf(v.date, today);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.visits.push(v);
    else groups.push({ month, visits: [v] });
  }

  const people = care.arrangements.map((a) => ({ id: a.caregiver.id, name: a.caregiver.name, ended: Boolean(a.endedOn) }));

  return { who, setWho, all, picked, list, groups, people };
}
