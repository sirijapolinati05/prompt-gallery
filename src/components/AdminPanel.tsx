import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import CategoryFilters from "./CategoryFilters";
import PromptCard from "./PromptCard";
import PromptForm from "./PromptForm";
import Dexie from "dexie";
import { toast } from "sonner";

interface Prompt {
  id: string;
  image_url: string | null;
  prompt_text: string;
  ai_tool: string;
  category: string;
  created_at: string;
  copyCount?: number;
  isPopular?: boolean;
  order?: number;
}

interface AdminPanelProps {
  onBack: () => void;
}

// Initialize Dexie database
const db = new Dexie("PromptsDatabase");
db.version(2).stores({
  prompts: "id, prompt_text, ai_tool, category, created_at, order",
});

// Define category order for sorting
const categoryOrder: { [key: string]: number } = {
  men: 1,
  women: 2,
  couple: 3,
  kids: 4,
};

// Reusable sorting function to ensure consistent ordering
const sortPrompts = (prompts: Prompt[], respectManualOrder: boolean = false): Prompt[] => {
  // Calculate popular prompts for isPopular flag
  const sortedByCopyCount = [...prompts].sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
  const top3Threshold = sortedByCopyCount.length >= 3 ? sortedByCopyCount[2].copyCount || 0 : 0;

  // If manual order should be respected for prompts with copyCount 0, sort by category and existing order
  if (respectManualOrder) {
    return prompts.sort((a, b) => {
      const aCategoryOrder = categoryOrder[a.category.toLowerCase()] || 5;
      const bCategoryOrder = categoryOrder[b.category.toLowerCase()] || 5;

      if (aCategoryOrder !== bCategoryOrder) {
        return aCategoryOrder - bCategoryOrder;
      }

      // Within same category, sort by copyCount first
      const copyCountDiff = (b.copyCount || 0) - (a.copyCount || 0);
      if (copyCountDiff !== 0) {
        return copyCountDiff;
      }

      // For prompts with copyCount 0, respect manual order
      return (a.order || 0) - (b.order || 0);
    }).map((prompt, index) => ({
      ...prompt,
      isPopular: (prompt.copyCount || 0) >= top3Threshold && (prompt.copyCount || 0) > 0,
      order: index,
    }));
  }

  // Default sort: by category and then by copyCount
  return prompts.sort((a, b) => {
    const aCategoryOrder = categoryOrder[a.category.toLowerCase()] || 5;
    const bCategoryOrder = categoryOrder[b.category.toLowerCase()] || 5;

    if (aCategoryOrder !== bCategoryOrder) {
      return aCategoryOrder - bCategoryOrder;
    }

    // Within same category, sort by copyCount
    return (b.copyCount || 0) - (a.copyCount || 0);
  }).map((prompt, index) => ({
    ...prompt,
    isPopular: (prompt.copyCount || 0) >= top3Threshold && (prompt.copyCount || 0) > 0,
    order: index,
  }));
};

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All Prompts");
  const [showAddForm, setShowAddForm] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isManuallyReordered, setIsManuallyReordered] = useState(
    localStorage.getItem("isManuallyReordered") === "true"
  );
  
  // Click tracking for smart scroll feature
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickPositionRef = useRef({ x: 0, y: 0 });
  const headerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchPrompts = async (forceRefresh = false) => {
    try {
      let data = await db.prompts.toArray();

      // Add copy count from localStorage
      let promptsWithCounts = data.map((prompt) => {
        const storageKey = `copyCount_${prompt.prompt_text.replace(/\s+/g, "_")}`;
        const copyCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
        return {
          ...prompt,
          copyCount,
          category: prompt.category.toLowerCase(),
          order: prompt.order ?? 0,
        };
      });

      // Check manual reorder status
      const currentlyManuallyReordered = localStorage.getItem("isManuallyReordered") === "true";

      let sortedPrompts;
      if (currentlyManuallyReordered && !forceRefresh) {
        sortedPrompts = sortPrompts(promptsWithCounts, true);
      } else {
        sortedPrompts = sortPrompts(promptsWithCounts, false);
        await db.prompts.bulkPut(sortedPrompts);
      }

      setPrompts(sortedPrompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast.error("Failed to load prompts");
      try {
        await db.delete();
        await db.open();
        setPrompts([]);
      } catch (resetError) {
        console.error("Error resetting database:", resetError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      const storageKey = `copyCount_${promptText.replace(/\s+/g, "_")}`;
      const currentCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
      localStorage.setItem(storageKey, (currentCount + 1).toString());
      toast.success("Prompt copied to clipboard");
      
      // Re-fetch to update copyCount and popular status
      await fetchPrompts(true); // Force refresh to re-sort by copyCount
    } catch (error) {
      console.error("Error copying prompt:", error);
      toast.error("Failed to copy prompt");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const prompt = await db.prompts.get(id);
      if (prompt) {
        const storageKey = `copyCount_${prompt.prompt_text.replace(/\s+/g, "_")}`;
        localStorage.removeItem(storageKey);
      }
      await db.prompts.delete(id);
      
      // After delete, re-index remaining prompts
      const remainingPrompts = await db.prompts.toArray();
      const currentlyManuallyReordered = localStorage.getItem("isManuallyReordered") === "true";
      const reindexedPrompts = sortPrompts(remainingPrompts, currentlyManuallyReordered);
      await db.prompts.bulkPut(reindexedPrompts);
      await fetchPrompts();
      toast.success("Prompt deleted successfully");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowAddForm(true);
  };

  const handleAddOrUpdatePrompt = async (promptData: {
    image_url: string | null;
    prompt_text: string;
    ai_tool: string;
    category: string;
  }) => {
    try {
      const prompt: Prompt = {
        id: editingPrompt ? editingPrompt.id : crypto.randomUUID(),
        created_at: editingPrompt
          ? editingPrompt.created_at
          : new Date().toISOString(),
        order: editingPrompt ? editingPrompt.order : prompts.length,
        ...promptData,
        category: promptData.category.toLowerCase(),
      };
      await db.prompts.put(prompt);
      await fetchPrompts(false); // Do not force refresh to preserve order
      toast.success(
        editingPrompt ? "Prompt updated successfully" : "Prompt added successfully"
      );
      setShowAddForm(false);
      setEditingPrompt(null);
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error(editingPrompt ? "Failed to update prompt" : "Failed to add prompt");
    }
  };

  const movePrompt = async (promptId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt || (prompt.copyCount || 0) > 0) return; // Prevent reordering if copyCount > 0

    // Get all prompts in the selected category view
    const viewPrompts = selectedCategory === "All Prompts" 
      ? prompts 
      : prompts.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    
    const currentIndex = viewPrompts.findIndex(p => p.id === promptId);
    if (currentIndex === -1) return;

    const cols = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 2 : 1;
    let targetIndex = currentIndex;

    switch (direction) {
      case 'left':
        targetIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        break;
      case 'right':
        targetIndex = currentIndex < viewPrompts.length - 1 ? currentIndex + 1 : currentIndex;
        break;
      case 'up':
        targetIndex = currentIndex - cols >= 0 ? currentIndex - cols : currentIndex;
        break;
      case 'down':
        targetIndex = currentIndex + cols < viewPrompts.length ? currentIndex + cols : currentIndex;
        break;
    }

    if (targetIndex === currentIndex) return;

    // Ensure target prompt has copyCount 0
    const targetPrompt = viewPrompts[targetIndex];
    if ((targetPrompt.copyCount || 0) > 0) return;

    // Reorder within the view
    const reorderedViewPrompts = Array.from(viewPrompts);
    const [movedPrompt] = reorderedViewPrompts.splice(currentIndex, 1);
    reorderedViewPrompts.splice(targetIndex, 0, movedPrompt);

    // Update order values
    const updatedViewPrompts = reorderedViewPrompts.map((p, index) => ({
      ...p,
      order: index,
    }));

    let updatedPrompts;
    if (selectedCategory === "All Prompts") {
      // If in "All Prompts" view, update entire list
      updatedPrompts = updatedViewPrompts;
    } else {
      // If in specific category, merge with other categories
      const otherPrompts = prompts.filter(p => p.category.toLowerCase() !== selectedCategory.toLowerCase());
      updatedPrompts = [...otherPrompts, ...updatedViewPrompts].sort((a, b) => {
        const aCategoryOrder = categoryOrder[a.category.toLowerCase()] || 5;
        const bCategoryOrder = categoryOrder[b.category.toLowerCase()] || 5;
        
        if (aCategoryOrder !== bCategoryOrder) {
          return aCategoryOrder - bCategoryOrder;
        }
        
        const copyCountDiff = (b.copyCount || 0) - (a.copyCount || 0);
        if (copyCountDiff !== 0) {
          return copyCountDiff;
        }
        return (a.order || 0) - (b.order || 0);
      });
    }

    // Update state immediately
    setPrompts(updatedPrompts);
    setIsManuallyReordered(true);
    localStorage.setItem("isManuallyReordered", "true");

    // Persist to database
    try {
      await db.prompts.bulkPut(updatedPrompts);
      toast.success("Position updated");
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Failed to update position");
      await fetchPrompts();
    }
  };

  const handleDragStart = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt && (prompt.copyCount || 0) === 0) {
      setDraggedItemId(promptId);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetPromptId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetPromptId) return;

    const draggedPrompt = prompts.find(p => p.id === draggedItemId);
    const targetPrompt = prompts.find(p => p.id === targetPromptId);
    if (!draggedPrompt || !targetPrompt || (targetPrompt.copyCount || 0) > 0) return;

    // Check if we're in category-specific view
    if (selectedCategory !== "All Prompts") {
      // Only allow drag within the same category
      if (draggedPrompt.category.toLowerCase() !== targetPrompt.category.toLowerCase()) return;
    }

    // Get prompts in current view
    const viewPrompts = selectedCategory === "All Prompts"
      ? prompts
      : prompts.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

    const draggedIndex = viewPrompts.findIndex(p => p.id === draggedItemId);
    const targetIndex = viewPrompts.findIndex(p => p.id === targetPromptId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const reorderedViewPrompts = Array.from(viewPrompts);
    const [movedPrompt] = reorderedViewPrompts.splice(draggedIndex, 1);
    reorderedViewPrompts.splice(targetIndex, 0, movedPrompt);

    const updatedViewPrompts = reorderedViewPrompts.map((p, index) => ({
      ...p,
      order: index,
    }));

    let updatedPrompts;
    if (selectedCategory === "All Prompts") {
      updatedPrompts = updatedViewPrompts;
    } else {
      const otherPrompts = prompts.filter(p => p.category.toLowerCase() !== selectedCategory.toLowerCase());
      updatedPrompts = [...otherPrompts, ...updatedViewPrompts].sort((a, b) => {
        const aCategoryOrder = categoryOrder[a.category.toLowerCase()] || 5;
        const bCategoryOrder = categoryOrder[b.category.toLowerCase()] || 5;
        
        if (aCategoryOrder !== bCategoryOrder) {
          return aCategoryOrder - bCategoryOrder;
        }
        
        const copyCountDiff = (b.copyCount || 0) - (a.copyCount || 0);
        if (copyCountDiff !== 0) {
          return copyCountDiff;
        }
        return (a.order || 0) - (b.order || 0);
      });
    }

    setPrompts(updatedPrompts);
  };

  const handleDragEnd = async () => {
    if (!draggedItemId) return;

    setIsManuallyReordered(true);
    localStorage.setItem("isManuallyReordered", "true");

    try {
      await db.prompts.bulkPut(prompts);
      toast.success("Order updated successfully");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
      await fetchPrompts();
    }
    setDraggedItemId(null);
  };

  // Handle background clicks for smart scroll feature
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only count clicks on the background itself, not on child elements
    if (e.target === e.currentTarget) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      // Check if click is within 50px radius of last click (same spot)
      const distance = Math.sqrt(
        Math.pow(currentX - lastClickPositionRef.current.x, 2) + 
        Math.pow(currentY - lastClickPositionRef.current.y, 2)
      );
      
      const isSameSpot = clickCountRef.current === 0 || distance < 50;
      
      if (isSameSpot) {
        clickCountRef.current += 1;
        lastClickPositionRef.current = { x: currentX, y: currentY };
        
        // Visual feedback - dot with ripple effect only
        const ripple = document.createElement("div");
        ripple.className = "fixed pointer-events-none z-50";
        ripple.style.left = `${currentX}px`;
        ripple.style.top = `${currentY}px`;
        ripple.style.transform = "translate(-50%, -50%)";
        ripple.innerHTML = `
          <div class="relative">
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
            <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        `;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        console.log(`Click count: ${clickCountRef.current}/4 in ${selectedCategory} section`);

        // Reset timer
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }

        // If 4 clicks reached, scroll based on which direction has more distance
        if (clickCountRef.current >= 4) {
          const windowHeight = window.innerHeight;
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const documentHeight = document.documentElement.scrollHeight;
          
          // Calculate distances
          const distanceToTop = scrollTop;
          const distanceToBottom = documentHeight - (scrollTop + windowHeight);
          
          console.log(`Distances - Top: ${distanceToTop}px, Bottom: ${distanceToBottom}px`);
          
          if (distanceToTop > distanceToBottom) {
            // More distance to scroll up - go to header
            console.log(`More distance to top (${distanceToTop}px) - Scrolling to header...`);
            headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            toast.success("Scrolling to top!");
          } else {
            // More distance to scroll down - go to bottom
            console.log(`More distance to bottom (${distanceToBottom}px) - Scrolling to bottom...`);
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            toast.success("Scrolling to bottom!");
          }
          
          clickCountRef.current = 0;
          lastClickPositionRef.current = { x: 0, y: 0 };
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
          }
        } else {
          // Reset count after 2 seconds if not completed
          clickTimerRef.current = setTimeout(() => {
            console.log("Click timer reset");
            clickCountRef.current = 0;
            lastClickPositionRef.current = { x: 0, y: 0 };
          }, 2000);
        }
      } else {
        // Different spot - reset count
        console.log("Click in different spot - resetting count");
        clickCountRef.current = 1;
        lastClickPositionRef.current = { x: currentX, y: currentY };
        
        // Show reset feedback - dot only
        const resetRipple = document.createElement("div");
        resetRipple.className = "fixed pointer-events-none z-50";
        resetRipple.style.left = `${currentX}px`;
        resetRipple.style.top = `${currentY}px`;
        resetRipple.style.transform = "translate(-50%, -50%)";
        resetRipple.innerHTML = `
          <div class="relative">
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
            <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        `;
        document.body.appendChild(resetRipple);
        setTimeout(() => resetRipple.remove(), 600);
        
        // Set new timer
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }
        clickTimerRef.current = setTimeout(() => {
          clickCountRef.current = 0;
          lastClickPositionRef.current = { x: 0, y: 0 };
        }, 2000);
      }
    }
  };

  useEffect(() => {
    fetchPrompts();
    
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const filteredPrompts = prompts.filter((prompt) => {
    if (selectedCategory === "All Prompts") return true;
    return prompt.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div 
      className="min-h-screen bg-background py-8 px-4 cursor-pointer" 
      onClick={handleBackgroundClick}
    >
      <style>
        {`
          @keyframes floatButton {
            0% { transform: perspective(500px) translateZ(8px) translateY(-2px); }
            50% { transform: perspective(500px) translateZ(12px) translateY(-4px); }
            100% { transform: perspective(500px) translateZ(8px) translateY(-2px); }
          }
          .button-3d {
            transform: perspective(500px) translateZ(8px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            animation: floatButton 2s ease-in-out infinite;
            transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out;
          }
          .button-3d:hover {
            background-color: black;
            transform: perspective(500px) translateZ(12px) scale(1.07);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
          }
          @keyframes floatBackButton {
            0% { transform: perspective(500px) translateZ(8px) translateY(-2px); }
            50% { transform: perspective(500px) translateZ(12px) translateY(-4px); }
            100% { transform: perspective(500px) translateZ(8px) translateY(-2px); }
          }
          .button-back-3d {
            background-color: #20B2AA;
            border-radius: 9999px;
            transform: perspective(500px) translateZ(8px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            animation: floatBackButton 2s ease-in-out infinite;
            transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out;
          }
          .button-back-3d:hover {
            background-color: #4682B4;
            transform: perspective(500px) translateZ(12px) scale(1.07);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto pointer-events-none">
        <div className="pointer-events-auto" ref={headerRef}>
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" onClick={onBack} className="button-back-3d">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <div />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
            <CategoryFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            {!showAddForm && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditingPrompt(null);
                    setShowAddForm(true);
                  }}
                  size="sm"
                  className="px-3 py-1 button-3d"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Prompt
                </Button>
              </div>
            )}
          </div>

          {showAddForm && (
            <PromptForm
              onClose={() => {
                setShowAddForm(false);
                setEditingPrompt(null);
              }}
              onSubmit={handleAddOrUpdatePrompt}
              initialPrompt={editingPrompt}
            />
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading prompts...</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No prompts found. Add your first prompt!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPrompts.map((prompt) => {
                const viewPrompts = selectedCategory === "All Prompts" 
                  ? prompts 
                  : prompts.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
                const indexInView = viewPrompts.findIndex(p => p.id === prompt.id);
                const cols = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 2 : 1;
                const canMove = (prompt.copyCount || 0) === 0;
                
                return (
                  <div
                    key={prompt.id}
                    draggable={canMove}
                    onDragStart={() => handleDragStart(prompt.id)}
                    onDragOver={(e) => handleDragOver(e, prompt.id)}
                    onDragEnd={handleDragEnd}
                    className={`relative group ${draggedItemId === prompt.id ? 'opacity-50' : 'opacity-100'} ${canMove ? 'cursor-move' : 'cursor-default'}`}
                  >
                    {canMove && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/90 p-1 rounded-lg shadow-lg pointer-events-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePrompt(prompt.id, 'up');
                          }}
                          className="h-6 w-6 p-0"
                          disabled={indexInView < cols}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePrompt(prompt.id, 'left');
                          }}
                          className="h-6 w-6 p-0"
                          disabled={indexInView === 0}
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePrompt(prompt.id, 'right');
                          }}
                          className="h-6 w-6 p-0"
                          disabled={indexInView === viewPrompts.length - 1}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePrompt(prompt.id, 'down');
                          }}
                          className="h-6 w-6 p-0"
                          disabled={indexInView + cols >= viewPrompts.length}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <PromptCard
                      imageUrl={prompt.image_url || undefined}
                      promptText={prompt.prompt_text}
                      aiTool={prompt.ai_tool}
                      category={prompt.category}
                      isAdmin={true}
                      onEdit={() => handleEdit(prompt)}
                      onDelete={() => handleDelete(prompt.id)}
                      onCopy={() => handleCopy(prompt.prompt_text)}
                      isPopular={prompt.isPopular}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div ref={bottomRef} className="h-1"></div>
      </div>
    </div>
  );
};

export default AdminPanel;
export { sortPrompts };