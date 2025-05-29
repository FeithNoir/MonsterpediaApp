import { IMonsterGirl } from "./monster-girl.interface";

export interface IEntry {
  id: string;
  title: string;
  content: string;
  author: string;
  date: Date;
  tags: string[];
  MonsterGirl: IMonsterGirl;
}
