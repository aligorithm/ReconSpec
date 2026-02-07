import type { SecurityAssessment, EndpointDetail } from "@reconspec/shared";
import { AttackScenarioRow } from "./AttackScenarioRow.js";

interface SecurityAssessmentProps {
  endpoint: EndpointDetail;
  assessment: SecurityAssessment;
  onDeepDive: (endpointId: string, scenarioId: string) => Promise<void>;
}

export function SecurityAssessmentPanel({
  endpoint,
  assessment,
  onDeepDive,
}: SecurityAssessmentProps): JSX.Element {
  const scenarioCount = assessment.scenarios.length;

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
        <span className="scenario-count-label">
          {scenarioCount} attack scenario{scenarioCount !== 1 ? "s" : ""}
        </span>
      </div>

      {scenarioCount === 0 ? (
        <div
          style={{
            padding: "20px 16px",
            textAlign: "center",
            color: "var(--text-tertiary)",
            fontSize: "13px",
          }}
        >
          No attack scenarios identified for this endpoint.
        </div>
      ) : (
        <>
          {assessment.scenarios.map((scenario, index) => (
            <AttackScenarioRow
              key={scenario.id}
              scenario={scenario}
              index={index}
              endpointId={endpoint.id}
              onDeepDive={onDeepDive}
            />
          ))}

          <div className="add-scenario-row">
            <button
              className="add-scenario-btn"
              disabled
              aria-label="Add a custom attack scenario (coming soon)"
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
              Add Custom Scenario
            </button>
          </div>
        </>
      )}
    </div>
  );
}
