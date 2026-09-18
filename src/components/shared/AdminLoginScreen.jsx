import React, { useState } from 'react';
import { Sprout, LogIn } from 'lucide-react';
import { loginAdmin } from '../../lib/auth-service';

export function AdminLoginScreen({ title, buttonLabel = 'Entrar' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await loginAdmin(email, password);
    } catch (err) {
      setError('Email o contraseña incorrectos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="posLoginScreen">
      <form className="posLoginCard" onSubmit={handleSubmit}>
        <div className="posLoginBrand">
          <Sprout size={28} />
          <span>{title}</span>
        </div>

        <div className="formGroup">
          <label htmlFor="admin-email">Usuario</label>
          <input
            id="admin-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@jardinvida.com"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            required
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
          <LogIn size={18} /> {isSubmitting ? 'Accediendo...' : buttonLabel}
        </button>
      </form>
    </div>
  );
}
