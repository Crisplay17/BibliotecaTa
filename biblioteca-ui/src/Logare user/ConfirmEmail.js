import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
    Container,
    Typography,
    Box,
    Button,
    CircularProgress,
    Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

export default function ConfirmEmail() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState("Se validează confirmarea...");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const confirmEmailAsync = async () => {
            console.log("🚀 Începe procesul de confirmare email");

            const token = searchParams.get("token");
            console.log("🎫 Token din URL:", token);

            if (!token) {
                console.error("❌ Token lipsește din URL");
                setMessage("Token-ul de confirmare lipsește din URL.");
                setError(true);
                setLoading(false);
                return;
            }

            try {
                console.log("📡 Trimit request la backend...");
                const response = await fetch(`http://localhost:8080/users/confirm-email?token=${token}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/plain, application/json, */*',
                    },
                });

                console.log("📥 Status răspuns:", response.status);
                console.log("📥 Status OK:", response.ok);

                // Citește răspunsul ca text indiferent de Content-Type
                const responseText = await response.text();
                console.log("📝 Răspuns text brut:", responseText);

                let finalMessage = responseText;
                let isError = false;

                // Încearcă să parseze ca JSON dacă arată ca JSON
                if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                    try {
                        const jsonData = JSON.parse(responseText);
                        console.log("📄 Răspuns parsat ca JSON:", jsonData);
                        finalMessage = jsonData.message || responseText;
                        // Verifică explicit success field-ul din JSON
                        isError = jsonData.success === false;
                    } catch (jsonError) {
                        console.log("⚠️ Nu e JSON valid, folosesc text-ul brut");
                        // Pentru text brut, verifică mesajele comune de eroare
                        isError = isErrorMessage(responseText) || !response.ok;
                    }
                } else {
                    // Pentru răspunsuri text, verifică mesajele comune de eroare
                    isError = isErrorMessage(responseText) || !response.ok;
                }

                // Dacă nu avem mesaj, folosește unul default
                if (!finalMessage || finalMessage.trim() === '') {
                    finalMessage = response.ok
                        ? "Email confirmat cu succes! Așteaptă aprobarea bibliotecarului."
                        : "Eroare la confirmarea emailului.";
                    isError = !response.ok;
                }

                console.log("✅ Mesaj final:", finalMessage);
                console.log("❌ Este eroare:", isError);

                setMessage(finalMessage);
                setError(isError);

            } catch (fetchError) {
                console.error("💥 Eroare la request:", fetchError);
                setMessage("Eroare de conexiune cu serverul. Verifică dacă backend-ul rulează.");
                setError(true);
            } finally {
                setLoading(false);
                console.log("🏁 Procesul s-a terminat");
            }
        };

        // Funcție helper pentru a detecta mesaje de eroare
        const isErrorMessage = (message) => {
            const errorKeywords = [
                'token invalid',
                'token expired',
                'token expirat',
                'eroare',
                'error',
                'failed',
                'eșuat',
                'invalid',
                'nu există',
                'not found'
            ];

            const lowerMessage = message.toLowerCase();
            return errorKeywords.some(keyword => lowerMessage.includes(keyword));
        };

        // Mică întârziere pentru UX
        setTimeout(confirmEmailAsync, 800);
    }, [searchParams]);

    console.log("🎨 Render component:", { loading, error, message });

    return (
        <Container maxWidth="sm" sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Paper
                elevation={8}
                sx={{
                    p: 6,
                    borderRadius: 4,
                    textAlign: 'center',
                    minWidth: '400px',
                    backgroundColor: error ? '#ffebee' : (loading ? 'white' : '#e8f5e8'),
                    border: `3px solid ${error ? '#f44336' : (loading ? '#2196f3' : '#4caf50')}`
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <CircularProgress size={60} color="primary" />
                        <Typography variant="h6" color="primary" fontWeight={600}>
                            {message}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vă rugăm să așteptați...
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{ mb: 3 }}>
                            {error ? (
                                <ErrorIcon sx={{ fontSize: 80, color: '#f44336' }} />
                            ) : (
                                <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50' }} />
                            )}
                        </Box>

                        <Typography
                            variant="h4"
                            fontWeight={700}
                            gutterBottom
                            sx={{ color: error ? '#f44336' : '#4caf50', mb: 2 }}
                        >
                            {error ? "Eroare!" : "Succes!"}
                        </Typography>

                        <Typography
                            variant="h6"
                            sx={{
                                mb: 4,
                                color: '#333',
                                lineHeight: 1.6,
                                px: 2
                            }}
                        >
                            {message}
                        </Typography>

                        <Box sx={{ mt: 4 }}>
                            {!error ? (
                                <Button
                                    component={Link}
                                    to="/login"
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    sx={{
                                        px: 6,
                                        py: 2,
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderRadius: '25px',
                                        boxShadow: 3
                                    }}
                                >
                                    Mergi la autentificare
                                </Button>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Button
                                        component={Link}
                                        to="/register"
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        sx={{
                                            px: 4,
                                            py: 2,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderRadius: '25px'
                                        }}
                                    >
                                        Înregistrare nouă
                                    </Button>
                                    <Button
                                        component={Link}
                                        to="/home"
                                        variant="outlined"
                                        size="large"
                                        sx={{
                                            px: 4,
                                            py: 2,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderRadius: '25px'
                                        }}
                                    >
                                        Acasă
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}