import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container, Typography, TextField, Button, Box, CircularProgress,
    Alert, Snackbar, Grid, MenuItem, FormControl, InputLabel, Select,
    Card, CardContent, CardMedia, CardActionArea, Chip, Paper, IconButton, Divider
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import { AuthContext } from "../Logare user/AuthContext";

export default function EditBook() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [book, setBook] = useState(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Imaginea nouă și preview-ul acesteia
    const [newCoverImage, setNewCoverImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [filters, setFilters] = useState({
        searchTerm: "",
        category: "",
        availability: "",
    });

    useEffect(() => {
        const fetchBookOrList = async () => {
            setLoading(true);
            try {
                const url = bookId
                    ? `http://localhost:8080/books/${bookId}`
                    : `http://localhost:8080/books/all`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Eroare la încărcare.");
                const data = await res.json();

                if (bookId) {
                    setBook(data);
                    // Resetăm preview-ul când încărcăm o carte nouă
                    setPreviewUrl(null);
                    setNewCoverImage(null);
                } else {
                    setBooks(data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookOrList();
    }, [bookId, token]);

    // Curățăm URL-ul creat pentru preview la demontarea componentei
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "totalCopies") {
            const numericValue = parseInt(value, 10) || 0;
            setBook(prev => ({
                ...prev,
                totalCopies: numericValue,
                available: numericValue > 0
            }));
        } else if (name === "available") {
            setBook(prev => ({ ...prev, available: value === "true" }));
        } else {
            setBook(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewCoverImage(file);
            setPreviewUrl(URL.createObjectURL(file)); // Creăm un preview instant
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!book) return;
        setSaving(true);
        setError("");
        setSuccess(false);

        const formData = new FormData();
        formData.append("title", book.title);
        formData.append("author", book.author);
        formData.append("category", book.category);
        formData.append("isbn", book.isbn);
        formData.append("description", book.description);
        formData.append("available", book.available);
        formData.append("totalCopies", book.totalCopies);
        formData.append("publicationDate", book.publicationDate);

        if (newCoverImage) {
            formData.append("file", newCoverImage);
        }

        try {
            const res = await fetch(`http://localhost:8080/books/update/${bookId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error("Eroare la salvarea modificărilor.");
            setSuccess(true);
            setTimeout(() => navigate("/dashboard/edit-book"), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // Optimizare: Folosim useMemo pentru a filtra lista doar când se schimbă cărțile sau filtrele
    const filteredBooks = useMemo(() => {
        return books.filter((b) => {
            const matchesSearch =
                b.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                b.author.toLowerCase().includes(filters.searchTerm.toLowerCase());

            const matchesCategory = filters.category ? b.category === filters.category : true;

            const matchesAvailability =
                filters.availability === "" ? true
                    : filters.availability === "true" ? b.available === true
                        : b.available === false;

            return matchesSearch && matchesCategory && matchesAvailability;
        });
    }, [books, filters]);

    if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", my: 10 }} />;

    // ==========================================
    // PARTEA 1: LISTA DE CĂRȚI
    // ==========================================
    if (!bookId) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, color: "text.primary" }}>
                    📚 Editează o Carte
                </Typography>

                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Caută după titlu sau autor..."
                                variant="outlined"
                                name="searchTerm"
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Categorie</InputLabel>
                                <Select name="category" value={filters.category} onChange={handleFilterChange} label="Categorie">
                                    <MenuItem value="">Toate categoriile</MenuItem>
                                    <MenuItem value="Ficțiune">Ficțiune</MenuItem>
                                    <MenuItem value="Non-ficțiune">Non-ficțiune</MenuItem>
                                    <MenuItem value="Biografie">Biografie</MenuItem>
                                    <MenuItem value="Tehnologie">Tehnologie</MenuItem>
                                    <MenuItem value="Istorie">Istorie</MenuItem>
                                    <MenuItem value="Știință">Știință</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Stoc</InputLabel>
                                <Select name="availability" value={filters.availability} onChange={handleFilterChange} label="Stoc">
                                    <MenuItem value="">Toate stările</MenuItem>
                                    <MenuItem value="true">Disponibil</MenuItem>
                                    <MenuItem value="false">Indisponibil</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                {filteredBooks.length === 0 ? (
                    <Box textAlign="center" py={8}>
                        <Typography variant="h6" color="text.secondary">Nicio carte nu corespunde filtrelor aplicate.</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {filteredBooks.map((b) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={b.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3,
                                        transition: '0.3s',
                                        '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
                                    }}
                                >
                                    <CardActionArea onClick={() => navigate(`/dashboard/edit-book/${b.id}`)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <CardMedia
                                            component="img"
                                            height="240"
                                            image={b.coverImage ? `http://localhost:8080/books/image/${b.id}` : "/book-cover-placeholder.png"}
                                            alt={b.title}
                                            sx={{ objectFit: "cover", borderBottom: '1px solid #eee' }}
                                            onError={(e) => { e.target.onerror = null; e.target.src = "/book-cover-placeholder.png"; }}
                                        />
                                        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                                            <Typography variant="h6" fontWeight="bold" noWrap title={b.title}>
                                                {b.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                                                {b.author}
                                            </Typography>
                                            <Chip
                                                label={b.available ? "Disponibil" : "Indisponibil"}
                                                color={b.available ? "success" : "error"}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        );
    }

    // ==========================================
    // PARTEA 2: FORMULAR EDITARE
    // ==========================================
    if (!book) return <Typography color="error" align="center" mt={5}>Cartea nu a fost găsită.</Typography>;

    // Afișăm preview-ul nou dacă există, altfel poza veche
    const displayImage = previewUrl || (book.coverImage ? `data:image/jpeg;base64,${book.coverImage}` : "/book-cover-placeholder.png");

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={() => navigate("/dashboard/edit-book")} sx={{ mr: 2, bgcolor: 'action.hover' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        Editare Date: {book.title}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={4}>
                        {/* Coloana Stângă - Imagine */}
                        <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
                            <Box
                                component="img"
                                src={displayImage}
                                alt="Copertă carte"
                                sx={{
                                    width: "100%",
                                    maxWidth: 250,
                                    height: "auto",
                                    aspectRatio: "2/3",
                                    objectFit: "cover",
                                    borderRadius: 3,
                                    boxShadow: 3,
                                    mb: 2
                                }}
                            />
                            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ borderRadius: 2 }}>
                                Schimbă coperta
                                <input type="file" hidden accept="image/*" onChange={handleCoverChange} />
                            </Button>
                        </Grid>

                        {/* Coloana Dreaptă - Formular */}
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField label="Titlu" name="title" value={book.title || ""} onChange={handleChange} fullWidth required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Autor" name="author" value={book.author || ""} onChange={handleChange} fullWidth required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Categorie</InputLabel>
                                        <Select name="category" value={book.category || ""} onChange={handleChange} label="Categorie">
                                            <MenuItem value="Ficțiune">Ficțiune</MenuItem>
                                            <MenuItem value="Non-ficțiune">Non-ficțiune</MenuItem>
                                            <MenuItem value="Biografie">Biografie</MenuItem>
                                            <MenuItem value="Tehnologie">Tehnologie</MenuItem>
                                            <MenuItem value="Istorie">Istorie</MenuItem>
                                            <MenuItem value="Știință">Știință</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="ISBN" name="isbn" value={book.isbn || ""} onChange={handleChange} fullWidth />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Data Publicării" name="publicationDate" type="date" value={book.publicationDate || ""} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Număr total copii" name="totalCopies" type="number" value={book.totalCopies || ""} onChange={handleChange} fullWidth />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Disponibilitate</InputLabel>
                                        <Select name="available" value={book.available} onChange={handleChange} label="Disponibilitate">
                                            <MenuItem value={true}>Disponibil</MenuItem>
                                            <MenuItem value={false}>Indisponibil</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField label="Descriere" name="description" value={book.description || ""} onChange={handleChange} fullWidth multiline rows={4} />
                                </Grid>

                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={saving} startIcon={<SaveIcon />} sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}>
                                        {saving ? "Se salvează..." : "Salvează Modificările"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <Snackbar open={!!error || success} autoHideDuration={4000} onClose={() => { setError(""); setSuccess(false); }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {error ? (
                    <Alert severity="error" onClose={() => setError("")} sx={{ width: '100%', borderRadius: 2 }}>{error}</Alert>
                ) : (
                    <Alert severity="success" onClose={() => setSuccess(false)} sx={{ width: '100%', borderRadius: 2 }}>
                        Modificările au fost salvate cu succes!
                    </Alert>
                )}
            </Snackbar>
        </Container>
    );
}