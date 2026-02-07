import type { DeepDiveResult } from "@reconspec/shared";
import { useState } from "react";

interface ScenarioDeepDiveProps {
  deepDive: DeepDiveResult;
  onGenerateMorePayloads: () => void;
  isLoadingMorePayloads: boolean;
}

export function ScenarioDeepDive({
  deepDive,
  onGenerateMorePayloads,
  isLoadingMorePayloads,
}: ScenarioDeepDiveProps): JSX.Element {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (body: string, index: number) => {
    navigator.clipboard.writeText(body);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Convert &lt; and &gt; back to < and > for display in code blocks
  const decodeHtml = (text: string) => {
    return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  };

  return (
    <div className="scenario-deep-dive">
      <div className="deep-dive-card">
        {/* Overview */}
        <div className="deep-dive-section">
          <div className="deep-dive-heading">Overview</div>
          <p className="deep-dive-text">{deepDive.overview}</p>
        </div>

        {/* Testing Steps */}
        {deepDive.steps.length > 0 && (
          <div className="deep-dive-section">
            <div className="deep-dive-heading">Testing Steps</div>
            <ol className="deep-dive-steps">
              {deepDive.steps.map((step, index) => (
                <li key={index}>
                  {step.description}
                  {step.parameterFocus.length > 0 && (
                    <span style={{ marginLeft: "8px", color: "var(--text-tertiary)", fontSize: "12px" }}>
                      (Targets:{" "}
                      {step.parameterFocus.map((param) => (
                        <code
                          key={param}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            background: "var(--bg-primary)",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            marginLeft: "4px",
                          }}
                        >
                          {param}
                        </code>
                      ))}
                      )
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Expected Responses */}
        {deepDive.expectedResponses.length > 0 && (
          <div className="deep-dive-section">
            <div className="deep-dive-heading">Expected Responses</div>
            {deepDive.expectedResponses.map((resp, index) => (
              <div
                key={index}
                style={{
                  background: "var(--info-bg)",
                  border: "1px solid rgba(96, 165, 250, 0.2)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "var(--info)",
                    marginBottom: "6px",
                  }}
                >
                  {resp.condition}
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {resp.indicators.map((indicator, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        marginBottom: "2px",
                      }}
                    >
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Sample Payloads */}
        {deepDive.samplePayloads.length > 0 && (
          <div className="deep-dive-section">
            <div className="deep-dive-heading">Sample Payloads</div>
            {deepDive.samplePayloads.map((payload, index) => (
              <div key={index} style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    marginBottom: "4px",
                  }}
                >
                  {payload.label}
                </div>
                <div className="payload-block">
                  <span className="payload-label">{payload.contentType}</span>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    <code>{decodeHtml(payload.body)}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(payload.body, index)}
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      padding: "4px 6px",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "4px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    aria-label="Copy payload to clipboard"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {copiedIndex === index ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    marginTop: "4px",
                  }}
                >
                  {payload.description}
                </div>
              </div>
            ))}

            {/* Generate More Payloads Button */}
            <button
              className="generate-payload-btn"
              onClick={onGenerateMorePayloads}
              disabled={isLoadingMorePayloads}
              aria-label="Generate more payloads"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  animation: isLoadingMorePayloads ? "spin 1s linear infinite" : "none",
                }}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {isLoadingMorePayloads ? "Generating..." : "Generate More Payloads"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
