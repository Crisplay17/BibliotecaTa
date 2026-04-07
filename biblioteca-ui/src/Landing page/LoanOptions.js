import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Card, CardContent, Typography, Button, CircularProgress,
    Box, Snackbar, Alert, Grid, useTheme, Paper, IconButton, Avatar
} from "@mui/material";
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';

const LoanOptions = ({ bookId: propBookId }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { bookId: paramBookId } = useParams();
    const bookId = propBookId || paramBookId;

    const [loanDuration, setLoanDuration] = useState(14); // Standard 14 zile
    const [isLoanRequestSent, setIsLoanRequestSent] = useState(false);
    const [loanStatus, setLoanStatus] = useState("NONE");
    const [initialLoading, setInitialLoading] = useState(true);

    // UI States
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const showMessage = (message, severity = "info") => {
        setSnackbar({ open: true, message, severity });
    };

    useEffect(() => {
        const getLoanStatus = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) return;

                const response = await fetch(`http://localhost:8080/loans/status/${bookId}`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setLoanStatus(data.status);
                }
            } catch (error) {
                console.error("Eroare la obținerea statusului:", error);
            } finally {
                setInitialLoading(false);
            }
        };

        if (bookId) {
            getLoanStatus();
        } else {
            setInitialLoading(false);
        }
    }, [bookId]);

    const handleLoans = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            showMessage("Te rog autentifică-te pentru a împrumuta cartea.", "error");
            return;
        }

        setIsLoanRequestSent(true);

        try {
            const response = await fetch("http://localhost:8080/loans/request", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    book: { id: bookId },
                    loanDuration: loanDuration,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Eroare la procesarea cererii.');
            }

            showMessage("Cererea de împrumut a fost trimisă cu succes! 🎉", "success");
            setLoanStatus("PENDING");

            // Așteptăm 2 secunde ca utilizatorul să citească mesajul, apoi navigăm înapoi la carte
            setTimeout(() => {
                navigate(-1);
            }, 2000);

        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            setIsLoanRequestSent(false);
        }
    };

    // Date pentru cardurile de selecție a duratei
    const durationOptions = [
        { value: 7, label: "7 Zile", desc: "Împrumut scurt" },
        { value: 14, label: "14 Zile", desc: "Standard" },
        { value: 30, label: "30 Zile", desc: "Perioadă extinsă" }
    ];

    const renderStatusBanner = () => {
        const statusConfig = {
            APPROVED: { text: "Cartea este deja împrumutată de tine.", severity: "success" },
            PENDING: { text: "Cererea ta a fost trimisă și este în așteptare.", severity: "warning" },
            RESERVED: { text: "Ai deja o rezervare activă pentru această carte.", severity: "info" },
            AVAILABLE_FOR_PICKUP: { text: "Cartea te așteaptă la bibliotecă pentru ridicare.", severity: "success" },
            DENIED: { text: "Cererea ta anterioară a fost respinsă.", severity: "error" }
        };

        const config = statusConfig[loanStatus];
        if (!config) return null;

        return (
            <Alert severity={config.severity} variant="filled" sx={{ mb: 3, borderRadius: 2 }}>
                {config.text}
            </Alert>
        );
    };

    if (initialLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: propBookId ? "auto" : "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                bgcolor: propBookId ? "transparent" : (theme.palette.mode === 'dark' ? "background.default" : "grey.50")
            }}
        >
            <Card
                elevation={propBookId ? 0 : 6}
                sx={{
                    maxWidth: 500,
                    width: "100%",
                    borderRadius: 4,
                    border: propBookId ? "none" : `1px solid ${theme.palette.divider}`,
                    position: "relative"
                }}
            >
                {/* Buton Înapoi */}
                {!propBookId && (
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ position: 'absolute', top: 16, left: 16, color: 'text.secondary' }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                )}

                <CardContent sx={{ p: { xs: 3, md: 5 }, pt: !propBookId ? 8 : 3 }}>
                    <Box textAlign="center" mb={4}>
                        <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56, mx: "auto", mb: 2, boxShadow: 2 }}>
                            <EventAvailableIcon fontSize="large" />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Solicitare Împrumut
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Alege perioada pentru care dorești să păstrezi această carte.
                        </Typography>
                    </Box>

                    {loanStatus !== "NONE" && loanStatus !== "DENIED" ? (
                        <>
                            {renderStatusBanner()}
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => navigate(-1)}
                                sx={{ borderRadius: 2, py: 1.5 }}
                            >
                                Înapoi la detalii carte
                            </Button>
                        </>
                    ) : (
                        <>
                            {loanStatus === "DENIED" && renderStatusBanner()}

                            <Grid container spacing={2} mb={4}>
                                {durationOptions.map((option) => (
                                    <Grid item xs={12} sm={4} key={option.value}>
                                        <Paper
                                            elevation={loanDuration === option.value ? 4 : 0}
                                            onClick={() => setLoanDuration(option.value)}
                                            sx={{
                                                p: 2,
                                                textAlign: "center",
                                                cursor: "pointer",
                                                borderRadius: 3,
                                                border: "2px solid",
                                                borderColor: loanDuration === option.value ? "primary.main" : "divider",
                                                bgcolor: loanDuration === option.value ? "primary.light" : "background.paper",
                                                color: loanDuration === option.value ? "primary.contrastText" : "text.primary",
                                                transition: "all 0.2s ease-in-out",
                                                "&:hover": {
                                                    borderColor: "primary.main",
                                                    transform: "translateY(-2px)"
                                                }
                                            }}
                                        >
                                            <TimerIcon sx={{ mb: 1, opacity: 0.8 }} />
                                            <Typography variant="h6" fontWeight="bold">
                                                {option.label}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                {option.desc}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>

                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                onClick={handleLoans}
                                disabled={isLoanRequestSent}
                                startIcon={isLoanRequestSent ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: 'bold',
                                    fontSize: '1.05rem',
                                    textTransform: 'none'
                                }}
                            >
                                {isLoanRequestSent ? "Se procesează..." : "Trimite Cererea"}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LoanOptions;