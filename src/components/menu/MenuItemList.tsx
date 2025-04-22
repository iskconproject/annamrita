import { MenuItem } from '@/types/menu';
import { useMenuStore } from '@/store/menuStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface MenuItemListProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export const MenuItemList = ({ items, onEdit, onDelete }: MenuItemListProps) => {
  const { toggleItemAvailability } = useMenuStore();

  const handleToggleAvailability = async (id: string, available: boolean) => {
    await toggleItemAvailability(id, !available);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="p-4 text-left text-xs font-medium text-iskcon-primary uppercase tracking-wider">
              Name
            </th>
            <th className="p-4 text-left text-xs font-medium text-iskcon-primary uppercase tracking-wider">
              Short Name
            </th>
            <th className="p-4 text-left text-xs font-medium text-iskcon-primary uppercase tracking-wider">
              Category
            </th>
            <th className="p-4 text-left text-xs font-medium text-iskcon-primary uppercase tracking-wider">
              Price
            </th>
            <th className="p-4 text-left text-xs font-medium text-iskcon-primary uppercase tracking-wider">
              Available
            </th>
            <th className="p-4 text-left text-xs font-medium text-iskcon-primary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
            >
              <td className="p-4">
                <div className="font-medium text-iskcon-primary">{item.name}</div>
              </td>
              <td className="p-4">
                <div className="text-gray-600">{item.shortName}</div>
              </td>
              <td className="p-4">
                <div className="inline-block px-2 py-1 text-xs font-medium text-iskcon-primary bg-iskcon-light rounded-full">
                  {item.category}
                </div>
              </td>
              <td className="p-4">
                <div className="font-semibold">₹{item.price.toFixed(2)}</div>
              </td>
              <td className="p-4">
                <Switch
                  checked={item.available}
                  onCheckedChange={() => handleToggleAvailability(item.id, item.available)}
                />
              </td>
              <td className="p-4">
                <div className="flex space-x-2">
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
