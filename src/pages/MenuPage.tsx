import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { MenuItemList } from '../components/menu/MenuItemList';
import { MenuItemForm } from '../components/menu/MenuItemForm';
import { useMenuStore } from '../store/menuStore';
import { MenuItem } from '../types/menu';

export const MenuPage = () => {
  const { items, fetchMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, isLoading } = useMenuStore();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | 'All'>('All');

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteMenuItem(id);
    }
  };

  const handleFormSubmit = async (item: Omit<MenuItem, 'id'>) => {
    if (editingItem) {
      await updateMenuItem(editingItem.id, item);
    } else {
      await addMenuItem(item);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category)));

  // Filter items by category
  const filteredItems = categoryFilter === 'All'
    ? items
    : items.filter(item => item.category === categoryFilter);

  return (
    <Layout>
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Menu Management</h1>
          <button
            onClick={handleAddItem}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Item
          </button>
        </div>
        
        {/* Category Filter */}
        <div className="mt-4">
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
            Filter by Category
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as string | 'All')}
            className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="All">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Form */}
        {showForm && (
          <div className="p-4 mt-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <div className="mt-4">
              <MenuItemForm
                item={editingItem || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}
        
        {/* Menu Items List */}
        <div className="mt-6 bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading menu items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No menu items found</p>
            </div>
          ) : (
            <MenuItemList
              items={filteredItems}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};
