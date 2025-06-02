import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { UserList } from '../components/users/UserList';
import { UserDialog } from '../components/users/UserDialog';
import { UserDeleteDialog } from '../components/users/UserDeleteDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '../types/auth';
import { Plus, Users as UsersIcon } from 'lucide-react';

export const UserManagementPage = () => {
  const { users, fetchUsers, addUser, deleteUser, isLoading, error } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (email: string, password: string, name: string, role: string) => {
    // For now, we only support adding users, not editing
    // TODO: Add update user functionality to the store
    await addUser(email, password, name, role as any);
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteById = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      handleDeleteClick(user);
    }
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="container py-8 mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-iskcon-light">
              <UsersIcon className="h-6 w-6 text-iskcon-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
            </div>
          </div>
          <Button
            onClick={handleAddUser}
            className="bg-iskcon-primary hover:bg-iskcon-primary/90 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Users List Card */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Team Members</CardTitle>
                <CardDescription className="mt-1">
                  {users.length} {users.length === 1 ? 'user' : 'users'} in your organization
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Total: {users.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iskcon-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first team member</p>
                  <Button onClick={handleAddUser} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            ) : (
              <UserList
                users={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteById}
              />
            )}
          </CardContent>
        </Card>

        {/* User Dialog */}
        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={editingUser || undefined}
          onSubmit={handleFormSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <UserDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          user={userToDelete || undefined}
        />
      </div>
    </Layout>
  );
};
