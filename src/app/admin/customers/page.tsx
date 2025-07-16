
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCustomersStore, type Customer } from '@/hooks/use-customers';
import { formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function CustomersPage() {
  const { customers } = useCustomersStore();
  const { currency } = useCurrencyStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const sortedCustomers = React.useMemo(() => 
    [...customers].sort((a, b) => b.totalSpent - a.totalSpent),
    [customers]
  );
  
  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm) return sortedCustomers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return sortedCustomers.filter(customer => 
      customer.name.toLowerCase().includes(lowercasedTerm) ||
      customer.phone.includes(lowercasedTerm)
    );
  }, [searchTerm, sortedCustomers]);

  const getInitials = (name: string) => {
      if (!name) return 'CF';
      const names = name.split(' ');
      if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  }

  return (
    <main className="grid flex-1 items-start gap-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  Un listado de todos los clientes que han realizado compras.
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-[300px] pl-10"
                />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead className="text-right">Gasto Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.phone}
                  </TableCell>
                  <TableCell>
                    {customer.orderIds.length}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.totalSpent, currency.code)}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No se encontraron clientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Mostrando <strong>{filteredCustomers.length}</strong> de <strong>{customers.length}</strong> clientes.
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}

    
