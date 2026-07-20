import React, { FormEvent, useState } from "react";
import { createRoot } from "react-dom/client";
import V3 from "./V3";
import "./access.css";
import { setActiveProfile } from "./storage";
import LogicPage from "./LogicPage";

const PERSONAL_ACCESS_CODE = "2501";
const TEST_LOGIN = "тест 1";
const TEST_PASSWORD = "тест1";
const OWNER_LOGIN = "mvisl";
const OWNER_PASSWORD = "bsrtyp";

function App() {
  if (window.location.pathname.endsWith("/logic")) return <LogicPage />;
  const [granted, setGranted] = useState(
    () => localStorage.getItem("ecars_access_granted") === "true",
  );
  const [code, setCode] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    const normalizedLogin = login.trim().toLowerCase().replace(/\s+/g, " ");
    if (code === PERSONAL_ACCESS_CODE) {
      setActiveProfile("mvisl");
      localStorage.setItem("ecars_access_granted", "true");
      setGranted(true);
      return;
    }
    if (normalizedLogin === TEST_LOGIN && password === TEST_PASSWORD) {
      setActiveProfile("test-1");
      localStorage.setItem("ecars_access_granted", "true");
      setGranted(true);
      return;
    }
    if (normalizedLogin === OWNER_LOGIN && password === OWNER_PASSWORD) {
      setActiveProfile("mvisl");
      localStorage.setItem("ecars_access_granted", "true");
      setGranted(true);
      return;
    }
    if (code || login || password) {
      setError(true);
      return;
    }
    setError(true);
  };

  const lock = () => {
    localStorage.removeItem("ecars_access_granted");
    setActiveProfile("mvisl");
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
        <label htmlFor="access-login">Логин</label>
        <input id="access-login" autoComplete="username" value={login} onChange={(event) => { setLogin(event.target.value); setError(false); }} />
        <label htmlFor="access-password">Пароль</label>
        <input id="access-password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(false); }} />
        <details className="legacy-access">
          <summary>Личный код владельца</summary>
          <input id="access-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => { setCode(event.target.value); setError(false); }} />
        </details>
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
