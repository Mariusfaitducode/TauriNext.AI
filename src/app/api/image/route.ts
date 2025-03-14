import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log('image prompt received:', prompt);
    
    // Vérifier si la clé API est disponible
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set');
      return new Response(
        JSON.stringify({ 
          error: 'Missing OpenAI API key. Please add it to your .env.local file as OPENAI_API_KEY.' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Générer l'image
    const { image } = await generateImage({
      model: openai.image('dall-e-3'),
      prompt: prompt,
    });
    
    // Retourner l'image en base64
    return new Response(
      JSON.stringify({ 
        image: image.base64,
        revised_prompt: prompt
      }),
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate image' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 