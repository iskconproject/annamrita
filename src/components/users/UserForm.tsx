import { useState } from 'react';
import { UserRole } from '../../types/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFormProps {
  onSubmit: (email: string, password: string, name: string, role: UserRole) => void;
  onCancel: () => void;
}

export const UserForm = ({ onSubmit, onCancel }: UserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('volunteer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, name, role);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium text-gray-700">
          Role
        </label>
        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
          <SelectTrigger className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="volunteer">Volunteer</SelectItem>
            <SelectItem value="kitchen">Kitchen Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border-iskcon-primary/30 text-iskcon-primary hover:bg-iskcon-light"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="iskcon"
        >
          Add User
        </Button>
      </div>
    </form>
  );
};
