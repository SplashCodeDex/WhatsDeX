import { useState, useCallback } from 'react';
import { userService } from '@/services/userService';
import { toast } from '@/hooks/use-toast';
import { User, ApiResponse } from '@/types';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async (params: any = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await userService.getUsers(params);
            // Handle both array direct return or { data: [] } format
            const userList = Array.isArray(response) ? response : (response.data || []);
            setUsers(userList);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users');
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const createUser = async (data: any) => {
        setLoading(true);
        try {
            await userService.createUser(data);
            toast({ title: 'Success', description: 'User created' });
            fetchUsers({ 'page': '1', 'limit': '50', 'sortBy': 'createdAt', 'sortOrder': 'desc' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to create user', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (id: string, data: any) => {
        setLoading(true);
        try {
            await userService.updateUser(id, data);
            toast({ title: 'Success', description: 'User updated' });
            fetchUsers({ 'page': '1', 'limit': '50', 'sortBy': 'createdAt', 'sortOrder': 'desc' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to update user', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: string) => {
        setLoading(true);
        try {
            await userService.deleteUser(id);
            toast({ title: 'Success', description: 'User deleted' });
            fetchUsers({ 'page': '1', 'limit': '50', 'sortBy': 'createdAt', 'sortOrder': 'desc' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to delete user', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return {
        users,
        loading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser
    };
}
