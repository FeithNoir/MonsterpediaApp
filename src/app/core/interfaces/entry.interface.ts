import { IUser } from "./auth.interface";
import { IMonsterGirl } from "./monster-girl.interface";

export interface IEntry {
  id: string;
  title: string;
  content: string;
  author: IUser;
  date: Date;
  tags: string[];
  MonsterGirl: IMonsterGirl;
}
