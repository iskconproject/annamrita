import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { MenuItemCard } from '../components/pos/MenuItemCard';
import { OrderSummary } from '../components/pos/OrderSummary';
import { useMenuStore } from '../store/menuStore';
import { cn } from '@/lib/utils';

export const POSPage = () => {
  const { items, categories, fetchMenuItems, isLoading } = useMenuStore();
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  useEffect(() => {
    // Only fetch if we don't already have items
    if (items.length === 0) {
      fetchMenuItems();
    }
  }, [items.length, fetchMenuItems]);

  useEffect(() => {
    // No need to set initial category as we now default to 'all'
  }, [categories]);

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Point of Sale</h1>
          <div className="mt-4 md:mt-0">
            {/* Any additional header actions can go here */}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Menu Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4">
            {/* Category Tabs */}
            <div className="mb-6 overflow-x-auto">
              <nav className="flex space-x-4 min-w-max">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    selectedCategory === 'all'
                      ? 'bg-iskcon-primary text-white'
                      : 'text-gray-600 hover:bg-iskcon-light hover:text-iskcon-primary'
                  )}
                >
                  All Menu
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      selectedCategory === category.name
                        ? 'bg-iskcon-primary text-white'
                        : 'text-gray-600 hover:bg-iskcon-light hover:text-iskcon-primary'
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Menu Items Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading menu items...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredItems.map(item => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <OrderSummary />
          </div>
        </div>
      </div>
    </Layout>
  );
};
