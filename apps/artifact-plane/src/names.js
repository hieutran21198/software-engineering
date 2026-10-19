// Name matching for search fields and the sidebar filter; plain JavaScript so Node tests load it.
export const normalizeName = value => String(value || '').normalize('NFC').trim().toLowerCase();
export const matchesName = (query, ...fields) => fields.some(field => normalizeName(field).includes(normalizeName(query)));
