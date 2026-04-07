import React, { useState, useEffect, useMemo } from "react";
import {
    Container, Typography, Box, List, ListItem, Button, Snackbar, Alert,
    Card, CardContent, Chip, CardActions, TextField, FormControl,
    InputLabel, Select, MenuItem, Avatar, Paper, Grid, Collapse, IconButton, Tooltip, Divider
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import roLocale from 'date-fns/locale/ro';
import dayjs from "dayjs";

// Iconițe
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

export default function ViewLoans() {
    const [loans, setLoans] = useState([]);
    const [error, setError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [now, setNow] = useState(new Date());
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showChart, setShowChart] = useState(false);

    // Timer pentru actualizarea în timp real a timpului rămas
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await fetch("http://localhost:8080/loans", {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setLoans(data);
            } else {
                throw new Error("Eroare la obținerea împrumuturilor.");
            }
        } catch (error) {
            showError(error.message);
        }
    };

    const showError = (msg) => {
        setError(msg);
        setOpenSnackbar(true);
    };

    // --- ACȚIUNI API ---
    const handleAction = async (url, method = "POST", successMsg) => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await fetch(url, {
                method,
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (response.ok) {
                await fetchLoans();
                showError(successMsg); // Folosim snackbar-ul existent pentru succes
            } else {
                throw new Error("Eroare la procesarea cererii.");
            }
        } catch (error) {
            showError(error.message);
        }
    };

    const handleApproveLoan = (loan) => handleAction(`http://localhost:8080/loans/approve/${loan.id}`, "POST", "Împrumut aprobat!");
    const handleDenyLoan = (loan) => handleAction(`http://localhost:8080/loans/deny/${loan.id}`, "DELETE", "Împrumut refuzat!");
    const handleReturnLoan = (loan) => handleAction(`http://localhost:8080/loans/return/${loan.id}`, "POST", "Carte returnată cu succes!");
    const handleCancelReservation = (loan) => handleAction(`http://localhost:8080/loans/reservation/${loan.id}`, "DELETE", "Rezervare anulată.");
    const handleConfirmPickup = (loan) => handleAction(`http://localhost:8080/loans/pickup/${loan.id}`, "POST", "Ridicare confirmată.");
    const handleMarkAvailableForPickup = (loan) => handleAction(`http://localhost:8080/loans/mark-available/${loan.id}`, "POST", "Marcat ca disponibil pentru ridicare.");

    // --- LOGICA TIMPULUI RĂMAS ---
    const getTimeLeft = (returnDateStr) => {
        const returnTime = new Date(returnDateStr);
        const currentTime = now.getTime();
        const tzOffsetDiff = (now.getTimezoneOffset() - returnTime.getTimezoneOffset()) * 60000;
        const diff = returnTime.getTime() - currentTime + tzOffsetDiff + 2000;

        if (diff <= 0) return "⛔ Întârziat";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${days}z ${hours}h ${minutes}m ${seconds}s`;
    };

    // --- OPTIMIZARE: Filtrare și grupare cu useMemo ---
    // Asta previne recalcularea grea în fiecare secundă când timer-ul schimbă state-ul `now`
    const filteredLoans = useMemo(() => {
        return loans
            .filter((loan) =>
                loan.book?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter((loan) => {
                if (!startDate || !endDate) return true;
                const loanDate = dayjs(loan.loanDate);
                return loanDate.isAfter(dayjs(startDate).startOf("day")) && loanDate.isBefore(dayjs(endDate).endOf("day"));
            })
            .filter((loan) => statusFilter === "ALL" || loan.status === statusFilter)
            .filter((loan) => loan.status !== "RETURNED")
            .sort((a, b) => new Date(b.loanDate) - new Date(a.loanDate));
    }, [loans, searchTerm, startDate, endDate, statusFilter]);

    const groupedByDate = useMemo(() => {
        return filteredLoans.reduce((acc, loan) => {
            const date = new Date(loan.loanDate).toLocaleDateString("ro-RO", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            if (!acc[date]) acc[date] = [];
            acc[date].push(loan);
            return acc;
        }, {});
    }, [filteredLoans]);

    const chartData = useMemo(() => {
        return Object.entries(groupedByDate).map(([date, items]) => ({ date, count: items.length })).reverse();
    }, [groupedByDate]);

    // Helpers UI
    const getStatusConfig = (status) => {
        switch (status) {
            case "PENDING": return { label: "În așteptare", color: "warning" };
            case "APPROVED": return { label: "Împrumut activ", color: "success" };
            case "DENIED": return { label: "Refuzat", color: "error" };
            case "RETURNED": return { label: "Returnat", color: "default" };
            case "RESERVED": return { label: "Rezervare", color: "info" };
            case "AVAILABLE_FOR_PICKUP": return { label: "Gata de ridicat", color: "secondary" };
            default: return { label: status, color: "default" };
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>

            {/* Antet */}
            <Box display="flex" alignItems="center" gap={2} mb={4}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <AutoStoriesIcon fontSize="large" />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        Management Împrumuturi
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Aprobă cereri, confirmă ridicări și monitorizează termenele de returnare.
                    </Typography>
                </Box>
            </Box>

            {/* Panou Filtre */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Caută după carte sau utilizator..."
                            variant="outlined"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={roLocale}>
                            <Box display="flex" gap={2}>
                                <DatePicker
                                    label="De la data"
                                    value={startDate}
                                    onChange={(newVal) => setStartDate(newVal)}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                                <DatePicker
                                    label="Până la data"
                                    value={endDate}
                                    onChange={(newVal) => setEndDate(newVal)}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                            </Box>
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="ALL">Toate active</MenuItem>
                                <MenuItem value="APPROVED">Aprobate</MenuItem>
                                <MenuItem value="PENDING">Neaprobate</MenuItem>
                                <MenuItem value="RESERVED">Rezervate</MenuItem>
                                <MenuItem value="AVAILABLE_FOR_PICKUP">Gata de ridicat</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Grafic (Opțional) */}
            <Box textAlign="right" mb={2}>
                <Button
                    variant="text"
                    endIcon={<ExpandMoreIcon sx={{ transform: showChart ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }} />}
                    onClick={() => setShowChart((prev) => !prev)}
                >
                    {showChart ? "Ascunde grafic" : "Vezi grafic cereri"}
                </Button>
            </Box>
            <Collapse in={showChart} timeout="auto" unmountOnExit>
                <Paper elevation={0} sx={{ p: 2, height: 300, mb: 4, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Collapse>

            {/* Listă goală */}
            {filteredLoans.length === 0 && (
                <Box textAlign="center" py={10} bgcolor="background.paper" borderRadius={3} border="1px dashed" borderColor="divider">
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        📭 Nu există împrumuturi care să corespundă criteriilor
                    </Typography>
                </Box>
            )}

            {/* Lista Împrumuturi pe Zile */}
            <List disablePadding>
                {Object.entries(groupedByDate).map(([date, dateLoans]) => (
                    <Box key={date} sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {date} <Chip label={dateLoans.length} size="small" sx={{ ml: 1, fontWeight: 'bold' }} />
                        </Typography>

                        <Grid container spacing={2}>
                            {dateLoans.map((loan) => {
                                const statusConfig = getStatusConfig(loan.status);

                                return (
                                    <Grid item xs={12} md={6} lg={4} key={loan.id}>
                                        <Card
                                            elevation={2}
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: 3,
                                                transition: '0.2s',
                                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                                            }}
                                        >
                                            <CardContent sx={{ display: "flex", gap: 2, flexGrow: 1, p: 2.5 }}>
                                                {/* Copertă carte */}
                                                <Box
                                                    sx={{
                                                        width: 80, height: 120, flexShrink: 0,
                                                        borderRadius: 1.5, overflow: "hidden", boxShadow: 1
                                                    }}
                                                >
                                                    <img
                                                        src={loan.book?.coverImage ? `${loan.book.coverImage}?v=${loan.status}` : "/book-cover-placeholder.png"}
                                                        alt={loan.book?.title}
                                                        onError={(e) => (e.target.src = "/book-cover-placeholder.png")}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                </Box>

                                                {/* Info */}
                                                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                        <Box minWidth={0}>
                                                            <Typography variant="subtitle1" fontWeight="bold" noWrap title={loan.book.title}>
                                                                {loan.book.title}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                                de {loan.book.author}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                                        <Avatar
                                                            src={loan.user?.profileImage ? `${loan.user.profileImage}` : undefined}
                                                            sx={{ width: 24, height: 24, fontSize: '0.8rem' }}
                                                        >
                                                            {loan.user?.username?.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Typography variant="body2" fontWeight="medium" noWrap>
                                                            {loan.user?.firstName} {loan.user?.lastName}
                                                        </Typography>
                                                    </Box>

                                                    <Box mt="auto" display="flex" flexDirection="column" gap={1}>
                                                        <Chip
                                                            label={statusConfig.label}
                                                            color={statusConfig.color}
                                                            size="small"
                                                            sx={{ alignSelf: 'flex-start', fontWeight: 'bold' }}
                                                        />

                                                        {loan.approved && loan.returnDate && (
                                                            <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                                                ⏳ Timp rămas: <Typography component="span" variant="caption" color="error.main" fontWeight="bold">{getTimeLeft(loan.returnDate)}</Typography>
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </CardContent>

                                            <Divider />

                                            {/* Acțiuni specifice statusului */}
                                            <CardActions sx={{ p: 1.5, bgcolor: 'action.hover', justifyContent: "flex-end", flexWrap: 'wrap', gap: 1 }}>
                                                {loan.status === "PENDING" && (
                                                    <>
                                                        <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => handleApproveLoan(loan)}>Aprobă</Button>
                                                        <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon />} onClick={() => handleDenyLoan(loan)}>Refuză</Button>
                                                    </>
                                                )}
                                                {loan.status === "APPROVED" && (
                                                    <Button variant="contained" color="primary" size="small" startIcon={<AssignmentReturnIcon />} onClick={() => handleReturnLoan(loan)}>Confirmă Returnarea</Button>
                                                )}
                                                {loan.status === "RESERVED" && (
                                                    <>
                                                        <Button variant="contained" color="secondary" size="small" startIcon={<InventoryIcon />} onClick={() => handleMarkAvailableForPickup(loan)}>Gata de ridicat</Button>
                                                        <Button variant="outlined" color="error" size="small" onClick={() => handleCancelReservation(loan)}>Anulează</Button>
                                                    </>
                                                )}
                                                {loan.status === "AVAILABLE_FOR_PICKUP" && (
                                                    <Button variant="contained" color="success" size="small" startIcon={<LocalShippingIcon />} onClick={() => handleConfirmPickup(loan)}>Confirmă Ridicarea</Button>
                                                )}
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                ))}
            </List>

            <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert variant="filled" severity={error.includes("succes") || error.includes("aprobat") || error.includes("confirmat") ? "success" : "error"}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
}