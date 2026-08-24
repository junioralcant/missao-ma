'use client';

import {useRouter} from 'next/navigation';

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {method: 'POST'});
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button className="btn btn--small btn--ghost" onClick={handleLogout}>
      Sair
    </button>
  );
};
