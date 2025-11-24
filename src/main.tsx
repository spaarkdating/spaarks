import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import App from "./App.tsx";
import { LoadingScreen } from "./components/LoadingScreen";
import "./index.css";

const Root = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? <LoadingScreen key="loading" /> : <App key="app" />}
    </AnimatePresence>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
