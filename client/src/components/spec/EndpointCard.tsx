import { useState } from "react";
import type { EndpointDetail } from "@reconspec/shared";
import { useSpec } from "../../context/SpecContext.js";
import { MethodBadge } from "./MethodBadge.js";
import { EndpointBody } from "./EndpointBody.js";

interface EndpointCardProps {
  endpoint: EndpointDetail;
}

export function EndpointCard({ endpoint }: EndpointCardProps): JSX.Element {
  const { expandedEndpoints, toggleEndpoint, selectedEndpoint } = useSpec();
  const isExpanded = expandedEndpoints.has(endpoint.id);
  const isSelected = selectedEndpoint === endpoint.id;

  const scenarioCount = endpoint.assessment?.scenarios.length ?? 0;

  // Highlight path parameters
  const pathWithParams = endpoint.path.replace(
    /\{([^}]+)\}/g,
    '<span class="param">{$1}</span>'
  );

  return (
    <div
      id={endpoint.id}
      className={`endpoint-card${isExpanded ? " open" : ""}${isSelected ? " selected" : ""}`}
    >
      <div
        className="endpoint-header"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => toggleEndpoint(endpoint.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleEndpoint(endpoint.id);
          }
        }}
      >
        <MethodBadge method={endpoint.method} />
        <span
          className="endpoint-path"
          dangerouslySetInnerHTML={{ __html: pathWithParams }}
        />
        {endpoint.summary && (
          <span className="endpoint-summary-text">{endpoint.summary}</span>
        )}
        {endpoint.deprecated && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--warning)",
              background: "var(--warning-bg)",
              padding: "2px 8px",
              borderRadius: "4px",
              marginLeft: "8px",
            }}
          >
            DEPRECATED
          </span>
        )}
        {scenarioCount > 0 && (
          <span className="endpoint-scenario-count">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {scenarioCount}
          </span>
        )}
        <svg
          className="endpoint-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      {isExpanded && <EndpointBody endpoint={endpoint} />}
    </div>
  );
}
