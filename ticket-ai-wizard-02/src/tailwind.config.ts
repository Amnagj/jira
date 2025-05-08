
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class", ".dark"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Source Sans 3', 'sans-serif'],
				raleway: ['Raleway', 'sans-serif'],
				sourcesans: ['Source Sans 3', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				cosmic: {
					dark: '#0a1535',
					DEFAULT: '#1e3a8a',
					light: '#3b82f6',
					accent: '#60a5fa'
				},
				blue: {
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    200: '#BFDBFE',
                    300: '#93C5FD',
                    400: '#60A5FA',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                    800: '#1E40AF',
                    900: '#1E3A8A',
                    950: '#172554',
                },
				indigo: {
					100: '#e0e7ff',
					500: '#6366f1',
					600: '#4f46e5',
					900: '#1e1b4b'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                'wave': {
                    '0%': { transform: 'translateX(0) translateZ(0) scaleY(1)' },
                    '50%': { transform: 'translateX(-25%) translateZ(0) scaleY(0.9)' },
                    '100%': { transform: 'translateX(-50%) translateZ(0) scaleY(1)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'pulse-slow': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
				'twinkle': {
					'0%, 100%': { opacity: '0.2' },
					'50%': { opacity: '0.8' },
				},
				'shooting-star': {
					'0%': { transform: 'translateX(0) translateY(0)', opacity: '0' },
					'10%': { opacity: '1' },
					'100%': { transform: 'translateX(300px) translateY(300px)', opacity: '0' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'float': 'float 4s ease-in-out infinite',
                'wave': 'wave 20s -10s linear infinite',
                'shimmer': 'shimmer 2s infinite linear',
                'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
				'twinkle': 'twinkle 3s ease-in-out infinite',
				'shooting-star': 'shooting-star 5s ease-in-out infinite',
			},
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'cosmic-gradient': 'linear-gradient(180deg, #0a1535 0%, #081640 100%)',
				'cosmic-card': 'linear-gradient(120deg, rgba(30,58,138,0.4) 0%, rgba(15,23,42,0.6) 100%)',
				'button-gradient': 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            },
			boxShadow: {
				'cosmic': '0 4px 20px rgba(37, 99, 235, 0.15)',
				'neon': '0 0 10px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.2)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
