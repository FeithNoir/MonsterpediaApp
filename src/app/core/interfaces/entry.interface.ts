import { IUser } from "./auth.interface";

export interface IEntry {
  id: string;
  title: string;
  name: string;
  description: string;
  commonNames: string[];
  species: string;
  clasification: string[];
  alignment: string;
  threatLevel: number;
  longevity: string;
  images?: string[];
  content: string;
  author: IUser;
  date: Date;
  tags: string[];
}
