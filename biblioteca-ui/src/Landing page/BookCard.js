import { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Grid, Box, Chip } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BookCard = ({ book, showRecentTag = false }) => {
    const navigate = useNavigate();
    const [loanStatus, setLoanStatus] = useState("NONE"); // Poate fi și RESERVED

    const bookImage = book.coverImage
        ? `data:image/jpeg;base64,${book.coverImage}`
        : "/book-cover-placeholder.png";

    const category = book.category || "Fiction";

    useEffect(() => {
        const fetchLoanStatus = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) return;

                const response = await fetch(`http://localhost:8080/loans/status/${book.id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setLoanStatus(data.status);
                } else {
                    console.error("Eroare API:", response.status);
                }
            } catch (error) {
                console.error("Eroare la obținerea statusului împrumutului:", error);
            }
        };

        fetchLoanStatus();
    }, [book.id]);

    const handleLoanRequest = (bookId) => {
        if (["PENDING", "APPROVED", "OVERDUE", "RESERVED"].includes(loanStatus)) return;
        navigate(`/loan-options/${bookId}`);
    };

    // Modificare: navighează către pagina de detalii carte
    const handleReservationRequest = (bookId) => {
        navigate(`/books/${bookId}`);
    };

    const getButtonText = () => {
        switch (loanStatus) {
            case "APPROVED": return "Cartea este împrumutată";
            case "PENDING": return "Cerere trimisă";
            case "DENIED": return "Cerere respinsă";
            case "OVERDUE": return "Întârziere la returnare!";
            case "RESERVED": return "Rezervare activă";
            case "AVAILABLE_FOR_PICKUP": return "Disponibilă pentru ridicare"; // nou
            default: return "Împrumută";
        }
    };


    return (
        <Grid item xs={12} sm={6} md={4} lg={3} sx={{ display: "flex", justifyContent: "center", padding: "20px" }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card
                    sx={{
                        width: 280,
                        height: 450,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                        borderRadius: "16px",
                        cursor: "pointer",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        background: "#fff",
                        "&:hover": {
                            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.3)",
                        },
                        position: "relative",
                    }}
                    onClick={() => {
                        navigate(`/books/${book.id}`);
                    }}
                >
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: "65%",
                            background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3))",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: "10px",
                            }}
                        >
                            <motion.img
                                src={bookImage}
                                alt={book.title}
                                style={{
                                    maxWidth: "90%",
                                    maxHeight: "90%",
                                    objectFit: "contain",
                                    borderRadius: "12px",
                                    margin: "0 auto",
                                    display: "block",
                                    transition: "transform 0.3s ease, filter 0.3s ease",
                                }}
                                whileHover={{
                                    scale: 1.25,
                                    filter: "brightness(1.3)",
                                    transition: { duration: 0.4 },
                                }}
                            />
                        </Box>
                        <Chip
                            label={category}
                            size="small"
                            sx={{
                                position: "absolute",
                                bottom: 10,
                                right: 10,
                                background: "rgba(255, 255, 255, 0.8)",
                                backdropFilter: "blur(5px)",
                                color: "#333",
                                fontWeight: "bold",
                                zIndex: 5,
                            }}
                        />
                    </Box>

                    {showRecentTag && (
                        <Box sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'red',
                            color: 'white',
                            px: 1,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                        }}>
                            Nou
                        </Box>
                    )}

                    <CardContent
                        sx={{
                            height: "35%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            padding: "16px",
                            background: "#fff",
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: "1.2rem", color: "#333" }}>
                            {book.title}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "1rem", color: "#777", marginBottom: 1 }}>
                            {book.author}
                        </Typography>

                        {book.available ? (

                            <Button
                                variant="contained"
                                disabled={["PENDING", "APPROVED", "OVERDUE", "RESERVED", "AVAILABLE_FOR_PICKUP"].includes(loanStatus)}
                                sx={{
                                    width: "100%",
                                    borderRadius: 2,
                                    padding: "10px",
                                    fontWeight: "bold",
                                    textTransform: "none",
                                    backgroundColor:
                                        loanStatus === "OVERDUE" ? "#b71c1c" :
                                            loanStatus === "APPROVED" ? "#2e7d32" :
                                                loanStatus === "PENDING" ? "#ff9800" :
                                                    loanStatus === "DENIED" ? "#d32f2f" :
                                                        loanStatus === "AVAILABLE_FOR_PICKUP" ? "#43a047" : // verde pentru ridicare
                                                            "#1976d2",
                                    color: "#fff",
                                    "&.Mui-disabled": {
                                        backgroundColor:
                                            loanStatus === "OVERDUE" ? "#b71c1c" :
                                                loanStatus === "APPROVED" ? "#2e7d32" :
                                                    loanStatus === "PENDING" ? "#ff9800" :
                                                        loanStatus === "DENIED" ? "#d32f2f" :
                                                            loanStatus === "RESERVED" ? "#9e9e9e" :
                                                                "#9e9e9e",
                                        color: "#fff",
                                        opacity: 1,
                                    },
                                    "&:hover": {
                                        backgroundColor:
                                            loanStatus === "OVERDUE" ? "#7f0000" :
                                                loanStatus === "APPROVED" ? "#1b5e20" :
                                                    loanStatus === "PENDING" ? "#ef6c00" :
                                                        loanStatus === "DENIED" ? "#c62828" :
                                                            loanStatus === "AVAILABLE_FOR_PICKUP" ? "#2e7d32" : // verde mai închis la hover
                                                                "#0056b3",
                                        transform: "scale(1.05)",
                                    },
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLoanRequest(book.id);
                                }}
                            >
                                {getButtonText()}
                            </Button>

                        ) : (
                            <Button
                                variant="contained"
                                sx={{
                                    width: "100%",
                                    borderRadius: 2,
                                    padding: "10px",
                                    fontWeight: "bold",
                                    textTransform: "none",
                                    backgroundColor:
                                        loanStatus === "RESERVED" || loanStatus === "AVAILABLE_FOR_PICKUP"
                                            ? "#9e9e9e" // gri pentru rezervare activă sau disponibilă pentru ridicare
                                            : loanStatus === "APPROVED" // ✅ Adăugat pentru consistență
                                                ? "#2e7d32" // verde pentru împrumutat
                                                : "#7b1fa2", // albastru pentru rezervă
                                    color: "#fff",
                                    "&.Mui-disabled": {
                                        backgroundColor:
                                            loanStatus === "RESERVED" || loanStatus === "AVAILABLE_FOR_PICKUP"
                                                ? "#9e9e9e"
                                                : loanStatus === "APPROVED" // ✅ Adăugat pentru consistență
                                                    ? "#2e7d32"
                                                    : "#9e9e9e",
                                        color: "#fff",
                                        opacity: 1,
                                    },
                                    "&:hover": {
                                        backgroundColor:
                                            loanStatus === "RESERVED" || loanStatus === "AVAILABLE_FOR_PICKUP"
                                                ? "#757575"
                                                : loanStatus === "APPROVED" // ✅ Adăugat pentru consistență
                                                    ? "#1b5e20" // verde mai închis la hover
                                                    : "#4a148c",
                                        transform: "scale(1.05)",
                                    },
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReservationRequest(book.id);
                                }}
                                disabled={ loanStatus === "RESERVED" ||
                                    loanStatus === "AVAILABLE_FOR_PICKUP" ||
                                    loanStatus === "APPROVED" ||
                                    loanStatus === "OVERDUE"}
                            >
                                {loanStatus === "RESERVED"
                                    ? "Rezervare activă"
                                    : loanStatus === "AVAILABLE_FOR_PICKUP"
                                        ? "Disponibilă pentru ridicare"
                                        : loanStatus === "APPROVED"
                                            ? "Cartea este împrumutată" // ✅ Text consistent
                                            : loanStatus === "OVERDUE"
                                                ? "Întârziere la returnare"
                                                : "Rezervă"}
                            </Button>

                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </Grid>
    );

};

export default BookCard;
