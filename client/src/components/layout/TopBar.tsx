import { useSpec } from "../../context/SpecContext.js";
import { getProviderStatus } from "../../services/api.js";
import { useEffect, useState } from "react";
import type { ProviderStatus } from "@reconspec/shared";

interface TopBarProps {
  onImportClick: () => void;
}

export function TopBar({ onImportClick }: TopBarProps): JSX.Element {
  const { parsedSpec, clearSpec } = useSpec();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    getProviderStatus()
      .then(setProviderStatus)
      .catch(() => {
        // If fetching fails, just show as not configured
        setProviderStatus({ configured: false });
      });
  }, []);

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <a href="#" className="logo" aria-label="ReconSpec home">
          <div className="logo-icon" aria-hidden="true">
            R
          </div>
          <div className="logo-text">
            Recon<span>Spec</span>
          </div>
        </a>
        {parsedSpec && (
          <>
            <div className="topbar-divider" aria-hidden="true" />
            <div className="api-title">
              <strong>{parsedSpec.title}</strong> &nbsp;v{parsedSpec.version}
            </div>
            {/* Phase 1: Not analyzed status indicator */}
            <div
              className="analysis-status"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--text-tertiary)",
                background: "var(--bg-tertiary)",
                padding: "4px 10px",
                borderRadius: "20px",
              }}
            >
              <span
                className="dot"
                aria-hidden="true"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--text-tertiary)",
                }}
              />
              Not analyzed
            </div>
            {/* Phase 2: Provider status indicator */}
            {providerStatus && (
              <div
                className="provider-status"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: providerStatus.configured
                    ? "var(--success)"
                    : "var(--text-tertiary)",
                  background: providerStatus.configured
                    ? "var(--success-bg)"
                    : "var(--bg-tertiary)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  marginLeft: "8px",
                }}
              >
                <span
                  className="dot"
                  aria-hidden="true"
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: providerStatus.configured
                      ? "var(--success)"
                      : "var(--text-tertiary)",
                  }}
                />
                {providerStatus.configured
                  ? `${providerStatus.provider === "anthropic" ? "Anthropic" : providerStatus.provider === "openai" ? "OpenAI" : providerStatus.provider} — ${providerStatus.model}`
                  : "No provider"}
              </div>
            )}
          </>
        )}
      </div>
      <div className="topbar-right">
        {parsedSpec && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              clearSpec();
              onImportClick();
            }}
            aria-label="Import new spec"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import
          </button>
        )}
      </div>
    </header>
  );
}
