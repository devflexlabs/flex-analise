import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Flex Análise - Grupo Flex",
  description: "Análise inteligente de contratos financeiros - Grupo Flex",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "font-poppins",
            style: {
              borderRadius: "0.5rem",
              padding: "1rem",
              fontSize: "0.875rem",
              fontWeight: "500",
            },
            success: {
              iconTheme: {
                primary: "#1e3a8a",
                secondary: "#fff",
              },
              style: {
                background: "#ffffff",
                color: "#1e293b",
                border: "2px solid #1e3a8a",
              },
              duration: 3000,
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
              style: {
                background: "#ffffff",
                color: "#1e293b",
                border: "2px solid #ef4444",
              },
              duration: 4000,
            },
          }}
        />
      </body>
    </html>
  );
}


