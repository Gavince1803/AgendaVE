# Guía de Configuración para Android

Esta guía te ayudará a configurar y ejecutar AgendaVE en Android.

## 📋 Pre-requisitos

1. **Android Studio** instalado con Android SDK
2. **Java Development Kit (JDK)** 17 o superior
3. **Node.js** 18+ instalado
4. **Expo CLI** actualizado

## 🔧 Configuración Inicial

### 1. Verificar instalación de dependencias

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar Java
java -version
```

### 2. Configurar variables de entorno de Android

Agrega estas variables a tu sistema (en Windows, Panel de Control > Sistema > Variables de entorno):

```
ANDROID_HOME=C:\Users\<TuUsuario>\AppData\Local\Android\Sdk
```

Agrega a PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\emulator
```

### 3. Instalar dependencias del proyecto

```bash
cd C:\Users\PC\Desktop\booker\AgendaVE
npm install
```

## 🚀 Ejecutar en Android

### Opción 1: Usando Expo Go (Desarrollo rápido)

1. Instala Expo Go en tu dispositivo Android desde Google Play Store
2. Ejecuta el proyecto:
```bash
npm start
```
3. Escanea el código QR con la app Expo Go

**Nota**: Expo Go tiene limitaciones con notificaciones push nativas y algunos módulos nativos.

### Opción 2: Development Build (Recomendado para testing completo)

#### Crear el build de desarrollo:

```bash
# Instalar Expo CLI si no lo tienes
npm install -g expo-cli

# Instalar EAS CLI
npm install -g eas-cli

# Login a tu cuenta de Expo
eas login

# Configurar el proyecto
eas build:configure

# Crear un build de desarrollo para Android
eas build --profile development --platform android
```

#### Instalar el build en tu dispositivo:

1. Una vez completado el build, recibirás un link de descarga
2. Descarga el APK en tu dispositivo Android
3. Instala el APK (permite instalación desde fuentes desconocidas si es necesario)

#### Ejecutar el desarrollo:

```bash
# Inicia el servidor de desarrollo
npm start

# En otro terminal, puedes ver logs
npx react-native log-android
```

### Opción 3: Usando Android Studio Emulator

#### Configurar un emulador:

1. Abre Android Studio
2. Ve a Tools > AVD Manager
3. Crea un nuevo Virtual Device:
   - Dispositivo recomendado: Pixel 5 o similar
   - System Image: Android 13 (Tiramisu) o superior
   - RAM: 2GB mínimo

#### Ejecutar en el emulador:

```bash
# Inicia el emulador desde Android Studio o
emulator -avd <nombre_del_avd>

# En otro terminal, ejecuta
npm run android
```

## 🛠️ Configuraciones Específicas de Android

### 1. Permisos en AndroidManifest.xml

El archivo ya debe tener los permisos necesarios, pero verifica:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 2. Configuración de Notificaciones Push

Para notificaciones push en Android, necesitas:

1. **Firebase Cloud Messaging (FCM)** configurado
2. Archivo `google-services.json` en `android/app/`

#### Configurar FCM:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Agrega una app Android
4. Descarga `google-services.json`
5. Coloca el archivo en `android/app/google-services.json`

### 3. Deep Links

Para que funcionen los enlaces de invitación de empleados:

Verifica en `app.json`:

```json
{
  "expo": {
    "scheme": "agendave",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "agendave"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## 🐛 Troubleshooting

### Error: "SDK location not found"

Solución:
```bash
# Crear archivo local.properties en android/
echo "sdk.dir=C:\\Users\\<TuUsuario>\\AppData\\Local\\Android\\Sdk" > android/local.properties
```

### Error: "Unable to load script. Make sure you're running a Metro server"

Solución:
```bash
# Limpiar cache y reiniciar
npm start -- --reset-cache
```

### Error: "INSTALL_FAILED_INSUFFICIENT_STORAGE"

Solución:
- Libera espacio en el dispositivo/emulador
- Usa un emulador con más almacenamiento

### Error de Gradle build

Solución:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

## 📱 Testing en Dispositivo Físico

### 1. Habilitar Modo Desarrollador en Android:

1. Ve a Configuración > Acerca del teléfono
2. Toca 7 veces en "Número de compilación"
3. Vuelve a Configuración > Opciones de desarrollador
4. Habilita "Depuración USB"

### 2. Conectar dispositivo:

```bash
# Verificar que el dispositivo está conectado
adb devices

# Si no aparece, intenta:
adb kill-server
adb start-server
adb devices
```

### 3. Ejecutar app en dispositivo:

```bash
npm run android
```

## 🎯 Testing de Funcionalidades Críticas

### Push Notifications

1. Asegúrate de tener FCM configurado
2. Registra tu token de dispositivo
3. Crea una cita de prueba
4. Verifica que el provider reciba la notificación

### Deep Links (Invitaciones de empleados)

1. Crea un empleado desde la app
2. Copia el link de invitación
3. Ábrelo en el dispositivo (puede usar `adb shell am start -a android.intent.action.VIEW -d "agendave://accept-invite?token=XXX"`)
4. Verifica que abra la pantalla correcta

### Booking Flow

1. Explora proveedores
2. Selecciona un servicio
3. Elige fecha y hora
4. Confirma la reserva con pago on-site
5. Verifica que la cita se cree correctamente

## 📦 Build para Producción

### Crear APK firmado:

```bash
# Configurar firma en eas.json
eas build --platform android --profile production
```

### Subir a Google Play Store:

1. Ve a [Google Play Console](https://play.google.com/console)
2. Crea una nueva app
3. Completa la información requerida
4. Sube el APK/AAB generado
5. Completa el proceso de revisión

## 🔐 Variables de Entorno

Asegúrate de tener un archivo `.env` con:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
EXPO_PUBLIC_EMPLOYEE_INVITE_URL=agendave://accept-invite
```

## ✅ Checklist Pre-Launch

- [ ] Notificaciones push funcionando
- [ ] Deep links funcionando
- [ ] Booking flow completo funcional
- [ ] Pagos on-site implementados
- [ ] Slots de tiempo ajustados a duración de servicio
- [ ] Autoscroll en pantallas de reserva
- [ ] Sistema de invitaciones de empleados
- [ ] Testing en múltiples dispositivos Android
- [ ] Performance optimizado
- [ ] Manejo de errores adecuado

## 📞 Soporte

Si tienes problemas, revisa:
- Logs: `npx react-native log-android`
- Metro bundler: `npm start`
- Supabase Dashboard para errores de backend
