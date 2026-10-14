import { useState } from 'react';
import { useShowMore } from '@/hooks/use-show-more';
import { allVisits, dayOf, monthOf, todayOf } from '../data/familyCare';

// Every visit, newest first, across everyone who has come, as the drawer
// "Sve posete" lists them: picked by who came, ten at a
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

  // by month alone (§8a): a visit is planned for today or tomorrow at the
  // latest, so what is coming sits in this month, its row saying "Sutra"
  const groups = [];
  for (const v of list.visible) {
    const month = monthOf(v.date, today);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.visits.push(v);
    else groups.push({ month, visits: [v] });
  }

  const people = care.arrangements.map((a) => ({ id: a.caregiver.id, name: a.caregiver.name, ended: Boolean(a.endedOn) }));

  return { who, setWho, all, picked, list, groups, people };
}
