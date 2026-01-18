type Props = {
  className?: string;
};

export function Skeleton({ className }: Props) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-white/10",
        className ?? "h-4 w-full",
      ].join(" ")}
    />
  );
}
