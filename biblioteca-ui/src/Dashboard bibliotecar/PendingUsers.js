import React, { useState, useEffect, useContext } from "react";
import {
    Container, Typography, Button, Stack, Paper, Box, CircularProgress,
    Avatar, Snackbar, Alert, Card, Divider
} from "@mui/material";
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import EmailIcon from '@mui/icons-material/Email';
import { AuthContext } from "../Logare user/AuthContext";

export default function PendingUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stări pentru notificări (Snackbar)
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchPendingUsers = async () => {
            try {
                setLoading(true);
                const res = await fetch("http://localhost:8080/users/pending-approval", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Eroare la încărcarea utilizatorilor în așteptare.");

                const data = await res.json();
                setUsers(data);
            } catch (err) {
                showSnackbar(err.message, "error");
            } finally {
                setLoading(false);
            }
        };

        fetchPendingUsers();
    }, [token]);

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAction = async (userId, action) => {
        try {
            const res = await fetch(`http://localhost:8080/users/${userId}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`Eroare la ${action === "approve" ? "aprobare" : "refuzare"}.`);

            // Eliminăm utilizatorul din listă după succes
            setUsers((prev) => prev.filter((u) => u.id !== userId));

            showSnackbar(
                action === "approve" ? "Utilizatorul a fost aprobat cu succes!" : "Utilizatorul a fost refuzat.",
                action === "approve" ? "success" : "info"
            );
        } catch (err) {
            showSnackbar(err.message, "error");
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header Secțiune */}
            <Box display="flex" alignItems="center" gap={2} mb={4}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                    <PendingActionsIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                    Aprobări Conturi Noi
                </Typography>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" my={8}>
                    <CircularProgress />
                </Box>
            ) : users.length === 0 ? (
                <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius={3} border="1px dashed" borderColor="divider">
                    <Typography variant="h6" color="text.secondary">
                        Nu există niciun utilizator în așteptare momentan. 🎉
                    </Typography>
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                    {users.map((user) => (
                        <Card
                            key={user.id}
                            elevation={2}
                            sx={{
                                borderRadius: 3,
                                transition: '0.2s',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                            }}
                        >
                            <Box
                                sx={{
                                    p: 2.5,
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    justifyContent: 'space-between',
                                    gap: 2
                                }}
                            >
                                {/* Info Utilizator */}
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48, fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                                            {user.firstName} {user.lastName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight="medium" mb={0.5}>
                                            @{user.username}
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                                            <EmailIcon sx={{ fontSize: 16 }} />
                                            <Typography variant="caption">{user.email}</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Acțiuni */}
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={1.5}
                                    sx={{ width: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}
                                >
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckCircleOutlineIcon />}
                                        onClick={() => handleAction(user.id, "approve")}
                                        fullWidth
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                    >
                                        Aprobă
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<HighlightOffIcon />}
                                        onClick={() => handleAction(user.id, "reject")}
                                        fullWidth
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                    >
                                        Refuză
                                    </Button>
                                </Stack>
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Snackbar pentru alerte */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}