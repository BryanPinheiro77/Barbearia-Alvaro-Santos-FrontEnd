import React from "react";

type Props = {
  className?: string;
};

export function Skeleton({ className }: Props) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-gray-200/70",
        className ?? "h-4 w-full",
      ].join(" ")}
    />
  );
}
