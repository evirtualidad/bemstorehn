
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { createUser } from '@/actions/create-user';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const userFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingresa un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  role: z.enum(['admin', 'cashier'], { required_error: 'Debes seleccionar un rol.' }),
});

function CreateUserDialog({ onUserCreated, disabled }: { onUserCreated: () => void, disabled: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'cashier',
    },
  });

  const onSubmit = async (values: z.infer<typeof userFormSchema>) => {
    setIsSubmitting(true);
    const result = await createUser(values.email, values.password, values.role);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: '¡Usuario Creado!',
        description: `El usuario ${values.email} ha sido creado exitosamente.`,
      });
      setIsOpen(false);
      onUserCreated();
      form.reset();
    } else {
      toast({
        title: 'Error al Crear Usuario',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto gap-1" disabled={disabled}>
          <PlusCircle className="h-3.5 w-3.5" />
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Completa los detalles para crear un nuevo usuario en el sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier">Cajero</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className='pt-4'>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Usuario
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function UsersPage() {
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [adminError, setAdminError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { role: adminRole } = useAuthStore();
  const router = useRouter();

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    const result = await getUsers();
    if (result.error) {
      setAdminError(result.error);
      setUsers([]);
    } else {
      const sanitizedUsers = result.users.map(u => ({
        ...u,
        customClaims: {
          ...u.customClaims,
          role: u.customClaims?.role || 'cashier',
        },
      }));
      setUsers(sanitizedUsers);
      setAdminError(null);
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    if (adminRole && !['admin', 'cashier'].includes(adminRole)) {
      router.replace('/admin/dashboard');
    } else if (adminRole) {
      fetchUsers();
    }
  }, [adminRole, router, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'cashier') => {
    const originalUsers = [...users];
    
    setUsers(currentUsers => currentUsers.map(u => u.uid === userId ? { ...u, customClaims: { ...u.customClaims, role: newRole } } : u));
    
    const { success, error } = await setRole(userId, newRole);

    if (!success) {
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
      await fetchUsers(); // Re-fetch to ensure data consistency
    }
  };

  if (isLoading || !adminRole) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="grid flex-1 items-start gap-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        {adminRole === 'admin' && <CreateUserDialog onUserCreated={fetchUsers} disabled={!!adminError} />}
      </div>

      {adminError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de Configuración del Administrador</AlertTitle>
          <AlertDescription>
             {adminError} No se pueden gestionar usuarios. Por favor, completa las credenciales en el archivo <strong>src/lib/serviceAccountKey.ts</strong> y reinicia el servidor.
          </AlertDescription>
        </Alert>
      )}

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
                        disabled={adminRole !== 'admin' || !!adminError}
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
