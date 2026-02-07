import { useSpec } from "../../context/SpecContext.js";
import type { APISummary } from "../../services/api.js";

export function SummaryCard(): JSX.Element | null {
  const { parsedSpec, apiSummary, analysisTimestamp } = useSpec();

  if (!parsedSpec) return null;

  const totalEndpoints = parsedSpec.tagGroups.reduce(
    (sum, group) => sum + group.endpoints.length,
    0
  );

  const totalAuthSchemes = parsedSpec.auth.length;

  // Calculate total vulnerabilities from analyzed endpoints
  const totalVulns = parsedSpec.tagGroups.reduce(
    (sum, group) => sum + group.endpoints.reduce((epSum, ep) => epSum + (ep.assessment?.vulnerabilities.length || 0), 0),
    0
  );

  const hasAnalysis = apiSummary !== null;

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
          {hasAnalysis ? (
            <>
              <div className="stat">
                <div className="stat-value">{totalVulns}</div>
                <div className="stat-label">Test Areas</div>
              </div>
              <div className="stat">
                <div className="stat-value">{totalEndpoints}</div>
                <div className="stat-label">Endpoints</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat">
                <div className="stat-value">{parsedSpec.tagGroups.length}</div>
                <div className="stat-label">Groups</div>
              </div>
              <div className="stat">
                <div className="stat-value">{totalEndpoints}</div>
                <div className="stat-label">Endpoints</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="summary-body">
        {hasAnalysis && apiSummary ? (
          <>
            {apiSummary.overview
              .split("\n\n")
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </>
        ) : (
          <>
            {parsedSpec.description && <p>{parsedSpec.description}</p>}
          </>
        )}

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

      {/* Testing categories section */}
      <div className="risk-tags" aria-label="Testing strategy">
        {hasAnalysis && apiSummary && apiSummary.testingCategories.length > 0 ? (
          apiSummary.testingCategories.map((cat) => (
            <span key={cat.categoryId} className="risk-tag">
              {cat.categoryId} — {cat.categoryName}{" "}
              <span className="tag-count">{cat.count}</span>
            </span>
          ))
        ) : (
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-tertiary)",
              fontStyle: "italic",
            }}
          >
            {hasAnalysis
              ? "No specific testing areas identified"
              : "Run analysis to identify testing priorities"}
          </span>
        )}
      </div>
    </section>
  );
}
