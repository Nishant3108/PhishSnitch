import { useState, useRef, useEffect } from "react";
import { FiLink, FiAlertTriangle, FiCheckCircle, FiInfo, FiSun, FiMoon } from "react-icons/fi";
import "./App.css";
import { analyzeMessage } from "./services/api";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const textareaRef = useRef(null);

  // Load saved input/result and theme from localStorage on mount
  useEffect(() => {
    const savedInput = localStorage.getItem("phishsnitch_input");
    const savedResult = localStorage.getItem("phishsnitch_result");
    const savedTheme = localStorage.getItem("phishsnitch_theme");

    if (savedInput) setInput(savedInput);
    if (savedResult) setResult(JSON.parse(savedResult));
    if (savedTheme) setDarkMode(savedTheme === "dark");
  }, []);

  // Update document root class on theme change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
      document.documentElement.classList.remove("dark-mode");
    }
    localStorage.setItem("phishsnitch_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("phishsnitch_input", input);
  }, [input]);

  useEffect(() => {
    if (result) {
      localStorage.setItem("phishsnitch_result", JSON.stringify(result));
    } else {
      localStorage.removeItem("phishsnitch_result");
    }
  }, [result]);

  useEffect(() => {
    if (result && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [result]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError("Please enter a message or link to analyze.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await analyzeMessage(input);
      setResult(data);
    } catch {
      setResult({
        label: "Error",
        confidence: 0,
        explanation: "❌ Could not connect to server or analyze the message.",
      });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" && e.ctrlKey) || e.key === "Enter") {
      e.preventDefault();
      if (!loading && input.trim()) {
        handleAnalyze();
      }
    }
  };

  const getConfidenceColor = (confidence, label) => {
    const l = label.toLowerCase().trim();
    if (l === "phishing - look out!" || l === "phishing") return "#f87171";
    if (l.includes("possibly safe") || l.includes("double check")) return "#facc15";
    if (l.includes("not phishing") || l.includes("safe")) return "#4ade80";
    return "#6b7280";
  };

  const getConfidenceLabel = (confidence, label) => {
    const l = label.toLowerCase().trim();
    if (l === "phishing - look out!" || l === "phishing") return "🔴 High Risk";
    if (l.includes("possibly safe") || l.includes("double check"))
      return "🟡 Warning – Check Carefully";
    if (l.includes("not phishing") || l.includes("safe")) return "🟢 Very Confident Safe";
    return "ℹ️ Unknown";
  };

  const getResultCardClass = (label) => {
    const l = label.toLowerCase().trim();
    if (l === "phishing - look out!" || l === "phishing") return "result-card phishing";
    if (l.includes("possibly safe") || l.includes("double check")) return "result-card possibly-safe";
    if (l.includes("not phishing") || l.includes("safe")) return "result-card not-phishing";
    return "result-card";
  };

  const renderUrls = (urls, blacklisted, trusted) => {
    if (!urls || urls.length === 0) {
      return (
        <p className="info-text">
          No URLs detected <FiInfo className="icon-inline" />
        </p>
      );
    }

    return urls.map((url, i) => {
      let color = "#999";
      let label = "Neutral";
      if (blacklisted.includes(url)) {
        color = "#dc2626";
        label = "Blacklisted";
      } else if (trusted.includes(url)) {
        color = "#22c55e";
        label = "Trusted";
      }
      return (
        <span
          key={i}
          className="badge"
          style={{ borderColor: color, color }}
          title={label}
        >
          <FiLink className="icon-inline" /> {url}
        </span>
      );
    });
  };

  const renderDomains = (domains, blacklisted, trusted) => {
    if (!domains || domains.length === 0) {
      return (
        <em className="info-text">
          No domains found <FiInfo className="icon-inline" />
        </em>
      );
    }

    return domains.map((domain, i) => {
      const isBlacklisted = blacklisted.includes(domain);
      const isTrusted = trusted.includes(domain);
      let color = "#999";
      let label = "Neutral";

      if (isBlacklisted) {
        color = "#dc2626";
        label = "Blacklisted";
      } else if (isTrusted) {
        color = "#22c55e";
        label = "Trusted";
      }

      return (
        <span
          key={i}
          className="badge"
          style={{ borderColor: color, color }}
          title={label}
        >
          {domain}
        </span>
      );
    });
  };

  const renderKeywordBadges = (keywords, color, icon) => {
    if (!keywords || keywords.length === 0) {
      return (
        <em className="info-text">
          None detected <FiInfo className="icon-inline" />
        </em>
      );
    }

    return keywords.map((kw, i) => (
      <span key={i} className="badge" style={{ backgroundColor: color + "33", color }}>
        {icon} {kw}
      </span>
    ));
  };

  return (
    <div className="app-container">
      <header className="app-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="app-title">🕵️‍♂️ PhishSnitch</h1>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark/light mode"
          title="Toggle dark/light mode"
          className="theme-toggle-button"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1.5rem",
            color: darkMode ? "#facc15" : "#4b5563",
          }}
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
      </header>

      <p className="app-desc">AI powered snitch!</p>

      <div style={{ position: "relative", width: "100%" }}>
        <textarea
          ref={textareaRef}
          className="input-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste suspicious message or URL here..."
          rows={6}
          disabled={loading}
          onKeyDown={handleKeyDown}
          aria-label="Message input textarea"
        />
        {input && !loading && (
          <button
            onClick={() => setInput("")}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "0.5rem",
              background: "transparent",
              border: "none",
              color: "#00bfff",
              fontWeight: "bold",
              fontSize: "1.5rem",
              cursor: "pointer",
              userSelect: "none",
              lineHeight: "1",
            }}
            aria-label="Clear input"
            title="Clear input"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          style={{ color: "#f87171", marginTop: "0.5rem" }}
        >
          {error}
        </p>
      )}

      <button
        className="analyze-button"
        onClick={handleAnalyze}
        disabled={!input.trim() || loading}
        aria-label="Analyze message button"
      >
        Analyze
        {loading && (
          <span
            className="spinner"
            aria-live="polite"
            aria-busy="true"
            role="status"
            style={{ marginLeft: "8px" }}
          />
        )}
      </button>

      {result && (
        <div className={getResultCardClass(result.label)}>
          <h2 style={{ color: getConfidenceColor(result.confidence, result.label) }}>
            {result.label.toUpperCase()}
          </h2>

          <p className="confidence-text">
            Confidence: {result.confidence}% –{" "}
            <span>{getConfidenceLabel(result.confidence, result.label)}</span>
          </p>

          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${result.confidence}%`,
                backgroundColor: getConfidenceColor(result.confidence, result.label),
              }}
            />
          </div>

          <p className="explanation-text">
            <strong>Why?</strong> {result.explanation}
          </p>

          <div className="details-section">
            <h3>
              <FiLink className="icon-inline" /> URLs detected:
            </h3>
            <div className="badges-container">
              {renderUrls(
                result.urls || [],
                result.blacklisted_domains_found || [],
                result.trusted_domains_found || []
              )}
            </div>

            <h3>🌐 Domains found:</h3>
            <div className="badges-container">
              {renderDomains(
                result.domains || [],
                result.blacklisted_domains_found || [],
                result.trusted_domains_found || []
              )}
            </div>

            <h3>
              <FiAlertTriangle className="icon-inline" /> Phishing trigger keywords:
            </h3>
            <div className="badges-container">
              {renderKeywordBadges(result.trigger_keywords_found, "#dc2626", "🚩")}
            </div>

            <h3>
              <FiCheckCircle className="icon-inline" /> Safe keywords found:
            </h3>
            <div className="badges-container">
              {renderKeywordBadges(result.safe_keywords_found, "#22c55e", "✅")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
