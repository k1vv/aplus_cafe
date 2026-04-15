import { cn } from "@/lib/utils";

interface Props {
  selected: string;
  onSelect: (cat: string) => void;
  categories: string[];
}

export default function CategoryFilter({ selected, onSelect, categories }: Props) {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center -mx-4 px-4 sm:mx-0 sm:px-0">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "whitespace-nowrap text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all pb-1 shrink-0",
            selected === cat
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-primary"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
