import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest
        } catch (err: any) {
             setError('Logowanie nie powiodło się. Sprawdź dane i spróbuj ponownie.');
             console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <i className="fas fa-tags text-indigo-400 text-5xl mb-3"></i>
                    <h1 className="text-3xl font-bold text-white tracking-wider">Menedżer NFC</h1>
                    <p className="text-gray-400">Zaloguj się, aby kontynuować</p>
                </div>

                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="test@firma.pl"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-300 mb-1">Hasło</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="123456"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                                Zapamiętaj mnie
                            </label>
                        </div>
                        
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center"
                            >
                                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Zaloguj się'}
                            </button>
                        </div>
                    </form>
                </div>
                 <div className="text-center mt-4 text-gray-500 text-sm">
                    <p>Dane testowe: test@firma.pl / 123456</p>
                </div>
            </div>
        </div>
    );
};

export default Login;