import { Button, Snackbar, Alert, Container, Typography } from "@mui/material";
import {useState} from "react";

export default function NotifyOverdue() {
    const [error, setError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleNotifyOverdue = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await fetch("http://localhost:8080/loans/notify-overdue", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setOpenSnackbar(true);
            } else {
                throw new Error("Eroare la trimiterea notificărilor");
            }
        } catch (error) {
            setError(error.message);
            setOpenSnackbar(true);
        }
    };

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom align="center">
                Notifică Împrumuturile Întârziate
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={handleNotifyOverdue}
                fullWidth
            >
                Trimite Notificări
            </Button>

            <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Container>
    );
}
