import './globals.css';

export const metadata = {
  title: 'Gestion Smart CRM | Portal de Relaciones con Clientes',
  description: 'Sistema centralizado de administración de relaciones con clientes, control comercial y análisis LTV para Gestion Smart.',
};

export default function RootLayout({ children }) {
  // Script para inyectar el tema oscuro/claro inmediatamente antes de pintar para evitar destellos (FOUC)
  const themeScript = `
    (function() {
      try {
        const storedTheme = localStorage.getItem('gsm_theme');
        const theme = storedTheme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
