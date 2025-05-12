export interface Entry {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  relatedMonsters: string[]; // IDs de monstruos relacionados
}
