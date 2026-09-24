// Resolves image keys from the mock data to bundled asset URLs.
const toMap = (mods) =>
  Object.fromEntries(Object.entries(mods).map(([path, url]) => [path.split('/').pop().replace(/\.\w+$/, ''), url]));

const productImages = toMap(import.meta.glob('../assets/products/*.jpg', { eager: true, query: '?url', import: 'default' }));
const photos = toMap(import.meta.glob('../assets/photos/*.jpg', { eager: true, query: '?url', import: 'default' }));

export const productImageUrl = (key) => productImages[key] ?? null;
export const photoUrl = (key) => photos[key] ?? null;
