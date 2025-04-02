import { ThemeProvider as AppThemeProvider, createTheme, Theme } from '@mui/material/styles';
import React from "react";
import { DeviceUserMetaTheme } from '../../data/types/get-devices-user-meta';

// const colorSchemes = {
// dark: {
//     palette: {
//         primary: {
//             main: '#e1dab7',
//             contrastText: '#191816',
//         },
//         secondary: {
//             main: '#b0bda0',
//             contrastText: '#191816',
//         },
//         text: {
//             primary: 'rgb(228, 223, 216)',
//             secondary: 'rgba(228, 223, 216, 0.6)',
//             disabled: 'rgba(228, 223, 216, 0.38)',
//             // hint: 'rgb(87, 102, 71)',
//         },
//         background: {
//             default: '#191816',
//             paper: '#202020',
//         },
//         error: {
//             main: '#de6359',
//         },
//         warning: {
//             main: '#f1ac48',
//         },
//         info: {
//             main: '#61b6de',
//         },
//         success: {
//             main: '#7dcb7f',
//         },
//     }
// },
// dark: false,
// light: false,
// light: {
//     palette: {
//         primary: {
//             main: '#7a7146',
//             contrastText: '#e9e9e7',
//         },
//         secondary: {
//             main: '#4c6785',
//             contrastText: '#e9e9e7',
//         },
//         text: {
//             primary: 'rgb(39, 34, 27)',
//             secondary: 'rgba(39, 34, 27, 0.6)',
//             disabled: 'rgba(39, 34, 27, 0.38)',
//             // hint: 'rgb(115, 127, 102)',
//         },
//         background: {
//             default: '#e9e9e7',
//         },
//     }
// },
// }

const themeBase = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#e1dab7',
            contrastText: '#191816',
        },
        secondary: {
            main: '#b0bda0',
            contrastText: '#191816',
        },
        text: {
            primary: 'rgb(228, 223, 216)',
            secondary: 'rgba(228, 223, 216, 0.6)',
            disabled: 'rgba(228, 223, 216, 0.38)',
            // hint: 'rgb(87, 102, 71)',
        },
        background: {
            default: '#191816',
            paper: '#202020',
        },
        error: {
            main: '#de6359',
        },
        warning: {
            main: '#f1ac48',
        },
        info: {
            main: '#61b6de',
        },
        success: {
            main: '#7dcb7f',
        },
    },
    typography: {
        fontFamily: 'Geist, "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 2,
    },
    components: {
        // MuiButtonBase: {
        //     defaultProps: {
        //         // disableRipple: true,
        //         centerRipple: true,
        //     },
        // },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: 'currentColor'
                }
            }
        }
    },
    // colorSchemes,
});

export const themeMap: Record<DeviceUserMetaTheme, Theme> = {
    default: themeBase,

    mauve: createTheme({
        ...themeBase,
        palette: {
            ...themeBase.palette,
            primary: {
                ...themeBase.palette.primary,
                main: '#5f4a5f',
            },
            background: {
                default: '#220022',
                paper: '#362236'
            },
        },
    }),

    blue: createTheme({
        ...themeBase,
        palette: {
            ...themeBase.palette,
            primary: {
                ...themeBase.palette.primary,
                main: '#5f4a5f',
            },
            background: {
                default: '#000022',
                paper: '#222236'
            },
        },
    }),

    green: createTheme({
        ...themeBase,
        palette: {
            ...themeBase.palette,
            primary: {
                ...themeBase.palette.primary,
                main: '#5f4a5f',
            },
            background: {
                default: '#002200',
                paper: '#223622'
            },
        },
    }),
};

type ThemeProviderProps = {
    themeName?: DeviceUserMetaTheme;
}

export const ThemeProvider: React.FC<React.PropsWithChildren<ThemeProviderProps>> = ({
    themeName = 'default',
    children
}) => {
    return (
        <AppThemeProvider theme={themeMap[ themeName ]}>
            {children}
        </AppThemeProvider>
    )
};
