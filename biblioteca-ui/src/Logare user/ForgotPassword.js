import React, { useState } from "react";
import { TextField, Button, Typography, Box, Container, Card, Snackbar, Alert, CircularProgress, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import EmailIcon from '@mui/icons-material/Email';

export default function ForgotPassword() {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.includes("@")) {
            setSnackbar({ open: true, message: "Te rugăm să introduci o adresă de email validă.", severity: "error" });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("http://localhost:8080/users/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const text = await response.text();
            setSnackbar({ open: true, message: text, severity: response.ok ? "success" : "error" });
            if (response.ok) setEmail("");
        } catch (error) {
            setSnackbar({ open: true, message: "Eroare la conexiunea cu serverul.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2, background: theme.palette.mode === 'dark' ? "radial-gradient(circle at 50% 0%, #1e293b, #0f172a)" : "radial-gradient(circle at 50% 0%, #e0f2fe, #bfdbfe)" }}>
            <Card elevation={10} sx={{ maxWidth: 450, width: "100%", p: 4, borderRadius: 4 }}>
                <Box textAlign="center" mb={3}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>Mi-am uitat parola</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Introdu adresa de email asociată contului tău, iar noi îți vom trimite un link securizat pentru resetare.
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Adresa de Email" variant="outlined" fullWidth required type="email"
                        value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}
                        sx={{ mb: 3 }}
                    />
                    <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />} sx={{ py: 1.5, borderRadius: 2 }}>
                        {loading ? "Se trimite..." : "Trimite link-ul de resetare"}
                    </Button>
                </form>

                <Box mt={3} textAlign="center">
                    <Link to="/login" style={{ color: theme.palette.primary.main, textDecoration: "none", fontWeight: "bold" }}>
                        Înapoi la Autentificare
                    </Link>
                </Box>
            </Card>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}