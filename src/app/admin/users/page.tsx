
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
import { v4 as uuidv4 } from 'uuid';


// --- User Type Definition ---
export interface UserDoc {
    uid: string;
    email: string;
    role: 'admin' | 'cashier';
    created_at: {
        seconds: number;
        nanoseconds: number;
    };
}

const initialUsers: UserDoc[] = [
    {
        uid: 'admin_user_id',
        email: 'admin@bemstore.hn',
        role: 'admin',
        created_at: { seconds: Math.floor(new Date().getTime() / 1000) - 86400, nanoseconds: 0 }
    },
    {
        uid: 'cashier_user_id',
        email: 'cashier@bemstore.hn',
        role: 'cashier',
        created_at: { seconds: Math.floor(new Date().getTime() / 1000) - 172800, nanoseconds: 0 }
    }
];


// --- Create User Dialog ---
const userFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingresa un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  role: z.enum(['admin', 'cashier'], { required_error: 'Debes seleccionar un rol.' }),
});

function CreateUserDialog({ onUserCreated }: { onUserCreated: (newUser: UserDoc) => void }) {
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
    
    // Simulate async operation
    await new Promise(res => setTimeout(res, 500));

    const newUser: UserDoc = {
        uid: uuidv4(),
        email: values.email,
        role: values.role,
        created_at: {
            seconds: Math.floor(new Date().getTime() / 1000),
            nanoseconds: 0
        }
    };
    
    onUserCreated(newUser);

    toast({
        title: '¡Usuario Creado!',
        description: `El usuario ${values.email} ha sido creado exitosamente (simulado).`,
    });

    setIsSubmitting(false);
    setIsOpen(false);
    form.reset();
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
  const [users, setUsers] = React.useState<UserDoc[]>(initialUsers);
  const [isLoading, setIsLoading] = React.useState(false); // Can be false as it's local
  const { toast } = useToast();
  const { role: adminRole, user: currentUser } = useAuthStore();


  const handleUserCreated = (newUser: UserDoc) => {
    setUsers(currentUsers => [newUser, ...currentUsers]);
  };

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'cashier') => {
    setUsers(currentUsers => currentUsers.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    toast({ title: '¡Rol actualizado!', description: `El rol del usuario ha sido cambiado a ${newRole} (simulado).`});
  };

  const isCurrentUser = (uid: string) => currentUser?.uid === uid || (currentUser?.email === 'admin@bemstore.hn' && uid === 'admin_user_id');

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
        {adminRole === 'admin' && <CreateUserDialog onUserCreated={handleUserCreated} />}
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
                    {user.created_at ? format(new Date(user.created_at.seconds * 1000), 'd MMM, yyyy', { locale: es }) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Select
                        value={user.role || 'cashier'}
                        onValueChange={(newRole: 'admin' | 'cashier') => handleRoleChange(user.uid, newRole)}
                        disabled={adminRole !== 'admin' || isCurrentUser(user.uid)}
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
