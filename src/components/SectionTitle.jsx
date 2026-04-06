import { SparkIcon } from "./Icons";

export default function SectionTitle({ icon = true, title, subtitle, center = true }) {
  return (
    <div className={center ? "text-center" : ""}>
      {icon && (
        <div className={center ? "mb-4 flex justify-center" : "mb-4"}>
          <SparkIcon className="h-10 w-10 text-gold-400" />
        </div>
      )}
      <h2 className="font-display text-3xl font-semibold tracking-[0.08em] text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-mist-300 sm:text-base">
          {subtitle}
        </p>
      ) : null}
      <div className="gold-line mt-5" />
    </div>
  );
}
