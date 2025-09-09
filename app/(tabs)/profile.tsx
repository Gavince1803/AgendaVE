import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Perfil
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <IconSymbol name="person.fill" size={40} color="#6b7280" />
          </View>
        </View>
        
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>
            {user?.profile?.full_name || 'Usuario'}
          </ThemedText>
          <ThemedText style={styles.userEmail}>
            {user?.email}
          </ThemedText>
          <View style={styles.roleBadge}>
            <ThemedText style={styles.roleText}>
              {user?.profile?.role === 'client' ? 'Cliente' : 
               user?.profile?.role === 'provider' ? 'Proveedor' : 'Admin'}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name={item.icon} size={24} color="#6b7280" />
              <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
          <ThemedText style={styles.signOutText}>Cerrar Sesión</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});

