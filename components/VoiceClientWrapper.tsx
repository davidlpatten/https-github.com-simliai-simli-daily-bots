import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SimliIntegratedVoiceClientAudioWrapper with no SSR
const SimliIntegratedVoiceClientAudioWrapper = dynamic(
  () => import('./SimliIntegratedVoiceClientAudioWrapper'),
  { ssr: false }
);

export default function VoiceClientWrapper({ children }) {
  const [voiceClient, setVoiceClient] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeVoiceClient = async () => {
      try {
        const { DailyVoiceClient } = await import('realtime-ai-daily');
        const { VoiceClientProvider } = await import('realtime-ai-react');

        const client = new DailyVoiceClient({
          baseUrl: "/api/groqbotApi",
          enableMic: true,
  enableCam: false,
  services: {
  tts: "cartesia",
  llm: "groq"
},
  config: [
  {
    service: "vad",
    options: [
      {
        name: "params",
        value: {
          stop_secs: 0.3
        }
      }
    ]
  },
  {
    service: "tts",
    options: [
      {
        name: "voice",
        value: "fb26447f-308b-471e-8b00-8e9f04284eb5"
      }
    ]
  },
  {
    service: "llm",
    options: [
      {
        name: "model",
        value: "llama-3.1-8b-instant"
      },
      {
        name: "initial_messages",
        value: [
          {
            role: "system",
            content: "You're everybody's least favorite uncle because you can't stop making terrible puns. Ask me about my freshman year of high school. Your responses will converted to audio. Please do not include any special characters in your response other than '!' or '?'."
          }
        ]
      },
      {
        name: "run_on_config",
        value: true
      }
    ]
  }
],
          callbacks: { 
            onBotReady: () => {
              console.log("Bot is ready!");
            },
            onMetrics: (metrics) => {
              console.log("Metrics:", metrics);
            },
            onUserStartedSpeaking: () => {
              //log the time
              console.log("User started speaking at: ", new Date().toLocaleTimeString());
            },
            onUserStoppedSpeaking: () => {
              //log the time
              console.log("User stopped speaking at: ", new Date().toLocaleTimeString());
            }
          }
        });

        await client.start();
        setVoiceClient({ client, VoiceClientProvider });
      } catch (e) {
        console.error("Error initializing voice client:", e);
        setError(e.message || "Unknown error occurred");
      }
    };

    initializeVoiceClient();

    return () => {
      if (voiceClient && voiceClient.client) {
        voiceClient.client.stop();
      }
    };
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!voiceClient) {
    return <div>Loading voice client...</div>;
  }

  const { client, VoiceClientProvider } = voiceClient;

  return (
    <VoiceClientProvider voiceClient={client}>
      {children}
      <SimliIntegratedVoiceClientAudioWrapper />
    </VoiceClientProvider>
  );
}