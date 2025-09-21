# AgendaVE 📱

Una aplicación móvil moderna para reservas de servicios en Venezuela, inspirada en Booksy pero con un diseño único y diferenciado.

## 🚀 Características

- **Autenticación completa** con roles (Cliente, Proveedor, Admin)
- **Interfaz moderna** con diseño diferenciado y UX optimizada
- **Gestión de citas** para clientes y proveedores
- **Sistema de favoritos** para guardar proveedores preferidos
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
- **Favoritos**: Proveedores guardados como favoritos
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
- `user_favorites` - Relación entre usuarios y proveedores favoritos

### 💖 Sistema de Favoritos

El sistema de favoritos permite a los usuarios guardar sus proveedores preferidos para acceso rápido.

#### Características:
- **Añadir/Quitar favoritos**: Desde pantallas de explorar y detalle de proveedor
- **Pantalla dedicada**: Tab exclusivo para ver todos los favoritos
- **Persistencia**: Guardado en base de datos con sincronización en tiempo real
- **Indicadores visuales**: Iconos de corazón que cambian según el estado

#### Base de Datos:
```sql
CREATE TABLE user_favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, provider_id)
);
```

#### Funciones Principales:
- `BookingService.addToFavorites(providerId)` - Añadir a favoritos
- `BookingService.removeFromFavorites(providerId)` - Quitar de favoritos
- `BookingService.getFavoriteProviders()` - Obtener lista de favoritos
- `BookingService.isProviderFavorite(providerId)` - Verificar estado
- `BookingService.getFavoriteStatuses(providerIds[])` - Estados múltiples

#### Troubleshooting:
Si experimentas problemas con favoritos, usa las funciones de debug en `lib/debug-favorites.ts` para diagnóstico detallado.

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
- [x] Sistema de citas completo (crear, confirmar, cancelar, reprogramar)
- [x] Sistema de favoritos completo (agregar, quitar, visualizar)
- [x] Gestión de servicios para proveedores
- [x] Dashboard con estadísticas en tiempo real
- [x] Soporte multiplataforma (iOS, Android, Web)

## 🆕 Últimas Mejoras (Sep 2025)

### Funcionalidades Añadidas
- **Sistema de favoritos completo**: Agregar/quitar proveedores de favoritos
- **Sistema de citas completo**: Confirmación, cancelación y reprogramación
- **Permisos granulares**: RLS policies optimizadas para appointments y favoritos
- **Interfaz mejorada**: Botones de acción rápida y iconos de favoritos
- **Compatibilidad web**: Confirmaciones nativas para navegadores
- **Logging mejorado**: Sistema de logs estructurado para debugging

### Correcciones Técnicas
- ✅ **BookingService**: Métodos `confirmAppointment`, `cancelAppointment`, `updateAppointment`
- ✅ **FavoritesService**: Métodos `addToFavorites`, `removeFromFavorites`, `getFavoriteProviders`
- ✅ **RLS Policies**: Políticas de seguridad optimizadas para clientes y proveedores
- ✅ **Data Fetching**: Joins manuales para evitar errores de foreign keys
- ✅ **Cross-platform**: Alertas y confirmaciones compatibles con web/móvil
- ✅ **Authentication**: Validación de permisos mejorada
- ✅ **Debug Utilities**: Herramientas de debugging para troubleshooting

## 🔮 Próximas Características

- [ ] Sistema de pagos
- [ ] Notificaciones push
- [ ] Geolocalización
- [ ] Reseñas y calificaciones avanzadas
- [ ] Chat en tiempo real
- [ ] Reportes y analytics
- [ ] Sincronización offline

## 📄 Licencia

Este proyecto es privado y confidencial.

## 🤝 Contribución

Para contribuir al proyecto, contacta al equipo de desarrollo.

---

**AgendaVE** - Tu plataforma de reservas en Venezuela 🇻🇪
