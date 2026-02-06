import { useSpec } from "./context/SpecContext.js";
import { MainLayout } from "./components/layout/MainLayout.js";
import { ImportDropzone } from "./components/spec/ImportDropzone.js";
import { SummaryCard } from "./components/spec/SummaryCard.js";
import { TagGroup } from "./components/spec/TagGroup.js";
import "./styles/tokens.css";

function App(): JSX.Element {
  const { parsedSpec } = useSpec();

  if (!parsedSpec) {
    return (
      <>
        <div className="topbar" style={{ position: "sticky", top: 0, zIndex: 100 }}>
          <div className="topbar-left">
            <a href="#" className="logo" aria-label="ReconSpec home">
              <div className="logo-icon" aria-hidden="true">
                R
              </div>
              <div className="logo-text">
                Recon<span>Spec</span>
              </div>
            </a>
          </div>
          <div className="topbar-right">
            {/* Disabled settings button */}
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
        </div>
        <ImportDropzone />
      </>
    );
  }

  return (
    <MainLayout showImport={false} onImportClick={() => {}}>
      <SummaryCard />
      <TagGroup />
    </MainLayout>
  );
}

export default App;
