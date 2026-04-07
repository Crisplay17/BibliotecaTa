import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    Container,
    Typography,
    CardMedia,
    CircularProgress,
    Box,
    Button,
    useTheme,
    Grid,
    Paper,
    Snackbar,
    Alert,
} from "@mui/material";

export default function BookDetails() {
    const { bookId } = useParams();
    const theme = useTheme();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loanStatus, setLoanStatus] = useState("NONE");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await fetch(`http://localhost:8080/books/${bookId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBook(data);
                } else {
                    setBook(null);
                }
            } catch (error) {
                console.error("Eroare la încărcarea detaliilor:", error);
                setBook(null);
            } finally {
                setLoading(false);
            }
        };

        const fetchLoanStatus = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) return;

                const response = await fetch(`http://localhost:8080/loans/status/${bookId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setLoanStatus(data.status);
                }
            } catch (error) {
                console.error("Eroare la obținerea statusului împrumutului:", error);
            }
        };

        fetchBook();
        fetchLoanStatus();
    }, [bookId]);

    const handleLoanRequest = () => {
        if (["PENDING", "APPROVED", "OVERDUE"].includes(loanStatus)) return;
        window.location.href = `/loan-options/${bookId}`;
    };

    const handleReservationRequest = async () => {
        if (loanStatus === "RESERVED") {
            setSnackbar({ open: true, message: "Ai deja o rezervare activă pentru această carte.", severity: "warning" });
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            if (!token) {
                setSnackbar({ open: true, message: "Te rugăm să te autentifici pentru a putea face o rezervare.", severity: "error" });
                return;
            }

            const response = await fetch(`http://localhost:8080/loans/reserve/${bookId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ book: { id: bookId } }),
            });

            if (response.ok) {
                setLoanStatus("RESERVED"); // ✅ UI se actualizează instant
                setSnackbar({ open: true, message: "Rezervarea a fost creată cu succes!", severity: "success" });
            } else {
                let errorMessage = "Eroare la rezervare.";
                try {
                    const data = await response.json();
                    if (data.message) errorMessage = data.message;
                } catch {}
                setSnackbar({ open: true, message: errorMessage, severity: "error" });
            }
        } catch (error) {
            console.error("Eroare la rezervare:", error);
            setSnackbar({ open: true, message: "Eroare la rezervare. Încearcă din nou.", severity: "error" });
        }
    };

    const getButtonText = () => {
        switch (loanStatus) {
            case "APPROVED": return "Cartea este împrumutată"; // ✅ Text consistent
            case "PENDING": return "Cerere trimisă";
            case "DENIED": return "Cerere respinsă";
            case "OVERDUE": return "Întârziere la returnare!";
            case "RESERVED": return "Rezervare activă";
            case "AVAILABLE_FOR_PICKUP": return "Disponibilă pentru ridicare";
            default: return "Împrumută";
        }
    };

    const getButtonColor = () => {
        switch (loanStatus) {
            case "OVERDUE": return "#b71c1c"; // ✅ Roșu închis pentru overdue
            case "APPROVED": return "#2e7d32"; // ✅ Verde pentru approved (consistent cu BookCard)
            case "PENDING": return "#ff9800"; // ✅ Portocaliu pentru pending
            case "DENIED": return "#d32f2f"; // ✅ Roșu pentru denied
            case "RESERVED": return "#9e9e9e"; // ✅ Gri pentru reserved
            case "AVAILABLE_FOR_PICKUP": return "#43a047"; // Verde pentru ridicare
            default: return theme.palette.primary.main;
        }
    };


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!book) {
        return (
            <Container>
                <Typography variant="h5" mt={4} textAlign="center">
                    Cartea nu a fost găsită.
                </Typography>
            </Container>
        );
    }

    const publicationYear = book.publicationDate ? new Date(book.publicationDate).getFullYear() : "Nespecificat";
    const bookImage = book.coverImage;

    return (
        <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh", py: 6 }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={4}
                            sx={{
                                padding: 2,
                                backgroundColor: theme.palette.background.paper,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                borderRadius: 3,
                            }}
                        >
                            {bookImage ? (
                                <CardMedia
                                    component="img"
                                    image={`data:image/jpeg;base64,${bookImage}`}
                                    alt={book.title}
                                    sx={{
                                        width: 300,
                                        height: 450,
                                        borderRadius: 2,
                                        objectFit: "contain",
                                        backgroundColor: "#f0f0f0",
                                        boxShadow: 3,
                                        mb: 2,
                                    }}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        width: "100%",
                                        height: 400,
                                        backgroundColor: "#ccc",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        color: "#555",
                                        fontStyle: "italic",
                                        borderRadius: 2,
                                        mb: 2,
                                    }}
                                >
                                    Fără copertă
                                </Box>
                            )}

                            {book.available ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleLoanRequest}
                                    disabled={["PENDING", "APPROVED", "OVERDUE", "RESERVED", "AVAILABLE_FOR_PICKUP"].includes(loanStatus)}
                                    sx={{
                                        borderRadius: 2,
                                        padding: "12px",
                                        fontWeight: "bold",
                                        textTransform: "none",
                                        backgroundColor: getButtonColor(),
                                        color: "#fff",
                                        "&.Mui-disabled": {
                                            backgroundColor: getButtonColor(),
                                            color: "#fff",
                                            opacity: 1,
                                        },
                                        "&:hover": {
                                            backgroundColor: getButtonColor(),
                                            transform: "scale(1.03)",
                                        },
                                        mb: 2,
                                    }}
                                >
                                    {getButtonText()}
                                </Button>

                            ) : (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="secondary"
                                    onClick={handleReservationRequest}
                                    disabled={ loanStatus === "RESERVED" ||
                                        loanStatus === "AVAILABLE_FOR_PICKUP" ||
                                        loanStatus === "APPROVED" ||
                                        loanStatus === "OVERDUE"}
                                    sx={{
                                        borderRadius: 2,
                                        padding: "12px",
                                        fontWeight: "bold",
                                        textTransform: "none",
                                        borderColor:
                                            loanStatus === "RESERVED" || loanStatus === "AVAILABLE_FOR_PICKUP"
                                                ? "#1976d2"
                                                : "#d32f2f",
                                        color:
                                            loanStatus === "RESERVED" || loanStatus === "AVAILABLE_FOR_PICKUP"
                                                ? "#1976d2"
                                                : "#d32f2f",
                                        "&:hover": {
                                            backgroundColor:
                                                loanStatus === "RESERVED" || loanStatus === "AVAILABLE_FOR_PICKUP"
                                                    ? "rgba(25, 118, 210, 0.1)"
                                                    : "rgba(211, 47, 47, 0.1)",
                                            borderColor:
                                                loanStatus === "RESERVED" || loanStatus === "AVAILABLE_FOR_PICKUP"
                                                    ? "#1976d2"
                                                    : "#b71c1c",
                                        },
                                        mb: 2,
                                    }}

                                >
                                    {loanStatus === "RESERVED"
                                        ? "Rezervare activă"
                                        : loanStatus === "AVAILABLE_FOR_PICKUP"
                                            ? "Disponibilă pentru ridicare"
                                            : loanStatus === "APPROVED"
                                                ? "Cartea este împrumutată"
                                                : loanStatus === "OVERDUE"
                                                    ? "Întârziere la returnare"
                                                    : "Rezervă"}

                                </Button>

                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={4}
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                padding: 4,
                                borderRadius: 3,
                            }}
                        >
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                {book.title}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                de {book.author}
                            </Typography>

                            <Typography variant="body1" paragraph>
                                <strong>Descriere:</strong> {book.description || "Fără descriere."}
                            </Typography>

                            <Typography variant="body2" mb={1}>
                                <strong>Categorie:</strong> {book.category || "Nespecificată"}
                            </Typography>
                            <Typography variant="body2" mb={1}>
                                <strong>Disponibilitate:</strong> {book.available ? "Disponibil" : "Împrumutat"}
                            </Typography>
                            <Typography variant="body2" mb={1}>
                                <strong>An publicare:</strong> {publicationYear}
                            </Typography>
                            <Typography variant="body2" mb={1}>
                                <strong>ISBN:</strong> {book.isbn || "Nespecificat"}
                            </Typography>
                            <Typography variant="body2" mb={1}>
                                <strong>Exemplare totale:</strong> {book.totalCopies}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
}
