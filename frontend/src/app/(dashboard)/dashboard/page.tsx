import { redirect } from 'next/navigation';

export default function DashboardRoot(): never {
    redirect('/dashboard/home');
}
