import React, { useState, useEffect } from "react";
import { TextField, Button, Typography, Box, Card, Snackbar, Alert, CircularProgress, useTheme, InputAdornment } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import VpnKeyIcon from '@mui/icons-material/VpnKey';

export default function ResetPassword() {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Extragem token-ul din URL (ex: ?token=abc-123)
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const isMatch = confirmPassword.length > 0 && password === confirmPassword;
    const isError = confirmPassword.length > 0 && password !== confirmPassword;

    // Dacă utilizatorul intră pe pagină fără token, îi dăm eroare direct
    useEffect(() => {
        if (!token) {
            setSnackbar({ open: true, message: "Link-ul este invalid. Lipsește token-ul de securitate.", severity: "error" });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) return setSnackbar({ open: true, message: "Token invalid.", severity: "error" });
        if (password.length < 8) return setSnackbar({ open: true, message: "Parola trebuie să aibă minim 8 caractere.", severity: "error" });
        if (password !== confirmPassword) return setSnackbar({ open: true, message: "Parolele nu coincid!", severity: "error" });

        setLoading(true);
        try {
            const response = await fetch("http://localhost:8080/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const text = await response.text();

            if (response.ok) {
                setSnackbar({ open: true, message: "🎉 Parola a fost resetată cu succes! Te redirecționăm...", severity: "success" });
                setTimeout(() => navigate("/login"), 3000);
            } else {
                setSnackbar({ open: true, message: text || "Eroare la resetare.", severity: "error" });
            }
        } catch (error) {
            setSnackbar({ open: true, message: "Eroare de conexiune la server.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2, background: theme.palette.mode === 'dark' ? "radial-gradient(circle at 50% 0%, #1e293b, #0f172a)" : "radial-gradient(circle at 50% 0%, #e0f2fe, #bfdbfe)" }}>
            <Card elevation={10} sx={{ maxWidth: 450, width: "100%", p: 4, borderRadius: 4 }}>
                <Box textAlign="center" mb={4}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>Setează o parolă nouă</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Te rugăm să introduci o parolă puternică pentru contul tău.
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Parolă nouă" type="password" variant="outlined" fullWidth required
                        value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading || !token}
                        sx={{ mb: 3 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><VpnKeyIcon color="action" /></InputAdornment> }}
                    />

                    <TextField
                        label="Confirmă parola nouă" type="password" variant="outlined" fullWidth required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading || !token}
                        error={isError} color={isMatch ? "success" : "primary"} focused={isMatch}
                        helperText={isMatch ? "Parolele coincid! ✅" : isError ? "Parolele nu coincid! ❌" : ""}
                        sx={{ mb: 4 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><VpnKeyIcon color={isMatch ? "success" : isError ? "error" : "action"} /></InputAdornment> }}
                    />

                    <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={loading || !token || !isMatch} sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Salvează Parola"}
                    </Button>
                </form>
            </Card>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}