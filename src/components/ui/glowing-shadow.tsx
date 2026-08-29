'use client'

import type { ReactNode } from 'react'

const CSS = `
  @property --hue {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
  @property --rotate {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
  @property --bg-y { syntax: "<number>"; inherits: true; initial-value: 0; }
  @property --bg-x { syntax: "<number>"; inherits: true; initial-value: 0; }
  @property --glow-translate-y { syntax: "<number>"; inherits: true; initial-value: 0; }
  @property --bg-size { syntax: "<number>"; inherits: true; initial-value: 0; }
  @property --glow-opacity { syntax: "<number>"; inherits: true; initial-value: 0; }
  @property --glow-blur { syntax: "<number>"; inherits: true; initial-value: 0; }
  @property --glow-scale { syntax: "<number>"; inherits: true; initial-value: 2; }
  @property --glow-radius { syntax: "<number>"; inherits: true; initial-value: 2; }
  @property --white-shadow { syntax: "<number>"; inherits: true; initial-value: 0; }

  .gs-container {
    --card-color: #F7F7F5;
    --card-radius: 2rem;
    --border-width: 2px;
    --bg-size: 1;
    --hue: 0;
    --hue-speed: 1;
    --rotate: 0;
    --animation-speed: 4s;
    --interaction-speed: 0.55s;
    --glow-scale: 0.9;
    --scale-factor: 1;
    --glow-blur: 2;
    --glow-opacity: 0.45;
    --glow-radius: 100;
    --glow-rotate-unit: 1deg;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    border-radius: var(--card-radius);
    cursor: pointer;
  }

  .gs-content {
    position: relative;
    background: var(--card-color);
    border-radius: calc(var(--card-radius) * 0.9);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 1.1rem;
    z-index: 1;
  }

  .gs-content:before {
    content: "";
    display: block;
    position: absolute;
    inset: calc(-1 * var(--border-width));
    border-radius: calc(var(--card-radius) * 0.9);
    z-index: -1;
    background: hsl(0deg 0% 16%) radial-gradient(
      30% 30% at calc(var(--bg-x) * 1%) calc(var(--bg-y) * 1%),
      hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 90%) calc(0% * var(--bg-size)),
      hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 80%) calc(20% * var(--bg-size)),
      hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%) calc(40% * var(--bg-size)),
      transparent 100%
    );
    animation: gs-hue var(--animation-speed) linear infinite,
               gs-rotate-bg var(--animation-speed) linear infinite;
    transition: --bg-size var(--interaction-speed) ease;
  }

  .gs-glow {
    --glow-translate-y: 0;
    display: block;
    position: absolute;
    width: 30%;
    height: 70%;
    animation: gs-rotate var(--animation-speed) linear infinite;
    transform: rotateZ(calc(var(--rotate) * var(--glow-rotate-unit)));
    transform-origin: center;
    border-radius: calc(var(--glow-radius) * 10vw);
    pointer-events: none;
  }

  .gs-glow:after {
    content: "";
    display: block;
    z-index: -2;
    filter: blur(calc(var(--glow-blur) * 8px));
    width: 130%;
    height: 130%;
    left: -15%;
    top: -15%;
    background: hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 100% 60%);
    position: relative;
    border-radius: calc(var(--glow-radius) * 10vw);
    animation: gs-hue var(--animation-speed) linear infinite;
    transform: scaleY(calc(var(--glow-scale) * var(--scale-factor) / 1.1))
               scaleX(calc(var(--glow-scale) * var(--scale-factor) * 1.2))
               translateY(calc(var(--glow-translate-y) * 1%));
    opacity: var(--glow-opacity);
  }

  .gs-container:hover .gs-content {
  }

  .gs-container:hover .gs-content:before {
    --bg-size: 15;
    animation-play-state: paused;
    transition: --bg-size var(--interaction-speed) ease;
  }

  .gs-container:hover .gs-glow {
    --glow-blur: 1.5;
    --glow-opacity: 0.35;
    --glow-scale: 1.2;
    --glow-radius: 0;
    --rotate: 900;
    --glow-rotate-unit: 0;
    --scale-factor: 1.25;
    animation-play-state: paused;
  }

  .gs-container:hover .gs-glow:after {
    --glow-translate-y: 0;
    animation-play-state: paused;
    transition: --glow-translate-y 0s ease, --glow-blur 0.05s ease,
                --glow-opacity 0.05s ease, --glow-scale 0.05s ease,
                --glow-radius 0.05s ease;
  }

  @keyframes gs-shadow-pulse {
    0%, 24%, 46%, 73%, 96% { --white-shadow: 0.5; }
    12%, 28%, 41%, 63%, 75%, 82%, 98% { --white-shadow: 2.5; }
    6%, 32%, 57% { --white-shadow: 1.3; }
    18%, 52%, 88% { --white-shadow: 3.5; }
  }

  @keyframes gs-rotate-bg {
    0%   { --bg-x: 0;   --bg-y: 0; }
    25%  { --bg-x: 100; --bg-y: 0; }
    50%  { --bg-x: 100; --bg-y: 100; }
    75%  { --bg-x: 0;   --bg-y: 100; }
    100% { --bg-x: 0;   --bg-y: 0; }
  }

  @keyframes gs-rotate {
    from { --rotate: -70;  --glow-translate-y: -65; }
    to   { --rotate: 290;  --glow-translate-y: -65; }
  }

  @keyframes gs-hue {
    0%   { --hue: 0; }
    100% { --hue: 360; }
  }
`

interface GlowingShadowProps {
  children: ReactNode
}

export function GlowingShadow({ children }: GlowingShadowProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gs-container">
        <span className="gs-glow" />
        <div className="gs-content">{children}</div>
      </div>
    </>
  )
}
