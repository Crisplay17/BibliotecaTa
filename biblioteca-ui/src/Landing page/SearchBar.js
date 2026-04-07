import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchBar({ searchQuery, setSearchQuery }) {
    return (
        <TextField
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            placeholder="Căutați o carte..."
            sx={{
                backgroundColor: "white",
                borderRadius: 2,
                width: { xs: "50%", sm: "200px" },
                "& .MuiInputBase-root": {
                    paddingLeft: 1,
                },
                "& .MuiInputBase-input::placeholder": {
                    color: "gray",
                    opacity: 1,
                },
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon sx={{ color: "gray" }} />
                    </InputAdornment>
                ),
            }}
        />
    );
}
