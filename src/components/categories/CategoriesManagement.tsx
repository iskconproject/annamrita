import { useState } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, AlertCircle, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CategoriesManagement = () => {
  const { categories, addCategory } = useMenuStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We don't need to fetch categories here since they're already fetched in the SettingsPage
  // and passed down through the store

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        setIsLoading(true);
        setError(null);
        await addCategory(newCategoryName.trim());
        setNewCategoryName('');
        setIsAdding(false);
      } catch (err) {
        setError('Failed to add category');
        console.error('Error adding category:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-iskcon-primary" />
          <h3 className="text-lg font-medium">Available Categories</h3>
        </div>
        {!isAdding && !isLoading && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-iskcon-primary hover:bg-iskcon-primary/90 flex items-center gap-1"
          >
            <Plus size={16} />
            Add Category
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4 border-iskcon-primary/30">
          <div className="flex gap-2 items-center">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 focus:ring-2 focus:ring-iskcon-primary focus:border-iskcon-primary"
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <Button
              onClick={handleAddCategory}
              className="bg-iskcon-primary hover:bg-iskcon-primary/90"
              disabled={!newCategoryName.trim()}
            >
              Add
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName('');
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto border-2 rounded-full border-iskcon-primary border-t-transparent animate-spin"></div>
            <p className="mt-2 text-sm text-iskcon-primary">Loading categories...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="p-4 flex justify-between items-center hover:shadow-md transition-shadow">
              <span className="font-medium">{category.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                disabled={category.id.startsWith('sample-') || category.id.startsWith('fallback-') || category.id.startsWith('local-')}
                title={category.id.startsWith('sample-') || category.id.startsWith('fallback-') || category.id.startsWith('local-') ? 'Cannot delete default categories' : 'Delete category'}
              >
                <Trash2 size={16} />
              </Button>
            </Card>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <Tag className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p className="text-lg">No categories found</p>
              <p className="text-sm mt-1">Add your first category to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
