// Mi Negocio - Pantalla de configuración del negocio para proveedores
// Permite al proveedor configurar los datos de su negocio, servicios y horarios

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService, Provider, Service } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function MyBusinessScreen() {
  const { user } = useAuth();
  const log = useLogger();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para edición
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessData, setBusinessData] = useState({
    business_name: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    loadBusinessData();
  }, []);

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
          owner_id: user.id,
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
        website: '',
      });

      // Cargar servicios
      const servicesData = await BookingService.getProviderServices(user.id);
      setServices(servicesData);

      log.info(LogCategory.SERVICE, 'Business data loaded successfully', { 
        providerId: user.id,
        servicesCount: servicesData.length 
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
      log.error(LogCategory.SERVICE, 'Error saving business data', { error: error instanceof Error ? error.message : String(error) });
      Alert.alert('Error', `No se pudieron guardar los datos: ${error.message}`);
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
        website: provider.website || '',
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
      <TabSafeAreaView>
        <View style={styles.loadingContainer}>
          <ThemedText>Cargando datos del negocio...</ThemedText>
        </View>
      </TabSafeAreaView>
    );
  }

  return (
    <TabSafeAreaView>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Mi Negocio
          </ThemedText>
        </ThemedView>

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
              <Input
                label="Nombre del Negocio"
                value={businessData.business_name}
                onChangeText={(text) => setBusinessData({...businessData, business_name: text})}
                placeholder="Nombre del Negocio"
              />
              <Input
                label="Categoría"
                value={businessData.category}
                onChangeText={(text) => setBusinessData({...businessData, category: text})}
                placeholder="Categoría del Negocio"
              />
              <Input
                label="Descripción"
                value={businessData.description}
                onChangeText={(text) => setBusinessData({...businessData, description: text})}
                placeholder="Descripción del Negocio"
                multiline
                numberOfLines={3}
              />
              <Input
                label="Dirección"
                value={businessData.address}
                onChangeText={(text) => setBusinessData({...businessData, address: text})}
                placeholder="Dirección del Negocio"
              />
              <Input
                label="Teléfono"
                value={businessData.phone}
                onChangeText={(text) => setBusinessData({...businessData, phone: text})}
                placeholder="Teléfono de Contacto"
                keyboardType="phone-pad"
              />
              <Input
                label="Email"
                value={businessData.email}
                onChangeText={(text) => setBusinessData({...businessData, email: text})}
                placeholder="Email de Contacto"
                keyboardType="email-address"
              />
              <Input
                label="Sitio Web"
                value={businessData.website}
                onChangeText={(text) => setBusinessData({...businessData, website: text})}
                placeholder="Sitio Web (opcional)"
                keyboardType="url"
              />
              
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
                <ThemedText style={styles.infoValue}>{provider?.description || 'No especificado'}</ThemedText>
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
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Sitio Web:</ThemedText>
                <ThemedText style={styles.infoValue}>{provider?.website || 'No especificado'}</ThemedText>
              </View>
            </View>
          )}
        </Card>

        {/* Servicios - Enlace al tab de Services */}
        <Card variant="elevated" style={styles.section}>
          <TouchableOpacity 
            style={styles.servicesLink}
            onPress={() => router.push('/(tabs)/services')}
          >
            <View style={styles.servicesLinkContent}>
              <View style={styles.servicesLinkInfo}>
                <ThemedText type="subtitle" style={styles.servicesLinkTitle}>
                  Mis Servicios ({services.length})
                </ThemedText>
                <ThemedText style={styles.servicesLinkSubtext}>
                  Gestiona tus servicios, precios y disponibilidad
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={24} color={Colors.light.primary} />
            </View>
          </TouchableOpacity>
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
          </View>
        </Card>

        {/* Espacio adicional */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
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
});
