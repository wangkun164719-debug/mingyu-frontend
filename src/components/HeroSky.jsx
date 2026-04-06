const starPositions = [
  { top: "14%", left: "10%", delay: "0s" },
  { top: "20%", left: "28%", delay: "1.2s" },
  { top: "12%", left: "72%", delay: "0.8s" },
  { top: "34%", left: "18%", delay: "2.1s" },
  { top: "30%", left: "82%", delay: "1.7s" },
  { top: "48%", left: "24%", delay: "2.7s" },
  { top: "44%", left: "76%", delay: "0.5s" },
  { top: "56%", left: "8%", delay: "1.3s" },
  { top: "60%", left: "92%", delay: "2.4s" }
];

export default function HeroSky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden mask-fade">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%)]" />
      {starPositions.map((star) => (
        <span
          key={`${star.top}-${star.left}`}
          className="absolute h-1 w-1 rounded-full bg-gold-300/80 shadow-[0_0_20px_rgba(229,194,89,0.75)] animate-star"
          style={{ top: star.top, left: star.left, animationDelay: star.delay }}
        />
      ))}
    </div>
  );
}
