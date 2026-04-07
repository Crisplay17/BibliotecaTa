import { useState, useEffect } from "react";
import {
    TextField, Button, Snackbar, Alert, Container, Typography, Grid,
    FormControl, InputLabel, Select, MenuItem, InputAdornment, Box, Paper,
    IconButton, Divider, CircularProgress
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from "react-router-dom";

export default function AddBook() {
    const navigate = useNavigate();

    // State-uri
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [category, setCategory] = useState("");
    const [coverImage, setCoverImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null); // Optimizare pentru preview
    const [isbn, setIsbn] = useState("");
    const [publicationDate, setPublicationDate] = useState(null);
    const [description, setDescription] = useState("");
    const [available, setAvailable] = useState(true);
    const [totalCopies, setTotalCopies] = useState(1);

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const MAX_DESCRIPTION_LENGTH = 1000;

    // Curățare URL imagine pentru a preveni memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleDescriptionChange = (e) => {
        let value = e.target.value;
        if (value.length > MAX_DESCRIPTION_LENGTH) {
            value = value.slice(0, MAX_DESCRIPTION_LENGTH);
            setError(`Descrierea nu poate depăși ${MAX_DESCRIPTION_LENGTH} caractere.`);
            setOpenSnackbar(true);
        }
        setDescription(value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCopiesChange = (e) => {
        const value = parseInt(e.target.value, 10) || 0;
        setTotalCopies(value);
        // Automatizare: actualizează disponibilitatea pe baza stocului
        setAvailable(value > 0);
    };

    const handleAddBook = async () => {
        if (!title || !author || !category || !isbn || !publicationDate || !coverImage) {
            setError("Toate câmpurile sunt obligatorii (inclusiv coperta)!");
            setOpenSnackbar(true);
            return;
        }

        setLoading(true);
        const formattedPublicationDate = publicationDate ? publicationDate.toISOString().split('T')[0] : '';

        const formData = new FormData();
        formData.append("file", coverImage);
        formData.append("title", title);
        formData.append("author", author);
        formData.append("category", category);
        formData.append("isbn", isbn);
        formData.append("publicationDate", formattedPublicationDate);
        formData.append("description", description);
        formData.append("available", available);
        formData.append("totalCopies", totalCopies);

        try {
            const token = sessionStorage.getItem("token");
            const response = await fetch("http://localhost:8080/books/add", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            });

            const contentType = response.headers.get("Content-Type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (response.ok) {
                    setSuccess(`Cartea "${data.title}" a fost adăugată cu succes!`);
                    setOpenSnackbar(true);
                    setTimeout(() => navigate("/dashboard"), 1500);
                } else {
                    setError(data.message || "Eroare la adăugarea cărții.");
                    setOpenSnackbar(true);
                }
            } else {
                setError("Eroare la server: Răspuns invalid.");
                setOpenSnackbar(true);
            }
        } catch (error) {
            setError("Eroare la comunicarea cu serverul.");
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>

                    {/* Header */}
                    <Box display="flex" alignItems="center" mb={3}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 2, bgcolor: 'action.hover' }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" fontWeight="bold">
                            📖 Adaugă o Carte Nouă
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 4 }} />

                    <Grid container spacing={4}>
                        {/* COLOANA STÂNGĂ: Upload Imagine */}
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    border: '2px dashed',
                                    borderColor: previewUrl ? 'primary.main' : 'grey.400',
                                    borderRadius: 3,
                                    p: 2,
                                    textAlign: 'center',
                                    bgcolor: 'background.default',
                                    transition: '0.3s',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                    id="cover-upload"
                                />
                                <label htmlFor="cover-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                                    {previewUrl ? (
                                        <Box>
                                            <img
                                                src={previewUrl}
                                                alt="Cover Preview"
                                                style={{ width: '100%', height: 'auto', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} fullWidth size="small" sx={{ borderRadius: 2 }}>
                                                Schimbă coperta
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                                            <Typography variant="body1" color="text.secondary" fontWeight="medium">
                                                Apasă pentru a adăuga o copertă
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                JPEG sau PNG (obligatoriu)
                                            </Typography>
                                        </Box>
                                    )}
                                </label>
                            </Box>
                        </Grid>

                        {/* COLOANA DREAPTĂ: Formularul principal */}
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField label="Titlu carte" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} fullWidth required />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Categorie</InputLabel>
                                        <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Categorie">
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
                                    <TextField label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} fullWidth required />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="Data Publicării *"
                                        value={publicationDate}
                                        onChange={(newValue) => setPublicationDate(newValue)}
                                        sx={{ width: '100%' }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Stoc (Număr copii)"
                                        type="number"
                                        value={totalCopies}
                                        onChange={handleCopiesChange}
                                        fullWidth
                                        InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Disponibilitate</InputLabel>
                                        <Select value={available} onChange={(e) => setAvailable(e.target.value)} label="Disponibilitate">
                                            <MenuItem value={true}>Disponibil</MenuItem>
                                            <MenuItem value={false}>Indisponibil</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="Descriere scurtă"
                                        value={description}
                                        onChange={handleDescriptionChange}
                                        fullWidth
                                        multiline
                                        rows={4}
                                        helperText={`${description.length} / ${MAX_DESCRIPTION_LENGTH} caractere`}
                                        error={description.length > MAX_DESCRIPTION_LENGTH}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Box mt={4} pt={3} borderTop="1px solid #eee" textAlign="right">
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={handleAddBook}
                            disabled={loading || description.length > MAX_DESCRIPTION_LENGTH}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
                            sx={{ py: 1.5, px: 4, borderRadius: 2, fontWeight: 'bold' }}
                        >
                            {loading ? "Se adaugă..." : "Adaugă Cartea"}
                        </Button>
                    </Box>

                </Paper>

                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={5000}
                    onClose={() => setOpenSnackbar(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity={success ? "success" : "error"} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                        {success || error}
                    </Alert>
                </Snackbar>
            </Container>
        </LocalizationProvider>
    );
}