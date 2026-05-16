import { initialsOf } from '@/lib/utils';

interface AvatarProps {
  name: string | null | undefined;
  color?: string;
  size?: number;
}

export function Avatar({ name, color = '#E91E8C', size = 40 }: AvatarProps) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 tracking-tight"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.4) }}
    >
      {initialsOf(name)}
    </div>
  );
}
