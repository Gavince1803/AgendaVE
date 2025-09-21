import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Toast } from '@/components/ui/Toast';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isProvider = user?.profile?.role === 'provider';

  const handleSignOut = async () => {
    console.log('🔴 [PROFILE] handleSignOut llamado');
    console.log('🔴 [PROFILE] isSigningOut:', isSigningOut);
    
    if (isSigningOut) {
      console.log('🔴 [PROFILE] Ya se está cerrando sesión, ignorando...');
      return;
    }
    
    console.log('🔴 [PROFILE] Mostrando confirmación...');
    
    // Usar confirm() en lugar de Alert.alert para mejor compatibilidad con web
    const confirmed = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
    
    if (confirmed) {
      console.log('🔴 [PROFILE] Usuario confirmó cerrar sesión');
      setIsSigningOut(true);
      
      try {
        console.log('🔴 [PROFILE] Llamando a signOut()...');
        await signOut();
        console.log('🔴 [PROFILE] ✅ signOut() completado exitosamente');
        
        setToastMessage('Sesión cerrada exitosamente');
        setToastType('success');
        setShowToast(true);
        
        setTimeout(() => {
          console.log('🔴 [PROFILE] Navegando a login...');
          router.replace('/(auth)/login');
        }, 1000);
        
      } catch (error) {
        console.error('🔴 [PROFILE] ❌ Error en signOut:', error);
        setToastMessage('Error al cerrar sesión. Inténtalo de nuevo.');
        setToastType('error');
        setShowToast(true);
        setIsSigningOut(false);
      }
    } else {
      console.log('🔴 [PROFILE] Usuario canceló cerrar sesión');
    }
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Editar Perfil',
      icon: 'person.circle',
      onPress: () => {
        router.push('/(main)/profile-edit');
      },
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'bell',
      onPress: () => {
        // Show notification settings in a modal
        Alert.alert(
          'Configuración de Notificaciones',
          'Configura cómo quieres recibir notificaciones sobre tus citas y recordatorios.',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Activar Push',
              onPress: () => {
                setToastMessage('Notificaciones push activadas');
                setToastType('success');
                setShowToast(true);
              }
            },
            {
              text: 'Solo Email',
              onPress: () => {
                setToastMessage('Solo recibirás notificaciones por email');
                setToastType('success');
                setShowToast(true);
              }
            }
          ]
        );
      },
    },
    {
      id: 'payment-methods',
      title: 'Métodos de Pago',
      icon: 'creditcard',
      onPress: () => {
        // Show payment methods management
        Alert.alert(
          'Métodos de Pago',
          'Gestiona tus métodos de pago y facturación',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Agregar Tarjeta',
              onPress: () => {
                Alert.alert('Información', 'La gestión de métodos de pago estará disponible próximamente');
              }
            }
          ]
        );
      },
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      icon: 'questionmark.circle',
      onPress: () => {
        // Show help and support options
        Alert.alert(
          'Ayuda y Soporte',
          '¿En qué podemos ayudarte?',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Preguntas Frecuentes',
              onPress: () => {
                Alert.alert(
                  'Preguntas Frecuentes',
                  '¿¿Cómo hago una reserva?\nSelecciona un proveedor, elige un servicio, selecciona fecha y hora.\n\n¿Puedo cancelar mi cita?\nSí, puedes cancelar desde "Mis Citas".\n\n¿Cómo contacto al proveedor?\nEncuentra la información de contacto en los detalles del proveedor.',
                  [{ text: 'Entendido' }]
                );
              }
            },
            {
              text: 'Contactar Soporte',
              onPress: () => {
                Alert.alert(
                  'Contactar Soporte',
                  'Contáctanos:\n\nEmail: soporte@agendave.com\nTeléfono: +58 412-1234567\nHorario: Lun-Vie 9AM-6PM',
                  [{ text: 'Cerrar' }]
                );
              }
            }
          ]
        );
      },
    },
    {
      id: 'about',
      title: 'Acerca de',
      icon: 'info.circle',
      onPress: () => {
        Alert.alert(
          'Acerca de AgendaVE',
          'Versión: 1.0.0\n\nAgendaVE es tu plataforma de reservas en Venezuela.\n\nConecta con los mejores proveedores de servicios y gestiona tus citas de manera sencilla.\n\n© 2024 AgendaVE. Todos los derechos reservados.',
          [{ text: 'Cerrar' }]
        );
      },
    },
    // Provider-specific menu items
    ...(isProvider ? [
      {
        id: 'my-business',
        title: 'Mi Negocio',
        icon: 'building.2',
        onPress: () => {
          router.push('/(provider)/my-business');
        },
      },
      {
        id: 'provider-settings',
        title: 'Configuración de Proveedor',
        icon: 'gearshape',
        onPress: () => {
          Alert.alert(
            'Panel de Proveedor',
            'Accede a las herramientas para gestionar tu negocio',
            [
              {
                text: 'Cancelar',
                style: 'cancel'
              },
              {
                text: 'Mi Negocio',
                onPress: () => router.push('/(provider)/my-business')
              },
              {
                text: 'Empleados',
                onPress: () => router.push('/(provider)/employee-management')
              },
              {
                text: 'Horarios',
                onPress: () => router.push('/(provider)/availability')
              }
            ]
          );
        },
      },
    ] : [
      {
        id: 'favorites',
        title: 'Mis Favoritos',
        icon: 'heart',
        onPress: () => {
          router.push('/(tabs)/favorites');
        },
      },
    ]),
    {
      id: 'privacy',
      title: 'Privacidad y Seguridad',
      icon: 'lock.shield',
      onPress: () => {
        Alert.alert(
          'Privacidad y Seguridad',
          'Gestiona tu privacidad y seguridad',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Ver Configuración',
              onPress: () => {
                Alert.alert(
                  'Configuración de Privacidad',
                  'Tu privacidad es importante para nosotros.\n\n• Tus datos están encriptados\n• No compartimos información personal\n• Puedes eliminar tu cuenta en cualquier momento\n\nPara cambios específicos, contacta soporte.',
                  [{ text: 'Entendido' }]
                );
              }
            }
          ]
        );
      },
    },
  ];

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Perfil
          </ThemedText>
        </ThemedView>

        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileContent}>
            <Avatar 
              name={user?.profile?.display_name || 'Usuario'}
              size="xl"
              style={styles.avatar}
            />
            
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {user?.profile?.display_name || 'Usuario'}
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {user?.email}
              </ThemedText>
              {user?.profile?.phone && (
                <ThemedText style={styles.userPhone}>
                  {user.profile.phone}
                </ThemedText>
              )}
              <Badge 
                variant={user?.profile?.role === 'provider' ? 'success' : 'primary'}
                size="medium"
                style={styles.roleBadge}
              >
                {user?.profile?.role === 'client' ? 'Cliente' : 
                 user?.profile?.role === 'provider' ? 'Proveedor' : 'Usuario'}
              </Badge>
            </View>
          </View>
        </Card>

        <Card variant="elevated" style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name={item.icon} size={24} color={Colors.light.icon} />
                <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={Colors.light.iconSecondary} />
            </TouchableOpacity>
          ))}
        </Card>

        <View style={styles.signOutSection}>
          <Button
            title={isSigningOut ? "Cerrando Sesión..." : "Cerrar Sesión"}
            variant="outline"
            size="large"
            loading={isSigningOut}
            disabled={isSigningOut}
            icon={!isSigningOut ? <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={Colors.light.error} /> : undefined}
            onPress={() => {
              console.log('🔴 [PROFILE] Botón Cerrar Sesión presionado');
              handleSignOut();
            }}
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'], // Espacio extra para scroll
  },
  header: {
    padding: DesignTokens.spacing['2xl'],
    paddingTop: DesignTokens.spacing.lg,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['3xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  profileCard: {
    marginHorizontal: DesignTokens.spacing['2xl'],
    marginBottom: DesignTokens.spacing['2xl'],
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing['2xl'],
  },
  avatar: {
    marginBottom: DesignTokens.spacing.lg,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  userPhone: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },
  roleBadge: {
    marginTop: DesignTokens.spacing.sm,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    marginHorizontal: DesignTokens.spacing['2xl'],
    marginBottom: DesignTokens.spacing['2xl'],
    paddingVertical: DesignTokens.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    marginLeft: DesignTokens.spacing.lg,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  signOutSection: {
    paddingHorizontal: DesignTokens.spacing['2xl'],
    marginBottom: DesignTokens.spacing['2xl'],
  },
  signOutButton: {
    borderColor: Colors.light.error,
    borderWidth: 2,
  },
});

