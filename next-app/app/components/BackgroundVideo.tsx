import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const videoSrc = 'https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8';

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Soporte nativo para HLS (Safari / iOS)
      video.src = videoSrc;
    } else if (Hls.isSupported()) {
      // Soporte mediante hls.js (Chrome, Firefox, Edge, etc.)
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black w-full h-full z-0">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-100"
      />
    </div>
  );
}
