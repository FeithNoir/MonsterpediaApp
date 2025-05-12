export interface Monster {
  id: string;
  name: string;
  commonName: string;
  species: string;
  subspecies: string;
  stats: Stats;
  tags: string[];
  image?: string;
  description: string;
  entries: string[];
}

export interface Stats {
  strength: number;
  agility: number;
  intelligence: number;
  charm: number;
  magic: number;
}
