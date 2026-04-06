import IconBadge from "./IconBadge";

export default function FeatureCard({ icon, title, description, className = "" }) {
  return (
    <article
      className={[
        "panel group p-6 transition duration-300 hover:-translate-y-1 hover:border-gold-400/35 hover:shadow-glow",
        className
      ].join(" ")}
    >
      <IconBadge icon={icon} className="transition duration-300 group-hover:bg-gold-400/16" />
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-mist-300">{description}</p>
    </article>
  );
}
