import { redirect } from 'next/navigation';

export default function SettingsRedirect(): never {
    redirect('/dashboard/settings');
}
