import React, { useEffect, useRef, useState } from "react";
import { useVoiceClientMediaTrack } from "realtime-ai-react";
import { SimliClient } from 'simli-client';

const simli_faceid = '88109f93-40ce-45b8-b310-1473677ddde2';

const SimliIntegratedVoiceClientAudioWrapper: React.FC = () => {
  const botAudioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const simliAudioRef = useRef<HTMLAudioElement>(null);
  const botAudioTrack = useVoiceClientMediaTrack("audio", "bot");
  const [simliClient, setSimliClient] = useState<SimliClient | null>(null);

  useEffect(() => {
    if (videoRef.current && simliAudioRef.current) {
      const SimliConfig = {
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY,
        faceID: simli_faceid,
        handleSilence: true,
        videoRef: videoRef,
        audioRef: simliAudioRef,
      };

      const client = new SimliClient();
      client.Initialize(SimliConfig);
      setSimliClient(client);

      client.start();
    }

    return () => {
      if (simliClient) {
        simliClient.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!botAudioRef.current || !botAudioTrack || !simliClient) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sourceNode = audioContext.createMediaStreamSource(new MediaStream([botAudioTrack]));
    
    const scriptNode = audioContext.createScriptProcessor(1024*8, 1, 1);
    sourceNode.connect(scriptNode);
    scriptNode.connect(audioContext.destination);

    scriptNode.onaudioprocess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      
      // Convert Float32Array to Int16Array
      const int16Data = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[i] * 32767)));
      }

      // Send the audio data to Simli
      console.log("sendt ", int16Data.length, " bytes to simli");
      console.log("send the data at time: ", audioContext.currentTime);
      simliClient.sendAudioData(new Uint8Array(int16Data.buffer));
      console.log("buffer size is ", int16Data.length);
    };

    return () => {
      scriptNode.disconnect();
      sourceNode.disconnect();
      audioContext.close();
    };
  }, [botAudioTrack, simliClient]);

  return (
    <div className="relative w-full aspect-video">
      <video ref={videoRef} id="simli_video" autoPlay playsInline className="w-full h-full object-cover"></video>
      <audio ref={simliAudioRef} id="simli_audio" autoPlay></audio>
      <audio ref={botAudioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default SimliIntegratedVoiceClientAudioWrapper;