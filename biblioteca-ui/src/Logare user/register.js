import React, { useState } from "react";
import {
    TextField, Button, Typography, Grid, Box, Alert, LinearProgress,
    Snackbar, Card, InputAdornment, Avatar, CircularProgress, useTheme
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

// Funcție pentru generarea numărului de card
function generateLibraryCardNumber(firstName, lastName, birthDate) {
    if (!firstName || !lastName || !birthDate) return "";
    const initials = (firstName[0] + lastName[0]).toUpperCase();
    const dateStr = birthDate.replace(/-/g, "");
    const uniqueCode = String(Date.now()).slice(-3);
    return `${initials}${dateStr}${uniqueCode}`;
}

// Funcție de evaluare a puterii parolei
function passwordStrength(password) {
    let score = 0;
    if (!password) return score;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+={}[\]:;"'<>,.?/~`-]/.test(password)) score++;
    return score;
}

export default function Register() {
    const theme = useTheme();
    const navigate = useNavigate();

    // Form States
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Snackbar States
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Password Strength Data
    const strength = passwordStrength(password);
    const strengthLabels = ["Foarte slabă", "Slabă", "Medie", "Puternică", "Excelentă"];
    const strengthColors = ["error", "error", "warning", "info", "success"];

    const showSnackbar = (message, severity = "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (_, reason) => {
        if (reason === "clickaway") return;
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validări frontend
        if (!firstName.trim() || !lastName.trim() || !birthDate) {
            return showSnackbar("Completează prenumele, numele și data nașterii.");
        }
        if (!email.includes("@")) {
            return showSnackbar("Adresa de email este invalidă.");
        }
        if (password !== confirmPassword) {
            return showSnackbar("Parolele nu se potrivesc!");
        }
        if (strength < 3) {
            return showSnackbar("Parola este prea slabă. Adaugă cifre și simboluri.");
        }

        setLoading(true);

        const cardNumber = generateLibraryCardNumber(firstName, lastName, birthDate);

        try {
            const response = await fetch("http://localhost:8080/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    firstName,
                    lastName,
                    birthDate,
                    libraryCardNumber: cardNumber,
                }),
            });

            if (response.ok) {
                showSnackbar("🎉 Înregistrare reușită! Vei fi redirecționat...", "success");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                const errorText = await response.text();
                showSnackbar(errorText || "Eroare la înregistrare.");
            }
        } catch (error) {
            showSnackbar("Eroare la conexiune cu serverul.");
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
                    maxWidth: 700,
                    width: "100%",
                    p: { xs: 3, md: 5 },
                    borderRadius: 4,
                    backdropFilter: "blur(12px)",
                    backgroundColor: theme.palette.mode === 'dark' ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)"
                }}
            >
                <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                    <Avatar sx={{ bgcolor: "secondary.main", width: 56, height: 56, mb: 2, boxShadow: 3 }}>
                        <PersonAddOutlinedIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" fontWeight="900" color="text.primary" gutterBottom textAlign="center">
                        Creează un Cont Nou
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        Alătură-te bibliotecii noastre pentru a împrumuta și rezerva cărți!
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Prenume"
                                variant="outlined"
                                fullWidth
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nume de familie"
                                variant="outlined"
                                fullWidth
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment> }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Data nașterii"
                                variant="outlined"
                                fullWidth
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon color="action" /></InputAdornment> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nume utilizator (Username)"
                                variant="outlined"
                                fullWidth
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Adresa de Email"
                                variant="outlined"
                                fullWidth
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Parola"
                                type="password"
                                variant="outlined"
                                fullWidth
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                InputProps={{ startAdornment: <InputAdornment position="start"><VpnKeyIcon color="action" /></InputAdornment> }}
                            />
                            {password && (
                                <Box sx={{ mt: 1, px: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(strength / 4) * 100}
                                        color={strengthColors[strength]}
                                        sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                                    />
                                    <Typography variant="caption" color={`${strengthColors[strength]}.main`} fontWeight="bold">
                                        Nivel securitate: {strengthLabels[strength]}
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Confirmă Parola"
                                type="password"
                                variant="outlined"
                                fullWidth
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                error={confirmPassword.length > 0 && password !== confirmPassword}
                                helperText={confirmPassword.length > 0 && password !== confirmPassword ? "Parolele nu coincid!" : ""}
                                InputProps={{ startAdornment: <InputAdornment position="start"><VpnKeyIcon color="action" /></InputAdornment> }}
                            />
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        fullWidth
                        size="large"
                        sx={{ mt: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold', fontSize: '1.05rem', textTransform: 'none', boxShadow: 3 }}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? "Se creează contul..." : "Creează Contul Acum"}
                    </Button>
                </form>

                <Box mt={3} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                        Ai deja un cont?{" "}
                        <Link to="/login" style={{ color: theme.palette.secondary.main, fontWeight: 'bold', textDecoration: 'none' }}>
                            Conectează-te aici
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