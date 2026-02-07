import type { AttackScenario } from "@reconspec/shared";
import { ScenarioDeepDive } from "./ScenarioDeepDive.js";
import { useState } from "react";

interface AttackScenarioRowProps {
  scenario: AttackScenario;
  index: number;
  endpointId: string;
  onDeepDive: (endpointId: string, scenarioId: string) => Promise<void>;
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

export function AttackScenarioRow({ scenario, index, endpointId, onDeepDive }: AttackScenarioRowProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMorePayloads, setIsLoadingMorePayloads] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = CATEGORY_MAP[scenario.category] || {
    short: scenario.category,
    full: scenario.category,
    emoji: "⚠️",
  };

  const handleExpandClick = async () => {
    console.log('[AttackScenarioRow] handleExpandClick called', {
      scenarioId: scenario.id,
      endpointId,
      hasDeepDive: !!scenario.deepDive,
      isExpanded,
      isLoading
    });

    if (scenario.deepDive) {
      setIsExpanded(!isExpanded);
    } else if (!isExpanded && !isLoading) {
      setIsLoading(true);
      setError(null);
      console.log('[AttackScenarioRow] Calling onDeepDive...');
      try {
        await onDeepDive(endpointId, scenario.id);
        console.log('[AttackScenarioRow] onDeepDive completed, setting isExpanded=true');
        setIsExpanded(true);
      } catch (err) {
        console.error('[AttackScenarioRow] onDeepDive failed:', err);
        setError(err instanceof Error ? err.message : "Failed to load deep dive");
      } finally {
        console.log('[AttackScenarioRow] Setting isLoading=false');
        setIsLoading(false);
      }
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleGenerateMorePayloads = async () => {
    console.log('[AttackScenarioRow] Generate more payloads clicked');
    setIsLoadingMorePayloads(true);
    try {
      await onDeepDive(endpointId, scenario.id);
    } catch (err) {
      console.error("Failed to generate more payloads:", err);
    } finally {
      setIsLoadingMorePayloads(false);
    }
  };

  return (
    <div className="attack-scenario">
      <div className="attack-scenario-header">
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
            {scenario.affectedParams.length > 0 && (
              <span className="scenario-params">
                {scenario.affectedParams.map((param) => (
                  <code key={param}>{param}</code>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isExpanded && (
        <div style={{ padding: "0 16px 8px 48px" }}>
          <button
            className="scenario-expand-btn"
            onClick={handleExpandClick}
            disabled={isLoading}
            aria-label={`Show detailed testing steps for ${scenario.name}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {isLoading ? "Loading..." : scenario.deepDive ? "Show Deep Dive" : "Deep Dive"}
          </button>
        </div>
      )}

      {isExpanded && (
        <>
          {isLoading && (
            <div
              style={{
                padding: "16px 48px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-tertiary)",
                fontSize: "13px",
              }}
            >
              <div className="spinner" style={{ width: "14px", height: "14px" }}></div>
              Generating testing guidance...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "16px 48px",
                color: "var(--error)",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {scenario.deepDive && !isLoading && (
            <ScenarioDeepDive
              deepDive={scenario.deepDive}
              onGenerateMorePayloads={handleGenerateMorePayloads}
              isLoadingMorePayloads={isLoadingMorePayloads}
            />
          )}
        </>
      )}
    </div>
  );
}
