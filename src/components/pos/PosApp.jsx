import React, { useEffect, useState } from 'react';
import { subscribeToAuthState, logoutAdmin } from '../../lib/auth-service';
import { checkIsAdmin } from '../../lib/firestore-service';
import { AdminLoginScreen } from '../shared/AdminLoginScreen';
import { PosDashboard } from './PosDashboard';

export default function PosApp() {
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
    return <AdminLoginScreen title="Jardín de la Vida · TPV" buttonLabel="Entrar a caja" />;
  }

  if (isAdmin === undefined) {
    return <div className="posScreen posLoadingScreen">Comprobando acceso...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="posLoginScreen">
        <div className="posLoginCard">
          <p>Esta cuenta no tiene acceso al TPV.</p>
          <button className="btn secondary full" onClick={logoutAdmin}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return <PosDashboard userEmail={user.email} />;
}
