import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { UserForm } from '../components/users/UserForm';
import { UserList } from '../components/users/UserList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const UserManagementPage = () => {
  const { users, fetchUsers, addUser, deleteUser, isLoading, error } = useAuthStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setShowForm(true);
  };

  const handleFormSubmit = async (email: string, password: string, name: string, role: string) => {
    await addUser(email, password, name, role as any);
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(userId);
    }
  };

  return (
    <Layout>
      <div className="container py-6 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-iskcon-primary">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts for the Rath Yatra festival</p>
          </div>
          <Button
            onClick={handleAddUser}
            variant="iskcon"
            className="iskcon-shadow"
          >
            Add User
          </Button>
        </div>

        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <Card className="mb-6 iskcon-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-iskcon-primary">Add New User</CardTitle>
              <CardDescription>
                Create a new user account with appropriate permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserForm
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card className="iskcon-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-iskcon-primary">Users</CardTitle>
            <CardDescription>
              Manage existing user accounts and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <UserList
                users={users}
                onDelete={handleDeleteUser}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
