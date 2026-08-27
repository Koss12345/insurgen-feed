'use strict';

// Subtle repeating icon watermark on the background, echoing the
// reference screenshot's tiled-logo card look.
function buildPattern(iconColor) {
  return `<defs>
    <pattern id="bgIcon" width="110" height="110" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
      <g fill="none" stroke="${iconColor}" stroke-width="4" opacity="0.5">
        <circle cx="30" cy="30" r="16"/>
        <path d="M 22,24 L 38,24 L 41,34 L 30,42 L 19,34 Z" />
      </g>
    </pattern>
  </defs>
  <rect width="500" height="500" fill="url(#bgIcon)"/>`;
}

module.exports = { buildPattern };
