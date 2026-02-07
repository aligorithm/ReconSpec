import { useSpec } from "../../context/SpecContext.js";
import { getProviderStatus } from "../../services/api.js";
import { useState, useEffect } from "react";

export function AnalysisBar(): JSX.Element | null {
  const {
    parsedSpec,
    isAnalyzing,
    analysisProgress,
    analysisTimestamp,
    analyzeSpec,
  } = useSpec();

  const [providerConfigured, setProviderConfigured] = useState(false);

  useEffect(() => {
    getProviderStatus()
      .then((status) => setProviderConfigured(status.configured))
      .catch(() => setProviderConfigured(false));
  }, []);

  if (!parsedSpec) return null;

  const canAnalyze = providerConfigured && !isAnalyzing;

  const handleAnalyze = async () => {
    if (canAnalyze) {
      await analyzeSpec();
    }
  };

  return (
    <div className="export-bar">
      <div className="export-bar-left">
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {isAnalyzing ? "Analyzing..." : "Test Plan"}
        </span>
        {isAnalyzing && analysisProgress && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginLeft: "12px",
            }}
          >
            Analyzing endpoint {analysisProgress.completed} of{" "}
            {analysisProgress.total}: {analysisProgress.currentEndpoint}
          </span>
        )}
        {!isAnalyzing && analysisTimestamp && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginLeft: "12px",
            }}
          >
            Last analyzed{" "}
            {new Date(analysisTimestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="export-bar-right">
        <button
          className="btn btn-secondary btn-sm"
          disabled
          title="Export functionality coming soon"
        >
          Export JSON
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          aria-describedby="analyze-help"
        >
          {isAnalyzing ? (
            <>
              <span
                className="spinner"
                style={{
                  width: "12px",
                  height: "12px",
                  borderWidth: "2px",
                }}
              />{" "}
              Analyzing...
            </>
          ) : analysisTimestamp ? (
            "Re-analyze"
          ) : (
            "Analyze"
          )}
        </button>
      </div>
      {!providerConfigured && (
        <span
          id="analyze-help"
          style={{
            display: "none",
          }}
        >
          Configure an LLM provider to enable analysis
        </span>
      )}
    </div>
  );
}
