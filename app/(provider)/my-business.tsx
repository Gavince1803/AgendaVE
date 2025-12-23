// Mi Negocio - Pantalla de configuración del negocio para proveedores
// Permite al proveedor configurar los datos de su negocio, servicios y horarios

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Availability, BookingService, Provider, Service } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyBusinessScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInactiveServices, setShowInactiveServices] = useState(false);
  const [revenueThisMonth, setRevenueThisMonth] = useState<{ currency: string; amount: number } | null>(null);
  const [monthlyAppointments, setMonthlyAppointments] = useState<number>(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Estados para edición
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessData, setBusinessData] = useState({
    business_name: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    email: '',

  });

  useEffect(() => {
    loadBusinessData();
  }, []);

  // Refilter services when toggle changes
  useEffect(() => {
    const filteredServices = showInactiveServices
      ? allServices // Show all services
      : allServices.filter(s => s.is_active === true); // Show only active
    setServices(filteredServices);
  }, [showInactiveServices, allServices]);

  const loadBusinessData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      log.info(LogCategory.SERVICE, 'Loading business data', { userId: user.id });

      // Cargar datos del proveedor
      let providerData = await BookingService.getProviderById(user.id);

      // Si no existe el proveedor, crear uno básico
      if (!providerData) {
        log.info(LogCategory.SERVICE, 'Provider not found, creating new provider', { userId: user.id });
        providerData = await BookingService.createProvider({
          user_id: user.id,
          name: user.email || 'Mi Negocio',
          business_name: user.email || 'Mi Negocio',
          category: 'general',
          bio: '',
          address: '',
          phone: '',
          email: user.email || '',
          is_active: true,
        });
      }

      setProvider(providerData);
      setBusinessData({
        business_name: providerData.business_name || '',
        category: providerData.category || '',
        description: providerData.bio || '',
        address: providerData.address || '',
        phone: providerData.phone || '',
        email: providerData.email || '',

      });

      // Cargar TODOS los servicios (activos e inactivos) para gestión
      const allServicesData = await BookingService.getAllProviderServices(providerData.id);
      console.log('🔴 [MY BUSINESS] All services loaded:', allServicesData);
      console.log('🔴 [MY BUSINESS] All services summary:', allServicesData.map(s => ({ id: s.id, name: s.name, is_active: s.is_active })));

      // Store all services
      setAllServices(allServicesData);

      // Filter services based on toggle state
      const filteredServices = showInactiveServices
        ? allServicesData // Show all services
        : allServicesData.filter(s => s.is_active === true); // Show only active

      console.log('🔴 [MY BUSINESS] Filtered services:', filteredServices.map(s => ({ id: s.id, name: s.name, is_active: s.is_active })));
      setServices(filteredServices);

      // Cargar disponibilidad del proveedor
      const availabilityData = await BookingService.getProviderAvailability(providerData.id);
      setAvailability(availabilityData);

      // Cargar métricas del proveedor
      try {
        const [revenue, apptCount] = await Promise.all([
          BookingService.getProviderRevenueThisMonth(user.id),
          BookingService.getMonthlyAppointmentsCount(user.id)
        ]);
        setRevenueThisMonth(revenue);
        setMonthlyAppointments(apptCount);
      } catch (metricsError) {
        console.warn('🔴 [MY BUSINESS] Error loading metrics:', metricsError);
      }

      log.info(LogCategory.SERVICE, 'Business data loaded successfully', {
        providerId: user.id,
        servicesCount: allServicesData.length,
        activeServicesCount: allServicesData.filter(s => s.is_active === true).length,
        availabilityCount: availabilityData.length
      });
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Error loading business data', { error: error instanceof Error ? error.message : String(error) });
      Alert.alert('Error', 'No se pudieron cargar los datos del negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    console.log('🔴 [MY BUSINESS] handleSaveBusiness llamado');
    console.log('🔴 [MY BUSINESS] user:', user);
    console.log('🔴 [MY BUSINESS] provider:', provider);
    console.log('🔴 [MY BUSINESS] businessData:', businessData);

    if (!user || !provider) {
      console.log('🔴 [MY BUSINESS] Error: user o provider es null');
      return;
    }

    try {
      setSaving(true);
      log.userAction('Save business data', { providerId: user.id, data: businessData });

      console.log('🔴 [MY BUSINESS] Guardando datos:', businessData);

      // Actualizar el proveedor con los nuevos datos
      const updatedProvider = await BookingService.updateProvider(user.id, businessData);

      console.log('🔴 [MY BUSINESS] Proveedor actualizado:', updatedProvider);

      Alert.alert(
        '✅ Datos Guardados',
        'La información de tu negocio se ha actualizado correctamente.',
        [
          {
            text: 'Continuar',
            style: 'default',
            onPress: () => {
              setEditingBusiness(false);
              loadBusinessData();
            }
          }
        ]
      );
    } catch (error) {
      console.error('🔴 [MY BUSINESS] Error guardando:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(LogCategory.SERVICE, 'Error saving business data', { error: errorMessage });
      Alert.alert('Error', `No se pudieron guardar los datos: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Restaurar los datos originales del proveedor
    if (provider) {
      setBusinessData({
        business_name: provider.business_name || '',
        category: provider.category || '',
        description: provider.bio || '',
        address: provider.address || '',
        phone: provider.phone || '',
        email: provider.email || '',

      });
    }
    setEditingBusiness(false);
  };

  const handleAddService = () => {
    log.userAction('Add new service', { providerId: user?.id });
    router.push('/(provider)/add-service');
  };

  const handleEditService = (serviceId: string) => {
    log.userAction('Edit service', { serviceId, providerId: user?.id });
    router.push({
      pathname: '/(provider)/edit-service',
      params: { serviceId }
    });
  };

  const handleManageAvailability = () => {
    log.userAction('Manage availability', { providerId: user?.id });
    router.push('/(provider)/availability');
  };

  if (loading) {
    return (
      <TabSafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={200} borderRadius={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={150} borderRadius={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={150} borderRadius={16} style={{ marginBottom: 16 }} />
        </View>
      </TabSafeAreaView>
    );
  }

  return (
    <TabSafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Mi Negocio
            </ThemedText>
            <NotificationBell />
          </ThemedView>

          {/* Acciones Rápidas */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Acciones Rápidas
              </ThemedText>
            </View>
            <Button
              title="Bloquear Hora / Agendar Manualmente"
              variant="primary"
              onPress={() => {
                log.userAction('Navigate to Manual Booking', { providerId: user?.id });
                router.push('/(provider)/manual-booking');
              }}
              leftIcon={<IconSymbol name="calendar.badge.plus" size={18} color="#fff" />}
            />
          </Card>

          {/* Información del Negocio */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Información del Negocio
              </ThemedText>
              {!editingBusiness && (
                <Button
                  title="Editar"
                  size="small"
                  variant="outline"
                  onPress={() => setEditingBusiness(true)}
                />
              )}
            </View>

            {editingBusiness ? (
              <View style={styles.editForm}>
                {/* Logo uploader */}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setUploadingLogo(true);
                      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (permission.status !== 'granted') {
                        Alert.alert('Permiso requerido', 'Habilita el acceso a la galería para subir el logo');
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                      });
                      if (result.canceled || !result.assets?.length) return;
                      const asset = result.assets[0];
                      // Subir a Supabase Storage (bucket 'logos')
                      try {
                        const fileUri = asset.uri;
                        const mime = (asset as any).mimeType || 'image/jpeg';
                        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
                        const filePath = `${user?.id}/${Date.now()}.${ext}`;
                        const response = await fetch(fileUri);
                        const arrayBuffer = await response.arrayBuffer();
                        const { error: uploadError } = await supabase.storage
                          .from('logos')
                          .upload(filePath, arrayBuffer, { upsert: true, contentType: mime });
                        if (uploadError) throw uploadError;
                        // Obtener URL pública
                        const { data: publicUrl } = await supabase.storage
                          .from('logos').getPublicUrl(filePath);
                        // Persistir en provider
                        await BookingService.updateProvider(user!.id, { logo_url: publicUrl.publicUrl });
                        setProvider(prev => prev ? { ...prev, logo_url: publicUrl.publicUrl } as any : prev);
                        Alert.alert('Logo subido', 'Logo actualizado correctamente');
                      } catch (uploadErr) {
                        console.error('Error uploading logo:', uploadErr);
                        Alert.alert('Error', 'No se pudo subir el logo');
                      }
                    } finally {
                      setUploadingLogo(false);
                    }
                  }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconSymbol name="photo" size={18} color={Colors.light.primary} />
                    <ThemedText>{uploadingLogo ? 'Subiendo logo...' : 'Subir logo'}</ThemedText>
                  </View>
                </TouchableOpacity>

                {/* Banner uploader */}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setUploadingBanner(true);
                      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (permission.status !== 'granted') {
                        Alert.alert('Permiso requerido', 'Habilita el acceso a la galería para subir la portada');
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [16, 9],
                        quality: 0.8,
                      });
                      if (result.canceled || !result.assets?.length) return;
                      const asset = result.assets[0];
                      // Subir a Supabase Storage (bucket 'banners')
                      try {
                        const fileUri = asset.uri;
                        const mime = (asset as any).mimeType || 'image/jpeg';
                        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
                        const filePath = `${user?.id}/${Date.now()}.${ext}`;
                        const response = await fetch(fileUri);
                        const arrayBuffer = await response.arrayBuffer();
                        const { error: uploadError } = await supabase.storage
                          .from('banners')
                          .upload(filePath, arrayBuffer, { upsert: true, contentType: mime });
                        if (uploadError) throw uploadError;
                        // Obtener URL pública
                        const { data: publicUrl } = await supabase.storage
                          .from('banners').getPublicUrl(filePath);
                        // Persistir en provider
                        await BookingService.updateProvider(user!.id, { hero_image_url: publicUrl.publicUrl });
                        setProvider(prev => prev ? { ...prev, hero_image_url: publicUrl.publicUrl } as any : prev);
                        Alert.alert('Portada subida', 'Imagen de portada actualizada correctamente');
                      } catch (uploadErr) {
                        console.error('Error uploading banner:', uploadErr);
                        Alert.alert('Error', 'No se pudo subir la portada');
                      }
                    } finally {
                      setUploadingBanner(false);
                    }
                  }}
                  style={{ alignSelf: 'flex-start', marginTop: 12 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconSymbol name="photo.fill" size={18} color={Colors.light.primary} />
                    <ThemedText>{uploadingBanner ? 'Subiendo portada...' : 'Subir portada (Banner)'}</ThemedText>
                  </View>
                </TouchableOpacity>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nombre del Negocio</Text>
                  <TextInput
                    style={styles.textInput}
                    value={businessData.business_name}
                    onChangeText={(text) => setBusinessData({ ...businessData, business_name: text })}
                    placeholder="Nombre del Negocio"
                    placeholderTextColor={Colors.light.textSecondary}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Categoría</Text>
                  <TextInput
                    style={styles.textInput}
                    value={businessData.category}
                    onChangeText={(text) => setBusinessData({ ...businessData, category: text })}
                    placeholder="Categoría del Negocio"
                    placeholderTextColor={Colors.light.textSecondary}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Descripción</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={businessData.description}
                    onChangeText={(text) => setBusinessData({ ...businessData, description: text })}
                    placeholder="Descripción del Negocio"
                    placeholderTextColor={Colors.light.textSecondary}
                    autoCapitalize="sentences"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    returnKeyType="default"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Dirección</Text>
                  <TextInput
                    style={styles.textInput}
                    value={businessData.address}
                    onChangeText={(text) => setBusinessData({ ...businessData, address: text })}
                    placeholder="Dirección del Negocio"
                    placeholderTextColor={Colors.light.textSecondary}
                    autoCapitalize="sentences"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.textInput}
                    value={businessData.phone}
                    onChangeText={(text) => setBusinessData({ ...businessData, phone: text })}
                    placeholder="Teléfono de Contacto"
                    placeholderTextColor={Colors.light.textSecondary}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={businessData.email}
                    onChangeText={(text) => setBusinessData({ ...businessData, email: text })}
                    placeholder="Email de Contacto"
                    placeholderTextColor={Colors.light.textSecondary}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>



                {/* Botones de acción al final del formulario */}
                <View style={styles.formActions}>
                  <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={handleCancelEdit}
                    style={styles.cancelButton}
                  />
                  <Button
                    title={saving ? "Guardando..." : "Guardar Cambios"}
                    variant="primary"
                    onPress={() => {
                      console.log('🔴 [MY BUSINESS] Botón Guardar presionado');
                      handleSaveBusiness();
                    }}
                    loading={saving}
                    disabled={saving}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.businessInfo}>
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Image
                    source={{ uri: provider?.logo_url || `https://picsum.photos/seed/${provider?.id}/200` }}
                    style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.light.surfaceVariant }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Nombre:</ThemedText>
                  <ThemedText style={styles.infoValue}>{provider?.business_name || 'No especificado'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Categoría:</ThemedText>
                  <ThemedText style={styles.infoValue}>{provider?.category || 'No especificado'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Descripción:</ThemedText>
                  <ThemedText style={styles.infoValue}>{provider?.bio || 'No especificado'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Dirección:</ThemedText>
                  <ThemedText style={styles.infoValue}>{provider?.address || 'No especificado'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Teléfono:</ThemedText>
                  <ThemedText style={styles.infoValue}>{provider?.phone || 'No especificado'}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Email:</ThemedText>
                  <ThemedText style={styles.infoValue}>{provider?.email || 'No especificado'}</ThemedText>
                </View>

              </View>
            )}
          </Card>

          {/* Clientes */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Clientes
              </ThemedText>
              <Button
                title="Ver Lista"
                size="small"
                onPress={() => {
                  log.userAction('Navigate to clients', { screen: 'MyBusiness' });
                  router.push('/(provider)/clients');
                }}
                leftIcon={<IconSymbol name="person.2" size={16} color={Colors.light.surface} />}
              />
            </View>

            <ThemedView style={styles.employeeInfo}>
              <IconSymbol name="person.2" size={24} color={Colors.light.primary} />
              <View style={styles.employeeText}>
                <ThemedText style={styles.employeeTitle}>
                  Base de Clientes
                </ThemedText>
                <ThemedText style={styles.employeeSubtext}>
                  Consulta el historial y notas de tus clientes
                </ThemedText>
              </View>
            </ThemedView>
          </Card>

          {/* Servicios */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Mis Servicios ({allServices.filter(s => s.is_active).length} activos / {allServices.length} total)
              </ThemedText>
              <View style={styles.serviceHeaderActions}>
                <TouchableOpacity
                  onPress={() => setShowInactiveServices(!showInactiveServices)}
                  style={[styles.toggleButton, showInactiveServices && styles.toggleButtonActive]}
                >
                  <ThemedText style={[styles.toggleButtonText, showInactiveServices && styles.toggleButtonTextActive]}>
                    {showInactiveServices ? 'Ocultar Inactivos' : 'Ver Inactivos'}
                  </ThemedText>
                </TouchableOpacity>
                <Button
                  title="Agregar"
                  size="small"
                  onPress={handleAddService}
                  leftIcon={<IconSymbol name="plus.circle" size={16} color={Colors.light.surface} />}
                />
              </View>
            </View>

            {services.length > 0 ? (
              <View style={styles.servicesList}>
                {services.map((service) => (
                  <View
                    key={service.id}
                    style={[
                      styles.serviceItem,
                      { opacity: service.is_active ? 1 : 0.6 } // Inactive services appear grayed out
                    ]}
                  >
                    <View style={styles.serviceInfo}>
                      <ThemedText style={[
                        styles.serviceName,
                        !service.is_active && { color: Colors.light.textSecondary }
                      ]}>
                        {service.name} {!service.is_active && '(Inactivo)'}
                      </ThemedText>
                      <ThemedText style={[
                        styles.servicePrice,
                        !service.is_active && { color: Colors.light.textSecondary }
                      ]}>
                        ${service.price_amount} - {service.duration_minutes} min
                      </ThemedText>
                    </View>
                    <View style={styles.serviceActions}>
                      <TouchableOpacity
                        style={[styles.statusBadge, { backgroundColor: service.is_active ? Colors.light.success : Colors.light.error }]}
                        onPress={async () => {
                          const newStatus = !service.is_active;
                          const action = newStatus ? 'activar' : 'desactivar';
                          const actionPast = newStatus ? 'activado' : 'desactivado';

                          Alert.alert(
                            `${action.charAt(0).toUpperCase() + action.slice(1)} Servicio`,
                            `¿Estás seguro de que quieres ${action} el servicio "${service.name}"?`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: action.charAt(0).toUpperCase() + action.slice(1),
                                onPress: async () => {
                                  try {
                                    console.log('🔴 [MY BUSINESS] Toggling service:', {
                                      serviceId: service.id,
                                      currentStatus: service.is_active,
                                      newStatus
                                    });

                                    await BookingService.updateService(service.id, {
                                      is_active: newStatus
                                    });

                                    await loadBusinessData(); // Refresh data
                                    Alert.alert('Éxito', `Servicio ${actionPast} correctamente`);
                                  } catch (error) {
                                    console.error('🔴 [MY BUSINESS] Error toggling service:', error);
                                    Alert.alert('Error', 'No se pudo actualizar el servicio');
                                  }
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <ThemedText style={styles.statusText}>
                          {service.is_active ? 'Activo' : 'Inactivo'}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleEditService(service.id)}
                        style={styles.iconButton}
                      >
                        <IconSymbol name="pencil" size={16} color={Colors.light.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          console.log('🔴 [MY BUSINESS] Delete button pressed for service:', {
                            serviceId: service.id,
                            serviceName: service.name
                          });
                          console.log('🔴 [MY BUSINESS] Current services before delete:', services.map(s => ({ id: s.id, name: s.name, is_active: s.is_active })));

                          const deleteHandler = async () => {
                            console.log('🔴 [MY BUSINESS] Confirmed deletion for service:', service.id);
                            try {
                              console.log('🔴 [MY BUSINESS] Calling deleteService...');
                              await BookingService.deleteService(service.id);

                              console.log('🔴 [MY BUSINESS] Service deleted, refreshing data...');
                              await loadBusinessData(); // Refresh data

                              console.log('🔴 [MY BUSINESS] ✅ Service deactivation completed successfully');

                              if (Platform.OS === 'web') {
                                window.alert('Servicio desactivado correctamente');
                              } else {
                                Alert.alert('Éxito', 'Servicio desactivado correctamente');
                              }
                            } catch (error) {
                              console.error('🔴 [MY BUSINESS] ❌ Error deleting service:', error);
                              const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

                              if (Platform.OS === 'web') {
                                window.alert(`No se pudo eliminar el servicio:\n${errorMessage}`);
                              } else {
                                Alert.alert('Error', `No se pudo eliminar el servicio:\n${errorMessage}`);
                              }
                            }
                          };

                          if (Platform.OS === 'web') {
                            const confirmed = window.confirm(
                              `¿Estás seguro de que quieres desactivar "${service.name}"?\n\nEl servicio se ocultará para nuevas citas, pero las citas existentes no se verán afectadas.`
                            );

                            if (confirmed) {
                              deleteHandler();
                            } else {
                              console.log('🔴 [MY BUSINESS] Delete cancelled by user');
                            }
                          } else {
                            Alert.alert(
                              'Desactivar Servicio',
                              `¿Estás seguro de que quieres desactivar "${service.name}"?\n\nEl servicio se ocultará para nuevas citas, pero las citas existentes no se verán afectadas.`,
                              [
                                {
                                  text: 'Cancelar',
                                  style: 'cancel',
                                  onPress: () => console.log('🔴 [MY BUSINESS] Deactivation cancelled by user')
                                },
                                {
                                  text: 'Desactivar',
                                  style: 'destructive',
                                  onPress: deleteHandler
                                }
                              ]
                            );
                          }
                        }}
                        style={styles.iconButton}
                      >
                        <IconSymbol name="trash" size={16} color={Colors.light.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <IconSymbol name="scissors" size={32} color={Colors.light.textSecondary} />
                <ThemedText style={styles.emptyText}>No tienes servicios registrados</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Agrega tu primer servicio para empezar a recibir reservas
                </ThemedText>
                <Button
                  title="Agregar Servicio"
                  size="medium"
                  onPress={handleAddService}
                  style={styles.addFirstServiceButton}
                  leftIcon={<IconSymbol name="plus.circle" size={16} color={Colors.light.surface} />}
                />
              </View>
            )}
          </Card>

          {/* Empleados */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Empleados
              </ThemedText>
              <Button
                title="Gestionar"
                size="small"
                onPress={() => {
                  log.userAction('Navigate to employee management', { providerId: user?.id });
                  router.push('/(provider)/employee-management');
                }}
                leftIcon={<IconSymbol name="person.2" size={16} color={Colors.light.surface} />}
              />
            </View>

            <ThemedView style={styles.employeeInfo}>
              <IconSymbol name="person.2" size={24} color={Colors.light.primary} />
              <View style={styles.employeeText}>
                <ThemedText style={styles.employeeTitle}>
                  Gestiona tu equipo
                </ThemedText>
                <ThemedText style={styles.employeeSubtext}>
                  Agrega empleados y configura sus horarios individuales
                </ThemedText>
              </View>
            </ThemedView>
          </Card>

          {/* Horarios */}
          <Card variant="elevated" style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Horarios de Atención
              </ThemedText>
              <Button
                title="Configurar"
                size="small"
                onPress={handleManageAvailability}
                leftIcon={<IconSymbol name="clock" size={16} color={Colors.light.surface} />}
              />
            </View>

            {availability.length > 0 ? (
              <View style={styles.availabilityList}>
                {availability.map((av) => {
                  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  return (
                    <View key={av.id} style={styles.availabilityItem}>
                      <View style={styles.dayInfo}>
                        <ThemedText style={styles.dayName}>
                          {weekdays[av.weekday]}
                        </ThemedText>
                        <ThemedText style={styles.timeRange}>
                          {av.start_time} - {av.end_time}
                        </ThemedText>
                      </View>
                      <View style={styles.availabilityBadge}>
                        <ThemedText style={styles.availabilityBadgeText}>Activo</ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <ThemedView style={styles.availabilityInfo}>
                <IconSymbol name="clock" size={24} color={Colors.light.primary} />
                <View style={styles.availabilityText}>
                  <ThemedText style={styles.availabilityTitle}>
                    Configura tus horarios
                  </ThemedText>
                  <ThemedText style={styles.availabilitySubtext}>
                    Define cuándo estás disponible para recibir citas
                  </ThemedText>
                </View>
              </ThemedView>
            )}
          </Card>

          {/* Estadísticas */}
          <Card variant="elevated" style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Estadísticas
            </ThemedText>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{provider?.rating?.toFixed(1) || '0.0'}</ThemedText>
                <ThemedText style={styles.statLabel}>Calificación</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{provider?.total_reviews || 0}</ThemedText>
                <ThemedText style={styles.statLabel}>Reseñas</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{services.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Servicios</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {services.filter(s => s.is_active).length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Activos</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {revenueThisMonth ? `${revenueThisMonth.currency} ${revenueThisMonth.amount.toFixed(2)}` : '—'}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Ingresos (mes)</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{monthlyAppointments}</ThemedText>
                <ThemedText style={styles.statLabel}>Citas este mes</ThemedText>
              </View>
            </View>
          </Card>

          {/* Espacio adicional */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView >
    </TabSafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['5xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.sm,    // pequeño espacio superior
    paddingBottom: DesignTokens.spacing.lg, // espacio inferior cómodo
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  title: {
    textAlign: 'center',
  },
  section: {
    margin: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    flex: 1,
  },
  editForm: {
    gap: DesignTokens.spacing.lg,
  },
  fieldGroup: {
    marginBottom: DesignTokens.spacing.lg,
  },
  fieldLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
  },
  textArea: {
    minHeight: 112,
  },
  businessInfo: {
    gap: DesignTokens.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    width: 100,
    marginRight: DesignTokens.spacing.md,
  },
  infoValue: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    marginTop: DesignTokens.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginTop: DesignTokens.spacing.sm,
    textAlign: 'center',
  },
  servicesList: {
    gap: DesignTokens.spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    marginBottom: DesignTokens.spacing.xs,
  },
  serviceDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicePrice: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.success,
  },
  statusBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
  },
  statusText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.surface,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
  },
  availabilityList: {
    gap: DesignTokens.spacing.sm,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignTokens.spacing.md,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  timeRange: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  availabilityBadge: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    backgroundColor: Colors.light.success,
    borderRadius: DesignTokens.radius.sm,
  },
  availabilityBadgeText: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.surface,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  availabilityText: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  availabilityTitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    marginBottom: DesignTokens.spacing.xs,
  },
  availabilitySubtext: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
  },
  employeeText: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  employeeTitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    marginBottom: DesignTokens.spacing.xs,
  },
  employeeSubtext: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
  },
  statValue: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    marginBottom: DesignTokens.spacing.xs,
  },
  statLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xl,
  },
  servicesLink: {
    padding: DesignTokens.spacing.lg,
  },
  servicesLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicesLinkInfo: {
    flex: 1,
  },
  servicesLinkTitle: {
    marginBottom: DesignTokens.spacing.xs,
  },
  servicesLinkSubtext: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  formActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  iconButton: {
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: Colors.light.surfaceVariant,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: DesignTokens.radius.md,
    marginTop: DesignTokens.spacing.md,
  },
  viewAllText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.primary,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  addFirstServiceButton: {
    marginTop: DesignTokens.spacing.lg,
  },
  serviceHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  toggleButtonText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.text,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
  },
  toggleButtonTextActive: {
    color: Colors.light.surface,
  },
});
