import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { PaneHint } from '@/components/pane';
import Dialog from '../Dialog';
import { formGap } from './Forms';
import { Field, FieldError } from '../TextField';
import { t } from '@/i18n';

// Her photo, from her profile (decided 23. 11., dizajner: a press on her
// avatar on "Moj profil", marked by a pencil, opens it; it is not asked at
// the sign-up and nothing else reminds her). Families see it wherever she is
// shown, beside her name.
//
// Three faces of one dialog:
// - none yet: her initials where the photo will be and
//   "Izaberite fotografiju" (default, it sets up what is missing, §9);
// - one chosen: the photo in the square it will be cut to, moved by a drag (or
//   the arrows, the square has focus) and enlarged on the slider, "Izaberite
//   drugu" and "Sačuvaj";
// - hers: the photo, "Ukloni" (ghost, as a chosen file's, FileField) and
//   "Promenite fotografiju" (secondary: it changes what is set).
// The browser's file input stays hidden; on a phone it offers the camera or
// the gallery itself. What is saved is the square, 512 × 512, as a JPEG.

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_SIDE = 400;
// the square on screen, and what is saved
const STAGE = 240;
const OUT = 512;
const ZOOM_MAX = 3;
const STEP = 8;

// where the image stands in the square, at zoom `z` and moved by `x`, `y` from
// the middle, kept so that it always covers the square
function place(img, z, x, y) {
  const s = Math.max(STAGE / img.w, STAGE / img.h) * z;
  const w = img.w * s;
  const h = img.h * s;
  const mx = (w - STAGE) / 2;
  const my = (h - STAGE) / 2;
  const cx = Math.min(mx, Math.max(-mx, x));
  const cy = Math.min(my, Math.max(-my, y));
  return { s, w, h, x: cx, y: cy, left: (STAGE - w) / 2 + cx, top: (STAGE - h) / 2 + cy };
}

export default function PhotoDialog({ open, profile, onClose, onSave }) {
  const input = useRef(null);
  const [chosen, setChosen] = useState(null); // { url, w, h }
  const [zoom, setZoom] = useState(1);
  const [at, setAt] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const drag = useRef(null);

  // a chosen photo's address lives until another is chosen or the dialog goes
  useEffect(() => () => chosen && URL.revokeObjectURL(chosen.url), [chosen]);

  const pick = () => input.current?.click();
  const take = (file) => {
    setError(null);
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError(t('Izaberite fotografiju u formatu JPG, PNG ili WebP.'));
    if (file.size > MAX_BYTES) return setError(t('Fotografija je veća od 10 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (Math.min(img.naturalWidth, img.naturalHeight) < MIN_SIDE) {
        URL.revokeObjectURL(url);
        setError(t('Fotografija je premala. Treba bar 400 × 400 piksela.'));
        return;
      }
      setZoom(1);
      setAt({ x: 0, y: 0 });
      setChosen({ url, w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError(t('Ova fotografija ne može da se otvori. Izaberite drugu.'));
    };
    img.src = url;
  };

  const p = chosen && place(chosen, zoom, at.x, at.y);
  const move = (dx, dy) => setAt((a) => {
    const q = place(chosen, zoom, a.x + dx, a.y + dy);
    return { x: q.x, y: q.y };
  });
  // enlarged about the middle of the square, so what is there stays there
  const zoomTo = (z) => {
    setAt((a) => {
      const q = place(chosen, z, (a.x * z) / zoom, (a.y * z) / zoom);
      return { x: q.x, y: q.y };
    });
    setZoom(z);
  };

  const save = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUT;
      canvas.height = OUT;
      const k = OUT / STAGE;
      canvas.getContext('2d').drawImage(img, p.left * k, p.top * k, p.w * k, p.h * k);
      onSave({ photo: canvas.toDataURL('image/jpeg', 0.85) });
    };
    img.src = chosen.url;
  };

  const square = 'size-60 shrink-0 self-center overflow-hidden rounded-2xl';

  return (
    <Dialog open={open} title={t('Vaša fotografija')} className={formGap} onClose={onClose}>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(',')}
        className="hidden"
        aria-label={t('Izaberite fotografiju')}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {chosen ? (
        <>
          {/* the square it will be cut to: a drag moves it, so does an arrow */}
          <div
            role="group"
            tabIndex={0}
            aria-label={t('Fotografija: prevucite je ili je pomerite strelicama')}
            className={`${square} relative cursor-grab touch-none bg-muted outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              move(e.clientX - drag.current.x, e.clientY - drag.current.y);
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={(e) => {
              const d = e.shiftKey ? STEP * 4 : STEP;
              const by = { ArrowLeft: [d, 0], ArrowRight: [-d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key];
              if (!by) return;
              e.preventDefault();
              move(...by);
            }}
          >
            <img
              src={chosen.url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
              style={{ width: p.w, height: p.h, transform: `translate(${p.left}px, ${p.top}px)` }}
            />
          </div>
          <Field label={t('Uvećanje')}>
            <Slider value={[zoom]} min={1} max={ZOOM_MAX} step={0.01} onValueChange={([z]) => zoomTo(z)} aria-label={t('Uvećanje')} />
          </Field>
          <div className="flex flex-col gap-1">
            <PaneHint>{t('Prevucite fotografiju da lice bude na sredini.')}</PaneHint>
            {error && <FieldError>{error}</FieldError>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={pick}>
              {t('Izaberite drugu')}
            </Button>
            <Button onClick={save}>{t('Sačuvaj')}</Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <div className={`${square} flex items-center justify-center bg-primary-200`}>
            {profile.photo ? (
              <img src={profile.photo} alt={t('Vaša fotografija')} className="size-full object-cover" />
            ) : (
              <span aria-hidden className="text-base font-medium text-primary-700">
                {profile.initials}
              </span>
            )}
          </div>
          {error && <FieldError>{error}</FieldError>}
          <DialogFooter>
            {profile.photo ? (
              <>
                <Button variant="ghost" onClick={() => onSave({ photo: null })}>
                  {t('Ukloni')}
                </Button>
                <Button variant="secondary" onClick={pick}>
                  {t('Promenite fotografiju')}
                </Button>
              </>
            ) : (
              <Button onClick={pick}>{t('Izaberite fotografiju')}</Button>
            )}
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
