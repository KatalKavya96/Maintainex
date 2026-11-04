/** Decorative contribution contours, not a chart or an assertion about user activity. */
export function ContributionLandscape() {
  return <svg viewBox="0 0 680 480" fill="none" aria-hidden="true" className="h-full w-full text-moss">
    {Array.from({ length: 26 }, (_, i) => <path key={i} d={`M -40 ${145+i*11} C 100 ${230+i*10}, 165 ${-90+i*13}, 340 ${110+i*10} S 510 ${490-i*6}, 730 ${160+i*9}`} stroke="currentColor" strokeOpacity={0.12+i/55} strokeWidth={i%6===0 ? 1.7 : 0.7} />)}
    <path d="M170 360V245Q170 225 190 225H345Q365 225 365 205V110M365 225H495Q515 225 515 245V330" stroke="var(--app-text)" strokeOpacity=".45" strokeWidth="1.5" />
    {[[170,360],[365,110],[515,330],[365,225]].map(([x,y])=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="7" fill="var(--app-bg)" stroke="currentColor" strokeWidth="2" /><circle cx={x} cy={y} r="2" fill="currentColor" /></g>)}
  </svg>;
}
