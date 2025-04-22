import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { MenuItemList } from '@/components/menu/MenuItemList';
import { MenuItemGrid } from '@/components/menu/MenuItemGrid';
import { MenuItemDialog } from '@/components/menu/MenuItemDialog';
import { useMenuStore } from '@/store/menuStore';
import { MenuItem } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const MenuPage = () => {
  const { items, categories, fetchMenuItems, fetchCategories, addMenuItem, addCategory, updateMenuItem, deleteMenuItem, isLoading } = useMenuStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Only fetch if we don't already have items
    if (items.length === 0) {
      fetchMenuItems();
    }

    // Only fetch if we don't already have categories or if they're sample categories
    if (categories.length === 0 ||
      (categories.length > 0 &&
        (categories[0].id.startsWith('sample-') ||
          categories[0].id.startsWith('fallback-') ||
          categories[0].id.startsWith('local-')))) {
      fetchCategories();
    }
  }, [items.length, categories, fetchMenuItems, fetchCategories]);

  const handleAddItem = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteMenuItem(id);
    }
  };

  const handleFormSubmit = async (item: Omit<MenuItem, 'id'>) => {
    // Check if the category is new and needs to be added
    const categoryExists = categories.some(cat => cat.name === item.category);
    if (!categoryExists && item.category) {
      await addCategory(item.category);
    }

    if (editingItem) {
      await updateMenuItem(editingItem.id, item);
    } else {
      await addMenuItem(item);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  // Use categories from the store

  // Filter items by category and search query
  const filteredItems = items
    .filter(item => categoryFilter === 'All' || item.category === categoryFilter)
    .filter(item =>
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Layout>
      <div className="container py-8 mx-auto">
        {/* Header with decorative background */}
        <div className="relative p-6 mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-iskcon-light to-iskcon-primary/20">
          <div className="absolute inset-0 opacity-10"></div>
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-iskcon-primary">Menu Management</h1>
              <p className="mt-1 text-gray-600">Manage your menu items with ease</p>
            </div>
            <Button
              onClick={handleAddItem}
              className="bg-iskcon-primary hover:bg-iskcon-primary/90"
            >
              Add New Item
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid gap-4 mb-6 md:grid-cols-3">
          <div className="flex items-center space-x-2">
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end mb-4 space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-iskcon-primary hover:bg-iskcon-primary/90' : ''}
          >
            Grid View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-iskcon-primary hover:bg-iskcon-primary/90' : ''}
          >
            List View
          </Button>
        </div>

        {/* Menu Items Display */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto border-4 rounded-full border-iskcon-primary border-t-transparent animate-spin"></div>
              <p className="mt-4 font-medium text-iskcon-primary">Loading menu items...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-white rounded-lg shadow">
            <p className="text-xl text-gray-500">No menu items found</p>
            <p className="mt-2 text-gray-400">
              {searchQuery ? 'Try a different search term or' : 'Start by'} adding a new menu item
            </p>
            <Button
              onClick={handleAddItem}
              className="mt-4 bg-iskcon-primary hover:bg-iskcon-primary/90"
            >
              Add New Item
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <MenuItemGrid
            items={filteredItems}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
          />
        ) : (
          <div className="bg-white rounded-lg shadow">
            <MenuItemList
              items={filteredItems}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          </div>
        )}

        {/* Menu Item Dialog */}
        <MenuItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editingItem || undefined}
          categories={categories}
          onSubmit={handleFormSubmit}
        />
      </div>
    </Layout>
  );
};
