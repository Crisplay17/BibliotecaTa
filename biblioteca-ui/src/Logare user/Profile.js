import React, { useState, useEffect, useMemo } from "react";
import {
    TextField, Button, Avatar, Card, Typography, Box, Snackbar, Alert, Tabs, Tab,
    useTheme, CardContent, CardMedia, Grid, Paper, Divider, CircularProgress, InputAdornment
} from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function ProfilePage() {
    const theme = useTheme();

    const [tabIndex, setTabIndex] = useState(0);

    // Date Utilizator (Editabile)
    const [profilePicture, setProfilePicture] = useState("/book-cover-placeholder.png");
    const [selectedPictureFile, setSelectedPictureFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    // Date Utilizator (Read-Only)
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [libraryCardNumber, setLibraryCardNumber] = useState("");

    // Parolă
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [authPassword, setAuthPassword] = useState("");

    // UI States
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [loading, setLoading] = useState(false);

    // Date Istoric
    const [activityHistory, setActivityHistory] = useState([]);

    useEffect(() => {
        const fetchFreshUserData = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) return;

            try {
                // Cerem datele proaspete direct din baza de date
                const response = await fetch("http://localhost:8080/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const userData = await response.json();

                    // Actualizăm interfața cu noile date
                    setUsername(userData.username || "");
                    setEmail(userData.email || "");
                    setFirstName(userData.firstName || "");
                    setLastName(userData.lastName || "");
                    setBirthDate(userData.birthDate || "");
                    setLibraryCardNumber(userData.libraryCardNumber || "");

                    // Suprascriem vechiul sessionStorage cu cel nou și complet
                    sessionStorage.setItem("user", JSON.stringify(userData));

                    // Încărcăm restul datelor
                    fetchProfilePicture(userData.id);
                    fetchUserLoans(userData.id);
                }
            } catch (error) {
                console.error("Eroare la încărcarea datelor de profil:", error);
            }
        };

        fetchFreshUserData();
    }, []);

    // Prevenire Memory Leaks la schimbarea imaginii
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const showMessage = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchProfilePicture = async (userId) => {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8080/users/getProfilePicture/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                setProfilePicture(imageUrl);
                localStorage.setItem("profilePicture", imageUrl);
            } else {
                setProfilePicture("/book-cover-placeholder.png");
            }
        } catch (error) {
            setProfilePicture("/book-cover-placeholder.png");
        }
    };

    const fetchUserLoans = async (userId) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/loans/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setActivityHistory(data);
            }
        } catch {
            setActivityHistory([]);
        }
    };

    const categorizedLoans = useMemo(() => {
        const now = new Date();
        return {
            pending: activityHistory.filter(loan => loan.status === "PENDING"),
            approved: activityHistory.filter(loan => loan.status === "APPROVED" && new Date(loan.returnDate) > now),
            overdue: activityHistory.filter(loan => loan.status === "APPROVED" && new Date(loan.returnDate) <= now),
            reserved: activityHistory.filter(loan => loan.status === "RESERVED"),
            availableForPickup: activityHistory.filter(loan => loan.status === "AVAILABLE_FOR_PICKUP"),
            rejected: activityHistory.filter(loan => loan.status === "DENIED" || loan.status === "REJECTED"),
            returned: activityHistory.filter(loan => loan.status === "RETURNED"),
        };
    }, [activityHistory]);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // ==========================================
    // LOGICĂ ACTUALIZARE DATE PERSONALE
    // ==========================================
    const handleUpdatePersonalInfo = async () => {
        if (!username.trim() || !email.trim()) {
            return showMessage("Completează toate câmpurile.", "error");
        }
        if (!validateEmail(email)) {
            return showMessage("Adresa de email nu este validă.", "error");
        }
        if (!authPassword) {
            return showMessage("Introdu parola curentă pentru a confirma modificările.", "error");
        }

        const token = sessionStorage.getItem("token");
        const storedUser = JSON.parse(sessionStorage.getItem("user"));
        if (!token || !storedUser) return showMessage("Nu ești autentificat.", "error");

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/users/update/${storedUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username,
                    email,
                    currentPassword: authPassword
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Eroare la actualizarea datelor.");
            }

            const updatedUser = { ...storedUser, username, email };
            sessionStorage.setItem("user", JSON.stringify(updatedUser));

            showMessage("Datele au fost actualizate cu succes!", "success");
            setAuthPassword("");
        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOGICĂ SCHIMBARE PAROLĂ
    // ==========================================
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return showMessage("Completează toate câmpurile pentru parolă.", "error");
        }
        if (newPassword !== confirmPassword) {
            return showMessage("Parolele noi nu coincid.", "error");
        }

        const token = sessionStorage.getItem("token");
        const storedUser = JSON.parse(sessionStorage.getItem("user"));
        if (!token || !storedUser) return showMessage("Nu ești autentificat.", "error");

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/users/change-password/${storedUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Eroare la schimbarea parolei. Verifică parola curentă.");
            }

            showMessage("Parola a fost schimbată cu succes!", "success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePictureChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
                return showMessage("Fișierul trebuie să fie în format JPEG sau PNG.", "error");
            }
            setSelectedPictureFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfilePicture = async () => {
        if (!selectedPictureFile) return showMessage("Selectează o poză înainte de a actualiza.", "error");

        const token = sessionStorage.getItem("token");
        const storedUser = JSON.parse(sessionStorage.getItem("user"));

        if (!token || !storedUser) return showMessage("Ești neautentificat. Reîncearcă.", "error");

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedPictureFile);

            const response = await fetch(`http://localhost:8080/users/updateProfilePicture/${storedUser.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) throw new Error("Eroare la actualizarea pozei.");

            await fetchProfilePicture(storedUser.id);
            showMessage("Poza de profil a fost actualizată cu succes.");
            setSelectedPictureFile(null);
            setPreviewUrl(null);
        } catch (error) {
            showMessage(error.message || "A apărut o eroare.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        window.location.href = "/login";
    };

    const getStatusChip = (status) => {
        const config = {
            PENDING: { color: "#ff9800", bg: "#fff3e0", text: "În așteptare" },
            APPROVED: { color: "#2e7d32", bg: "#e8f5e9", text: "Activ" },
            OVERDUE: { color: "#d32f2f", bg: "#ffebee", text: "Întârziat" },
            RESERVED: { color: "#7b1fa2", bg: "#f3e5f5", text: "Rezervat" },
            AVAILABLE_FOR_PICKUP: { color: "#43a047", bg: "#e8f5e9", text: "Gata de ridicat" },
            REJECTED: { color: "#757575", bg: "#fafafa", text: "Refuzat" },
            RETURNED: { color: "#1976d2", bg: "#e3f2fd", text: "Returnat" }
        }[status] || { color: "#ff9800", bg: "#fff3e0", text: "În așteptare" };

        return (
            <Box sx={{
                display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5,
                borderRadius: 2, backgroundColor: config.bg, color: config.color,
                fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5
            }}>
                {config.text}
            </Box>
        );
    };

    const renderModernSection = (title, loans, icon) => (
        <Box mb={5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, p: 2, borderRadius: 3, bgcolor: theme.palette.mode === "dark" ? 'background.paper' : 'primary.light', boxShadow: 1 }}>
                <Box sx={{ fontSize: "2rem" }}>{icon}</Box>
                <Typography variant="h5" fontWeight={700} color="text.primary">{title} ({loans.length})</Typography>
            </Box>

            {loans.length === 0 ? (
                <Box sx={{ textAlign: "center", p: 4, borderRadius: 3, bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `2px dashed ${theme.palette.divider}` }}>
                    <Typography color="text.secondary" fontStyle="italic">Nu există elemente în această categorie.</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {loans.map((loan) => (
                        <Grid item xs={12} sm={6} lg={4} key={loan.id}>
                            <Card sx={{ height: "100%", borderRadius: 4, overflow: "hidden", transition: "all 0.3s ease", "&:hover": { transform: "translateY(-6px)", boxShadow: 6 } }}>
                                <Box sx={{ position: "relative" }}>
                                    <CardMedia
                                        component="img" height="200"
                                        image={loan.book?.id ? `http://localhost:8080/books/image/${loan.book.id}` : "/book-cover-placeholder.png"}
                                        alt={loan.book?.title}
                                        sx={{ objectFit: "cover", filter: loan.status === "OVERDUE" ? "sepia(20%)" : "none" }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = "/book-cover-placeholder.png"; }}
                                    />
                                    <Box sx={{ position: "absolute", top: 12, right: 12 }}>{getStatusChip(loan.status)}</Box>
                                </Box>

                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="h6" fontWeight={600} noWrap title={loan.book?.title}>{loan.book?.title || "Titlu necunoscut"}</Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>de {loan.book?.author || "Autor necunoscut"}</Typography>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {["RESERVED", "AVAILABLE_FOR_PICKUP"].includes(loan.status) ? "Data rezervării:" : "Data cererii:"}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={500}>
                                                {loan.loanDate ? new Date(loan.loanDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                                            </Typography>
                                        </Box>
                                        {loan.returnDate && ["APPROVED", "OVERDUE", "RETURNED"].includes(loan.status) && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {loan.status === "RETURNED" ? "Returnat pe:" : loan.status === "APPROVED" && new Date(loan.returnDate) > new Date() ? "Returnare până:" : "Data returnării:"}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500} color={loan.status === "OVERDUE" ? "error.main" : "text.primary"}>
                                                    {new Date(loan.returnDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );

    return (
        <Box sx={{ background: theme.palette.mode === 'dark' ? "radial-gradient(circle at 50% 0%, #1e293b, #0f172a)" : "radial-gradient(circle at 50% 0%, #e0f2fe, #bfdbfe)", minHeight: "100vh", p: { xs: 2, md: 4 }, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            <Card sx={{ width: "100%", maxWidth: 1000, borderRadius: 5, p: { xs: 2, md: 4 }, backdropFilter: "blur(12px)", backgroundColor: theme.palette.mode === 'dark' ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)", boxShadow: 8 }}>

                <Box textAlign="center" mb={4}>
                    <Avatar src={profilePicture} sx={{ width: 80, height: 80, mx: "auto", mb: 2, border: "3px solid", borderColor: "primary.main", boxShadow: 2 }} />
                    <Typography variant="h4" fontWeight={800} color="text.primary">Contul Meu</Typography>
                    <Typography variant="body1" color="text.secondary">@{username}</Typography>
                </Box>

                <Tabs
                    value={tabIndex}
                    onChange={(e, newValue) => setTabIndex(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                        mb: 4,
                        borderBottom: 1,
                        borderColor: 'divider',
                        // Magia pentru centrare:
                        '& .MuiTabs-flexContainer': {
                            justifyContent: { xs: 'flex-start', sm: 'center' }
                        }
                    }}
                >
                    <Tab iconPosition="start" icon={<PersonIcon />} label="Informații" sx={{ fontWeight: 'bold' }} />
                    <Tab iconPosition="start" icon={<PhotoCameraIcon />} label="Poză" sx={{ fontWeight: 'bold' }} />
                    <Tab iconPosition="start" icon={<LockIcon />} label="Securitate" sx={{ fontWeight: 'bold' }} />
                    <Tab iconPosition="start" icon={<HistoryIcon />} label="Activitate" sx={{ fontWeight: 'bold' }} />
                    <Tab iconPosition="start" icon={<LogoutIcon />} label="Setări" sx={{ fontWeight: 'bold' }} />
                </Tabs>

                <Box sx={{ minHeight: 400 }}>
                    {/* TAB 0: INFORMAȚII */}
                    {tabIndex === 0 && (
                        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, border: "1px solid", borderColor: "divider", maxWidth: 650, mx: "auto" }}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>Date Oficiale</Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Prenume" value={firstName} fullWidth disabled
                                        InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Nume de familie" value={lastName} fullWidth disabled
                                        InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Data Nașterii" value={birthDate ? new Date(birthDate).toLocaleDateString("ro-RO") : ""} fullWidth disabled
                                        InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Card Bibliotecă" value={libraryCardNumber || "N/A"} fullWidth disabled
                                        InputProps={{ startAdornment: <InputAdornment position="start"><CreditCardIcon /></InputAdornment> }}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 3 }}>Date Cont (Editabile)</Divider>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth
                                        InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircleIcon /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth
                                        InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 3 }}>Confirmare Securitate</Divider>

                            <TextField
                                label="Parola curentă" type="password" value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)} fullWidth sx={{ mb: 4 }}
                                helperText="Pentru a modifica datele contului, trebuie să introduci parola curentă."
                                autoComplete="new-password"
                                InputProps={{ startAdornment: <InputAdornment position="start"><VpnKeyIcon color="error" /></InputAdornment> }}
                            />

                            <Button
                                variant="contained" size="large" fullWidth disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleUpdatePersonalInfo} sx={{ borderRadius: 2, py: 1.5 }}
                            >
                                {loading ? "Se salvează..." : "Salvează Modificările"}
                            </Button>
                        </Paper>
                    )}

                    {/* TAB 1: POZA PROFIL */}
                    {tabIndex === 1 && (
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", maxWidth: 600, mx: "auto", textAlign: "center" }}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>Actualizare Fotografie</Typography>
                            <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                                <Avatar src={previewUrl || profilePicture} sx={{ width: 180, height: 180, border: "4px solid", borderColor: "divider", boxShadow: 2 }} />
                                <Box width="100%" maxWidth={300}>
                                    <Button variant="outlined" component="label" fullWidth startIcon={<PhotoCameraIcon />} sx={{ mb: 2, borderRadius: 2, textTransform: 'none' }}>
                                        Alege o poză nouă
                                        <input type="file" accept="image/jpeg, image/png" hidden onChange={handlePictureChange} />
                                    </Button>
                                    <Button variant="contained" fullWidth onClick={handleUpdateProfilePicture} disabled={!selectedPictureFile || loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />} sx={{ mb: 2, borderRadius: 2, py: 1.2 }}>
                                        {loading ? "Se încarcă..." : "Salvează Fotografia"}
                                    </Button>
                                    {profilePicture !== "/book-cover-placeholder.png" && (
                                        <Button variant="text" color="error" fullWidth onClick={() => { setProfilePicture("/book-cover-placeholder.png"); setSelectedPictureFile(null); setPreviewUrl(null); showMessage("Poza a fost ștearsă."); }}>
                                            Șterge poza curentă
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* TAB 2: PAROLĂ */}
                    {tabIndex === 2 && (
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", maxWidth: 500, mx: "auto" }}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>Schimbare Parolă</Typography>
                            <TextField
                                label="Parola curentă" type="password" value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)} fullWidth sx={{ mb: 3 }}
                                autoComplete="new-password"
                                InputProps={{ startAdornment: <InputAdornment position="start"><VpnKeyIcon /></InputAdornment> }}
                            />
                            <Divider sx={{ mb: 3 }} />
                            <TextField
                                label="Parola nouă" type="password" value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} fullWidth sx={{ mb: 3 }}
                                autoComplete="new-password"
                                InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment> }}
                            />
                            <TextField
                                label="Confirmă parola nouă" type="password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} fullWidth sx={{ mb: 4 }}
                                autoComplete="new-password"
                                InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment> }}
                            />
                            <Button
                                variant="contained" size="large" fullWidth disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleChangePassword} sx={{ borderRadius: 2, py: 1.5 }}
                            >
                                {loading ? "Se actualizează..." : "Actualizează Parola"}
                            </Button>
                        </Paper>
                    )}

                    {/* TAB 3: ISTORIC */}
                    {tabIndex === 3 && (
                        <Box>
                            {renderModernSection("Cereri în așteptare", categorizedLoans.pending, "⏳")}
                            {renderModernSection("Gata de ridicat", categorizedLoans.availableForPickup, "📦")}
                            {renderModernSection("Rezervări", categorizedLoans.reserved, "📋")}
                            {renderModernSection("Împrumuturi active", categorizedLoans.approved, "✅")}
                            {renderModernSection("Întârziate", categorizedLoans.overdue, "⚠️")}
                            {renderModernSection("Returnate", categorizedLoans.returned, "📚")}
                            {renderModernSection("Refuzate", categorizedLoans.rejected, "❌")}
                        </Box>
                    )}

                    {/* TAB 4: SETĂRI/LOGOUT */}
                    {tabIndex === 4 && (
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", maxWidth: 500, mx: "auto", textAlign: "center" }}>
                            <Typography variant="h6" fontWeight="bold" color="error" mb={2}>Zona de Pericol</Typography>
                            <Typography variant="body2" color="text.secondary" mb={4}>Acțiunea de deconectare va șterge sesiunea curentă de pe acest dispozitiv.</Typography>
                            <Button variant="contained" color="error" size="large" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ borderRadius: 2, py: 1.5, px: 4 }}>
                                Deconectare Cont
                            </Button>
                        </Paper>
                    )}
                </Box>

                <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert variant="filled" severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: "100%", borderRadius: 2 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Card>
        </Box>
    );
}