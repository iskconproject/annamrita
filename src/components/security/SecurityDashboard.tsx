import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  AlertTriangle,
  Users,
  Activity,
  Eye,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { auditLogger, AuditLog } from '../../utils/security';
import { useAuthStore } from '../../store/authStore';

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'success' | 'failure'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    // Get audit logs
    const allLogs = auditLogger.getLogs();
    setLogs(allLogs);
    setFilteredLogs(allLogs);
  }, []);

  useEffect(() => {
    // Filter logs based on search term, filter type, and time range
    let filtered = logs;

    // Time range filter
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    filtered = filtered.filter(log =>
      now - log.timestamp.getTime() <= timeRanges[selectedTimeRange]
    );

    // Success/failure filter
    if (filterType !== 'all') {
      filtered = filtered.filter(log =>
        filterType === 'success' ? log.success : !log.success
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterType, selectedTimeRange]);

  const getSecurityStats = () => {
    const recentLogs = logs.filter(log =>
      Date.now() - log.timestamp.getTime() <= 24 * 60 * 60 * 1000
    );

    // Filter out system/anonymous users for more accurate active user count
    const realUserLogs = recentLogs.filter(log =>
      log.userId !== 'unknown' &&
      log.userId !== 'anonymous' &&
      log.userId !== 'system' &&
      !log.userId.startsWith('offline-') &&
      !log.userId.startsWith('sample-')
    );

    return {
      totalEvents: recentLogs.length,
      successfulEvents: recentLogs.filter(log => log.success).length,
      failedEvents: recentLogs.filter(log => !log.success).length,
      activeUsers: new Set(realUserLogs.map(log => log.userId)).size,
      securityEvents: recentLogs.filter(log =>
        log.action.includes('security_event') ||
        log.action.includes('unauthorized') ||
        log.action.includes('permission_denied') ||
        log.action.includes('insufficient_')
      ).length,
      loginAttempts: recentLogs.filter(log => log.action === 'login').length,
      failedLogins: recentLogs.filter(log => log.action === 'login' && !log.success).length,
    };
  };

  const stats = getSecurityStats();

  const getActionBadgeVariant = (action: string, success: boolean) => {
    if (!success) return 'destructive';
    if (action.includes('login') || action.includes('logout')) return 'default';
    if (action.includes('create') || action.includes('update')) return 'secondary';
    return 'outline';
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User ID', 'Action', 'Resource', 'Success', 'Details'],
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.userId,
        log.action,
        log.resource,
        log.success.toString(),
        JSON.stringify(log.details || {})
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Only show to admin users
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Active Users (24h)</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-xs text-gray-500">Users with activity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Security Events</p>
                <p className="text-2xl font-bold text-orange-600">{stats.securityEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Security Audit Logs</span>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Events</option>
              <option value="success">Successful Only</option>
              <option value="failure">Failed Only</option>
            </select>

            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2">Resource</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 100).map((log, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-xs text-gray-600">
                      {log.timestamp.toLocaleString()}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {log.userId.substring(0, 8)}...
                    </td>
                    <td className="p-2">
                      <Badge variant={getActionBadgeVariant(log.action, log.success)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs">{log.resource}</td>
                    <td className="p-2">
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs text-gray-600 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No logs found matching the current filters.
            </div>
          )}

          {filteredLogs.length > 100 && (
            <div className="text-center py-4 text-gray-500">
              Showing first 100 results. Use filters to narrow down the search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
