export interface ManifestFile {
  path: string;
  bytes: number;
  sha16: string;
}
export interface ManifestSection {
  dir: string;
  licence: string;
  files: ManifestFile[];
}
export function parseManifest(text: string): { sections: ManifestSection[] };
export function verifyAgainstManifest(
  fromRoot: string,
  sections: ManifestSection[],
): { problems: { path: string; kind: 'missing' | 'mismatch'; detail: string }[]; ok: { path: string; buf: Buffer }[] };
