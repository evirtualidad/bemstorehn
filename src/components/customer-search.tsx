
'use client';

import * as React from 'react';
import { useCustomersStore, type Customer } from '@/hooks/use-customers';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { UserSearch } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer | null) => void;
  form: UseFormReturn<any>;
}

export function CustomerSearch({ onCustomerSelect, form }: CustomerSearchProps) {
  const { customers } = useCustomersStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<Customer[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  React.useEffect(() => {
    // Set initial search query from form if it exists
    const initialName = form.getValues('name');
    if (initialName) {
        setSearchQuery(initialName);
    }
  }, []);


  React.useEffect(() => {
    // Only search if the query is not the name of the selected customer
    if (searchQuery && searchQuery !== selectedCustomer?.name) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filteredCustomers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(lowerCaseQuery) ||
        (customer.phone && customer.phone.includes(lowerCaseQuery))
      );
      setResults(filteredCustomers);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [searchQuery, customers, selectedCustomer]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const handleSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setSelectedCustomer(customer);
    setSearchQuery(customer.name); // Set input to customer name
    setIsOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setSearchQuery(newQuery);
      form.setValue('name', newQuery);
      
      if (newQuery === '') {
        onCustomerSelect(null);
        setSelectedCustomer(null);
        form.setValue('phone', '');
        form.setValue('address', undefined);
      } else {
        // A new search is being typed, so clear previous selection
        onCustomerSelect(null);
        setSelectedCustomer(null);
      }
  }

  return (
    <div className="relative" ref={searchContainerRef}>
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre del Cliente</FormLabel>
                    <div className='relative'>
                        <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input 
                                placeholder="Buscar o registrar cliente..." 
                                {...field} 
                                className="h-11 pl-10"
                                onFocus={() => {
                                    if (searchQuery && results.length > 0) {
                                        setIsOpen(true);
                                    }
                                }}
                                onChange={handleInputChange}
                                value={searchQuery}
                                autoComplete='off'
                            />
                        </FormControl>
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
        {isOpen && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                <ul className="max-h-60 overflow-y-auto">
                    {results.map((customer) => (
                    <li
                        key={customer.id}
                        className="flex items-center gap-4 p-2 cursor-pointer hover:bg-accent"
                        onClick={() => handleSelect(customer)}
                    >
                        <div className="flex-grow">
                            <p className="font-medium text-sm">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
      )}
    </div>
  );
}
    
