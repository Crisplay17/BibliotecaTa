import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem("user"));
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => sessionStorage.getItem("token"));

    useEffect(() => {
        if (user) sessionStorage.setItem("user", JSON.stringify(user));
        else sessionStorage.removeItem("user");
    }, [user]);

    useEffect(() => {
        if (token) sessionStorage.setItem("token", token);
        else sessionStorage.removeItem("token");
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken }}>
            {children}
        </AuthContext.Provider>
    );
}
