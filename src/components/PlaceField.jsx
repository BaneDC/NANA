import { useState } from 'react';
import { Field, Input, Select } from './TextField';
import { OTHER_PLACE, PLACES, joinPlace, splitPlace } from '../data/places';

// Where she lives, picked rather than typed: the city from the four we work in
// (a part of town beside it, if they like), or "Drugo mesto" and its name.
// Which caregivers can come is read from the city, so it cannot be a spelling.
export default function PlaceField({ label, value, onChange }) {
  const [place, setPlace] = useState(() => splitPlace(value));
  const set = (patch) => {
    const next = { ...place, ...patch };
    setPlace(next);
    onChange(joinPlace(next));
  };
  return (
    <>
      <Field label={label}>
        <Select
          value={place.city || null}
          onChange={(city) => set({ city, part: city === place.city ? place.part : '' })}
          options={[...PLACES.map((c) => ({ value: c, label: c })), { value: OTHER_PLACE, label: 'Drugo mesto' }]}
          placeholder="Izaberite grad"
        />
      </Field>
      {place.city === OTHER_PLACE ? (
        <Field label="Koje mesto" hint="Tamo još nemamo negovateljice; koordinatorka će vas pozvati.">
          <Input value={place.other} onChange={(other) => set({ other })} placeholder="npr. Tampere" />
        </Field>
      ) : (
        place.city && (
          <Field label="Deo grada" hint="Nije obavezno.">
            <Input value={place.part} onChange={(part) => set({ part })} placeholder="npr. Töölö" />
          </Field>
        )
      )}
    </>
  );
}
