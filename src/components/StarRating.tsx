export function StarRatingDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating) return <span className="text-sm text-muted ">Not rated</span>;
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-muted/50 ">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function StarRatingInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: number | null;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className="rounded-md border border-border bg-transparent px-2 py-1.5 text-sm "
    >
      <option value="">Not rated</option>
      {[1, 2, 3, 4, 5].map((value) => (
        <option key={value} value={value}>
          {"★".repeat(value)} ({value})
        </option>
      ))}
    </select>
  );
}
