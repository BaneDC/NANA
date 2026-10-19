import { activeVersion, allVisits, arrangementOf, lastVersion, latestRequest, monthOfDay, pendingVersion, todayOf, visitCharge } from './familyCare';
import { SERVICE_FEE } from './fees';

// The caregiver's side reads the same care the family's does, from where she
// stands: who her clients are, where each of them sits on her board, what she
// owes them next, and what she has earned (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md).
// Nothing is kept twice: everything here is worked out from the families' care.

// Every family on this market that has asked her or works with her: the demo's
// family (`state.person`) and the others the demo gives her (`state.clients`).
export function myClients(state, caregiverId) {
  const all = [{ id: 'family', person: state.person }, ...(state.clients || [])];
  return all
    .filter(({ person }) => person?.care && (person.care.requests.some((r) => r.caregiverId === caregiverId) || arrangementOf(person.care, caregiverId)))
    .map(({ id, person }) => ({
      id,
      person,
      care: person.care,
      request: latestRequest(person.care, caregiverId),
      arrangement: arrangementOf(person.care, caregiverId) || null,
      stage: stageOf(person.care, caregiverId),
    }));
}

// The one column a family sits in: what she owes them next.
//   request     — they asked, she has not answered
//   agreement   — she said yes and there are no terms in force yet
//   active      — terms in force, nothing owed
//   work-order  — a visit is over and waits for her work order
//   ended       — the cooperation is over
//   declined    — she said no
export function stageOf(care, caregiverId) {
  const r = latestRequest(care, caregiverId);
  const a = arrangementOf(care, caregiverId);
  if (r?.status === 'pending') return 'request';
  if (!a || (a.endedOn && !(r?.again && r.status === 'accepted'))) {
    if (a?.endedOn) return 'ended';
    return r?.status === 'declined' ? 'declined' : null;
  }
  if (a.visits.some((v) => v.status === 'awaiting')) return 'work-order';
  return activeVersion(a) ? 'active' : 'agreement';
}

// What she owes this family next, said at the top of their page; null when
// nothing waits on her.
export function owes(care, caregiverId) {
  const a = arrangementOf(care, caregiverId);
  if (!a || a.endedOn) return null;
  const due = a.visits.find((v) => v.status === 'awaiting');
  if (due) return { kind: 'work-order', visit: due };
  const queried = a.visits.find((v) => v.status === 'disputed');
  if (queried) return { kind: 'query', visit: queried };
  if (pendingVersion(a)) return { kind: 'waiting-terms', version: pendingVersion(a) };
  const last = lastVersion(a);
  if (!activeVersion(a) && (!last || ['declined', 'withdrawn'].includes(last.status))) return { kind: 'terms' };
  const extra = a.visits.find((v) => v.extra?.status === 'asked');
  if (extra) return { kind: 'extra', visit: extra };
  return null;
}

// Her share of a visit: what the family is charged, less the platform's fee.
export const netOf = (v) => Math.round(visitCharge(v) * (1 - SERVICE_FEE) * 100) / 100;
// what she will get for a planned visit, at the hours planned
export const plannedNet = (v) => Math.round(v.hours * v.rate * (1 - SERVICE_FEE) * 100) / 100;

// Her earnings across every family: paid this month, in the 24 hours before a
// charge, held for visits to come, and every paid visit, newest first.
export function earnings(clients, caregiverId) {
  const visits = clients.flatMap(({ id, care }) =>
    allVisits(care)
      .filter((v) => v.caregiver.id === caregiverId)
      .map((v) => ({ ...v, clientId: id, elder: care.elder.name, month: monthOfDay(v.day), thisMonth: monthOfDay(v.day) === monthOfDay(todayOf(care)) }))
  );
  const sum = (list, f) => Math.round(list.reduce((n, v) => n + f(v), 0) * 100) / 100;
  const paid = visits.filter((v) => v.status === 'paid').sort((a, b) => b.day - a.day || b.start - a.start);
  return {
    paidThisMonth: sum(paid.filter((v) => v.thisMonth), netOf),
    processing: sum(visits.filter((v) => v.status === 'charging'), netOf),
    reserved: sum(visits.filter((v) => v.status === 'planned'), plannedNet),
    paid,
  };
}
