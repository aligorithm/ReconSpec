import { useSpec } from "../../context/SpecContext.js";

export function SummaryCard(): JSX.Element | null {
  const { parsedSpec } = useSpec();

  if (!parsedSpec) return null;

  const totalEndpoints = parsedSpec.tagGroups.reduce(
    (sum, group) => sum + group.endpoints.length,
    0
  );

  const totalAuthSchemes = parsedSpec.auth.length;

  return (
    <section className="summary-card" aria-label="API summary">
      <div className="summary-header">
        <div>
          <h1 className="summary-title">{parsedSpec.title}</h1>
          <p className="summary-subtitle">
            OpenAPI {parsedSpec.openApiVersion} — {totalEndpoints} endpoint{totalEndpoints !== 1 ? "s" : ""} across {parsedSpec.tagGroups.length} tag group{parsedSpec.tagGroups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="summary-stats">
          <div className="stat">
            <div className="stat-value">{parsedSpec.tagGroups.length}</div>
            <div className="stat-label">Groups</div>
          </div>
          <div className="stat">
            <div className="stat-value">{totalEndpoints}</div>
            <div className="stat-label">Endpoints</div>
          </div>
        </div>
      </div>

      <div className="summary-body">
        {parsedSpec.description && <p>{parsedSpec.description}</p>}

        {/* Server URLs */}
        {parsedSpec.servers.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <div className="detail-heading">Servers</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {parsedSpec.servers.map((server, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                    padding: "4px 0",
                  }}
                >
                  {server.url}
                  {server.description && (
                    <span style={{ marginLeft: "8px", color: "var(--text-tertiary)" }}>
                      — {server.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Auth Schemes */}
        {totalAuthSchemes > 0 && (
          <div style={{ marginTop: "12px" }}>
            <div className="detail-heading">Authentication</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {parsedSpec.auth.map((auth) => (
                <span
                  key={auth.name}
                  style={{
                    fontSize: "12px",
                    padding: "4px 10px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {auth.name}
                  <span style={{ color: "var(--text-tertiary)", marginLeft: "4px" }}>
                    ({auth.type})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk tags section - placeholder for Phase 3 */}
      <div className="risk-tags" aria-label="Security analysis">
        <span
          style={{
            fontSize: "13px",
            color: "var(--text-tertiary)",
            fontStyle: "italic",
          }}
        >
          Security analysis will be available in Phase 3
        </span>
      </div>
    </section>
  );
}
