interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'lg' | 'xl' | '';
  ariaLabel?: string;
}

export function Checkbox({ checked, onChange, size = '', ariaLabel }: CheckboxProps) {
  return (
    <button
      type="button"
      className={`cbox ${size} ${checked ? 'checked' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      aria-label={ariaLabel ?? (checked ? 'décocher' : 'cocher')}
      aria-pressed={checked}
    />
  );
}
