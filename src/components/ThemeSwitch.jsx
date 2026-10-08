const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export default function ThemeSwitch({ theme, onToggle, className = '', ...props }) {
  const checked = theme === 'dark';

  return (
    <div className={`theme-switch ${className}`.trim()} {...props}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Toggle dark mode"
        onClick={onToggle}
        className="theme-switch-track"
        data-state={checked ? 'checked' : 'unchecked'}
      >
        <span className="theme-switch-thumb" />
      </button>
      <span className="theme-switch-icon left" data-active={!checked}><SunIcon /></span>
      <span className="theme-switch-icon right" data-active={checked}><MoonIcon /></span>
    </div>
  );
}
