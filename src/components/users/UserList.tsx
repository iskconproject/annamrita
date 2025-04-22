import { User } from '../../types/auth';
import { Button } from '@/components/ui/button';

interface UserListProps {
  users: User[];
  onDelete: (userId: string) => void;
}

export const UserList = ({ users, onDelete }: UserListProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-iskcon-light">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Role
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin'
                      ? 'bg-iskcon-primary/20 text-iskcon-primary'
                      : user.role === 'kitchen'
                        ? 'bg-iskcon-accent/20 text-iskcon-accent'
                        : 'bg-iskcon-secondary/20 text-iskcon-secondary'
                    }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                {/* Don't allow deleting the admin user */}
                {user.email !== 'arindamdawn3@gmail.com' ? (
                  <Button
                    onClick={() => onDelete(user.id)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-900 hover:bg-red-50 p-0 h-auto"
                  >
                    Delete
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400 italic">Primary Admin</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
