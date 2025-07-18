
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';


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

// --- Firebase Functions Callables ---
// These are now only used for actions requiring special permissions (creating a user in Auth, setting claims)
const functions = getFunctions(auth.app);
const createUserCallable = httpsCallable(functions, 'createUser');
const setRoleCallable = httpsCallable(functions, 'setRole');

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
        console.error("Error creating user via function:", error);
        toast({
            title: 'Error al Crear Usuario',
            description: error.message || 'Ocurrió un error en el servidor.',
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
  const [users, setUsers] = React.useState<UserDoc[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { role: adminRole, user: currentUser } = useAuthStore();

  const fetchUsers = React.useCallback(() => {
    setIsLoading(true);
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const userDocs = snapshot.docs.map(doc => doc.data() as UserDoc);
        setUsers(userDocs);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching users from Firestore:", error);
        toast({ title: 'Error al Cargar Usuarios', description: "No se pudieron obtener los datos de Firestore.", variant: 'destructive' });
        setUsers([]);
        setIsLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  React.useEffect(() => {
    const unsubscribe = fetchUsers();
    return () => unsubscribe();
  }, [fetchUsers]);

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'cashier') => {
    const originalUsers = [...users];
    
    // Optimistic UI update
    setUsers(currentUsers => currentUsers.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    
    try {
        // First, update the role in the Firestore document
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { role: newRole });
        
        // Then, call the cloud function to update the custom claim
        const result = await setRoleCallable({ userId: uid, role: newRole });
        
        if (!(result.data as any).success) {
            throw new Error((result.data as any).error || 'Error desconocido al cambiar el rol.');
        }
        
        toast({ title: '¡Rol actualizado!', description: `El rol del usuario ha sido cambiado a ${newRole}.`});
        
    } catch(error: any) {
        // Revert UI on error
        setUsers(originalUsers);
        toast({ title: 'Error al cambiar el rol', description: error.message, variant: 'destructive'});
    }
  };

  const isCurrentUser = (uid: string) => currentUser?.uid === uid;

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
        {adminRole === 'admin' && <CreateUserDialog onUserCreated={() => {}} />}
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
