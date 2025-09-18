import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { LogCategory, useLogger } from '@/lib/logger';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function ServicesScreen() {
  const { user } = useAuth();
  const log = useLogger(user?.id);
  
  const [services, setServices] = useState([
    {
      id: 1,
      name: 'Corte de Cabello',
      description: 'Corte profesional para damas y caballeros',
      duration: 30,
      price: 15,
      currency: 'USD',
      isActive: true,
    },
    {
      id: 2,
      name: 'Peinado',
      description: 'Peinado para ocasiones especiales',
      duration: 45,
      price: 25,
      currency: 'USD',
      isActive: true,
    },
    {
      id: 3,
      name: 'Tinte',
      description: 'Tinte profesional con productos de calidad',
      duration: 60,
      price: 35,
      currency: 'USD',
      isActive: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    currency: 'USD',
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleAddService = () => {
    log.userAction('Add service attempt', { serviceData: newService, screen: 'Services' });
    
    if (!newService.name || !newService.duration || !newService.price) {
      log.warn(LogCategory.SERVICE, 'Add service failed - missing required fields', { newService, screen: 'Services' });
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const service = {
        id: services.length + 1,
        name: newService.name,
        description: newService.description,
        duration: parseInt(newService.duration),
        price_amount: parseFloat(newService.price),
        price_currency: 'USD',
        currency: newService.currency,
        isActive: true,
      };

      setServices([...services, service]);
      setNewService({ name: '', description: '', duration: '', price: '', currency: 'USD' });
      setShowAddForm(false);
      
      log.serviceAction('Service added successfully', { service, screen: 'Services' });
      Alert.alert('Éxito', 'Servicio agregado correctamente');
    } catch (error) {
      log.serviceError('Add service failed', error, 'Services');
      Alert.alert('Error', 'No se pudo agregar el servicio');
    }
  };

  const toggleServiceStatus = (id: number) => {
    const service = services.find(s => s.id === id);
    const newStatus = !service?.isActive;
    
    log.userAction('Toggle service status', { serviceId: id, newStatus, screen: 'Services' });
    
    setServices(services.map(service => 
      service.id === id ? { ...service, isActive: !service.isActive } : service
    ));
    
    log.serviceAction('Service status toggled', { serviceId: id, newStatus, screen: 'Services' });
  };

  const deleteService = (id: number) => {
    log.userAction('Delete service attempt', { serviceId: id, screen: 'Services' });
    
    Alert.alert(
      'Eliminar Servicio',
      '¿Estás seguro de que quieres eliminar este servicio?',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => {
            log.userAction('Delete service cancelled', { serviceId: id, screen: 'Services' });
          }
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              setServices(services.filter(service => service.id !== id));
              log.serviceAction('Service deleted successfully', { serviceId: id, screen: 'Services' });
            } catch (error) {
              log.serviceError('Delete service failed', error, 'Services');
              Alert.alert('Error', 'No se pudo eliminar el servicio');
            }
          },
        },
      ]
    );
  };

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollableInputView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
      <View style={styles.header}>
        <IconSymbol name="scissors" size={32} color={Colors.light.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Mis Servicios</Text>
          <Text style={styles.subtitle}>Gestiona los servicios que ofreces</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Button
          title={showAddForm ? 'Cancelar' : 'Agregar Servicio'}
          onPress={() => {
            log.userAction('Toggle add service form', { showForm: !showAddForm, screen: 'Services' });
            setShowAddForm(!showAddForm);
          }}
          variant="primary"
          size="medium"
        />

        {showAddForm && (
          <Card variant="elevated" padding="medium" style={styles.addForm}>
            <Text style={styles.formTitle}>Nuevo Servicio</Text>
            
            <SimpleInput
              label="Nombre del Servicio"
              placeholder="Ej: Corte de Cabello"
              value={newService.name}
              onChangeText={(text) => setNewService({ ...newService, name: text })}
            />

            <SimpleInput
              label="Descripción"
              placeholder="Descripción del servicio"
              value={newService.description}
              onChangeText={(text) => setNewService({ ...newService, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <SimpleInput
                  label="Duración (min)"
                  placeholder="30"
                  value={newService.duration}
                  onChangeText={(text) => setNewService({ ...newService, duration: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <SimpleInput
                  label="Precio"
                  placeholder="15.00"
                  value={newService.price}
                  onChangeText={(text) => setNewService({ ...newService, price: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Button
              title="Guardar Servicio"
              onPress={handleAddService}
              variant="success"
              size="medium"
              style={styles.saveButton}
            />
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Servicios Activos ({services.filter(s => s.isActive).length})
          </Text>
        </View>
        
        <View style={styles.servicesList}>
          {services.map((service) => (
            <Card key={service.id} variant="elevated" padding="medium" style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  )}
                </View>
                <View style={styles.serviceActions}>
                  <Button
                    title={service.isActive ? 'Activo' : 'Inactivo'}
                    onPress={() => toggleServiceStatus(service.id)}
                    variant={service.isActive ? 'success' : 'destructive'}
                    size="small"
                  />
                  <Button
                    onPress={() => deleteService(service.id)}
                    variant="ghost"
                    size="small"
                  >
                    <IconSymbol name="trash" size={16} color={Colors.light.error} />
                  </Button>
                </View>
              </View>

              <View style={styles.serviceDetails}>
                <View style={styles.detailItem}>
                  <IconSymbol name="clock" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.detailText}>{service.duration} min</Text>
                </View>
                <View style={styles.detailItem}>
                  <IconSymbol name="dollarsign.circle" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.detailText}>
                    ${service.price_amount} {service.price_currency}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
      </ScrollableInputView>
    </TabSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'], // Espacio extra para el TabBar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.lg,
    backgroundColor: Colors.light.surface,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  addForm: {
    marginTop: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  servicesList: {
    gap: 16,
  },
  serviceCard: {
    marginBottom: 0,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

