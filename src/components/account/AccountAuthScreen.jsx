import React, { useState } from 'react';
import { Sprout, LogIn, UserPlus } from 'lucide-react';
import { login, signup } from '../../lib/auth-service';

export function AccountAuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ese email ya tiene una cuenta. Inicia sesión en su lugar.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else {
        setError('No se pudo completar la operación. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="posLoginScreen">
      <form className="posLoginCard" onSubmit={handleSubmit}>
        <div className="posLoginBrand">
          <Sprout size={28} />
          <span>Jardín de la Vida · Mi cuenta</span>
        </div>

        <div className="accountModeTabs">
          <button
            type="button"
            className={`accountModeTab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`accountModeTab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); }}
          >
            Crear cuenta
          </button>
        </div>

        <div className="formGroup">
          <label htmlFor="account-email">Email</label>
          <input
            id="account-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tú@ejemplo.com"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="account-password">Contraseña</label>
          <input
            id="account-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="formError" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="btn primary full" disabled={isSubmitting}>
          {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          {isSubmitting ? 'Un momento...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
