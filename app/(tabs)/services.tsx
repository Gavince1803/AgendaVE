import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    currency: 'USD',
  });

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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Mis Servicios
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Gestiona los servicios que ofreces
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <IconSymbol name="plus" size={20} color="#ffffff" />
          <ThemedText style={styles.addButtonText}>
            {showAddForm ? 'Cancelar' : 'Agregar Servicio'}
          </ThemedText>
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.addForm}>
            <ThemedText style={styles.formTitle}>Nuevo Servicio</ThemedText>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Nombre del Servicio *</ThemedText>
              <TextInput
                style={styles.input}
                value={newService.name}
                onChangeText={(text) => setNewService({ ...newService, name: text })}
                placeholder="Ej: Corte de Cabello"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Descripción</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newService.description}
                onChangeText={(text) => setNewService({ ...newService, description: text })}
                placeholder="Descripción del servicio"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <ThemedText style={styles.label}>Duración (min) *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={newService.duration}
                  onChangeText={(text) => setNewService({ ...newService, duration: text })}
                  placeholder="30"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <ThemedText style={styles.label}>Precio *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={newService.price}
                  onChangeText={(text) => setNewService({ ...newService, price: text })}
                  placeholder="15.00"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddService}>
              <ThemedText style={styles.saveButtonText}>Guardar Servicio</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Servicios Activos ({services.filter(s => s.isActive).length})
        </ThemedText>
        
        <View style={styles.servicesList}>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <ThemedText style={styles.serviceName}>{service.name}</ThemedText>
                  {service.description && (
                    <ThemedText style={styles.serviceDescription}>{service.description}</ThemedText>
                  )}
                </View>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={[styles.statusButton, service.isActive ? styles.activeButton : styles.inactiveButton]}
                    onPress={() => toggleServiceStatus(service.id)}
                  >
                    <ThemedText style={[styles.statusText, service.isActive ? styles.activeText : styles.inactiveText]}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteService(service.id)}
                  >
                    <IconSymbol name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.serviceDetails}>
                <View style={styles.detailItem}>
                  <IconSymbol name="clock" size={16} color="#6b7280" />
                  <ThemedText style={styles.detailText}>{service.duration} min</ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <IconSymbol name="dollarsign.circle" size={16} color="#6b7280" />
                  <ThemedText style={styles.detailText}>
                    ${service.price} {service.currency}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  servicesList: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeButton: {
    backgroundColor: '#d1fae5',
  },
  inactiveButton: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#dc2626',
  },
  deleteButton: {
    padding: 8,
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
    color: '#374151',
  },
});

