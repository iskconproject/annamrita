import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { MenuItemCard } from '../components/pos/MenuItemCard';
import { OrderSummary } from '../components/pos/OrderSummary';
import { useMenuStore } from '../store/menuStore';
import { Category } from '@/types/category';

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
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Point of Sale</h1>

        <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-3">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Category Tabs */}
            <div className="mb-4 border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`py-4 text-sm font-medium border-b-2 ${selectedCategory === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  All Menu
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`py-4 text-sm font-medium border-b-2 ${selectedCategory === category.name
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
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
          <div>
            <OrderSummary />
          </div>
        </div>
      </div>
    </Layout>
  );
};
