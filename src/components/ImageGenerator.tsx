"use client";

import { useState } from 'react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setImageData(null);
    
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      setImageData(data.image);
      setRevisedPrompt(data.revised_prompt);
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl">
      <h2 className="text-2xl font-bold">Image Generator</h2>

      {imageData && (
        <div className="mt-4">
          <div className="border border-black/[.08] dark:border-white/[.145] rounded-lg overflow-hidden">
            <img
              src={`data:image/png;base64,${imageData}`}
              alt={prompt}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label htmlFor="image-prompt" className="text-sm font-medium">
          Describe the image you want to generate
        </label>
        <textarea
          id="image-prompt"
          className="w-full p-4 border border-black/[.08] dark:border-white/[.145] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/20"
          placeholder="A futuristic city with flying cars and neon lights..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>
      
      <button
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleGenerateImage}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? 'Generating...' : 'Generate Image'}
      </button>
      
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      {revisedPrompt && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
          <strong>Revised prompt:</strong> {revisedPrompt}
        </div>
      )}
      
      
    </div>
  );
} 