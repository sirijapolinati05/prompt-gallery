import React from 'react';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const Header = ({ searchTerm, onSearchChange }: HeaderProps) => {
  return (
    <header className="py-12 px-6 text-center">
      <div className="relative z-10 transform perspective-1000 rotateX-2 rotateY-2 transition-transform duration-300 hover:scale-105 hover:rotateX-4 hover:rotateY-4">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl shadow-2xl p-6 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3 tracking-tight">
            ✨ PromptGallery
          </h1>
          <p className="text-primary-foreground/90 text-lg md:text-xl mx-auto mb-6">
            Discover and copy the best AI image generation prompts for creating stunning visuals.
          </p>
          <div className="relative max-w-2xl mx-auto mb-8 transform -translate-z-10 p-2 bg-gray-800/30 border border-gray-300/20 rounded-xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)]">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search prompts by keywords..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-14 py-4 text-lg rounded-xl border-2 focus:border-primary transition-all bg-white"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;