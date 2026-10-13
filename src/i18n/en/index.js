// Every file beside this one is part of the dictionary: export default { 'Srpski tekst': 'translation' }.
const parts = import.meta.glob('./*.js', { eager: true, import: 'default' });
export default Object.assign({}, ...Object.entries(parts).filter(([p]) => p !== './index.js').map(([, d]) => d));
