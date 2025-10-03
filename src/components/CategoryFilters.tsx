import { Button } from "@/components/ui/button";

interface CategoryFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = ["All Prompts", "Men", "Women", "Couple", "Kids"];

const CategoryFilters = ({ selectedCategory, onCategoryChange }: CategoryFiltersProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8 perspective-1000">
      {categories.map((category) => (
        <Button
          key={category}
          onClick={() => onCategoryChange(category)}
          variant={selectedCategory === category ? "default" : "outline"}
          className="px-6 py-2 transition-all duration-300 ease-in-out transform translate-z-6 translate-y-0 hover:translate-z-12 hover:-translate-y-2 hover:scale-105 shadow-[0_6px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] border border-black/20"
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilters;