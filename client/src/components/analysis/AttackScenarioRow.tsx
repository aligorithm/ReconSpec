import type { AttackScenario } from "@reconspec/shared";

interface AttackScenarioRowProps {
  scenario: AttackScenario;
  index: number;
}

// OWASP category display mapping
const CATEGORY_MAP: Record<string, { short: string; full: string; emoji: string }> = {
  API1: { short: "Broken Object Auth", full: "Broken Object Level Authorization", emoji: "🔓" },
  API2: { short: "Broken Authentication", full: "Broken Authentication", emoji: "🔑" },
  API3: { short: "Object Property Auth", full: "Broken Object Property Level Authorization", emoji: "🏠" },
  API4: { short: "Unlimited Resources", full: "Unrestricted Resource Consumption", emoji: "♾️" },
  API5: { short: "Function Authorization", full: "Broken Function Level Authorization", emoji: "⚡" },
  API6: { short: "Business Flows", full: "Unrestricted Access to Sensitive Business Flows", emoji: "💼" },
  API7: { short: "SSRF", full: "Server-Side Request Forgery", emoji: "🌐" },
  API8: { short: "Security Misconfiguration", full: "Security Misconfiguration", emoji: "⚙️" },
  API9: { short: "Inventory Management", full: "Improper Inventory Management", emoji: "📋" },
  API10: { short: "Unsafe API Consumption", full: "Unsafe Consumption of APIs", emoji: "🔗" },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "#dc2626"; // red-600
  if (score >= 60) return "#ea580c"; // orange-600
  if (score >= 40) return "#ca8a04"; // yellow-600
  return "#6b7280"; // gray-500
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  if (score >= 40) return "Moderate";
  return "Low";
}

export function AttackScenarioRow({ scenario, index }: AttackScenarioRowProps): JSX.Element {
  const category = CATEGORY_MAP[scenario.category] || {
    short: scenario.category,
    full: scenario.category,
    emoji: "⚠️",
  };

  const scoreColor = getScoreColor(scenario.relevanceScore);
  const scoreLabel = getScoreLabel(scenario.relevanceScore);

  return (
    <div className="attack-scenario">
      <button
        className="attack-scenario-header"
        aria-expanded={false}
        onClick={() => {
          // Deep dive functionality coming in Phase 4
        }}
      >
        <span className="scenario-number">{index + 1}</span>
        <div className="scenario-content">
          <div className="scenario-name">
            <span style={{ marginRight: "6px" }}>{category.emoji}</span>
            {scenario.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              className="scenario-category"
              aria-label={`OWASP category: ${category.full}`}
            >
              {category.short}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                background: `${scoreColor}15`,
                color: scoreColor,
                fontSize: "11px",
                fontWeight: "600",
                borderRadius: "4px",
              }}
              aria-label={`Relevance score: ${scenario.relevanceScore} out of 100 (${scoreLabel})`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              {scenario.relevanceScore}
            </span>
            {scenario.affectedParams.length > 0 && (
              <span className="scenario-params">
                {scenario.affectedParams.map((param) => (
                  <code key={param}>{param}</code>
                ))}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
