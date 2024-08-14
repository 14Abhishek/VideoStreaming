import './App.css'
import VideoPlayer from './videoPlayer'
import { useRef } from 'react'

function App() {

  const playerRef = useRef(null)
  const videoLink = "http://localhost:8000/uploads/videos/6b07b4f2-75cf-40bb-a012-dd9863ed4e7c/index.m3u8";
  
  
  const videoPlayerOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: videoLink,
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };


  return (
    <>
       <div>
        <h1>Video player</h1>
      </div>

      <VideoPlayer
        options={videoPlayerOptions}
        onReady={handlePlayerReady}
      />

    </>
  )
}

export default App
