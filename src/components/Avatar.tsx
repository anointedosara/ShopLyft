type AvatarProps = {
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
};

function initialsOf(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// Reusable avatar: shows the user's photo when set, otherwise their initials.
// Uses a plain <img> for the photo because avatar URLs can come from any host;
// this avoids next/image remotePatterns until uploads move to Cloudinary (Phase 8).
export default function Avatar({ name, image, size = 56, className = "" }: AvatarProps) {
  const dim = { width: size, height: size };

  if (image) {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-cloud ring-1 ring-line ${className}`}
        style={dim}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name ?? "Avatar"} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-brand text-white font-display font-semibold ${className}`}
      style={{ ...dim, fontSize: Math.round(size * 0.38) }}
    >
      {initialsOf(name)}
    </span>
  );
}
