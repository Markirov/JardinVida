import React, { useEffect, useState } from 'react';
import { subscribeToAuthState } from '../../lib/auth-service';
import { AdminLoginScreen } from '../shared/AdminLoginScreen';
import { AdminDashboard } from './AdminDashboard';

export default function AdminApp() {
  const [user, setUser] = useState(undefined); // undefined = cargando, null = sin sesión

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(setUser);
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div className="posScreen posLoadingScreen">Cargando...</div>;
  }

  return user
    ? <AdminDashboard userEmail={user.email} />
    : <AdminLoginScreen title="Jardín de la Vida · Panel Admin" buttonLabel="Entrar al panel" />;
}
