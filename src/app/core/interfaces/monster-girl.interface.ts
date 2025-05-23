export interface IMonsterGirl {
  id: string;
  name: string;
  description: string;
  commonNames: string[];
  species: string;
  clasification: string[];
  alignment: string;
  threatLevel: number;
  longevity: string;
  stats: IStats;
  tags: string[];
  image?: string;
  entries: string;
}

export interface IStats {
  strength: number;
  agility: number;
  intelligence: number;
  charm: number;
  magic: number;
}
