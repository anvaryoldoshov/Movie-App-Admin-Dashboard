import React, { useState } from "react";
import { login } from "../services/api";
import { useHistory } from "react-router-dom";
import image from "../assets/image/image.png";
import { Mail, Lock, LogIn } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);
            const { token, refreshToken } = response;

            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.role !== "ADMIN") {
                setError("Sizda admin huquqi yo'q");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", refreshToken);

            history.push("/movies");
        } catch (err) {
            setError(typeof err === 'string' ? err : "Login yoki parol noto'g'ri");
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center p-4 sm:p-8"
            style={{ backgroundImage: `url(${image})` }}
        >
            <div className="absolute inset-0 bg-black opacity-60 backdrop-blur-sm"></div>

            <div className="relative bg-[#1c1e2c] p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md text-white border border-gray-700/50">

                <div className="mb-8 text-center">
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
                        Online TV Admin
                    </h2>
                    <p className="text-gray-400 mt-2">Admin paneliga kirish</p>
                </div>

                {error && (
                    <div className="p-3 mb-6 bg-red-900/40 border border-red-600 rounded-lg text-red-300 text-center shadow-lg animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email manzilingizni kiriting"
                                className="w-full p-3 pl-10 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-inner"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parol</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Parolingizni kiriting"
                                className="w-full p-3 pl-10 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-inner"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 rounded-lg text-white font-semibold text-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-lg shadow-blue-500/50 transform hover:scale-[1.01]"
                    >
                        <LogIn className="w-5 h-5" />
                        <span>KIRISH</span>
                    </button>

                </form>

            </div>
        </div>
    );
};

export default Login;
