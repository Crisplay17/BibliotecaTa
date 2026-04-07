import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Box,
    Typography,
    Snackbar,
    Alert,
    CircularProgress,
    Card,
    CardActionArea,
    CardContent,
    Grid,
    Avatar,
    useTheme,
    alpha,
    Button
} from "@mui/material";
import {
    AddCircle,
    Edit,
    Receipt,
    People,
    PeopleAlt,
    Dashboard as DashboardIcon
} from "@mui/icons-material";
import { AuthContext } from "../Logare user/AuthContext";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const { token } = useContext(AuthContext);

    const navigateToLogin = useCallback(() => {
        navigate("/login");
    }, [navigate]);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            if (!token) {
                navigateToLogin();
                return;
            }
            try {
                const dashboardResponse = await fetch(
                    "http://localhost:8080/users/dashboard",
                    {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (!dashboardResponse.ok) {
                    throw new Error("Nu ai permisiunea să accesezi dashboard-ul.");
                }

                const dashboardData = await dashboardResponse.json();

                if (
                    dashboardData.message &&
                    !dashboardData.message.includes("Acces la dashboard permis pentru bibliotecar")
                ) {
                    throw new Error("Nu ai permisiunea să accesezi dashboard-ul.");
                }
            } catch (error) {
                console.error(error.message);
                setError(error.message);
                setOpenSnackbar(true);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigateToLogin, token]);

    // Configurarea modulelor din Dashboard pentru a le randa dinamic
    const dashboardModules = [
        {
            title: "Adaugă carte",
            description: "Introdu o carte nouă în sistem.",
            icon: <AddCircle fontSize="large" />,
            path: "/dashboard/add-book",
            colorKey: "primary"
        },
        {
            title: "Editează carte",
            description: "Modifică sau șterge cărți existente.",
            icon: <Edit fontSize="large" />,
            path: "/dashboard/edit-book",
            colorKey: "warning"
        },
        {
            title: "Gestionare Împrumuturi",
            description: "Aprobă, refuză și urmărește cărțile.",
            icon: <Receipt fontSize="large" />,
            path: "/dashboard/borrow-book",
            colorKey: "info"
        },
        {
            title: "Utilizatori înregistrați",
            description: "Gestionează membrii bibliotecii.",
            icon: <People fontSize="large" />,
            path: "/dashboard/users",
            colorKey: "success"
        },
        {
            title: "Aprobări conturi",
            description: "Cererile de înregistrare în așteptare.",
            icon: <PeopleAlt fontSize="large" />,
            path: "/dashboard/pending-users",
            colorKey: "secondary"
        }
    ];

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default, py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">

                {/* Antet Dashboard */}
                <Box display="flex" flexDirection="column" alignItems="center" mb={6}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mb: 2, boxShadow: 3 }}>
                        <DashboardIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h3" align="center" fontWeight={800} color="text.primary" gutterBottom>
                        Panou Bibliotecar
                    </Typography>
                    <Typography variant="h6" align="center" color="text.secondary" maxWidth="600px">
                        Gestionează rapid cărțile, membrii și activitatea bibliotecii dintr-un singur loc.
                    </Typography>
                </Box>

                {/* Stare Încărcare */}
                {loading ? (
                    <Box display="flex" justifyContent="center" my={10}>
                        <CircularProgress size={60} thickness={4} />
                    </Box>
                ) : error ? (
                    /* Stare Eroare */
                    <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius={4} boxShadow={2}>
                        <Typography variant="h5" color="error" fontWeight="bold" gutterBottom>
                            Acces Respins
                        </Typography>
                        <Typography variant="body1" color="text.secondary" mb={3}>
                            {error}
                        </Typography>
                        <Button variant="contained" onClick={navigateToLogin} sx={{ borderRadius: 2 }}>
                            Întoarce-te la Autentificare
                        </Button>
                    </Box>
                ) : (
                    /* Grila cu Module (Se afișează doar dacă nu sunt erori și loading-ul e gata) */
                    <Grid container spacing={4} justifyContent="center">
                        {dashboardModules.map((module, index) => {
                            const mainColor = theme.palette[module.colorKey].main;
                            const bgColor = alpha(mainColor, 0.1);

                            return (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card
                                        elevation={2}
                                        sx={{
                                            borderRadius: 4,
                                            height: '100%',
                                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            "&:hover": {
                                                transform: "translateY(-8px)",
                                                boxShadow: `0 12px 24px ${alpha(mainColor, 0.2)}`
                                            }
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => navigate(module.path)}
                                            sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                        >
                                            <Avatar
                                                sx={{
                                                    bgcolor: bgColor,
                                                    color: mainColor,
                                                    width: 72,
                                                    height: 72,
                                                    mb: 3,
                                                    transition: '0.3s',
                                                }}
                                            >
                                                {module.icon}
                                            </Avatar>
                                            <CardContent sx={{ p: 0, textAlign: 'center', flexGrow: 1 }}>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                    {module.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {module.description}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>

            {/* Snackbar pentru Erori */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={5000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity="error" variant="filled" onClose={() => setOpenSnackbar(false)} sx={{ width: '100%', borderRadius: 2 }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}