import React, { useEffect, useState } from 'react';
import { subscribeToAuthState } from '../../lib/auth-service';
import { PosLogin } from './PosLogin';
import { PosDashboard } from './PosDashboard';

export default function PosApp() {
  const [user, setUser] = useState(undefined); // undefined = cargando, null = sin sesión

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(setUser);
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div className="posScreen posLoadingScreen">Cargando...</div>;
  }

  return user ? <PosDashboard userEmail={user.email} /> : <PosLogin />;
}
