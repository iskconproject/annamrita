import { MenuItem } from '../../types/menu';
import { OrderItem } from '../../types/order';
import { useOrderStore } from '../../store/orderStore';

interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const { addItemToOrder } = useOrderStore();

  const handleAddToOrder = () => {
    const orderItem: OrderItem = {
      itemId: item.id,
      name: item.name,
      shortName: item.shortName,
      quantity: 1,
      price: item.price,
    };
    
    addItemToOrder(orderItem);
  };

  return (
    <button
      onClick={handleAddToOrder}
      disabled={!item.available}
      className={`p-4 text-left rounded-lg shadow-md transition-all ${
        item.available
          ? 'bg-white hover:bg-indigo-50 hover:shadow-lg'
          : 'bg-gray-100 opacity-60 cursor-not-allowed'
      }`}
    >
      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
      <p className="mt-1 text-xl font-bold text-indigo-600">₹{item.price.toFixed(2)}</p>
      {!item.available && (
        <span className="inline-block px-2 py-1 mt-2 text-xs font-medium text-red-800 bg-red-100 rounded-full">
          Not Available
        </span>
      )}
    </button>
  );
};
