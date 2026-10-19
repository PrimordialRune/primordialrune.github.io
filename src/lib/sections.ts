export interface Section {
  id: string;
  number: string;
  label: string;
  labelJp: string;
}

export const sections: Section[] = [
  { id: "hero", number: "01", label: "HERO", labelJp: "ヒーロー" },
  { id: "systems", number: "02", label: "SYSTEMS", labelJp: "システム" },
  { id: "worlds", number: "03", label: "WORLDS", labelJp: "ワールド" },
  { id: "interfaces", number: "04", label: "INTERFACES", labelJp: "インターフェース" },
  { id: "archives", number: "05", label: "ARCHIVES", labelJp: "アーカイブ" },
];

export function getSection(id: string): Section {
  return sections.find((s) => s.id === id) ?? sections[0];
}
