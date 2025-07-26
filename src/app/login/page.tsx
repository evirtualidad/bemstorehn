
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ThemeProvider } from '@/components/theme-provider';
import Image from 'next/image';
import { useLogoStore } from '@/hooks/use-logo-store';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingresa un correo válido.' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria.' }),
});

function LoginPageContent() {
  const { login, user, isAuthLoading, initializeSession } = useAuthStore();
  const { logoUrl } = useLogoStore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    // Initialize session to check if a user is already logged in.
    const unsubscribe = initializeSession();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeSession]);

  React.useEffect(() => {
    // If the session is loaded and a user exists, redirect to the dashboard.
    // This handles cases where a logged-in user navigates to the login page.
    if (!isAuthLoading && user) {
      router.replace('/admin/dashboard-v2');
    }
  }, [user, isAuthLoading, router]);


  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginFormSchema>) => {
    setIsSubmitting(true);
    const error = await login(values.email, values.password);
    
    if (error) {
      toast({
        title: 'Error de Autenticación',
        description: 'Credenciales inválidas. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });
      // The onAuthStateChange listener will handle the redirection.
      // No need to push manually.
    }
  };
  
  if (isAuthLoading || user) {
      return (
          <div className="flex h-screen items-center justify-center">
            <LoadingSpinner />
          </div>
      )
  }

  return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                   {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="BEM STORE HN Logo"
                        width={150}
                        height={50}
                        className="object-contain h-12"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold">BEM STORE HN</h1>
                    )}
              </div>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa a tu panel de administración</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@bemstore.hn"
                          {...field}
                        />
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Iniciar Sesión
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
  );
}

export default function LoginPage() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <LoginPageContent />
    </ThemeProvider>
  );
}
