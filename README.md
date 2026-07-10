# 🏢 Sistema de Facturación Residencial

Sistema de escritorio para la gestión de apartamentos, propietarios, lecturas de gas y facturación mensual. Construido con **Next.js 16**, **Electron**, **Supabase** y **TypeScript**.

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [Git](https://git-scm.com/)
- Una cuenta en [Supabase](https://supabase.com/) con el proyecto configurado
- Una cuenta en [EmailJS](https://www.emailjs.com/) para el sistema de recuperación de PIN

---

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/VICTORRUDECINDO/residencial-app.git
cd residencial-app
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará automáticamente todos los módulos necesarios, incluyendo:
- `next` — Framework de React para la interfaz
- `electron` — Para la ventana de escritorio
- `@supabase/supabase-js` — Conexión a la base de datos
- `@emailjs/browser` — Envío de correos de recuperación de PIN
- `recharts` — Gráficos del Dashboard
- `lucide-react` — Íconos

---

## 🔑 Configuración de Credenciales

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido. **Este archivo NO se sube a GitHub** por seguridad.

```env
# Supabase — Obtén estos valores en: supabase.com > Tu Proyecto > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON_KEY

# EmailJS — Obtén estos valores en: emailjs.com > Account > API Keys y Email Services
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_XXXXXXX
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_XXXXXXX
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=TU_PUBLIC_KEY
```

---

## ▶️ Comandos para Ejecutar

### Iniciar solo el servidor web (Next.js)
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Iniciar la aplicación de escritorio (Electron) ⭐
> Asegúrate de que el servidor `npm run dev` esté corriendo en otra terminal antes de ejecutar este comando.

```bash
npm run dev:electron
```

Esto abrirá la ventana de escritorio en pantalla completa. Puedes usar **F11** para alternar entre pantalla completa y ventana.

---

## 🗂️ Estructura del Proyecto

```
residencial-app/
├── Main.js               # Proceso principal de Electron
├── src/
│   ├── app/              # Páginas de la aplicación (Next.js App Router)
│   │   ├── page.tsx      # Dashboard
│   │   ├── apartamentos/ # Módulo de Apartamentos
│   │   ├── propietarios/ # Módulo de Propietarios
│   │   ├── lecturas/     # Módulo de Lecturas de Gas
│   │   ├── financiero/   # Módulo Financiero
│   │   └── configuracion/ # Configuración del sistema
│   ├── components/       # Componentes reutilizables
│   │   ├── LockScreen.tsx # Pantalla de bloqueo con PIN
│   │   ├── layout/       # Sidebar y AppShell
│   │   └── modals/       # Ventanas modales (CRUD)
│   ├── context/          # Contextos de React (AuthContext)
│   ├── lib/              # Cliente de Supabase
│   └── types/            # Tipos TypeScript del esquema DB
├── public/               # Archivos estáticos (logo, etc.)
└── .env.local            # ⚠️ Credenciales (NO subir a Git)
```

---

## 🔐 Acceso al Sistema

Al iniciar, el sistema mostrará una pantalla de bloqueo. El **PIN por defecto** es:

```
123456
```

Puedes cambiar el PIN y configurar un correo de recuperación desde el módulo de **Configuración**.

---

## 📋 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo Next.js |
| `npm run dev:electron` | Abre la ventana de escritorio Electron |
| `npm run build` | Compila la app para producción |
| `npm run build:exe` | Genera el ejecutable `.exe` instalable |
| `npm run lint` | Revisa errores de código |
