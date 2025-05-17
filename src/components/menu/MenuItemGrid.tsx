import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MenuItem } from "@/types/menu";
import { useMenuStore } from "@/store/menuStore";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface MenuItemGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function MenuItemGrid({ items, onEdit, onDelete }: MenuItemGridProps) {
  const { toggleItemAvailability } = useMenuStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const handleToggleAvailability = async (id: string, available: boolean) => {
    await toggleItemAvailability(id, !available);
  };

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md flex flex-col h-full border border-gray-200 hover:border-iskcon-primary/30">
            <CardContent className="p-6 flex-grow">
              <div className="grid grid-cols-1 gap-3 text-left">
                {/* Header section with name and availability toggle */}
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-iskcon-primary truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.shortName}</p>
                  </div>
                  <div className="flex items-center self-end sm:self-center mt-1 sm:mt-0 px-2 py-1 rounded-md">
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => handleToggleAvailability(item.id, item.available)}
                      className="data-[state=checked]:bg-iskcon-primary"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100"></div>

                {/* Category badge and price row */}
                <div className="flex justify-between items-center">
                  <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-iskcon-primary bg-iskcon-light rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {item.category}
                  </div>
                  <p className="text-xl font-bold text-iskcon-primary">₹{item.price.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between p-4 border-t gap-3 bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="text-iskcon-primary border-iskcon-primary hover:bg-iskcon-light flex-1 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteClick(item)}
                className="text-red-500 border-red-500 hover:bg-red-50 flex-1 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name}
      />
    </>
  );
}
