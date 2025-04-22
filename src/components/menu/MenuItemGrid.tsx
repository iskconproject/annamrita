import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MenuItem } from "@/types/menu";
import { useMenuStore } from "@/store/menuStore";

interface MenuItemGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function MenuItemGrid({ items, onEdit, onDelete }: MenuItemGridProps) {
  const { toggleItemAvailability } = useMenuStore();

  const handleToggleAvailability = async (id: string, available: boolean) => {
    await toggleItemAvailability(id, !available);
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-iskcon-primary">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.shortName}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Available</span>
                <Switch
                  checked={item.available}
                  onCheckedChange={() => handleToggleAvailability(item.id, item.available)}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <div className="inline-block px-2 py-1 text-xs font-medium text-iskcon-primary bg-iskcon-light rounded-full">
                {item.category}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-xl font-bold text-iskcon-primary">₹{item.price.toFixed(2)}</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between p-4 pt-0 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="text-iskcon-primary border-iskcon-primary hover:bg-iskcon-light"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="text-red-500 border-red-500 hover:bg-red-50"
            >
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
