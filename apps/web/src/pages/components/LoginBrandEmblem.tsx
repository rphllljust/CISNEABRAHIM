export function LoginBrandEmblem() {
  return (
    <div className="login-brand-emblem" aria-hidden="true">
      <svg
        className="login-brand-emblem__svg"
        viewBox="0 0 480 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          className="login-brand-emblem__ripple"
          cx="240"
          cy="262"
          rx="168"
          ry="9"
          stroke="#3a342c"
          strokeWidth="1"
        />
        <ellipse
          className="login-brand-emblem__ripple"
          cx="240"
          cy="272"
          rx="124"
          ry="5.5"
          stroke="#2f2a24"
          strokeWidth="1"
          opacity="0.72"
        />
        <ellipse
          className="login-brand-emblem__ripple"
          cx="240"
          cy="280"
          rx="80"
          ry="3"
          stroke="#25221d"
          strokeWidth="1"
          opacity="0.5"
        />

        <path
          className="login-brand-emblem__stroke"
          d="M58 214C78 148 136 98 200 90C258 82 308 104 336 142"
        />
        <path
          className="login-brand-emblem__stroke"
          d="M336 142C354 112 368 78 360 52"
        />
        <path className="login-brand-emblem__stroke" d="M360 52C362 40 356 30 346 22" />
        <circle className="login-brand-emblem__node login-brand-emblem__node--bright" cx="344" cy="20" r="2.75" />

        <path
          className="login-brand-emblem__stroke login-brand-emblem__stroke--soft"
          d="M92 182C118 158 152 142 188 136"
        />

        <path className="login-brand-emblem__stroke" d="M138 124L172 138" />
        <path className="login-brand-emblem__stroke" d="M172 138L204 128" />
        <path className="login-brand-emblem__stroke" d="M204 128L238 144" />
        <path className="login-brand-emblem__stroke" d="M238 144L272 126" />
        <path
          className="login-brand-emblem__stroke login-brand-emblem__stroke--soft"
          d="M172 138L204 162"
          opacity="0.62"
        />
        <path
          className="login-brand-emblem__stroke login-brand-emblem__stroke--soft"
          d="M204 128L238 152"
          opacity="0.62"
        />
        <path
          className="login-brand-emblem__stroke login-brand-emblem__stroke--soft"
          d="M138 124L172 138L204 128"
          opacity="0.32"
        />

        <circle className="login-brand-emblem__node" cx="138" cy="124" r="2.25" />
        <circle className="login-brand-emblem__node" cx="172" cy="138" r="2.25" />
        <circle className="login-brand-emblem__node login-brand-emblem__node--bright" cx="204" cy="128" r="2.25" />
        <circle className="login-brand-emblem__node" cx="238" cy="144" r="2.25" />
        <circle className="login-brand-emblem__node" cx="272" cy="126" r="2.25" />
      </svg>
    </div>
  );
}
