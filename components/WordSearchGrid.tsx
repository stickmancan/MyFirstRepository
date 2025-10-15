import React, { useMemo } from 'react';
import { PuzzleData } from '../types';

interface WordSearchGridProps {
  puzzleData: PuzzleData;
  showSolution: boolean;
}

const colorPalette = [
  'bg-yellow-200', 'bg-lime-200', 'bg-green-200', 'bg-emerald-200', 'bg-teal-200', 
  'bg-cyan-200', 'bg-sky-200', 'bg-blue-200', 'bg-indigo-200', 'bg-violet-200', 
  'bg-purple-200', 'bg-fuchsia-200', 'bg-pink-200', 'bg-rose-200'
];

export const WordSearchGrid: React.FC<WordSearchGridProps> = ({ puzzleData, showSolution }) => {
  const { grid, solution } = puzzleData;

  const highlightedCells = useMemo(() => {
    if (!showSolution) return new Map<string, string>();

    const cellMap = new Map<string, string>();
    solution.forEach(({ startRow, startCol, endRow, endCol }, index) => {
      const dRow = Math.sign(endRow - startRow);
      const dCol = Math.sign(endCol - startCol);
      let r = startRow;
      let c = startCol;
      const color = colorPalette[index % colorPalette.length];

      while (true) {
        cellMap.set(`${r}-${c}`, color);
        if (r === endRow && c === endCol) break;
        r += dRow;
        c += dCol;
      }
    });
    return cellMap;
  }, [showSolution, solution]);

  if (!grid || grid.length === 0) {
    return null;
  }

  const cellSize = grid.length > 20 ? 'text-xs' : grid.length > 15 ? 'text-sm' : 'text-base';

  return (
    <div
      className="grid aspect-square"
      style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))` }}
      aria-label="Word search puzzle grid"
    >
      {grid.map((row, rowIndex) =>
        row.map((letter, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          const highlightColor = highlightedCells.get(cellKey);
          
          return (
            <div
              key={cellKey}
              className={`flex items-center justify-center aspect-square border border-slate-200 font-sans font-bold text-slate-800 uppercase transition-colors duration-300 ${cellSize} ${highlightColor ? `${highlightColor} text-black/75` : 'bg-transparent'}`}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
};