import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '../../ui/utils/cn';

type LoginPasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean;
};

export function LoginPasswordField({
  id,
  invalid,
  disabled,
  className,
  ...props
}: LoginPasswordFieldProps) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('login-password-field', className)}>
      <input
        id={fieldId}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="login-field__input login-password-field__input"
        {...props}
      />
      <button
        type="button"
        className="login-password-field__toggle"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-pressed={visible}
        aria-controls={fieldId}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={0}
      >
        {visible ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  );
}
