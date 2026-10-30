/**
 * Prefixes a `public/` path ("data/knowledge-base.json") with the deploy base: "/" locally,
 * whatever `VITE_BASE` says on a static host. Data keeps base-free paths; wrap them at the point of use.
 */
export const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
