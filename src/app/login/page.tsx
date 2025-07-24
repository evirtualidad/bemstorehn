
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
import { Loader2, Leaf } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Head from 'next/head';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingresa un correo válido.' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria.' }),
});

export default function LoginPage() {
  const { login, user, isAuthLoading, initializeSession } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  React.useEffect(() => {
      // This now sets up the Supabase auth listener
      const unsubscribe = initializeSession();
      // Cleanup subscription on unmount
      return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
      };
  }, [initializeSession]);

  React.useEffect(() => {
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
      // The redirect will be handled by the layout component
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
    <>
      <Head>
        <link rel="manifest" href="/admin/manifest.json" />
        <meta name="theme-color" content="#793F5C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BEM Admin" />
        <link rel="apple-touch-icon" href="/admin/icons/apple-touch-icon.png" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                  <Leaf className="w-8 h-8 text-primary" />
                  <h1 className="text-2xl font-bold">BEM STORE</h1>
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
    </>
  );
}
