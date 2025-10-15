import React, { useState, useCallback } from 'react';
import { WordSearchControls } from './components/WordSearchControls';
import { WordSearchGrid } from './components/WordSearchGrid';
import { generateWordSearch } from './services/geminiService';
import { Direction, PuzzleData } from './types';
import { DownloadIcon, EyeIcon, EyeOffIcon } from './components/Icons';

declare const html2canvas: any;
declare const jspdf: any;

const App: React.FC = () => {
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const handleGenerate = useCallback(
    async (words: string[], size: number, directions: Direction[]) => {
      setIsLoading(true);
      setError(null);
      setPuzzleData(null);
      setShowSolution(false);
      try {
        const data = await generateWordSearch(words, size, directions);
        setPuzzleData(data);
      } catch (e: any) {
        setError(e.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleDownloadPNG = async () => {
    const printableArea = document.getElementById('printable-area');
    if (printableArea) {
      const canvas = await html2canvas(printableArea, {
        scale: 2, // Higher resolution
        backgroundColor: '#ffffff', // Ensure background is white
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'word-search.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadPDF = async () => {
    const printableArea = document.getElementById('printable-area');
    if (printableArea) {
      const { jsPDF } = jspdf;
      const canvas = await html2canvas(printableArea, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.width / canvas.height;
      
      const margin = 10; // 10mm margin
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      let imgFinalWidth = usableWidth;
      let imgFinalHeight = imgFinalWidth / canvasAspectRatio;

      if (imgFinalHeight > usableHeight) {
        imgFinalHeight = usableHeight;
        imgFinalWidth = imgFinalHeight * canvasAspectRatio;
      }

      const xPos = (pdfWidth - imgFinalWidth) / 2;
      const yPos = margin;
      
      pdf.addImage(imgData, 'PNG', xPos, yPos, imgFinalWidth, imgFinalHeight);
      pdf.save('word-search.pdf');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-sm print:hidden">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-teal-700">teachAI™ - Word Search Generator</h1>
          <p className="text-slate-500 mt-1">Create and print custom puzzles for your classroom</p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <WordSearchControls onGenerate={handleGenerate} isLoading={isLoading} />

          <div className="flex-1">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}

            {puzzleData ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-700">Your Puzzle</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSolution(!showSolution)}
                            className="flex items-center gap-2 bg-white text-slate-600 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
                            aria-label={showSolution ? 'Hide solution' : 'Show solution'}
                        >
                            {showSolution ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            <span>{showSolution ? 'Hide Solution' : 'Show Solution'}</span>
                        </button>
                        <button
                            onClick={handleDownloadPNG}
                            className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                            aria-label="Download as PNG"
                        >
                           <DownloadIcon className="h-5 w-5"/>
                           <span>PNG</span>
                        </button>
                         <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                            aria-label="Download as PDF"
                        >
                           <DownloadIcon className="h-5 w-5"/>
                           <span>PDF</span>
                        </button>
                    </div>
                </div>

                 <div id="printable-area" className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <WordSearchGrid puzzleData={puzzleData} showSolution={showSolution} />
                        </div>
                        <div className="lg:col-start-3">
                            <h3 className="text-xl font-bold mb-4 border-b pb-2 text-slate-700">Find these words:</h3>
                            <ul className="space-y-2 pt-2 columns-2 sm:columns-3 lg:columns-1">
                                {puzzleData.wordsUsed.sort().map((word, index) => (
                                    <li key={index} className="text-slate-600 font-medium break-all">{word}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
              </div>
            ) : !isLoading && !error && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-10 text-center">
                    <h2 className="text-2xl font-semibold text-slate-700">Welcome!</h2>
                    <p className="text-slate-500 mt-2 max-w-md">
                        Enter your words, choose the grid size and directions, then click "Generate Word Search" to create your puzzle.
                    </p>
                    <div className="text-5xl mt-6 text-teal-400 opacity-50">
                    🧩
                    </div>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;