import { useSpec } from "../../context/SpecContext.js";

interface TopBarProps {
  onImportClick: () => void;
}

export function TopBar({ onImportClick }: TopBarProps): JSX.Element {
  const { parsedSpec, clearSpec } = useSpec();

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
        {/* Phase 2: Settings button - disabled for now */}
        <button
          className="btn btn-ghost btn-icon"
          disabled
          aria-label="Settings (coming in Phase 2)"
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </header>
  );
}
