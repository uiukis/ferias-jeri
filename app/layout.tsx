import AuthProvider from "@/components/auth-provider";
import TopbarShell from "@/components/navigation/topbar-shell";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ferias Jeri",
  description: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialName = cookieStore.get("auth_name")?.value ?? undefined;
  return (
    <html lang="pt-BR">
      <body className={`${poppins.className} antialiased`}>
        <AuthProvider>
          <TopbarShell initialName={initialName} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
