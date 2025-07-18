
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
import { getUsers, type UserWithRole } from '@/actions/get-users';
import { auth } from '@/lib/firebase';


export default function UsersPage() {
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { role: adminRole, _setUser } = useAuthStore();
  const router = useRouter();
  
  React.useEffect(() => {
    if (adminRole && !['admin', 'cashier'].includes(adminRole)) {
      router.replace('/admin/dashboard');
    }
  }, [adminRole, router]);

  const fetchUsers = React.useCallback(async () => {
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
        customClaims: {
            ...u.customClaims,
            role: u.customClaims?.role || 'cashier',
        },
    }));
    setUsers(sanitizedUsers);
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    if (!adminRole) return;
    
    fetchUsers();
  }, [adminRole, router, fetchUsers]);
  

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'cashier') => {
    const originalUsers = [...users];
    
    // Optimistically update UI
    setUsers(currentUsers => currentUsers.map(u => u.uid === userId ? { ...u, customClaims: { ...u.customClaims, role: newRole } } : u));
    
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

      // Force a token refresh to get the new custom claims
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        // Update the user state in the auth store to reflect the new role
        await _setUser(auth.currentUser);
      }
      
      // Re-fetch all users to ensure data is consistent
      await fetchUsers();
    }
  };
  
  if (adminRole && !['admin', 'cashier'].includes(adminRole)) {
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
                <TableRow key={user.uid}>
                  <TableCell>
                    <div className="font-medium">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    {user.metadata?.creationTime ? format(new Date(user.metadata.creationTime), 'd MMM, yyyy', { locale: es }) : 'N/A'}
                  </TableCell>
                   <TableCell>
                    {user.metadata?.lastSignInTime ? format(new Date(user.metadata.lastSignInTime), 'd MMM, yyyy HH:mm', { locale: es }) : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <Select
                        value={user.customClaims?.role}
                        onValueChange={(newRole: 'admin' | 'cashier') => handleRoleChange(user.uid, newRole)}
                        disabled={adminRole !== 'admin'}
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
