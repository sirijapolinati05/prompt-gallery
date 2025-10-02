import { Button } from "@/components/ui/button";

interface CategoryFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = ["All Prompts", "Men", "Women", "Couple", "Kids"];

const CategoryFilters = ({ selectedCategory, onCategoryChange }: CategoryFiltersProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {categories.map((category) => (
        <Button
          key={category}
          onClick={() => onCategoryChange(category)}
          variant={selectedCategory === category ? "default" : "outline"}
          className="px-6 py-2 transition-all duration-300 hover:scale-105"
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilters;
