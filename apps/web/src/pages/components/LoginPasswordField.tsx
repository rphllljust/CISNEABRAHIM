import { useId, useState, type InputHTMLAttributes } from 'react';

type LoginPasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean;
};

export function LoginPasswordField({
  id,
  invalid,
  disabled,
  ...props
}: LoginPasswordFieldProps) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-wrap">
      <input
        id={fieldId}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-pressed={visible}
        aria-controls={fieldId}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  );
}
