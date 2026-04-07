import { useEffect, useState, useMemo } from "react";
import {
    Container,
    Grid,
    CircularProgress,
    Box,
    Typography,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Pagination,
    TextField,
    useTheme,
    useMediaQuery,
    Paper,
    InputAdornment,
    Button
} from "@mui/material";
import { useLocation } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BookCard from "./BookCard"; // Asigură-te că pachetul BookCard acceptă un prop pentru lățime (sau o pune el corect în Grid)

export default function AllBooksPage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get("search") || "";

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [categoryFilter, setCategoryFilter] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState("");
    const [sortFilter, setSortFilter] = useState("");
    const [page, setPage] = useState(1);

    const itemsPerPage = 8;

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await fetch("http://localhost:8080/books/all");
                if (!response.ok) throw new Error("Eroare server");
                const data = await response.json();
                setBooks(data);
            } catch (error) {
                console.error("Eroare la încărcarea cărților:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    // OPTIMIZARE: Folosim useMemo pentru filtrare și sortare
    // Evităm duplicarea de stări (filteredBooks vs books)
    const filteredBooks = useMemo(() => {
        let result = [...books];

        // 1. Filtrare Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(book =>
                (book.title && book.title.toLowerCase().includes(query)) ||
                (book.author && book.author.toLowerCase().includes(query))
            );
        }

        // 2. Filtrare Categorie
        if (categoryFilter) {
            result = result.filter(book => book.category === categoryFilter);
        }

        // 3. Filtrare Disponibilitate
        if (availabilityFilter) {
            result = result.filter(book =>
                availabilityFilter === "available" ? book.available : !book.available
            );
        }

        // 4. Sortare
        switch (sortFilter) {
            case "titleAsc":
                result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
                break;
            case "titleDesc":
                result.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
                break;
            case "authorAsc":
                result.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
                break;
            case "authorDesc":
                result.sort((a, b) => (b.author || "").localeCompare(a.author || ""));
                break;
            case "yearAsc":
                result.sort((a, b) => new Date(a.publicationDate) - new Date(b.publicationDate));
                break;
            case "yearDesc":
                result.sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate));
                break;
            default:
                break;
        }

        return result;
    }, [books, searchQuery, categoryFilter, availabilityFilter, sortFilter]);

    // Resetăm pagina la 1 atunci când se modifică rezultatele filtrării
    useEffect(() => {
        setPage(1);
    }, [searchQuery, categoryFilter, availabilityFilter, sortFilter]);

    const resetFilters = () => {
        setSearchQuery("");
        setCategoryFilter("");
        setAvailabilityFilter("");
        setSortFilter("");
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    const uniqueCategories = [...new Set(books.map(book => book.category).filter(Boolean))].sort();

    // Extragem doar cărțile pentru pagina curentă
    const paginatedBooks = filteredBooks.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>

            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={4}>
                <AutoStoriesIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                    Catalog Cărți
                </Typography>
            </Box>

            {/* Panou de Filtrare */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper"
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Caută titlu sau autor..."
                            variant="outlined"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Categorie</InputLabel>
                            <Select
                                value={categoryFilter}
                                label="Categorie"
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <MenuItem value="">Toate</MenuItem>
                                {uniqueCategories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Disponibilitate</InputLabel>
                            <Select
                                value={availabilityFilter}
                                label="Disponibilitate"
                                onChange={(e) => setAvailabilityFilter(e.target.value)}
                            >
                                <MenuItem value="">Toate</MenuItem>
                                <MenuItem value="available">Disponibile</MenuItem>
                                <MenuItem value="unavailable">Împrumutate</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sortează după</InputLabel>
                            <Select
                                value={sortFilter}
                                label="Sortează după"
                                onChange={(e) => setSortFilter(e.target.value)}
                            >
                                <MenuItem value="">Cele mai relevante</MenuItem>
                                <MenuItem value="titleAsc">Titlu A-Z</MenuItem>
                                <MenuItem value="titleDesc">Titlu Z-A</MenuItem>
                                <MenuItem value="authorAsc">Autor A-Z</MenuItem>
                                <MenuItem value="authorDesc">Autor Z-A</MenuItem>
                                <MenuItem value="yearDesc">Cele mai noi</MenuItem>
                                <MenuItem value="yearAsc">Cele mai vechi</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Buton de Resetare dacă există filtre active pe mobil, altfel doar iconiță */}
                    {(searchQuery || categoryFilter || availabilityFilter || sortFilter) && (
                        <Grid item xs={12} md={1} display="flex" justifyContent="flex-end">
                            <Button
                                variant="text"
                                color="error"
                                onClick={resetFilters}
                                fullWidth={isMobile}
                                startIcon={<RestartAltIcon />}
                                sx={{ minWidth: 'auto' }}
                            >
                                Reset
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Afișare Rezultate */}
            {filteredBooks.length === 0 ? (
                <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius={3} border="1px dashed" borderColor="divider">
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        Nu am găsit nicio carte care să corespundă căutării. 😔
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={3}>
                        Încearcă să folosești alți termeni de căutare sau resetează filtrele.
                    </Typography>
                    <Button variant="contained" onClick={resetFilters} startIcon={<RestartAltIcon />}>
                        Resetează Filtrele
                    </Button>
                </Box>
            ) : (
                <>
                    <Typography variant="body2" color="text.secondary" mb={2} fontWeight="bold">
                        Afișare {filteredBooks.length} rezultat{filteredBooks.length !== 1 && 'e'}
                    </Typography>

                    <Grid container spacing={3} sx={{ mb: 6 }}>
                        {paginatedBooks.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </Grid>

                    {/* Paginare - Doar dacă este necesară */}
                    {totalPages > 1 && (
                        <Box display="flex" justifyContent="center" mt={4} mb={2}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, value) => setPage(value)}
                                color="primary"
                                size={isMobile ? "medium" : "large"}
                                shape="rounded"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
}