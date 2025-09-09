# AgendaVE 📱

Una aplicación móvil moderna para reservas de servicios en Venezuela, inspirada en Booksy pero con un diseño único y diferenciado.

## 🚀 Características

- **Autenticación completa** con roles (Cliente, Proveedor, Admin)
- **Interfaz moderna** con diseño diferenciado y UX optimizada
- **Gestión de citas** para clientes y proveedores
- **Exploración de servicios** con categorías y filtros
- **Dashboard personalizado** según el rol del usuario
- **Integración con Supabase** para backend y base de datos

## 🛠️ Tecnologías

- **React Native** + **Expo** para desarrollo móvil
- **TypeScript** para tipado estático
- **Supabase** para backend y autenticación
- **Expo Router** para navegación
- **React Navigation** para navegación entre pantallas

## 📱 Pantallas MVP

### Autenticación
- Login/Registro
- Selección de rol

### Cliente
- **Inicio**: Categorías populares y proveedores destacados
- **Explorar**: Búsqueda y filtrado de servicios
- **Mis Citas**: Gestión de citas (próximas/historial)
- **Perfil**: Configuración de usuario

### Proveedor
- **Dashboard**: Estadísticas y próximas citas
- **Citas**: Gestión de citas de clientes
- **Servicios**: CRUD de servicios ofrecidos
- **Perfil**: Configuración de negocio

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd AgendaVE
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Edita `.env` con tus credenciales de Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

4. **Iniciar la aplicación**
   ```bash
   npx expo start
   ```

## 🗄️ Base de Datos

El proyecto utiliza Supabase con las siguientes tablas principales:

- `profiles` - Perfiles de usuarios
- `providers` - Información de proveedores/negocios
- `services` - Servicios ofrecidos
- `appointments` - Citas agendadas
- `availabilities` - Horarios disponibles

## 🎨 Diseño

- **Colores principales**: Azul (#2563eb) y tonos neutros
- **Tipografía**: Sistema nativo con pesos variados
- **Componentes**: Cards con sombras, botones redondeados
- **Iconografía**: SF Symbols para iOS, Material Icons para Android
- **Espaciado**: Sistema consistente de 8px

## 📁 Estructura del Proyecto

```
app/
├── (auth)/          # Pantallas de autenticación
├── (tabs)/          # Pantallas principales con tabs
├── _layout.tsx      # Layout raíz
components/          # Componentes reutilizables
contexts/           # Contextos de React (Auth)
lib/                # Configuración de Supabase
constants/          # Constantes y colores
```

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Ejecuta en Android
- `npm run ios` - Ejecuta en iOS
- `npm run web` - Ejecuta en web
- `npm run lint` - Ejecuta el linter

## 🚧 Estado del Proyecto

**MVP Completado** ✅
- [x] Autenticación y roles
- [x] Navegación entre pantallas
- [x] Pantallas para clientes
- [x] Pantallas para proveedores
- [x] Integración con Supabase
- [x] Diseño moderno y diferenciado

## 🔮 Próximas Características

- [ ] Sistema de pagos
- [ ] Notificaciones push
- [ ] Geolocalización
- [ ] Reseñas y calificaciones
- [ ] Chat en tiempo real
- [ ] Reportes y analytics

## 📄 Licencia

Este proyecto es privado y confidencial.

## 🤝 Contribución

Para contribuir al proyecto, contacta al equipo de desarrollo.

---

**AgendaVE** - Tu plataforma de reservas en Venezuela 🇻🇪
