import React, { useState, useEffect, useMemo } from "react";
import {
    Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Snackbar,
    TextField, Box, FormControl, InputLabel, Select, MenuItem, Button,
    Chip, Avatar, Grid, InputAdornment, IconButton, Tooltip
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import GroupIcon from '@mui/icons-material/Group';

export default function UsersTable() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    // Filtre
    const [filterUsername, setFilterUsername] = useState("");
    const [filterFirstName, setFilterFirstName] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const token = sessionStorage.getItem("token");
                const res = await fetch("http://localhost:8080/users/all", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Eroare la încărcarea utilizatorilor.");

                const data = await res.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
                setOpenSnackbar(true);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Optimizare: Folosim useMemo pentru a evita filtrarea la fiecare render inutil
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const usernameMatch = user.username?.toLowerCase().includes(filterUsername.toLowerCase().trim());
            const firstNameMatch = String(user.firstName || "").toLowerCase().includes(filterFirstName.toLowerCase().trim());
            const roleMatch = filterRole === "" || user.role === filterRole;
            const statusMatch = filterStatus === "" || user.status === filterStatus;

            return usernameMatch && firstNameMatch && roleMatch && statusMatch;
        });
    }, [users, filterUsername, filterFirstName, filterRole, filterStatus]);

    const resetFilters = () => {
        setFilterUsername("");
        setFilterFirstName("");
        setFilterRole("");
        setFilterStatus("");
    };

    // Helper pentru culorile Rolurilor
    const getRoleChip = (role) => {
        const roleConfig = {
            ADMIN: { color: "error", label: "Admin" },
            BIBLIOTECAR: { color: "info", label: "Bibliotecar" },
            USER: { color: "primary", label: "Utilizator" }
        };
        const current = roleConfig[role?.toUpperCase()] || { color: "default", label: role || "Necunoscut" };
        return <Chip label={current.label} color={current.color} size="small" sx={{ fontWeight: 'bold' }} />;
    };

    // Helper pentru culorile Statusului
    const getStatusChip = (status) => {
        const statusConfig = {
            ACTIVE: { color: "success", label: "Activ" },
            INACTIVE: { color: "default", label: "Inactiv" },
            BANNED: { color: "error", label: "Suspendat" },
            PENDING: { color: "warning", label: "În așteptare" }
        };
        const current = statusConfig[status?.toUpperCase()] || { color: "default", label: status || "-" };
        return <Chip label={current.label} color={current.color} variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />;
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={4}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <GroupIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                    Management Utilizatori
                </Typography>
            </Box>

            {/* Panou Filtre */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Caută Username"
                            variant="outlined"
                            value={filterUsername}
                            onChange={e => setFilterUsername(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Caută Prenume"
                            variant="outlined"
                            value={filterFirstName}
                            onChange={e => setFilterFirstName(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Rol</InputLabel>
                            <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} label="Rol">
                                <MenuItem value="">Toate</MenuItem>
                                <MenuItem value="USER">Utilizator</MenuItem>
                                <MenuItem value="BIBLIOTECAR">Bibliotecar</MenuItem>
                                <MenuItem value="ADMIN">Administrator</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} label="Status">
                                <MenuItem value="">Toate</MenuItem>
                                <MenuItem value="ACTIVE">Activ</MenuItem>
                                <MenuItem value="INACTIVE">Inactiv</MenuItem>
                                <MenuItem value="BANNED">Suspendat</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2} display="flex" justifyContent="flex-end">
                        <Tooltip title="Resetează toate filtrele">
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={resetFilters}
                                fullWidth
                                startIcon={<RestartAltIcon />}
                                sx={{ textTransform: 'none' }}
                            >
                                Resetare
                            </Button>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" my={8}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            ) : filteredUsers.length === 0 ? (
                <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius={3} border="1px dashed" borderColor="divider">
                    <Typography variant="h6" color="text.secondary">
                        Nu a fost găsit niciun utilizator care să corespundă filtrelor.
                    </Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }} aria-label="users table">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell><strong>Utilizator</strong></TableCell>
                                <TableCell><strong>Nume Complet</strong></TableCell>
                                <TableCell><strong>Data Înregistrării</strong></TableCell>
                                <TableCell align="center"><strong>Rol</strong></TableCell>
                                <TableCell align="center"><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Card Librărie</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    hover
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: '0.2s' }}
                                >
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40, fontSize: '1rem' }}>
                                                {user.username?.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    @{user.username}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {user.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString("ro-RO", { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {getRoleChip(user.role)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {getStatusChip(user.status)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold" color="text.secondary">
                                            {user.libraryCardNumber || "N/A"}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Snackbar
                open={openSnackbar}
                autoHideDuration={5000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setOpenSnackbar(false)} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
}