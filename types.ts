
export enum Direction {
  LTR = 'Left to right',
  TTB = 'Top to bottom',
  DLR = 'Diagonal left to right',
  RTL = 'Right to left',
  BTT = 'Bottom to top',
  DRL = 'Diagonal right to left',
}

export interface Solution {
  word: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface PuzzleData {
  grid: string[][];
  solution: Solution[];
  wordsUsed: string[];
}
