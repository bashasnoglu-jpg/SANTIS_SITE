import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch {
            setError('Invalid credentials or insufficient admin authority');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-sovereign-obsidian flex items-center justify-center text-white">
            <div className="bg-sovereign-panel p-8 rounded-lg shadow-lg w-96 border border-sovereign-line">
                <h2 className="text-2xl font-bold mb-6 text-center text-sovereign-gold-strong">Santis Admin</h2>
                {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-sovereign-graphite border border-sovereign-line-soft rounded p-2 text-white focus:border-sovereign-gold-strong focus:outline-none" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-sovereign-graphite border border-sovereign-line-soft rounded p-2 text-white focus:border-sovereign-gold-strong focus:outline-none" required />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-sovereign-gold-strong text-black font-bold py-2 rounded hover:bg-sovereign-gold-pressed transition-colors disabled:opacity-60">
                        {submitting ? 'Signing In…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
