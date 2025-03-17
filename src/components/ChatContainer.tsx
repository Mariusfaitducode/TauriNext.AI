"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from './ChatInterface';
import { Message } from 'ai';

// type Message = {
//   role: 'user' | 'assistant' | 'system';
//   content: string;
// };

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fonction pour détecter si le message est une demande de génération d'image
  const isImageGenerationRequest = (message: string): boolean => {
    const lowerCaseMessage = message.toLowerCase();
    return (
      (lowerCaseMessage.includes('génère') || 
       lowerCaseMessage.includes('genere') || 
       lowerCaseMessage.includes('crée') || 
       lowerCaseMessage.includes('cree') || 
       lowerCaseMessage.includes('dessine') || 
       lowerCaseMessage.includes('montre') ||
       lowerCaseMessage.includes('generate') ||
       lowerCaseMessage.includes('create') ||
       lowerCaseMessage.includes('draw') ||
       lowerCaseMessage.includes('show')) &&
      (lowerCaseMessage.includes('image') || 
       lowerCaseMessage.includes('photo') || 
       lowerCaseMessage.includes('picture') ||
       lowerCaseMessage.includes('illustration') ||
       lowerCaseMessage.includes('dessin'))
    );
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // Vérifier si c'est une demande de génération d'image
    if (isImageGenerationRequest(message)) {
      // Ajouter le message de l'utilisateur
      const userMessage: Message = { role: 'user', content: message, id: Date.now().toString() };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // Ajouter une réponse du système
      const systemMessage: Message = { 
        role: 'assistant', 
        content: "Je vais vous rediriger vers notre générateur d'images où vous pourrez créer l'image que vous souhaitez.", 
        id: (Date.now() + 1).toString() 
      };
      setMessages((prevMessages) => [...prevMessages, systemMessage]);
      
      // Rediriger vers la page de génération d'images après un court délai
      setTimeout(() => {
        router.push('/image');
      }, 1500);
      
      return;
    }
    
    setIsLoading(true);
    
    // Ajouter le message de l'utilisateur immédiatement
    const userMessage: Message = { role: 'user', content: message, id: Date.now().toString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    try {
      console.log('Sending message to API:', updatedMessages);
      
      // Appel API à votre endpoint chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      // Récupérer la réponse JSON
      const data = await response.json();
      console.log('Response data:', data);
      
      // Ajouter la réponse de l'assistant
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.content || 'Désolé, je n\'ai pas pu générer de réponse.', 
        id: (Date.now() + 1).toString() 
      };
      
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Ajouter un message d'erreur
      setMessages([
        ...updatedMessages, 
        { role: 'system', content: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`, id: (Date.now() + 1).toString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatInterface 
      messages={messages} 
      isLoading={isLoading} 
      onSendMessage={handleSendMessage} 
    />
  );
} 