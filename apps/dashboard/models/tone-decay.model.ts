import { TestStatus, Ear, ToneDecayResult } from "./enums";

export interface ToneDecayReadingModelData {
  id: string;
  toneDecayId: string;
  ear: Ear;
  frequencyHz: number;
  startingDb: number;
  finalDb: number | null;
  decayTimeSec: number | null;
  result: ToneDecayResult;
}

export interface ToneDecayTestModelData {
  id: string;
  consultationId: string;
  status: TestStatus;
  earTests: ToneDecayReadingModelData[];
  createdAt: string;
  updatedAt: string;
}

