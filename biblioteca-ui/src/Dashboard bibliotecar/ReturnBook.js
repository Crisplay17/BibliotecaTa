import { useState } from "react";
import { TextField, Button, Snackbar, Alert, Container, Typography } from "@mui/material";

export default function ReturnBook() {
    const [loanId, setLoanId] = useState("");
    const [error, setError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleReturnBook = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/loans/return/${loanId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setOpenSnackbar(true);
                setLoanId("");
            } else {
                throw new Error("Eroare la returnarea împrumutului");
            }
        } catch (error) {
            setError(error.message);
            setOpenSnackbar(true);
        }
    };

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom align="center">
                Returnează o Carte
            </Typography>
            <TextField
                label="ID Împrumut"
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                fullWidth
                margin="normal"
            />
            <Button
                variant="contained"
                color="primary"
                onClick={handleReturnBook}
                fullWidth
            >
                Returnează
            </Button>

            <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Container>
    );
}
