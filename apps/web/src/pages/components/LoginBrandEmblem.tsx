export function LoginBrandEmblem() {
  return (
    <div className="login-brand-emblem" aria-hidden="true">
      <svg
        className="login-brand-emblem__svg"
        viewBox="0 0 180 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          className="login-brand-emblem__ripple"
          cx="90"
          cy="157"
          rx="89"
          ry="5"
          stroke="#322c24"
          strokeWidth="0.7"
        />
        <ellipse
          className="login-brand-emblem__ripple"
          cx="90"
          cy="164"
          rx="66"
          ry="3.5"
          stroke="#29251f"
          strokeWidth="0.7"
          opacity="0.8"
        />

        <path
          className="login-brand-emblem__stroke"
          d="M63 32C78 20 98 13 114 14C139 17 155 39 153 70C151 105 126 132 84 143L18 141C17 108 24 77 38 51C47 35 48 21 36 9"
        />
        <path
          className="login-brand-emblem__stroke"
          d="M22 3L36 9C49 11 59 20 63 32"
        />
        <path
          className="login-brand-emblem__stroke login-brand-emblem__stroke--soft"
          d="M36 10C44 29 51 49 48 66C45 81 51 92 59 101"
        />

        <path className="login-brand-emblem__stroke login-brand-emblem__stroke--facet" d="M63 32L114 14L153 70" />
        <path className="login-brand-emblem__stroke login-brand-emblem__stroke--facet" d="M63 32L101 62L153 70" />
        <path className="login-brand-emblem__stroke login-brand-emblem__stroke--facet" d="M114 14L101 62L84 143" />
        <path className="login-brand-emblem__stroke login-brand-emblem__stroke--facet" d="M48 66L101 62L84 143" />
        <path
          className="login-brand-emblem__stroke login-brand-emblem__stroke--facet login-brand-emblem__stroke--soft"
          d="M18 141L84 143L153 70"
        />
        <path
          className="login-brand-emblem__stroke login-brand-emblem__stroke--facet login-brand-emblem__stroke--soft"
          d="M63 32L48 66L18 141"
        />

        <circle className="login-brand-emblem__node login-brand-emblem__node--bright" cx="36" cy="9" r="1.15" />
        <circle className="login-brand-emblem__node" cx="63" cy="32" r="1" />
        <circle className="login-brand-emblem__node" cx="114" cy="14" r="1" />
        <circle className="login-brand-emblem__node login-brand-emblem__node--bright" cx="153" cy="70" r="1.2" />
        <circle className="login-brand-emblem__node" cx="84" cy="143" r="1" />
      </svg>
    </div>
  );
}
