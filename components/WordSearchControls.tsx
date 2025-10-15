
import React, { useState } from 'react';
import { ALL_DIRECTIONS } from '../constants';
import { Direction } from '../types';
import { LoaderIcon } from './Icons';

interface WordSearchControlsProps {
  onGenerate: (words: string[], size: number, directions: Direction[]) => void;
  isLoading: boolean;
}

export const WordSearchControls: React.FC<WordSearchControlsProps> = ({ onGenerate, isLoading }) => {
  const [words, setWords] = useState<string>('React\nTypeScript\nTailwind\nGemini\nComponent');
  const [size, setSize] = useState<number>(15);
  const [selectedDirections, setSelectedDirections] = useState<Set<Direction>>(
    new Set([Direction.LTR, Direction.TTB, Direction.DLR])
  );

  const handleDirectionChange = (direction: Direction) => {
    const newDirections = new Set(selectedDirections);
    if (newDirections.has(direction)) {
      newDirections.delete(direction);
    } else {
      newDirections.add(direction);
    }
    setSelectedDirections(newDirections);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wordList = words.split('\n').map(w => w.trim()).filter(Boolean);
    if (wordList.length === 0 || selectedDirections.size === 0) {
      alert('Please enter at least one word and select at least one direction.');
      return;
    }
    onGenerate(wordList, size, Array.from(selectedDirections));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full lg:w-1/3 xl:w-1/4 p-6 bg-white rounded-2xl shadow-lg space-y-6 print:hidden">
      <div className="space-y-2">
        <label htmlFor="words" className="block text-sm font-medium text-gray-700">
          Words
        </label>
        <textarea
          id="words"
          value={words}
          onChange={(e) => setWords(e.target.value)}
          rows={8}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          placeholder="Enter one word per line"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="size" className="block text-sm font-medium text-gray-700">
          Grid Dimensions (e.g., 15 for 15x15)
        </label>
        <input
          id="size"
          type="number"
          value={size}
          onChange={(e) => setSize(Math.max(5, Math.min(30, parseInt(e.target.value, 10) || 5)))}
          min="5"
          max="30"
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Permitted Directions</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {ALL_DIRECTIONS.map((direction) => (
            <label key={direction} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDirections.has(direction)}
                onChange={() => handleDirectionChange(direction)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-gray-600 text-sm">{direction}</span>
            </label>
          ))}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center gap-2 bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out disabled:bg-teal-400 disabled:cursor-not-allowed"
      >
        {isLoading ? <><LoaderIcon className="h-5 w-5"/> Generating...</> : 'Generate Word Search'}
      </button>
    </form>
  );
};
