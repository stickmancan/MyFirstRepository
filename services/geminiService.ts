import { GoogleGenAI, Type } from "@google/genai";
import { Direction, PuzzleData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const puzzleSchema = {
  type: Type.OBJECT,
  properties: {
    grid: {
      type: Type.ARRAY,
      description: "A 2D array of strings representing the word search grid, where each string is a single uppercase letter.",
      items: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    solution: {
      type: Type.ARRAY,
      description: "An array of objects detailing the placement of each word.",
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The word placed in the grid." },
          startRow: { type: Type.INTEGER, description: "The 0-indexed starting row of the word." },
          startCol: { type: Type.INTEGER, description: "The 0-indexed starting column of the word." },
          endRow: { type: Type.INTEGER, description: "The 0-indexed ending row of the word." },
          endCol: { type: Type.INTEGER, description: "The 0-indexed ending column of the word." },
        },
        required: ["word", "startRow", "startCol", "endRow", "endCol"],
      },
    },
    wordsUsed: {
      type: Type.ARRAY,
      description: "An array of the words that were successfully placed in the grid. This might be a subset of the requested words if some did not fit.",
      items: { type: Type.STRING },
    },
  },
  required: ["grid", "solution", "wordsUsed"],
};

const validateAndCorrectPuzzleData = (data: PuzzleData, size: number): PuzzleData => {
  const { grid, solution, wordsUsed } = data;
  const correctedGrid = grid.map(row => [...row]);

  if (correctedGrid.length !== size || correctedGrid.some(row => row.length !== size || !row.every(cell => typeof cell === 'string' && cell.length === 1))) {
    throw new Error(`The grid dimensions or structure are incorrect. Expected a ${size}x${size} array of single-character strings.`);
  }

  // Key: "row-col", Value: { word: string; expectedChar: string }
  const occupiedCells = new Map<string, { word: string; expectedChar: string }>();

  for (const sol of solution) {
    const { word, startRow, startCol, endRow, endCol } = sol;

    if (startRow === 0 && startCol === 0) {
      throw new Error(`Invalid puzzle: The word "${word}" starts at the top-left corner (0,0), which is disallowed.`);
    }

    if (!wordsUsed.includes(word)) {
        throw new Error(`Word "${word}" is in the solution but not in the 'wordsUsed' list.`);
    }

    if (
      startRow < 0 || startRow >= size || startCol < 0 || startCol >= size ||
      endRow < 0 || endRow >= size || endCol < 0 || endCol >= size
    ) {
      throw new Error(`Coordinates for word "${word}" are out of the grid bounds.`);
    }

    const expectedLength = Math.max(Math.abs(endRow - startRow), Math.abs(endCol - startCol)) + 1;
    if (expectedLength !== word.length) {
      throw new Error(`The coordinates for "${word}" produce a length of ${expectedLength}, but the word's length is ${word.length}.`);
    }

    const dRow = Math.sign(endRow - startRow);
    const dCol = Math.sign(endCol - startCol);
    let r = startRow;
    let c = startCol;

    for (let i = 0; i < word.length; i++) {
      const key = `${r}-${c}`;
      const expectedChar = word[i].toUpperCase();

      // CRITICAL: Check for intersection, which is now disallowed.
      if (occupiedCells.has(key)) {
        const existingOccupant = occupiedCells.get(key)!;
        throw new Error(
          `The model created an invalid puzzle where words "${word}" and "${existingOccupant.word}" intersect at grid position (${r + 1}, ${c + 1}). Words are not allowed to intersect.`
        );
      }
      
      occupiedCells.set(key, { word, expectedChar });

      // Correct the grid on the fly
      if (correctedGrid[r][c].toUpperCase() !== expectedChar) {
        correctedGrid[r][c] = expectedChar;
      }
      
      r += dRow;
      c += dCol;
    }
  }

  return { ...data, grid: correctedGrid };
};

export const generateWordSearch = async (
  words: string[],
  size: number,
  directions: Direction[]
): Promise<PuzzleData> => {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;
  
  const prompt = `
    Generate a high-quality word search puzzle.
    - Grid size must be exactly ${size}x${size}.
    - The list of words to embed is: ${words.join(', ')}.
    - Permitted word directions are: ${directions.join(', ')}.

    CRITICAL INSTRUCTIONS:
    1. You MUST embed the words from the list into the grid. The spelling of each embedded word must be PERFECT. For example, if the word is "BOAT", the letters B, O, A, T must appear in the correct sequence in the grid.
    2. Words MUST NOT intersect or share any letters. Each letter cell in the grid can only belong to a single word from the solution. This is a strict rule.
    3. After placing the words, fill ALL remaining empty grid cells with random uppercase English letters (A-Z).
    4. The final 'grid' in the JSON output must be a perfect ${size}x${size} array of single-character strings.
    5. The 'solution' array MUST accurately report the location of each word you successfully placed. DOUBLE-CHECK that the start and end coordinates correspond to the EXACT word in the grid.
    6. The 'wordsUsed' array must ONLY contain words that you successfully placed in the grid with the correct spelling.
    7. VERY IMPORTANT: No word should start at the top-left corner of the grid (row 0, column 0). The 'startRow' and 'startCol' for any word in the solution cannot both be 0.

    Produce a JSON object that strictly follows the provided schema.
  `;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert puzzle maker. Your TOP priority is accuracy. You create word search puzzles where words DO NOT intersect. Each word is placed independently. You must strictly follow all instructions and output a valid JSON that conforms to the provided schema.",
          responseMimeType: "application/json",
          responseSchema: puzzleSchema,
        },
      });

      const jsonText = response.text.trim();
      const parsedData = JSON.parse(jsonText) as PuzzleData;

      if (!parsedData.grid || !parsedData.solution || !parsedData.wordsUsed) {
        throw new Error("Invalid puzzle data structure received from API.");
      }
      
      // If validation succeeds, return the data and exit the loop.
      return validateAndCorrectPuzzleData(parsedData, size);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt} failed: ${lastError.message}`);
      if (attempt === MAX_RETRIES) {
        break;
      }
    }
  }
  
  // If all retries fail, throw a user-friendly error.
  console.error("All generation attempts failed.", lastError);
  throw new Error(`The model failed to generate a valid puzzle after ${MAX_RETRIES} attempts. This can happen if words are too long for the grid size. Please try using a larger grid or shorter words.`);
};