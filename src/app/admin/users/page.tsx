
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';


// --- User Type Definition ---
export interface UserWithRole {
    uid: string;
    email?: string;
    metadata: {
        creationTime?: string;
        lastSignInTime?: string;
    };
    customClaims?: {
        [key: string]: any;
        role?: 'admin' | 'cashier';
    };
}

// --- Firebase Functions Callables ---
const functions = getFunctions(auth.app);
const createUserCallable = httpsCallable(functions, 'createUser');
const setRoleCallable = httpsCallable(functions, 'setRole');
const listUsersCallable = httpsCallable(functions, 'listUsers');

// --- Create User Dialog ---
const userFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingresa un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  role: z.enum(['admin', 'cashier'], { required_error: 'Debes seleccionar un rol.' }),
});

function CreateUserDialog({ onUserCreated }: { onUserCreated: () => void }) {
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
    try {
      const result = await createUserCallable(values);
      if ((result.data as any).success) {
        toast({
            title: '¡Usuario Creado!',
            description: `El usuario ${values.email} ha sido creado exitosamente.`,
        });
        setIsOpen(false);
        onUserCreated();
        form.reset();
      } else {
        throw new Error((result.data as any).error || 'Error desconocido');
      }
    } catch(error: any) {
        toast({
            title: 'Error al Crear Usuario',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto gap-1">
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

// --- Main Page Component ---
export default function UsersPage() {
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { role: adminRole } = useAuthStore();
  const router = useRouter();

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listUsersCallable();
      const data = result.data as { users: UserWithRole[], error?: string };
      if (data.error) {
        throw new Error(data.error);
      }
      setUsers(data.users || []);
    } catch(error: any) {
      toast({ title: 'Error al Cargar Usuarios', description: error.message, variant: 'destructive' });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (adminRole) { // Only fetch if role is determined
        if (adminRole === 'admin') {
            fetchUsers();
        } else {
             // If not an admin, they can only see a list of users, but not modify them.
             // We can listen to a public `users_basic_info` collection for example
             const q = query(collection(db, 'users_public'));
             const unsubscribe = onSnapshot(q, (snapshot) => {
                 const publicUsers = snapshot.docs.map(doc => doc.data() as UserWithRole);
                 setUsers(publicUsers);
                 setIsLoading(false);
             });
             return () => unsubscribe();
        }
    }
  }, [adminRole, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'cashier') => {
    const originalUsers = [...users];
    
    setUsers(currentUsers => currentUsers.map(u => u.uid === userId ? { ...u, customClaims: { ...u.customClaims, role: newRole } } : u));
    
    try {
        const result = await setRoleCallable({ userId, role: newRole });
        if (!(result.data as any).success) {
            throw new Error((result.data as any).error || 'Error desconocido');
        }
        toast({ title: '¡Rol actualizado!', description: `El rol del usuario ha sido cambiado a ${newRole}.`});
        await fetchUsers(); // Re-fetch to ensure data consistency
    } catch(error: any) {
        setUsers(originalUsers);
        toast({ title: 'Error al cambiar el rol', description: error.message, variant: 'destructive'});
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
        {adminRole === 'admin' && <CreateUserDialog onUserCreated={fetchUsers} />}
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
                        value={user.customClaims?.role || 'cashier'}
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
