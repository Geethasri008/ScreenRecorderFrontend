import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoURL, setVideoURL] = useState(null);
  const [recordingsList, setRecordingsList] = useState([]);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const videoRef = useRef(null);

  // Fetch recordings from backend
  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/recordings");
      setRecordingsList(res.data);
    } catch (error) {
      console.error("Error fetching recordings:", error);
    }
  };

  // Start Recording
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    let localChunks = []; // keep chunks locally

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        localChunks.push(e.data);
        console.log("Chunk collected:", e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(localChunks, { type: "video/webm; codecs=vp8,opus" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      setRecordedChunks(localChunks); // save to state for upload
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);

    // Timer (max 3 minutes = 180s)
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      setTimer(t);
      if (t >= 180) {
        stopRecording();
      }
    }, 1000);
    setIntervalId(id);
  } catch (err) {
    console.error("Error starting recording:", err);
  }
};

// Stop Recording
const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
    clearInterval(intervalId);
    setTimer(0);
  }
};


  // Download recording
  const downloadRecording = () => {
    if (!videoURL) return;
    const a = document.createElement("a");
    a.href = videoURL;
    a.download = "recording.webm";
    a.click();
  };

  // Upload recording
  const uploadRecording = async () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", blob, "recording.webm");

    try {
      await axios.post("http://localhost:5000/api/recordings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Upload successful!");
      fetchRecordings();
    } catch (error) {
      console.error("Error uploading recording:", error);
    }
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
    <div className="bg-gray-900/80 backdrop-blur-lg shadow-2xl rounded-2xl p-8 w-full max-w-3xl text-white">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-400">
        Screen Recorder
      </h1>

      <div className="mb-6 text-center">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg transition"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg transition"
          >
            Stop Recording
          </button>
        )}
      </div>

      {recording && (
        <p className="mb-6 text-center text-yellow-400 font-medium">
          ⏺ Recording... Time: {timer}s
        </p>
      )}

      {videoURL && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold mb-3 text-blue-300">Preview</h2>
          <video
            ref={videoRef}
            src={videoURL}
            controls
            className="w-full max-w-md mx-auto rounded-lg shadow-lg mb-4"
          />
          <div className="space-x-4">
            <button
              onClick={downloadRecording}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition"
            >
              Download
            </button>
            <button
              onClick={uploadRecording}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-md transition"
            >
              Upload
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3 text-green-300">
          Uploaded Recordings
        </h2>
        <ul className="space-y-2">
          {recordingsList.map((rec) => (
            <li key={rec.id}>
              <a
                href={`http://localhost:5000/api/recordings/${rec.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-500 underline"
              >
                {rec.filename}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);
}
