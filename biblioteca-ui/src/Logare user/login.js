import React, { useContext, useState } from "react";
import {
    TextField, Button, Typography, Box, Snackbar, Alert, Card,
    InputAdornment, Avatar, Tabs, Tab, CircularProgress, useTheme
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountBoxIcon from '@mui/icons-material/AccountBox';

import { AuthContext } from "./AuthContext";

export default function Login() {
    const { setUser, setToken } = useContext(AuthContext);
    const theme = useTheme();
    const navigate = useNavigate();

    // 0 = Membru (Card Bibliotecă), 1 = Staff (Username)
    const [loginTab, setLoginTab] = useState(0);

    // Form States
    const [libraryCardNumber, setLibraryCardNumber] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Snackbar State
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

    const showMessage = (message, severity = "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (_, reason) => {
        if (reason === "clickaway") return;
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const isStaff = loginTab === 1;

        if (!password) {
            return showMessage("Te rugăm să introduci parola.", "error");
        }
        if (!isStaff && !libraryCardNumber.trim()) {
            return showMessage("Introdu numărul cardului de bibliotecă.", "error");
        }
        if (isStaff && !username.trim()) {
            return showMessage("Introdu numele de utilizator (username).", "error");
        }

        setLoading(true);

        try {
            const body = {
                password,
                username: isStaff ? username : "",
                libraryCardNumber: !isStaff ? libraryCardNumber : "",
            };

            // 1. Cerere Login
            const response = await fetch("http://localhost:8080/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const token = await response.text();
                sessionStorage.setItem("token", token);
                setToken(token);

                // 2. Obținere Date Utilizator
                const userResponse = await fetch("http://localhost:8080/users/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUser(userData);
                    sessionStorage.setItem("user", JSON.stringify(userData));
                    navigate("/home");
                } else {
                    showMessage("Autentificare reușită, dar nu am putut obține datele profilului.", "warning");
                }
            } else {
                const errorText = await response.text();
                showMessage(errorText || "Autentificare eșuată. Verifică datele introduse.", "error");
            }
        } catch (error) {
            showMessage("Eroare de conexiune la server.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                background: theme.palette.mode === 'dark'
                    ? "radial-gradient(circle at 50% 0%, #1e293b, #0f172a)"
                    : "radial-gradient(circle at 50% 0%, #e0f2fe, #bfdbfe)"
            }}
        >
            <Card
                elevation={10}
                sx={{
                    maxWidth: 450,
                    width: "100%",
                    p: { xs: 3, md: 5 },
                    borderRadius: 4,
                    backdropFilter: "blur(12px)",
                    backgroundColor: theme.palette.mode === 'dark' ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)"
                }}
            >
                <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56, mb: 2, boxShadow: 3 }}>
                        <LockOutlinedIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" fontWeight="900" color="text.primary" gutterBottom>
                        Bine ai revenit
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        Conectează-te pentru a accesa contul tău
                    </Typography>
                </Box>

                <Tabs
                    value={loginTab}
                    onChange={(e, newVal) => {
                        setLoginTab(newVal);
                        setLibraryCardNumber("");
                        setUsername("");
                        setPassword("");
                    }}
                    variant="fullWidth"
                    sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        icon={<AccountBoxIcon sx={{ mb: 0.5 }} />}
                        label="Membru"
                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    />
                    <Tab
                        icon={<AdminPanelSettingsIcon sx={{ mb: 0.5 }} />}
                        label="Staff"
                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    />
                </Tabs>

                <form onSubmit={handleSubmit}>
                    {loginTab === 0 ? (
                        <TextField
                            label="Număr Card Bibliotecă"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={libraryCardNumber}
                            onChange={(e) => setLibraryCardNumber(e.target.value)}
                            required
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CreditCardIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    ) : (
                        <TextField
                            label="Nume Utilizator (Username)"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}

                    <TextField
                        label="Parolă"
                        type="password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        sx={{ mb: 1 }} // Am redus marginea de jos pentru a face loc link-ului
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <VpnKeyIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Link-ul pentru Mi-am uitat parola */}
                    <Box textAlign="right" mb={3}>
                        <Link
                            to="/forgot-password"
                            style={{
                                color: theme.palette.primary.main,
                                fontSize: "0.875rem",
                                fontWeight: "bold",
                                textDecoration: "none"
                            }}
                        >
                            Mi-am uitat parola
                        </Link>
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 'bold',
                            fontSize: '1.05rem',
                            textTransform: 'none',
                            boxShadow: 3
                        }}
                    >
                        {loading ? "Se autentifică..." : "Conectare"}
                    </Button>
                </form>

                <Box mt={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                        Nu ai încă un cont?{" "}
                        <Link
                            to="/register"
                            style={{
                                color: theme.palette.primary.main,
                                fontWeight: 'bold',
                                textDecoration: 'none'
                            }}
                        >
                            Înregistrează-te acum
                        </Link>
                    </Typography>
                </Box>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}