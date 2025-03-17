// import { OpenAIStream, StreamingTextResponse } from 'ai';
// import OpenAI from 'openai';

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { Message } from "openai/src/resources/beta/threads/messages.js";


// export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('messages received', messages);
    
    // Vérifier si la clé API est disponible
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set');
      // Vous pouvez retourner une réponse factice pour tester sans clé API
      return new Response(
        'Ceci est une réponse factice car aucune clé API n\'est configurée.',
        { headers: { 'Content-Type': 'text/plain' } }
      );
    }

    console.log('Using OpenAI API Key:', process.env.OPENAI_API_KEY.substring(0, 5) + '...');
    
    // Utiliser generateText au lieu de streamText pour simplifier
    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      messages: messages.map((message: Message) => ({
        role: message.role,
        content: message.content
      }))
    });
    
    // Retourner une réponse JSON simple
    return new Response(
      JSON.stringify({ 
        content: result.text
      }),
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process your request' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}