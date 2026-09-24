// The immersive variant asks for one field at a time, so each field needs to be
// phrased as something a person would actually say. The classic variant keeps the
// shorter form labels — this copy belongs to the immersive experience only.
export const FIELD_PROMPTS = {
  // about the person being cared for
  name: 'O kome brinemo?',
  age: 'Koliko ima godina?',
  city: 'Gde živi?',

  // about the caller
  'your-name': 'A sa kim ja razgovaram?',
  relation: 'Šta ste joj?',
  'your-phone': 'Na koji broj mogu da vas dobijem?',

  // what the family is hoping for
  goal: 'Kako bi izgledao dobar ishod?',
  worry: 'A šta vas najviše brine?',
};

// The classic form uses a generic placeholder on open text fields, which reads
// oddly when the field is the whole screen. Anything not listed keeps its own.
export const FIELD_PLACEHOLDERS = {
  goal: 'Da bezbedno ostane kod kuće',
  worry: 'Da opet padne dok sam na poslu',
};

// A quiet second line under the prompt, so a single field never feels like a form.
export const FIELD_HINTS = {
  name: 'Ime i prezime, kako biste ga napisali u formularu.',
  age: 'Otprilike je u redu ako niste sigurni.',
  city: 'Da nađemo negovateljice u blizini.',
  'your-name': 'Vas ćemo obaveštavati o svemu.',
  relation: 'Ćerka, sin, komšinica, šta god odgovara.',
  'your-phone': 'Ovde stiže upoznavanje sa negovateljicom.',
  goal: 'Svojim rečima. Od ovoga zavisi sve što predlažemo.',
  worry: 'Nije obavezno, ali obično nam kaže najviše.',
};
