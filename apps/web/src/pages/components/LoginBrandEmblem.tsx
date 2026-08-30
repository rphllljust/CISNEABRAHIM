export function LoginBrandEmblem() {
  return (
    <div className="plate-frame" aria-hidden="true">
      <svg viewBox="0 0 480 380" xmlns="http://www.w3.org/2000/svg">
        <ellipse className="ripple" cx="240" cy="330" rx="150" ry="10" />
        <ellipse className="ripple" cx="240" cy="342" rx="110" ry="7" />

        <path
          className="swan-line"
          d="M 120 300
            C 120 230, 150 190, 170 150
            C 185 120, 175 95, 150 80
            C 168 78, 190 92, 196 118
            C 210 90, 245 78, 280 90
            C 320 104, 345 140, 345 185
            C 345 250, 300 300, 230 305
            C 190 308, 150 305, 120 300 Z"
        />

        <path className="swan-line" d="M 150 80 L 128 68" />

        <path
          className="swan-line"
          d="M 152 82
            C 178 100, 182 130, 168 158
            C 156 182, 158 210, 178 232"
          strokeWidth="0.7"
          opacity="0.55"
        />

        <circle className="swan-node" cx="150" cy="80" r="3" />
        <circle className="swan-node dim" cx="196" cy="118" r="2.2" />
        <circle className="swan-node dim" cx="280" cy="90" r="2.2" />
        <circle className="swan-node" cx="345" cy="185" r="2.6" />
        <circle className="swan-node dim" cx="230" cy="305" r="2.2" />
        <circle className="swan-node dim" cx="168" cy="158" r="2" />

        <path
          className="swan-line"
          strokeWidth="0.5"
          opacity="0.4"
          d="M150 80 L196 118 M196 118 L280 90 M280 90 L345 185 M345 185 L230 305 M230 305 L168 158 M168 158 L150 80"
        />
      </svg>
    </div>
  );
}
