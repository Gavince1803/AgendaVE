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
        // TODO: Implementar edición de perfil
        Alert.alert('Próximamente', 'Esta función estará disponible pronto');
      },
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'bell',
      onPress: () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto');
      },
    },
    {
      id: 'payment-methods',
      title: 'Métodos de Pago',
      icon: 'creditcard',
      onPress: () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto');
      },
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      icon: 'questionmark.circle',
      onPress: () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto');
      },
    },
    {
      id: 'about',
      title: 'Acerca de',
      icon: 'info.circle',
      onPress: () => {
        Alert.alert('Acerca de', 'AgendaVE v1.0.0\n\nTu plataforma de reservas en Venezuela');
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

