import React, { FormEvent, useState } from "react";
import { createRoot } from "react-dom/client";
import V3 from "./V3";
import "./access.css";

const PERSONAL_ACCESS_CODE = "2501";

function App() {
  const [granted, setGranted] = useState(
    () => localStorage.getItem("ecars_access_granted") === "true",
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    if (code !== PERSONAL_ACCESS_CODE) {
      setError(true);
      return;
    }
    localStorage.setItem("ecars_access_granted", "true");
    setGranted(true);
  };

  const lock = () => {
    localStorage.removeItem("ecars_access_granted");
    setCode("");
    setGranted(false);
  };

  if (granted) return <V3 onLock={lock} />;
  return (
    <main className="access-screen">
      <form className="access-card" onSubmit={unlock}>
        <span className="access-mark">e</span>
        <h1>eCarsTrade Personal Scout</h1>
        <p>Персональный подбор автомобилей для Черногории</p>
        <label htmlFor="access-code">Код доступа</label>
        <input
          id="access-code"
          autoFocus
          inputMode="numeric"
          autoComplete="current-password"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(false);
          }}
          aria-invalid={error}
        />
        {error && <span className="access-error">Неверный код</span>}
        <button type="submit">Открыть</button>
      </form>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
