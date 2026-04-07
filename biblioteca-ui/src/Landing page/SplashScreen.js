import { Box, CircularProgress, Typography } from "@mui/material";

function SplashScreen() {
    // Citim tema din localStorage ca fallback
    const mode = sessionStorage.getItem("user")
        ? JSON.parse(sessionStorage.getItem("user")).themePreference
        : "light";

    const backgroundColor = mode === "dark" ? "#121212" : "#ffffff";
    const textColor = mode === "dark" ? "#ffffff" : "#000000";

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            flexDirection="column"
            sx={{
                backgroundColor: backgroundColor,
                color: textColor,
                transition: "background-color 0.3s ease",
            }}
        >
            <Typography variant="h4" sx={{ mb: 2 }}>
                Biblioteca ta 📚
            </Typography>
            <CircularProgress sx={{ color: textColor }} />
        </Box>
    );
}

export default SplashScreen;
