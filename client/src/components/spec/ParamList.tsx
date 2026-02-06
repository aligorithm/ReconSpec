import type { ParameterDetail, PropertyDetail } from "@reconspec/shared";

interface ParamListProps {
  parameters: ParameterDetail[] | PropertyDetail[];
  showRequired?: boolean;
}

export function ParamList({ parameters, showRequired = true }: ParamListProps): JSX.Element {
  if (parameters.length === 0) return <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>None</p>;

  return (
    <ul className="param-list">
      {parameters.map((param, index) => (
        <li key={index} className="param-item">
          <span className="param-name">{param.name}</span>
          <span className="param-type">{param.type}</span>
          {showRequired && param.required && (
            <span className="param-required">required</span>
          )}
          {param.description && <span className="param-desc">{param.description}</span>}
        </li>
      ))}
    </ul>
  );
}
