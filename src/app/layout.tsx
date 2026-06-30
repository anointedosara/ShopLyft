import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreProvider";
import { getCategories } from "@/lib/catalog";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import Toaster from "@/components/Toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopLyft — Online Shopping for Electronics, Fashion & More",
  description:
    "ShopLyft is your one-stop online marketplace. Shop phones, electronics, fashion, groceries and more with fast delivery and unbeatable flash deals.",
  keywords: ["ShopLyft", "online shopping", "ecommerce", "flash sales", "electronics", "fashion"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cloud text-ink">
        <StoreProvider>
          <Header categories={categories} />
          <CategoryNav categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
