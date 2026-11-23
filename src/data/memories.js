// The memories around the family's sign-in (docs/patterns.md §10, decided
// 23. 11.): one life seen by the child, from the first days with mother and
// father to the parents grown old, a photo a year that mattered. Generated for
// the prototype (GPT Image 2.6), 640 on the long side; `wide` is 4:3, the rest
// 3:4. In order of the years: the journey goes through them one by one.
import m1974 from '@/assets/memories/1974.jpg';
import m1975 from '@/assets/memories/1975.jpg';
import m1976 from '@/assets/memories/1976.jpg';
import m1977 from '@/assets/memories/1977.jpg';
import m1979 from '@/assets/memories/1979.jpg';
import m1981 from '@/assets/memories/1981.jpg';
import m1983 from '@/assets/memories/1983.jpg';
import m1986 from '@/assets/memories/1986.jpg';
import m1989 from '@/assets/memories/1989.jpg';
import m1992 from '@/assets/memories/1992.jpg';
import m1999 from '@/assets/memories/1999.jpg';
import m2004 from '@/assets/memories/2004.jpg';
import m2011 from '@/assets/memories/2011.jpg';
import m2017 from '@/assets/memories/2017.jpg';
import m2022 from '@/assets/memories/2022.jpg';
import m2025 from '@/assets/memories/2025.jpg';

export const MEMORIES = [
  { year: 1974, src: m1974 }, // the newborn, mother and father by the window
  { year: 1975, src: m1975, wide: true }, // father lifts her up in the garden
  { year: 1976, src: m1976 }, // first steps, to mother
  { year: 1977, src: m1977, wide: true }, // on father's shoulders by the lake
  { year: 1979, src: m1979 }, // baking with mother
  { year: 1981, src: m1981 }, // the first day of school
  { year: 1983, src: m1983, wide: true }, // father teaches her the bicycle
  { year: 1986, src: m1986, wide: true }, // a picnic by the lake
  { year: 1989, src: m1989, wide: true }, // fishing with father at sunset
  { year: 1992, src: m1992 }, // graduation, both parents
  { year: 1999, src: m1999, wide: true }, // her wedding, the dance with father
  { year: 2004, src: m2004 }, // they hold their grandchild
  { year: 2011, src: m2011, wide: true }, // grandfather and grandchild in the garden
  { year: 2017, src: m2017 }, // the parents on a bench, she behind them
  { year: 2022, src: m2022, wide: true }, // holding mother's hand at the table
  { year: 2025, src: m2025 }, // laughing with father on the balcony
];
