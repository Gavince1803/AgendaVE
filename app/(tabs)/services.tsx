import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ServicesScreen() {
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
    if (!newService.name || !newService.duration || !newService.price) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const service = {
      id: services.length + 1,
      name: newService.name,
      description: newService.description,
      duration: parseInt(newService.duration),
      price: parseFloat(newService.price),
      currency: newService.currency,
      isActive: true,
    };

    setServices([...services, service]);
    setNewService({ name: '', description: '', duration: '', price: '', currency: 'USD' });
    setShowAddForm(false);
    Alert.alert('Éxito', 'Servicio agregado correctamente');
  };

  const toggleServiceStatus = (id: number) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, isActive: !service.isActive } : service
    ));
  };

  const deleteService = (id: number) => {
    Alert.alert(
      'Eliminar Servicio',
      '¿Estás seguro de que quieres eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setServices(services.filter(service => service.id !== id));
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
          onPress={() => setShowAddForm(!showAddForm)}
          variant="primary"
          size="medium"
          icon="plus"
        />

        {showAddForm && (
          <Card variant="elevated" padding="medium" style={styles.addForm}>
            <Text style={styles.formTitle}>Nuevo Servicio</Text>
            
            <Input
              label="Nombre del Servicio"
              placeholder="Ej: Corte de Cabello"
              value={newService.name}
              onChangeText={(text) => setNewService({ ...newService, name: text })}
              required
            />

            <Input
              label="Descripción"
              placeholder="Descripción del servicio"
              value={newService.description}
              onChangeText={(text) => setNewService({ ...newService, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Duración (min)"
                  placeholder="30"
                  value={newService.duration}
                  onChangeText={(text) => setNewService({ ...newService, duration: text })}
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Precio"
                  placeholder="15.00"
                  value={newService.price}
                  onChangeText={(text) => setNewService({ ...newService, price: text })}
                  keyboardType="numeric"
                  required
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
                    icon="trash"
                    iconColor={Colors.light.error}
                  />
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
                    ${service.price} {service.currency}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
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

