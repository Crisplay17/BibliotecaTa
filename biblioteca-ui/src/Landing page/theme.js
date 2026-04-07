// theme.js
import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
    createTheme({
        palette: {
            mode,
            ...(mode === "light"
                ? {
                    background: {
                        default: "#f5f5f5",
                        paper: "#ffffff",
                    },
                }
                : {
                    background: {
                        default: "#121212",
                        paper: "#1e1e1e",
                    },
                }),
        },
        typography: {
            fontFamily: "Roboto, sans-serif",
        },
    });
