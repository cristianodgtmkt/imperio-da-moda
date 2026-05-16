interface ProductImageProps {
  size?: number;
  label?: string;
}

export function ProductImage({ size = 56, label }: ProductImageProps) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[10px]"
      style={{
        width: size,
        height: size,
        background: 'repeating-linear-gradient(45deg, #EEE, #EEE 4px, #F5F5F5 4px, #F5F5F5 8px)',
      }}
    >
      <div className="absolute inset-1 flex items-center justify-center rounded-md bg-surface text-center font-mono text-[9px] text-textc-subtle">
        {label || 'foto'}
      </div>
    </div>
  );
}
