import { useSpec } from "../../context/SpecContext.js";
import { MethodBadge } from "../spec/MethodBadge.js";

export function Sidebar(): JSX.Element | null {
  const { parsedSpec, expandedGroups, toggleGroup, selectedEndpoint, selectEndpoint } = useSpec();

  if (!parsedSpec) return null;

  return (
    <nav className="sidebar" role="navigation" aria-label="API endpoints">
      <div className="sidebar-section">
        <div className="sidebar-label">Endpoints</div>

        {parsedSpec.tagGroups.map((group) => (
          <div key={group.name} style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                color: "var(--text-tertiary)",
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {group.name}
            </div>
            {group.endpoints.map((endpoint) => {
              const scenarioCount = endpoint.assessment?.scenarios.length ?? 0;

              return (
                <a
                  key={endpoint.id}
                  href={`#${endpoint.id}`}
                  className={`sidebar-item${selectedEndpoint === endpoint.id ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    selectEndpoint(endpoint.id);
                    // Scroll to endpoint
                    document.getElementById(endpoint.id)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  <MethodBadge method={endpoint.method} variant="mini" />
                  <span className="path">{endpoint.path}</span>
                  {scenarioCount > 0 && (
                    <span className="sidebar-count">{scenarioCount}</span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
