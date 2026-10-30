// What the artifact views need of a skill (no KB lookup in the scene) and the stable order of a sheet.

export interface ArtifactSpec {
  skill: string;
  family: string;
  pigment: string;
  active?: boolean;
}

/** Items sorted by family then skill id: neighbours look alike, and the order is stable. */
export function sheetOrder<T extends ArtifactSpec>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.family.localeCompare(b.family) || a.skill.localeCompare(b.skill));
}
