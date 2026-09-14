import { TagTone } from "../types";

export function TagButton({
  active,
  name,
  count,
  tone = "blue",
  onClick,
}: {
  active: boolean;
  name: string;
  count: number;
  tone?: TagTone | string;
  onClick: () => void;
}) {
  return (
    <button className={`tag-button ${active ? "active" : ""} ${tone}`} onClick={onClick}>
      <span>{name}</span>
      <strong>{count}</strong>
    </button>
  );
}

export function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented">
      {options.map(([itemValue, label]) => (
        <button key={itemValue} className={value === itemValue ? "active" : ""} onClick={() => onChange(itemValue)}>
          {label}
        </button>
      ))}
    </div>
  );
}
