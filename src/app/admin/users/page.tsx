
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Button, buttonVariants } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useUsersStore } from '@/hooks/use-users-store';


export default function UsersPage() {
  const { users, isLoading, updateUserRole, deleteUser } = useUsersStore();
  const { role: adminRole, user: currentUser } = useAuthStore();

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'cajero') => {
    await updateUserRole(userId, newRole);
  };

  const isCurrentUser = (uid: string) => currentUser?.id === uid;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const roles: { value: 'admin' | 'cajero'; label: string; badgeVariant: 'destructive' | 'secondary' }[] = [
    { value: 'admin', label: 'Admin', badgeVariant: 'destructive' },
    { value: 'cajero', label: 'Cajero', badgeVariant: 'secondary' },
  ];

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
                <TableHead>Rol</TableHead>
                <TableHead>
                    <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                        value={user.role || 'cajero'}
                        onValueChange={(newRole: 'admin' | 'cajero') => handleRoleChange(user.id, newRole)}
                        disabled={adminRole !== 'admin' || isCurrentUser(user.id)}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                    <Badge variant={role.badgeVariant}>{role.label}</Badge>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {!isCurrentUser(user.id) && adminRole === 'admin' ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Alternar menú</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild key={user.id}>
                                        <div className={cn(
                                            "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                            "text-destructive focus:bg-destructive/10 focus:text-destructive"
                                        )}>
                                            Eliminar
                                        </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Se eliminará permanentemente al usuario
                                            <span className='font-bold'> {user.email}</span>.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => deleteUser(user.id)}
                                            className={cn(buttonVariants({ variant: 'destructive' }))}
                                        >
                                            Sí, eliminar usuario
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
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
