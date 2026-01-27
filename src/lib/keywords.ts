export interface HeroKeyword {
  id: string;
  label: string;
  labelJp: string;
  facts: string[];
}

// Keyword data - facts will be loaded from MD files
// The user can update content/hero-keywords/*.md files to customize facts
export const heroKeywords: HeroKeyword[] = [
  {
    id: "asymmetry",
    label: "ASYMMETRY",
    labelJp: "非対称",
    facts: [
      "Asymmetric design creates unique player experiences where each role feels distinct",
      "Games like Root and Vast pioneer asymmetric board gaming",
      "The challenge lies in balancing vastly different gameplay patterns",
      "Asymmetric PvP creates memorable \"David vs Goliath\" moments",
      "Information asymmetry: hidden traitor mechanics create social tension",
    ],
  },
  {
    id: "strategy",
    label: "STRATEGY",
    labelJp: "戦略",
    facts: [
      "Strategic depth emerges from simple rules with emergent complexity",
      "The best strategy games teach you by letting you fail",
      "Tempo, resources, and positioning: the three pillars of strategy",
      "Perfect information vs hidden information creates different strategic landscapes",
      "Chess has more possible games than atoms in the observable universe",
    ],
  },
  {
    id: "nostalgia",
    label: "NOSTALGIA",
    labelJp: "ノスタルジア",
    facts: [
      "Retro aesthetics evoke emotional connections beyond mere graphics",
      "Pixel art is a deliberate artistic choice, not a limitation",
      "The \"NES hard\" difficulty created a generation of persistent gamers",
      "CRT scanlines were never meant to be visible - now they're nostalgic",
      "Arcade game design optimized for \"one more quarter\" psychology",
    ],
  },
  {
    id: "roleplay",
    label: "ROLEPLAY",
    labelJp: "ロールプレイ",
    facts: [
      "Character progression creates emotional investment through mechanical growth",
      "The \"hero's journey\" structure maps perfectly to RPG pacing",
      "Turn-based combat prioritizes strategy over reflexes",
      "Stats and numbers make abstract growth tangible and satisfying",
      "JRPGs and WRPGs evolved from the same roots into distinct philosophies",
    ],
  },
  {
    id: "paragame",
    label: "PARAGAME",
    labelJp: "パラゲーム",
    facts: [
      "Metagame exists in the space between the game and the player",
      "Breaking the fourth wall creates memorable gaming moments",
      "Games can comment on their own medium through mechanics",
      "Ludonarrative harmony: when mechanics reinforce story themes",
      "Speedrunning creates an entirely different game from the intended experience",
    ],
  },
  {
    id: "modularity",
    label: "MODULARITY",
    labelJp: "モジュール性",
    facts: [
      "Modular game design enables endless replayability through recombination",
      "Procedural generation is modularity at the algorithmic level",
      "Deck-building games are modular by nature",
      "Roguelikes use modular rooms and items for infinite variety",
      "Modding communities keep games alive decades after release",
    ],
  },
];

// Get a random fact for a keyword
export function getRandomFact(keywordId: string): string {
  const keyword = heroKeywords.find((k) => k.id === keywordId);
  if (!keyword) return "";
  const randomIndex = Math.floor(Math.random() * keyword.facts.length);
  return keyword.facts[randomIndex];
}

// Get keyword by id
export function getKeywordById(id: string): HeroKeyword | undefined {
  return heroKeywords.find((k) => k.id === id);
}
