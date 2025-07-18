
'use server';

import { getAdmin } from '@/lib/firebase-admin';

type Role = 'admin' | 'cashier';

interface CreateUserResult {
    success: boolean;
    error?: string;
}

export async function createUser(email: string, password: string, role: Role): Promise<CreateUserResult> {
    const { admin, error: adminError } = getAdmin();
    if (!admin || adminError) {
        const errorMessage = adminError || "Firebase Admin SDK no está inicializado.";
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    try {
        const auth = admin.auth();

        const userRecord = await auth.createUser({
            email,
            password,
            emailVerified: true,
        });

        await auth.setCustomUserClaims(userRecord.uid, { role });

        console.log(`Successfully created new user: ${email} with role: ${role}`);
        return { success: true };

    } catch (error: any) {
        console.error("Error creating new user:", error);
        let errorMessage = 'Ocurrió un error inesperado.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'El correo electrónico ya está en uso por otro usuario.';
        } else if (error.code === 'auth/invalid-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (error.code === 'auth/insufficient-permission' || error.code === 'permission-denied') {
            errorMessage = 'Permisos insuficientes para crear usuarios. Revisa los roles IAM de tu cuenta de servicio.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        return { success: false, error: errorMessage };
    }
}
