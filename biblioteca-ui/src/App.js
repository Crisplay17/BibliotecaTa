import {useState, useEffect, useMemo, useContext} from "react";
import { ThemeProvider, CssBaseline} from "@mui/material";
import { getTheme } from "./Landing page/theme";
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import LibraryHome from './Landing page/LibraryHome';
import Login from "./Logare user/login";
import Register from "./Logare user/register";
import Profile from "./Logare user/Profile";
import Dashboard from "./Dashboard bibliotecar/Dashboard"; // Importă Dashboard-ul
import BorrowBook from './Dashboard bibliotecar/BorrowBook';
import ReturnBook from './Dashboard bibliotecar/ReturnBook';
import AddBook from './Dashboard bibliotecar/AddBook';
import LoanOptions from "./Landing page/LoanOptions";
import SplashScreen from './Landing page/SplashScreen';
import BookDetails from "./Landing page/BookDetails";
import AllBooksPage from "./Landing page/AllBooksPage";
import { AuthContext, AuthProvider } from "./Logare user/AuthContext";
import UsersList from "./Dashboard bibliotecar/UserList";
import EditBook from "./Dashboard bibliotecar/EditBook";
import PendingUsers from "./Dashboard bibliotecar/PendingUsers";
import ConfirmEmail from "./Logare user/ConfirmEmail";
import { Toaster } from "react-hot-toast";
import ResetPassword from "./Logare user/ResetPassword";
import ForgotPassword from "./Logare user/ForgotPassword";
function AppContent() {
    const { user, setUser, token } = useContext(AuthContext);
    const [mode, setMode] = useState("light");
    const [isThemeLoaded, setIsThemeLoaded] = useState(false);

    // La mount, ia tema din user sau default "light"
    useEffect(() => {
        setMode(user?.themePreference || "light");
        setIsThemeLoaded(true);
    }, [user]);

    // Actualizează user din backend dacă există token
    useEffect(() => {
        if (token) {
            fetch("http://localhost:8080/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((userData) => {
                    setUser(userData);
                    // Tema se setează automat în useEffect-ul anterior când user se schimbă
                })
                .catch(() => {
                    setUser(null);
                });
        } else {
            setUser(null);
        }
    }, [token, setUser]);

    const theme = useMemo(() => getTheme(mode), [mode]);

    const toggleTheme = () => {
        const newMode = mode === "light" ? "dark" : "light";
        setMode(newMode);

        if (user && token) {
            fetch("http://localhost:8080/users/me/theme", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ themePreference: newMode }),
            }).catch(() => {});
        }
    };

    if (!isThemeLoaded) return <SplashScreen />;

    return (

        <ThemeProvider theme={theme}>
            <Toaster position="top-center" />
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<LibraryHome toggleTheme={toggleTheme} mode={mode} />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={user ? <Profile key={user.id || 'profile'} /> : <Navigate to="/login" replace />} />
                    <Route path="/dashboard" element={user?.role === "BIBLIOTECAR" ? <Dashboard /> : <Navigate to="/home" replace />} />
                    <Route path="/dashboard/borrow-book" element={user?.role === "BIBLIOTECAR" ? <BorrowBook /> : <Navigate to="/home" replace />} />
                    <Route path="/return-book" element={user?.role === "BIBLIOTECAR" ? <ReturnBook /> : <Navigate to="/home" replace />} />
                    <Route path="/dashboard/add-book" element={user?.role === "BIBLIOTECAR" ? <AddBook /> : <Navigate to="/home" replace />} />
                    <Route path="/loan-options/:bookId" element={user ? <LoanOptions /> : <Navigate to="/login" replace />} />
                    <Route path="/books/:bookId" element={<BookDetails />} />
                    <Route path="/books/all" element={<AllBooksPage />} />
                    <Route path="/dashboard/users" element={user?.role === "BIBLIOTECAR" ? <UsersList /> : <Navigate to="/home" replace />} />
                    <Route path="/dashboard/edit-book" element={user?.role === "BIBLIOTECAR" ? <EditBook /> : <Navigate to="/home" replace />} />
                    <Route path="/dashboard/edit-book/:bookId" element={user?.role === "BIBLIOTECAR" ? <EditBook /> : <Navigate to="/home" replace />} />
                    <Route path="/dashboard/pending-users" element={<PendingUsers />} />
                    <Route path="/confirm-email" element={<ConfirmEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

