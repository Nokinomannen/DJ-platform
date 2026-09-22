import { initials } from "@/lib/format";
import { mediaUrl } from "@/lib/media";

type Props = {
  name: string;
  hue: number;
  imageKey: string | null;
  className?: string;
  textClassName?: string;
};

/** Artist photo, or a generated gradient with initials when no photo is uploaded. */
export function Avatar({ name, hue, imageKey, className = "", textClassName = "text-2xl" }: Props) {
  if (imageKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served from our own media route
      <img src={mediaUrl(imageKey)} alt={name} className={`object-cover ${className}`} />
    );
  }
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center font-bold text-white/90 ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, hsl(${hue} 90% 65%), hsl(${(hue + 50) % 360} 80% 35%) 60%, hsl(${(hue + 90) % 360} 70% 15%))`,
      }}
    >
      <span className={textClassName}>{initials(name)}</span>
    </div>
  );
}
