'use client';

import { useEffect } from 'react';
import {
    onSnapshot,
    type DocumentReference,
    type Query,
    type DocumentSnapshot,
    type QuerySnapshot
} from 'firebase/firestore';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * useFirestoreLive
 *
 * Bridges Firestore onSnapshot with TanStack Query cache.
 * Automatically updates the specified queryKey when the Firestore data changes.
 */
export function useFirestoreLive<T>(
    queryKey: QueryKey,
    ref: DocumentReference<T> | Query<T> | null,
    enabled: boolean = true
) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled || !ref) return;

        const unsubscribe = onSnapshot(ref as any, (snapshot: DocumentSnapshot<T> | QuerySnapshot<T>) => {
            if ('docs' in snapshot) {
                // It's a collection snapshot
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                queryClient.setQueryData(queryKey, data);
            } else {
                // It's a document snapshot
                if (snapshot.exists()) {
                    queryClient.setQueryData(queryKey, {
                        id: snapshot.id,
                        ...snapshot.data()
                    });
                } else {
                    queryClient.setQueryData(queryKey, null);
                }
            }
        }, (error) => {
            console.error(`[FirestoreLive] Error for key ${JSON.stringify(queryKey)}:`, error);
        });

        return () => unsubscribe();
    }, [queryClient, JSON.stringify(queryKey), ref, enabled]);
}
