import {
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  FlashIcon,
  HeartIcon,
  MedalIcon,
  MoonIcon,
  PinIcon,
  ShieldIcon,
  StarIcon,
  SunIcon,
  TargetIcon,
  UserIcon
} from "./Icons";

const iconMap = {
  user: UserIcon,
  flash: FlashIcon,
  heart: HeartIcon,
  moon: MoonIcon,
  star: StarIcon,
  sun: SunIcon,
  target: TargetIcon,
  shield: ShieldIcon,
  medal: MedalIcon,
  briefcase: BriefcaseIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  pin: PinIcon
};

export default function IconBadge({ icon, className = "" }) {
  const Icon = iconMap[icon] ?? StarIcon;

  return (
    <div
      className={[
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-400/18 bg-gold-400/10 text-gold-300",
        className
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}
