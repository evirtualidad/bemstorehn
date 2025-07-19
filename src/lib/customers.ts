
import type { Customer } from '@/hooks/use-customers';

export const initialCustomers: Customer[] = [
    {
        id: 'cust-1',
        created_at: '2023-01-15T10:00:00Z',
        name: 'Elena Rodríguez',
        phone: '9988-7766',
        address: {
            department: 'Francisco Morazán',
            municipality: 'Distrito Central',
            colony: 'Col. Palmira',
            exactAddress: 'Frente a la embajada, casa 123'
        },
        total_spent: 1500,
        order_count: 3
    },
    {
        id: 'cust-2',
        created_at: '2023-02-20T14:30:00Z',
        name: 'Carlos Portillo',
        phone: '3322-1100',
        address: null,
        total_spent: 850,
        order_count: 1
    }
];
