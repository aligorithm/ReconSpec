import { useSpec } from "../../context/SpecContext.js";
import { EndpointCard } from "./EndpointCard.js";

export function TagGroup(): JSX.Element | null {
  const { parsedSpec, expandedGroups, toggleGroup } = useSpec();

  if (!parsedSpec) return null;

  return (
    <>
      {parsedSpec.tagGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.name);
        const endpointCount = group.endpoints.length;

        return (
          <div key={group.name} className={`tag-group${isExpanded ? " open" : ""}`} role="region" aria-label={`${group.name} endpoints`}>
            <div
              className="tag-group-header"
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleGroup(group.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleGroup(group.name);
                }
              }}
            >
              <svg
                className="tag-group-chevron"
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
              <span className="tag-group-name">{group.name}</span>
              <span className="tag-group-count">
                {endpointCount} endpoint{endpointCount !== 1 ? "s" : ""}
              </span>
            </div>

            {isExpanded && (
              <div className="tag-group-endpoints">
                {group.endpoints.map((endpoint) => (
                  <EndpointCard key={endpoint.id} endpoint={endpoint} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
