
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setRole } from '@/actions/set-role';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useRouter } from 'next/navigation';
import { getUsers } from '@/actions/get-users';


export type UserWithRole = User & {
    app_metadata: {
        role?: 'admin' | 'cashier';
        provider?: string;
        providers?: string[];
    }
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { role: adminRole } = useAuthStore();
  const router = useRouter();
  
  React.useEffect(() => {
    if (adminRole && adminRole !== 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [adminRole, router]);

  React.useEffect(() => {
    if (adminRole !== 'admin') return;

    const fetchUsers = async () => {
        setIsLoading(true);
        const result = await getUsers();
        if (result.error) {
        toast({
            title: 'Error al cargar usuarios',
            description: result.error,
            variant: 'destructive',
        });
        setUsers([]);
        } else {
        // Ensure app_metadata and role exist to prevent runtime errors
        const sanitizedUsers = result.users.map(u => ({
            ...u,
            app_metadata: {
                ...u.app_metadata,
                role: u.app_metadata.role || 'cashier',
            },
        }));
        setUsers(sanitizedUsers);
        }
        setIsLoading(false);
    };
    
    fetchUsers();
  }, [adminRole, router, toast]);
  

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'cashier') => {
    const originalUsers = [...users];
    
    // Optimistically update UI
    setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { ...u, app_metadata: { ...u.app_metadata, role: newRole } } : u));
    
    const { success, error } = await setRole(userId, newRole);

    if (!success) {
      // Revert UI on failure
      setUsers(originalUsers);
      toast({
        title: 'Error al cambiar el rol',
        description: error || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } else {
       toast({
        title: '¡Rol actualizado!',
        description: `El rol del usuario ha sido cambiado a ${newRole}.`,
      });
    }
  };
  
  if (adminRole !== 'admin') {
      return (
        <div className="flex h-[80vh] items-center justify-center">
            <LoadingSpinner />
        </div>
      )
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Administra los usuarios y sus roles en el sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-48">
                    <LoadingSpinner />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <main className="grid flex-1 items-start gap-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Usuarios</h1>
      </div>
      <Card>
        <CardHeader>
            <div>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios y sus roles en el sistema.
              </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead>Último Inicio de Sesión</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), 'd MMM, yyyy', { locale: es }) : 'N/A'}
                  </TableCell>
                   <TableCell>
                    {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'd MMM, yyyy HH:mm', { locale: es }) : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <Select
                        value={user.app_metadata.role}
                        onValueChange={(newRole: 'admin' | 'cashier') => handleRoleChange(user.id, newRole)}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">
                                <Badge variant="destructive">Admin</Badge>
                            </SelectItem>
                            <SelectItem value="cashier">
                                <Badge variant="secondary">Cajero</Badge>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
