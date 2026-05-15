import type { ReactNode } from 'react';

type Props = {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  caution?: string;
  note?: ReactNode;
  valueFormatter?: (value: number) => string;
};

export function ParameterSlider({ label, description, value, min, max, step, onChange, caution, note, valueFormatter }: Props) {
  const displayValue = valueFormatter ? valueFormatter(value) : value.toFixed(2);
  return (
    <div className="parameter-slider">
      <div className="parameter-slider__header">
        <strong>{label}</strong>
        <span>{displayValue}</span>
      </div>
      <p className="parameter-slider__description">{description}</p>
      <p className="parameter-slider__range">推奨範囲: {min} 〜 {max} / step {step}</p>
      {caution && <p className="parameter-slider__caution">注意: {caution}</p>}
      {note && <div className="parameter-slider__note">{note}</div>}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
