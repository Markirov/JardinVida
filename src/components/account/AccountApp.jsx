import React, { useEffect, useState } from 'react';
import { subscribeToAuthState } from '../../lib/auth-service';
import { checkIsAdmin } from '../../lib/firestore-service';
import { AccountAuthScreen } from './AccountAuthScreen';
import { CustomerDashboard } from './CustomerDashboard';

export default function AccountApp() {
  const [user, setUser] = useState(undefined); // undefined = cargando, null = sin sesión
  const [isAdmin, setIsAdmin] = useState(undefined);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(undefined);
      return;
    }
    checkIsAdmin(user.uid).then(setIsAdmin);
  }, [user]);

  if (user === undefined) {
    return <div className="posScreen posLoadingScreen">Cargando...</div>;
  }

  if (!user) {
    return <AccountAuthScreen />;
  }

  if (isAdmin === undefined) {
    return <div className="posScreen posLoadingScreen">Comprobando acceso...</div>;
  }

  if (isAdmin) {
    window.location.href = '/admin';
    return <div className="posScreen posLoadingScreen">Redirigiendo al panel admin...</div>;
  }

  return <CustomerDashboard user={user} />;
}
