import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FUN-MATH — Media Pembelajaran Matematika",
  description:
    "Media pembelajaran interaktif matematika hitung susun ke bawah untuk Anak Hambatan Pendengaran (AHD). Belajar penjumlahan, pengurangan, dan perkalian dengan cara yang menyenangkan!",
  keywords: [
    "matematika",
    "anak",
    "belajar",
    "hitung susun",
    "penjumlahan",
    "pengurangan",
    "perkalian",
    "AHD",
    "hambatan pendengaran",
    "edukasi inklusif",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
