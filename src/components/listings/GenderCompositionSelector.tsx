import { Users, Minus, Plus } from "lucide-react";

interface GenderCompositionProps {
  composition: string;
  maleCount: number;
  femaleCount: number;
  onCompositionChange: (composition: string) => void;
  onMaleCountChange: (count: number) => void;
  onFemaleCountChange: (count: number) => void;
}

const compositionOptions = [
  { id: "female_only", label: "Kun kvinder", description: "Kun kvindelige beboere" },
  { id: "male_only", label: "Kun mænd", description: "Kun mandlige beboere" },
  { id: "mixed", label: "Blandet", description: "Både mænd og kvinder" },
];

const GenderCompositionSelector = ({
  composition,
  maleCount,
  femaleCount,
  onCompositionChange,
  onMaleCountChange,
  onFemaleCountChange,
}: GenderCompositionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-muted-foreground" />
        <label className="text-sm font-medium text-primary">
          Beboersammensætning *
        </label>
      </div>

      {/* Composition Type Selection */}
      <div className="grid grid-cols-3 gap-3">
        {compositionOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onCompositionChange(option.id)}
            className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
              composition === option.id
                ? "border-secondary bg-secondary text-secondary-foreground shadow-md"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            <span>{option.label}</span>
            <span className="text-xs opacity-70 font-normal">{option.description}</span>
          </button>
        ))}
      </div>

      {/* Count Controls */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Female Count - Show for female_only and mixed */}
        {(composition === "female_only" || composition === "mixed") && (
          <div className="bg-muted/50 rounded-xl p-4">
            <span className="text-sm text-muted-foreground block mb-3 text-center">
              Antal kvinder
            </span>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onFemaleCountChange(Math.max(0, femaleCount - 1))}
                className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-semibold text-primary w-8 text-center">
                {femaleCount}
              </span>
              <button
                type="button"
                onClick={() => onFemaleCountChange(femaleCount + 1)}
                className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Male Count - Show for male_only and mixed */}
        {(composition === "male_only" || composition === "mixed") && (
          <div className="bg-muted/50 rounded-xl p-4">
            <span className="text-sm text-muted-foreground block mb-3 text-center">
              Antal mænd
            </span>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onMaleCountChange(Math.max(0, maleCount - 1))}
                className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-semibold text-primary w-8 text-center">
                {maleCount}
              </span>
              <button
                type="button"
                onClick={() => onMaleCountChange(maleCount + 1)}
                className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {(femaleCount > 0 || maleCount > 0) && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          {composition === "female_only" && `${femaleCount} kvinde${femaleCount !== 1 ? "r" : ""} bor i boligen`}
          {composition === "male_only" && `${maleCount} mand bor i boligen`}
          {composition === "mixed" && `${femaleCount} kvinde${femaleCount !== 1 ? "r" : ""} og ${maleCount} mand bor i boligen`}
        </div>
      )}
    </div>
  );
};

export default GenderCompositionSelector;
