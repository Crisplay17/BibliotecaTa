import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    AppBar, Toolbar, Typography, IconButton, Container, Grid, Avatar,
    Menu, MenuItem, Snackbar, Alert, Button, Drawer,
    List, ListItemText, useTheme, Box, Skeleton, Divider, InputBase, Fade
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Iconițe
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from '@mui/icons-material/Search';
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import ListItemButton from "@mui/material/ListItemButton";
import { ListItemIcon } from "@mui/material";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ClearIcon from '@mui/icons-material/Clear';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

import BookCard from "./BookCard";

// ----------------------------------------------------------------------
// Funcții Utilitare (Pentru Căutare Inteligentă)
// ----------------------------------------------------------------------
const removeAccents = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
};

// ----------------------------------------------------------------------
// Skeletons pentru starea de încărcare
// ----------------------------------------------------------------------
const BookSkeleton = () => (
    <Box sx={{ width: '100%', maxWidth: 200, mx: 'auto' }}>
        <Skeleton variant="rectangular" width="100%" height={280} sx={{ borderRadius: 1, mb: 1 }} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="60%" height={16} />
    </Box>
);

const SliderSkeleton = () => (
    <Box sx={{ my: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="rectangular" width={4} height={28} />
                <Skeleton variant="text" width={200} height={32} />
            </Box>
            <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2, px: 1 }}>
            {[1, 2, 3, 4].map(i => (
                <Box key={i} sx={{ minWidth: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
                    <BookSkeleton />
                </Box>
            ))}
        </Box>
    </Box>
);

// ----------------------------------------------------------------------
// Componenta Carousel Cărți
// ----------------------------------------------------------------------
const SectionCarousel = React.memo(({ title, items, sectionKey, showRecentTag, isLoading }) => {
    const navigate = useNavigate();

    if (isLoading) return <SliderSkeleton />;
    if (!items || items.length === 0) return null;

    const sliderSettings = {
        dots: true, infinite: true, speed: 500, slidesToShow: 4, slidesToScroll: 1,
        autoplay: true, autoplaySpeed: 3000, pauseOnHover: true,
        responsive: [
            { breakpoint: 1280, settings: { slidesToShow: 3, slidesToScroll: 1 } },
            { breakpoint: 960, settings: { slidesToShow: 2, slidesToScroll: 1 } },
            { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
        ],
    };

    return (
        <Box sx={{ my: 10 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 4, height: 28, bgcolor: "primary.main", borderRadius: 1 }} />
                    <Typography variant="h5" fontWeight="bold">{title}</Typography>
                </Box>
                <Button onClick={() => navigate(`/books/all?section=${sectionKey}`)} variant="outlined" size="small" sx={{ textTransform: "none" }}>
                    Vezi mai multe
                </Button>
            </Box>

            <Box sx={{
                overflow: "visible",
                '& .slick-list': { padding: 0, margin: 0, overflow: 'hidden' },
                '& .slick-track': { display: 'flex', alignItems: 'stretch', marginLeft: '-4px' },
                '& .slick-slide': { padding: 0, margin: 0, minWidth: 'auto', outline: 'none' },
                '& .slick-slide > div': { marginLeft: '4px', marginRight: '4px', height: '100%', display: 'flex', justifyContent: 'center' },
                '& .slick-prev, & .slick-next': { zIndex: 2, width: 32, height: 32, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '50%', display: 'flex !important', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease-in-out' },
                '& .slick-prev:before, & .slick-next:before': { fontSize: 20, color: '#fff' },
                '& .slick-prev': { left: '-12px', '@media (max-width: 600px)': { left: '4px' } },
                '& .slick-next': { right: '-12px', '@media (max-width: 600px)': { right: '4px' } },
            }}>
                <Slider {...sliderSettings}>
                    {items.map((book) => (
                        <Box key={book.id} sx={{ height: '100%' }}>
                            <BookCard book={book} showRecentTag={showRecentTag} />
                        </Box>
                    ))}
                </Slider>
            </Box>
        </Box>
    );
});

// ----------------------------------------------------------------------
// Hooks Personalizate: Logica de Filtrare și Căutare
// ----------------------------------------------------------------------
const useSectionData = (books, user) => {
    return useMemo(() => {
        if (!books || books.length === 0) return { recent: [], recommendations: [] };

        // 1. CĂRȚI RECENTE: Sortăm după ID descrescător (cele mai noi adăugate)
        const recent = [...books]
            .sort((a, b) => (b.id || 0) - (a.id || 0))
            .slice(0, 10);

        // 2. RECOMANDĂRI
        let recommendations = [];
        if (user?.interests?.length > 0) {
            const userInterests = user.interests.map(i => removeAccents(i.toLowerCase()));
            recommendations = books.filter(book => {
                const searchableText = removeAccents([book.category, book.title, book.author].join(' ').toLowerCase());
                return userInterests.some(interest => searchableText.includes(interest));
            });
        }

        // Dacă nu avem recomandări, afișăm 10 cărți absolut aleatorii
        if (recommendations.length === 0) {
            recommendations = [...books]
                .sort(() => Math.random() - 0.5)
                .slice(0, 10);
        } else {
            recommendations = recommendations.slice(0, 10);
        }

        return { recent, recommendations };
    }, [books, user]);
};

const useSearchBooks = (books, searchQuery) => {
    return useMemo(() => {
        if (!searchQuery || !searchQuery.trim()) return [];

        const queryWords = removeAccents(searchQuery.toLowerCase().trim()).split(/\s+/);

        return books.filter(book => {
            const searchableText = removeAccents([
                book.title, book.author, book.category, book.description
            ].join(' ').toLowerCase());

            return queryWords.every(word => searchableText.includes(word));
        }).sort((a, b) => {
            const aTitle = removeAccents((a.title || '').toLowerCase());
            const bTitle = removeAccents((b.title || '').toLowerCase());
            const fullQuery = removeAccents(searchQuery.toLowerCase().trim());

            const aExact = aTitle.includes(fullQuery);
            const bExact = bTitle.includes(fullQuery);

            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
        }).slice(0, 8);
    }, [books, searchQuery]);
};

// ----------------------------------------------------------------------
// Componenta de Dropdown Search
// ----------------------------------------------------------------------
const SearchDropdown = React.memo(({ searchResults, searchQuery, isOpen, onClose, onSelectBook }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    if (!isOpen || !searchQuery.trim()) return null;

    return (
        <Box sx={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1300, mt: 1, maxHeight: 400, overflowY: 'auto',
            bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? 4 : '0 4px 20px rgba(0,0,0,0.1)',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: theme.palette.mode === 'dark' ? '#2e2e2e' : '#f1f1f1' },
            '&::-webkit-scrollbar-thumb': { background: theme.palette.mode === 'dark' ? '#555' : '#888', borderRadius: 3 },
        }}>
            {searchResults.length > 0 ? (
                <>
                    <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : 'rgba(0,0,0,0.6)' }}>
                            {searchResults.length} rezultat{searchResults.length !== 1 ? 'e' : ''} pentru "{searchQuery}"
                        </Typography>
                    </Box>
                    {searchResults.slice(0, 5).map((book) => (
                        <Box key={book.id} onClick={() => { onSelectBook(book); onClose(); navigate(`/books/${book.id}`); }}
                             sx={{
                                 display: 'flex', alignItems: 'center', p: 1.5, cursor: 'pointer',
                                 borderBottom: `1px solid ${theme.palette.divider}`, transition: 'background-color 0.2s',
                                 '&:hover': { bgcolor: theme.palette.action.hover }, '&:last-child': { borderBottom: 'none' },
                             }}
                        >
                            <Box component="img" src={book.coverImage ? `data:image/jpeg;base64,${book.coverImage}` : "/book-cover-placeholder.png"} alt={book.title}
                                 sx={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 1, mr: 2, flexShrink: 0 }}
                            />
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5, color: theme.palette.text.primary }}>
                                    {book.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    de {book.author}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                    {searchResults.length > 5 && (
                        <Box sx={{ p: 1.5, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button onClick={() => { onClose(); navigate(`/books/all?search=${encodeURIComponent(searchQuery)}`); }} size="small" sx={{ textTransform: 'none' }}>
                                Vezi toate rezultatele
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : 'rgba(0,0,0,0.6)', mb: 1 }}>
                        Nu s-au găsit rezultate pentru "{searchQuery}"
                    </Typography>
                </Box>
            )}
        </Box>
    );
});

// ----------------------------------------------------------------------
// Componenta Principală: LibraryHome
// ----------------------------------------------------------------------
export default function LibraryHome({ toggleTheme, mode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const section = useMemo(() => new URLSearchParams(location.search).get("section"), [location.search]);

    const hasFetchedBooks = useRef(false);
    const hasFetchedUser = useRef(false);
    const searchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);

    const [books, setBooks] = useState([]);
    const [user, setUser] = useState(null);
    const [booksLoading, setBooksLoading] = useState(true);
    const [userLoading, setUserLoading] = useState(true);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [error, setError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    // Date prelucrate
    const searchResults = useSearchBooks(books, searchQuery);
    const { recent, recommendations } = useSectionData(books, user);

    const filteredBooks = useMemo(() => {
        switch (section) {
            case "recente": return recent;
            case "recomandari": return recommendations;
            default: return books;
        }
    }, [section, recent, recommendations, books]);

    // ------------------- HANDLERS DEFINITE CLAR -------------------
    const handleMenuOpen = useCallback((event) => setAnchorEl(event.currentTarget), []);
    const handleMenuClose = useCallback(() => setAnchorEl(null), []);

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem("token");
        setUser(null); setIsAuthenticated(false); handleMenuClose();
        setError("Ai fost deconectat cu succes."); setOpenSnackbar(true);
        navigate("/login"); hasFetchedUser.current = false;
    }, [navigate, handleMenuClose]);

    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
        setSearchDropdownOpen(e.target.value.trim().length > 0);
    }, []);

    // Aici sunt definite functiile pentru Dropdown
    const handleCloseSearchDropdown = useCallback(() => {
        setSearchDropdownOpen(false);
    }, []);

    const handleSelectBook = useCallback((book) => {
        setSearchQuery("");
        setSearchDropdownOpen(false);
        setMobileSearchOpen(false);
    }, []);

    // --------------------------------------------------------------

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target) &&
                mobileSearchInputRef.current && !mobileSearchInputRef.current.contains(event.target)) {
                setSearchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch User
    useEffect(() => {
        const fetchUser = async () => {
            if (hasFetchedUser.current) return;
            const token = sessionStorage.getItem("token");
            if (!token) { setIsAuthenticated(false); setUserLoading(false); return; }

            hasFetchedUser.current = true;
            try {
                const response = await fetch("http://localhost:8080/users/me", { headers: { Authorization: `Bearer ${token}` } });
                if (response.ok) {
                    setUser(await response.json());
                    setIsAuthenticated(true);
                } else throw new Error("Eroare la autentificare.");
            } catch (error) {
                setError(error.message); setOpenSnackbar(true); setIsAuthenticated(false);
            } finally { setUserLoading(false); }
        };
        fetchUser();
    }, []);

    // Fetch Books
    useEffect(() => {
        const fetchBooks = async () => {
            if (hasFetchedBooks.current) return;
            hasFetchedBooks.current = true;
            try {
                const response = await fetch("http://localhost:8080/books/all");
                if (response.ok) setBooks(await response.json());
                else throw new Error("Eroare la încărcarea cărților.");
            } catch (error) {
                setError(error.message); setOpenSnackbar(true);
            } finally { setBooksLoading(false); }
        };
        fetchBooks();
    }, []);

    // Stiluri UI
    const containerStyles = useMemo(() => ({
        minHeight: "100vh",
        bgcolor: theme.palette.mode === "dark" ? "background.default" : "background.paper",
        background: theme.palette.mode === "dark" ? "linear-gradient(90deg, #1e1e2f 0%, #121212 100%)" : "linear-gradient(90deg, #e0e7ff 0%, #bfdbfe 100%)",
        color: theme.palette.text.primary,
    }), [theme.palette.mode, theme.palette.text.primary]);

    const sectionStyles = useMemo(() => ({
        backgroundColor: theme.palette.mode === 'light' ? '#f8f9fa' : theme.palette.background.paper,
        borderRadius: 3, p: { xs: 2, md: 4 }, mb: 6,
        boxShadow: theme.palette.mode === 'light' ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.3)',
    }), [theme.palette.mode, theme.palette.background.paper]);

    const titleWithAccent = (title) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 6, height: 32, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
            <Typography variant="h5" fontWeight="bold" color={theme.palette.text.primary}>{title}</Typography>
        </Box>
    );

    return (
        <Box sx={containerStyles}>
            <AppBar position="fixed" color="primary" sx={{ boxShadow: 3, zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", minHeight: { xs: "auto", sm: 64 } }}>

                    {/* Partea Stângă (Meniu Mobile + Noul LOGO) */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton edge="start" color="inherit" onClick={() => setOpenDrawer(true)} sx={{ display: { xs: "block", sm: "none" }, mr: 1 }}>
                            <MenuIcon />
                        </IconButton>

                        <Box component={Link} to="/home" sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", color: "inherit", flexShrink: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.paper", color: "primary.main", width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                                <AutoStoriesIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: "-0.5px", display: { xs: "none", sm: "block" } }}>Biblioteca Ta</Typography>
                        </Box>
                    </Box>

                    {/* Desktop Search & Menu */}
                    <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 2 }}>
                        <Box ref={searchInputRef} sx={{
                            position: 'relative', display: "flex", alignItems: "center",
                            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper',
                            border: theme.palette.mode === 'dark' ? 'none' : `1px solid ${theme.palette.divider}`,
                            px: 1.5, py: 0.5, borderRadius: 3, boxShadow: 1, transition: "all 0.2s ease-in-out",
                            '&:focus-within': { boxShadow: `0 0 0 2px ${theme.palette.primary.main}` },
                        }}>
                            <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                            <InputBase placeholder="Căutați o carte..." value={searchQuery} onChange={handleSearchChange} onFocus={() => searchQuery.trim() && setSearchDropdownOpen(true)} sx={{ color: "text.primary", width: 180, '& ::placeholder': { color: "text.secondary", opacity: 1 } }} />
                            {searchQuery && (
                                <IconButton size="small" onClick={() => { setSearchQuery(""); setSearchDropdownOpen(false); }} sx={{ ml: 0.5, color: "text.secondary" }}><ClearIcon fontSize="small" /></IconButton>
                            )}
                            <SearchDropdown
                                searchResults={searchResults}
                                searchQuery={searchQuery}
                                isOpen={searchDropdownOpen}
                                onClose={handleCloseSearchDropdown}
                                onSelectBook={handleSelectBook}
                            />
                        </Box>

                        <Button component={Link} to="/books/all" color="inherit" sx={{ fontWeight: 500 }} startIcon={<MenuBookIcon />}>Cărți</Button>
                        {user?.role === "BIBLIOTECAR" && (
                            <Button component={Link} to="/dashboard" color="inherit" sx={{ fontWeight: 500 }} startIcon={<DashboardIcon />}>Dashboard</Button>
                        )}

                        {userLoading ? <Skeleton variant="circular" width={40} height={40} /> : isAuthenticated && user ? (
                            <Avatar src={user?.profilePictureUrl || "/book-cover-placeholder.png"} alt={user?.username} sx={{ cursor: "pointer", width: 40, height: 40, border: "2px solid", borderColor: "primary.light", boxShadow: 1, transition: "0.2s", '&:hover': { transform: "scale(1.05)" } }} onClick={handleMenuOpen}>
                                {user?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                        ) : (
                            <IconButton color="inherit" onClick={handleMenuOpen}><PersonIcon /></IconButton>
                        )}
                    </Box>

                    {/* Mobile Search Icon & Avatar */}
                    <Box sx={{ display: { xs: "flex", sm: "none" }, alignItems: "center", gap: 1, flexGrow: 1, ml: 2, justifyContent: "flex-end" }}>
                        <IconButton onClick={() => setMobileSearchOpen(prev => !prev)} color="inherit" size="small"><SearchIcon fontSize="small" /></IconButton>
                        {userLoading ? <Skeleton variant="circular" width={32} height={32} /> : isAuthenticated && user ? (
                            <Avatar src={user?.profilePictureUrl || "/book-cover-placeholder.png"} alt={user?.username} sx={{ cursor: "pointer", width: 32, height: 32 }} onClick={handleMenuOpen}>
                                {user?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                        ) : (
                            <IconButton color="inherit" onClick={handleMenuOpen} size="small"><PersonIcon fontSize="small" /></IconButton>
                        )}
                    </Box>

                    {/* Mobile Search Bar Dropdown */}
                    <Fade in={mobileSearchOpen} unmountOnExit>
                        <Box sx={{ width: "100%", mt: 1.5, mb: 1, display: { xs: "flex", sm: "none" }, px: 1 }}>
                            <Box ref={mobileSearchInputRef} sx={{ position: 'relative', display: "flex", alignItems: "center", bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper', px: 2, py: 0.75, borderRadius: 1, width: "100%", boxShadow: 1 }}>
                                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                                <InputBase placeholder="Căutați o carte..." value={searchQuery} onChange={handleSearchChange} onFocus={() => searchQuery.trim() && setSearchDropdownOpen(true)} sx={{ color: "text.primary", width: "100%" }} autoFocus />
                                {searchQuery && <IconButton size="small" onClick={() => { setSearchQuery(""); setSearchDropdownOpen(false); setMobileSearchOpen(false); }} sx={{ ml: 0.5, color: "text.secondary" }}><ClearIcon fontSize="small" /></IconButton>}
                                <SearchDropdown
                                    searchResults={searchResults}
                                    searchQuery={searchQuery}
                                    isOpen={searchDropdownOpen}
                                    onClose={handleCloseSearchDropdown}
                                    onSelectBook={handleSelectBook}
                                />
                            </Box>
                        </Box>
                    </Fade>

                    {/* User Menu Dropdown */}
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                        {isAuthenticated && user ? [
                            <MenuItem key="profile" onClick={() => { navigate("/profile"); handleMenuClose(); }}>
                                <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} /> Profilul meu
                            </MenuItem>,
                            <MenuItem key="theme" onClick={() => { toggleTheme(); handleMenuClose(); }}>
                                {mode === "dark" ? <><Brightness7Icon fontSize="small" sx={{ mr: 1 }} /> Light Mode</> : <><Brightness4Icon fontSize="small" sx={{ mr: 1 }} /> Dark Mode</>}
                            </MenuItem>,
                            <Divider key="divider" />,
                            <MenuItem key="logout" onClick={handleLogout} sx={{ color: 'error.main' }}>
                                <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Deconectare
                            </MenuItem>
                        ] : [
                            <MenuItem key="login" component={Link} to="/login" onClick={handleMenuClose}><LoginIcon fontSize="small" sx={{ mr: 1 }} /> Autentificare</MenuItem>,
                            <MenuItem key="register" component={Link} to="/register" onClick={handleMenuClose}><PersonAddIcon fontSize="small" sx={{ mr: 1 }} /> Înregistrare</MenuItem>
                        ]}
                    </Menu>
                </Toolbar>
            </AppBar>

            <Toolbar sx={{ mb: 4 }} /> {/* Spacer */}

            {/* Mobile Drawer */}
            <Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)} sx={{ '& .MuiDrawer-paper': { width: 260, px: 2, pt: 2 } }}>
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, px: 1 }}>
                        <AutoStoriesIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">Biblioteca Ta</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <List disablePadding>
                        <ListItemButton component={Link} to="/home" onClick={() => setOpenDrawer(false)} sx={{ borderRadius: 2, mb: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><HomeIcon /></ListItemIcon><ListItemText primary="Acasă" />
                        </ListItemButton>
                        <ListItemButton component={Link} to="/books/all" onClick={() => setOpenDrawer(false)} sx={{ borderRadius: 2, mb: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}><MenuBookIcon /></ListItemIcon><ListItemText primary="Toate Cărțile" />
                        </ListItemButton>
                        {user?.role === "BIBLIOTECAR" && (
                            <ListItemButton component={Link} to="/dashboard" onClick={() => setOpenDrawer(false)} sx={{ borderRadius: 2, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}><DashboardIcon /></ListItemIcon><ListItemText primary="Panou Control" />
                            </ListItemButton>
                        )}
                    </List>
                </Box>
            </Drawer>

            {/* Main Content Area */}
            <Container maxWidth="xl" sx={{ py: 2 }}>
                {section ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <SectionCarousel
                            title={section === "recente" ? "Cărți recent adăugate" : section === "recomandari" ? "Recomandări pentru tine" : "Cărți"}
                            items={filteredBooks}
                            sectionKey={section}
                            showRecentTag={section === "recente"}
                            isLoading={booksLoading}
                        />
                    </Box>
                ) : (
                    <>
                        <Box sx={sectionStyles}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                {titleWithAccent("Cărți recent adăugate")}
                                <Button onClick={() => navigate(`/books/all?section=recente`)} variant="contained" size="small" sx={{ textTransform: 'none', borderRadius: 3 }}>
                                    Vezi mai multe
                                </Button>
                            </Box>
                            {booksLoading ? <SliderSkeleton /> : recent.length === 0 ? (
                                <Typography sx={{ textAlign: 'center', mt: 4, color: "text.secondary" }}>Nu există cărți recent adăugate.</Typography>
                            ) : (
                                <Slider dots infinite={false} speed={500} slidesToShow={Math.min(4, recent.length)} slidesToScroll={1} responsive={[{ breakpoint: 1280, settings: { slidesToShow: Math.min(3, recent.length) } }, { breakpoint: 960, settings: { slidesToShow: Math.min(2, recent.length) } }, { breakpoint: 600, settings: { slidesToShow: 1 } }]}>
                                    {recent.map((book) => <Box key={book.id} sx={{ px: 1 }}><BookCard book={book} showRecentTag /></Box>)}
                                </Slider>
                            )}
                        </Box>

                        <Box sx={sectionStyles}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                {titleWithAccent(isAuthenticated ? "Recomandări pentru tine" : "Cărți recomandate")}
                            </Box>
                            <SectionCarousel items={recommendations} sectionKey="recomandari" isLoading={booksLoading} />
                        </Box>

                        <Box sx={sectionStyles}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: "text.primary" }}>
                                Explorare Catalog
                            </Typography>
                            {booksLoading ? (
                                <Grid container spacing={3} justifyContent="center">
                                    {Array.from({ length: 8 }, (_, i) => <Grid item key={i} xs={12} sm={6} md={4} lg={3}><BookSkeleton /></Grid>)}
                                </Grid>
                            ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                                    {books.slice(0, 8).map((book) => (
                                        <Box key={book.id} sx={{ flex: '0 1 250px', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}>
                                            <BookCard book={book} />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            <Box sx={{ mt: 4, textAlign: 'center' }}>
                                <Button variant="contained" component={Link} to="/books/all" size="large" sx={{ borderRadius: 3, px: 5, fontWeight: "bold" }}>
                                    Afișează Tot Catalogul
                                </Button>
                            </Box>
                        </Box>
                    </>
                )}
            </Container>

            <Box component="footer" sx={{ mt: 6, py: 3, px: 2, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.200", color: "text.secondary", textAlign: "center", borderTop: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>© {new Date().getFullYear()} Biblioteca Ta</Typography>
                <Box>
                    <Link to="/privacy" style={{ color: "inherit", marginRight: 16, textDecoration: "none" }}>Politica de confidențialitate</Link>
                    <Link to="/terms" style={{ color: "inherit", textDecoration: "none" }}>Termeni și condiții</Link>
                </Box>
            </Box>

            <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity="info" variant="filled" onClose={() => setOpenSnackbar(false)} sx={{ borderRadius: 2 }}>{error}</Alert>
            </Snackbar>
        </Box>
    );
}