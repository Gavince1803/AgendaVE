# 📲 Proyecto: App de Reservas tipo Booksy para Venezuela

## 🎯 Contexto
Estamos creando una aplicación móvil en **React Native (Expo)** con **Supabase** como backend.  
La app conecta **clientes** con **proveedores de servicios** (peluquerías, barberías, estética, spa, etc.).  

## 🔑 Flujo Cliente → Proveedor
1. Cliente explora categorías y proveedores.
2. Cliente selecciona un proveedor y ve:
   - Nombre, bio, ubicación (ej. Google Maps / dirección).
   - Lista de servicios con precios y duración.
   - Horarios disponibles (según agenda del proveedor).
   - Calificación promedio + reviews de otros clientes.
3. Cliente selecciona un servicio + fecha + hora.
4. Se crea una cita:
   - Estado inicial: `pending`.
   - El proveedor recibe notificación push.
5. Proveedor abre su dashboard:
   - Ve cita nueva → puede `confirmar` o `rechazar`.
6. Cliente recibe actualización del estado.
7. Una vez completada la cita:
   - Cliente y proveedor pueden calificarse mutuamente.
   - Calificación y review quedan visibles en el perfil del proveedor.

---

## ⚙️ Reglas de Negocio

### Servicios y precios
- Cada proveedor define sus servicios con:
  - Nombre
  - Descripción
  - Precio (en Bs o USD, depende del mercado)
  - Duración (minutos, configurable)

### Disponibilidad / horarios
- Proveedor define franjas horarias disponibles.
- Puede ser:
  - Horarios fijos (ej. Lunes a Viernes, 9am–6pm)
  - O disponibilidad variable por días.
- La duración del servicio bloquea el slot automáticamente.

### Flujo de reserva
- Cliente elige un horario libre.
- La cita queda en estado `pending`.
- Proveedor confirma/rechaza.
- Si confirma, queda `confirmed`.
- Si rechaza, queda `cancelled`.

### Pagos
- Fase inicial: solo reservas (sin pagos integrados).
- Futuro: integración con pago móvil, Zelle o Binance Pay.

---

## 📱 Funcionalidades principales

### Cliente
- Registrarse / iniciar sesión (Supabase Auth).
- Editar perfil (nombre, teléfono, foto).
- Explorar proveedores por categorías o ubicación.
- Ver perfil de proveedor con:
  - Servicios
  - Horarios disponibles
  - Ubicación
  - Calificaciones
- Reservar un servicio (elige fecha y hora).
- Recibir notificaciones push de:
  - Confirmación/rechazo de cita
  - Recordatorio de cita
- Calificar proveedor después de cita.

### Proveedor
- Registrarse / iniciar sesión.
- Completar perfil de proveedor (nombre, bio, dirección, logo/foto).
- Definir servicios (nombre, precio, duración).
- Definir disponibilidad (agenda).
- Ver citas pendientes y confirmadas.
- Confirmar o rechazar citas.
- Recibir notificaciones push de nuevas reservas.
- Ver calificaciones y feedback de clientes.

---

## 🔔 Notificaciones
- **Push notifications** (con Expo Notifications y tabla `device_push_tokens` en Supabase).
- Emails opcionales vía Supabase (no obligatorio en v1).
- Eventos que generan notificación:
  - Nueva reserva (a proveedor).
  - Confirmación/rechazo (a cliente).
  - Recordatorio (a cliente y proveedor).

---

## 📂 Tablas clave en Supabase
- `profiles` → todos los usuarios (cliente/proveedor/admin).
- `providers` → info extendida de proveedores.
- `services` → servicios ofrecidos.
- `availabilities` → horarios disponibles.
- `appointments` → citas (con estado: pending, confirmed, cancelled, completed).
- `reviews` → calificaciones y comentarios.
- `device_push_tokens` → tokens de notificaciones push.

---

## 🛠️ Objetivo de este prompt
Generar en React Native (Expo) las pantallas y lógica necesarias para:
- Flujo cliente: explorar → reservar → recibir confirmación → calificar.
- Flujo proveedor: definir servicios/horarios → gestionar citas → recibir notificaciones.
- Conexión con Supabase (auth + db + RLS).
- Integrar push notifications básicas.

