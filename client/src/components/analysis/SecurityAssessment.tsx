import type { SecurityAssessment, EndpointDetail } from "@reconspec/shared";
import { VulnerabilityRow } from "./VulnerabilityRow.js";

interface SecurityAssessmentProps {
  endpoint: EndpointDetail;
  assessment: SecurityAssessment;
  onDeepDive: (endpointId: string, vulnId: string) => Promise<void>;
}

export function SecurityAssessmentPanel({
  endpoint,
  assessment,
  onDeepDive,
}: SecurityAssessmentProps): JSX.Element {
  const vulnCount = assessment.vulnerabilities.length;

  return (
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
        <span className="vulnerability-count-label">
          {vulnCount} potential vulnerabilit{vulnCount !== 1 ? "ies" : "y"}
        </span>
      </div>

      {vulnCount === 0 ? (
        <div
          style={{
            padding: "20px 16px",
            textAlign: "center",
            color: "var(--text-tertiary)",
            fontSize: "13px",
          }}
        >
          No vulnerabilities identified for this endpoint.
        </div>
      ) : (
        <>
          {assessment.vulnerabilities.map((vuln, index) => (
            <VulnerabilityRow
              key={vuln.id}
              vuln={vuln}
              index={index}
              endpointId={endpoint.id}
              onDeepDive={onDeepDive}
            />
          ))}

          <div className="add-vulnerability-row">
            <button
              className="add-vulnerability-btn"
              disabled
              aria-label="Add a custom vulnerability (coming soon)"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Custom Vulnerability
            </button>
          </div>
        </>
      )}
    </div>
  );
}
