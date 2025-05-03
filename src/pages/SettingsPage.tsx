import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReceiptConfigStore } from '@/store/receiptConfigStore';
import { useMenuStore } from '@/store/menuStore';
import { useAuthStore } from '@/store/authStore';
import { ReceiptConfigForm } from '@/components/receipts/ReceiptConfigForm';
import { ReceiptPreview } from '@/components/receipts/ReceiptPreview';
import { MenuItemDialog } from '@/components/menu/MenuItemDialog';
import { MenuItemGrid } from '@/components/menu/MenuItemGrid';
import { AlertCircle } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { CategoriesManagement } from '@/components/categories/CategoriesManagement';

export const SettingsPage = () => {
  // Receipt config state
  const { config, isLoading: receiptLoading, fetchConfig, updateConfig } = useReceiptConfigStore();
  const [previewConfig, setPreviewConfig] = useState(config || {
    headerText: 'ISKCON Asansol Rath Yatra',
    footerText: 'Thank you for your support!',
    showQRCode: false,
  });

  // Menu state
  const { items, categories, fetchMenuItems, fetchCategories, addMenuItem, updateMenuItem, deleteMenuItem, isLoading: menuLoading } = useMenuStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Users state
  const { users, fetchUsers } = useAuthStore();

  // Active section state
  const [activeSection, setActiveSection] = useState<'receipt' | 'menu' | 'users' | 'categories'>('receipt');

  // Loading state for the entire settings page
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Fetch data when component mounts - but only once
  useEffect(() => {
    // Use a ref to track if we've already loaded data
    const hasLoadedRef = { current: false };

    const loadData = async () => {
      // Prevent duplicate loading
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        setNetworkError(false);
        setDebugInfo([]);

        // Load each resource individually to better diagnose issues
        try {
          // Only fetch receipt config if not already loaded
          if (!config || !config.id) {
            setDebugInfo(prev => [...prev, 'Fetching receipt config...']);
            await fetchConfig();
            setDebugInfo(prev => [...prev, 'Receipt config fetched successfully']);
          } else {
            setDebugInfo(prev => [...prev, 'Receipt config already loaded']);
          }
        } catch (configError) {
          setDebugInfo(prev => [...prev, `Error fetching receipt config: ${configError}`]);
          console.error('Error fetching receipt config:', configError);
        }

        try {
          // Only fetch menu items if not already loaded
          if (items.length === 0) {
            setDebugInfo(prev => [...prev, 'Fetching menu items...']);
            await fetchMenuItems();
            setDebugInfo(prev => [...prev, 'Menu items fetched successfully']);
          } else {
            setDebugInfo(prev => [...prev, 'Menu items already loaded']);
          }
        } catch (menuError) {
          setDebugInfo(prev => [...prev, `Error fetching menu items: ${menuError}`]);
          console.error('Error fetching menu items:', menuError);
        }

        try {
          // Only fetch categories if not already loaded or if they're sample categories
          const needToFetchCategories = categories.length === 0 ||
            categories[0].id.startsWith('sample-') ||
            categories[0].id.startsWith('fallback-') ||
            categories[0].id.startsWith('local-');

          if (needToFetchCategories) {
            setDebugInfo(prev => [...prev, 'Fetching categories...']);
            await fetchCategories();
            setDebugInfo(prev => [...prev, 'Categories fetched successfully']);
          } else {
            setDebugInfo(prev => [...prev, 'Categories already loaded']);
          }
        } catch (categoriesError) {
          setDebugInfo(prev => [...prev, `Error fetching categories: ${categoriesError}`]);
          console.error('Error fetching categories:', categoriesError);
        }

        try {
          // Only fetch users if not already loaded
          if (users.length === 0) {
            setDebugInfo(prev => [...prev, 'Fetching users...']);
            await fetchUsers();
            setDebugInfo(prev => [...prev, 'Users fetched successfully']);
          } else {
            setDebugInfo(prev => [...prev, 'Users already loaded']);
          }
        } catch (usersError) {
          setDebugInfo(prev => [...prev, `Error fetching users: ${usersError}`]);
          console.error('Error fetching users:', usersError);
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
        setDebugInfo(prev => [...prev, `General error: ${error}`]);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          setNetworkError(true);
        }
      } finally {
        setIsPageLoading(false);
      }
    };

    loadData();

    // Empty dependency array ensures this only runs once when the component mounts
  }, []);

  // Update preview config when store config changes
  useEffect(() => {
    if (config) {
      setPreviewConfig(config);
    }
  }, [config]);

  return (
    <Layout>
      <div className="container py-6 mx-auto">
        {isPageLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto border-4 rounded-full border-iskcon-primary border-t-transparent animate-spin"></div>
              <p className="mt-4 font-medium text-iskcon-primary">Loading settings...</p>
              <div className="mt-4 text-xs text-gray-500 text-left max-w-md">
                <p>Debug info:</p>
                <ul className="list-disc pl-5">
                  {debugInfo.map((info, index) => (
                    <li key={index}>{info}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : networkError ? (
          <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-white rounded-lg shadow">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-500 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-6">
              Unable to connect to the server. Please check your internet connection and try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-iskcon-primary hover:bg-iskcon-primary/90"
            >
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-iskcon-primary">Settings</h1>
              <p className="text-muted-foreground">
                Configure various aspects of the Annamrita POS system
              </p>
            </div>

            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeSection === 'receipt' ? 'default' : 'outline'}
                onClick={() => setActiveSection('receipt')}
                className={activeSection === 'receipt' ? 'bg-iskcon-primary hover:bg-iskcon-primary/90' : ''}
              >
                Receipt
              </Button>
              <Button
                variant={activeSection === 'menu' ? 'default' : 'outline'}
                onClick={() => setActiveSection('menu')}
                className={activeSection === 'menu' ? 'bg-iskcon-primary hover:bg-iskcon-primary/90' : ''}
              >
                Menu
              </Button>
              <Button
                variant={activeSection === 'users' ? 'default' : 'outline'}
                onClick={() => setActiveSection('users')}
                className={activeSection === 'users' ? 'bg-iskcon-primary hover:bg-iskcon-primary/90' : ''}
              >
                Users
              </Button>
              <Button
                variant={activeSection === 'categories' ? 'default' : 'outline'}
                onClick={() => setActiveSection('categories')}
                className={activeSection === 'categories' ? 'bg-iskcon-primary hover:bg-iskcon-primary/90' : ''}
              >
                Categories
              </Button>
            </div>

            <div className="mt-6">
              {activeSection === 'receipt' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Receipt Configuration</CardTitle>
                    <CardDescription>
                      Customize how receipts appear when printed for customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
                        <ReceiptConfigForm
                          config={config}
                          onSubmit={updateConfig}
                          isLoading={receiptLoading}
                          onFormChange={(formData) => setPreviewConfig(formData)}
                        />
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold mb-4">Preview</h2>
                        {previewConfig && <ReceiptPreview config={previewConfig} />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'menu' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Menu Management</CardTitle>
                    <CardDescription>
                      Manage menu items, prices, and availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-2 border rounded-md"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setEditingItem(null);
                            setDialogOpen(true);
                          }}
                          className="px-4 py-2 bg-iskcon-primary text-white rounded-md hover:bg-iskcon-primary/90"
                        >
                          Add New Item
                        </button>
                      </div>

                      {menuLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto border-4 rounded-full border-iskcon-primary border-t-transparent animate-spin"></div>
                            <p className="mt-4 font-medium text-iskcon-primary">Loading menu items...</p>
                          </div>
                        </div>
                      ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-white rounded-lg shadow">
                          <p className="text-xl text-gray-500">No menu items found</p>
                          <p className="mt-2 text-gray-400">
                            Start by adding a new menu item
                          </p>
                          <button
                            onClick={() => {
                              setEditingItem(null);
                              setDialogOpen(true);
                            }}
                            className="mt-4 px-4 py-2 bg-iskcon-primary text-white rounded-md hover:bg-iskcon-primary/90"
                          >
                            Add New Item
                          </button>
                        </div>
                      ) : (
                        <MenuItemGrid
                          items={items}
                          onEdit={(item) => {
                            setEditingItem(item);
                            setDialogOpen(true);
                          }}
                          onDelete={async (id) => {
                            if (window.confirm('Are you sure you want to delete this item?')) {
                              await deleteMenuItem(id);
                            }
                          }}
                        />
                      )}

                      <MenuItemDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        item={editingItem || undefined}
                        categories={categories}
                        onSubmit={async (item) => {
                          if (editingItem) {
                            await updateMenuItem(editingItem.id, item);
                          } else {
                            await addMenuItem(item);
                          }
                          setDialogOpen(false);
                          setEditingItem(null);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'users' && (
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage users and their access permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-center py-4">User management is available at the Users page.</p>
                      <div className="flex justify-center">
                        <a href="/users" className="px-4 py-2 bg-iskcon-primary text-white rounded-md hover:bg-iskcon-primary/90">
                          Go to Users Page
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'categories' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Categories Management</CardTitle>
                    <CardDescription>
                      Manage menu categories for better organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CategoriesManagement />
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
