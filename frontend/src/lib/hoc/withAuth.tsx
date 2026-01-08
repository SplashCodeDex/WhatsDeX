import React, { FC, useEffect, ComponentType } from 'react';
import { useRouter } from 'next/router';

export function withAuth<T extends object>(WrappedComponent: ComponentType<T>): FC<T> {
    return function WithAuthComponent(props: T) {
        const router = useRouter();

        useEffect(() => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
            }
        }, [router]);

        return <WrappedComponent {...props} />;
    };
}

export default withAuth;
