import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initializeDiscord } from "./discord";
import "./style.css";

function App() {
  const [status, setStatus] = useState("Loading Activity...");

  useEffect(() => {
    (async () => {
      try {
        await initializeDiscord();
        setStatus("TikTok Shop Screener Activity is running");
      } catch (error) {
        console.error(error);
        setStatus(`Activity error: ${error.message}`);
      }
    })();
  }, []);

  return (
    <main className="app">
      <h1>TikTok Shop Screener</h1>
      <p>{status}</p>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
