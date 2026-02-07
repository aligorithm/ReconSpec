import type { EndpointDetail } from "@reconspec/shared";
import { ParamList } from "./ParamList.js";
import { SecurityAssessmentPanel } from "../analysis/SecurityAssessment.js";

interface EndpointBodyProps {
  endpoint: EndpointDetail;
}

export function EndpointBody({ endpoint }: EndpointBodyProps): JSX.Element {
  const hasParameters = endpoint.parameters.length > 0;
  const hasRequestBody = endpoint.requestBody !== null;

  return (
    <div className="endpoint-body">
      <div className="endpoint-details">
        {/* Parameters Section */}
        {hasParameters && (
          <div className="endpoint-detail-section">
            <div className="detail-heading">Parameters</div>
            <ParamList parameters={endpoint.parameters} />
          </div>
        )}

        {/* Request Body Section */}
        {hasRequestBody && (
          <div className="endpoint-detail-section">
            <div className="detail-heading">
              Request Body ({endpoint.requestBody?.contentType})
            </div>
            <ParamList
              parameters={endpoint.requestBody?.properties || []}
              showRequired={true}
            />
          </div>
        )}

        {/* Auth Section */}
        {endpoint.security.length > 0 && (
          <div className="endpoint-detail-section">
            <div className="detail-heading">Auth</div>
            {endpoint.security.map((req, index) => (
              <div
                key={index}
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                {req.name}
                {req.scopes.length > 0 && (
                  <span style={{ color: "var(--text-tertiary)", marginLeft: "4px" }}>
                    ({req.scopes.join(", ")})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Responses Section */}
        {endpoint.responses.length > 0 && (
          <div className="endpoint-detail-section">
            <div className="detail-heading">Responses</div>
            {endpoint.responses.map((response) => (
              <div
                key={response.statusCode}
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  padding: "4px 0",
                }}
              >
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color:
                      response.statusCode.startsWith("2")
                        ? "var(--success)"
                        : response.statusCode.startsWith("4")
                          ? "var(--warning)"
                          : response.statusCode.startsWith("5")
                            ? "var(--error)"
                            : "var(--info)",
                  }}
                >
                  {response.statusCode}
                </code>
                {response.description && (
                  <span style={{ marginLeft: "8px" }}>{response.description}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Assessment Section */}
      {endpoint.assessment ? (
        <SecurityAssessmentPanel endpoint={endpoint} assessment={endpoint.assessment} />
      ) : (
        <div
          className="security-assessment"
          role="region"
          aria-label={`Security assessment for ${endpoint.method.toUpperCase()} ${endpoint.path}`}
        >
          <div className="security-assessment-header">
            <div className="security-assessment-title">
              <svg
                className="shield-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Security Assessment
            </div>
            <span className="scenario-count-label">Not analyzed</span>
          </div>
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "14px",
              fontStyle: "italic",
            }}
          >
            Run analysis to generate attack scenarios.
          </div>
        </div>
      )}
    </div>
  );
}
