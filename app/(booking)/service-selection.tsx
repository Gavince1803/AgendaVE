import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { BookingService, Employee } from '@/lib/booking-service';
import { EmployeeSelector } from '@/components/ui/EmployeeSelector';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ServiceSelectionScreen() {
  const { providerId, providerName } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Cargar servicios del proveedor
  useEffect(() => {
    if (providerId) {
      loadServices();
      loadEmployees();
    }
  }, [providerId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const providerServices = await BookingService.getProviderServices(providerId as string);
      setServices(providerServices);
    } catch (error) {
      console.error('Error loading services:', error);
      // Fallback a servicios mock si hay error
      setServices([
        {
          id: 1,
          name: 'Corte de Cabello',
          description: 'Corte profesional para damas y caballeros con lavado incluido',
          price: 15,
          duration: 30,
          category: 'Peluquería',
          isPopular: true,
        },
        {
          id: 2,
          name: 'Peinado',
          description: 'Peinado para ocasiones especiales con productos profesionales',
          price: 25,
          duration: 45,
          category: 'Peluquería',
          isPopular: false,
        },
        {
          id: 3,
          name: 'Tinte',
          description: 'Tinte profesional con productos de alta calidad y cuidado capilar',
          price: 35,
          duration: 60,
          category: 'Coloración',
          isPopular: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    console.log('🔴 [SERVICE SELECTION] Loading employees for provider:', providerId);
    try {
      const providerEmployees = await BookingService.getProviderEmployees(providerId as string);
      console.log('🔴 [SERVICE SELECTION] Loaded employees:', providerEmployees);
      setEmployees(providerEmployees);
      
      // Auto-select the first employee (usually the owner)
      if (providerEmployees.length > 0) {
        setSelectedEmployee(providerEmployees[0]);
        console.log('🔴 [SERVICE SELECTION] Auto-selected employee:', providerEmployees[0]);
      } else {
        console.log('🔴 [SERVICE SELECTION] No employees found for provider');
      }
    } catch (error) {
      console.error('🔴 [SERVICE SELECTION] Error loading employees:', error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([loadServices(), loadEmployees()]).finally(() => {
      setRefreshing(false);
    });
  }, [providerId]);

  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId);
  };

  const handleContinue = () => {
    if (!selectedService) {
      return;
    }

    const service = services.find(s => s.id === selectedService);
    if (service) {
      router.push({
        pathname: '/(booking)/time-selection',
        params: {
          providerId,
          providerName,
          serviceId: service.id.toString(),
          serviceName: service.name,
          servicePrice: service.price_amount?.toString() || service.price?.toString() || '0',
          serviceDuration: service.duration_minutes?.toString() || service.duration?.toString() || '30',
          employeeId: selectedEmployee?.id || '',
          employeeName: selectedEmployee?.name || '',
        },
      });
    }
  };

  const selectedServiceData = selectedService ? services.find(s => s.id === selectedService) : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Premium */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.providerName}>{providerName}</Text>
            <Text style={styles.providerSubtitle}>Servicios Profesionales</Text>
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Paso 1 de 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Card variant="wellness" padding="large" shadow="sm">
            <View style={styles.welcomeContent}>
              <View style={styles.welcomeIcon}>
                <IconSymbol name="sparkles" size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
                <Text style={styles.welcomeText}>
                  Selecciona el servicio perfecto para ti
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Employee selection */}
        <EmployeeSelector
          employees={employees}
          selectedEmployee={selectedEmployee}
          onEmployeeSelect={setSelectedEmployee}
          loading={employeesLoading}
          selectedService={selectedServiceData ? {
            name: selectedServiceData.name,
            price: selectedServiceData.price_amount || selectedServiceData.price || 0,
            duration: selectedServiceData.duration_minutes || selectedServiceData.duration || 0
          } : null}
        />

        {/* Lista de servicios */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Servicios Disponibles</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando servicios...</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
              <Card
                key={service.id}
                variant={selectedService === service.id ? "premium" : "soft"}
                padding="large"
                style={[
                  styles.serviceCard,
                  selectedService === service.id ? styles.selectedServiceCard : styles.unselectedServiceCard
                ]}
                shadow={selectedService === service.id ? "lg" : "sm"}
                onPress={() => handleServiceSelect(service.id)}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <View style={styles.serviceTitleRow}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>Popular</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <Text style={styles.serviceCategory}>{service.category}</Text>
                  </View>
                  
                  <View style={styles.servicePricing}>
                    <Text style={styles.servicePrice}>${service.price_amount || service.price || 0}</Text>
                    <Text style={styles.serviceDuration}>{service.duration_minutes || service.duration || 0} min</Text>
                  </View>
                </View>

                {selectedService === service.id && (
                  <View style={styles.selectedIndicator}>
                    <IconSymbol name="checkmark.circle" size={20} color={Colors.light.success} />
                    <Text style={styles.selectedText}>Seleccionado</Text>
                  </View>
                )}
              </Card>
            ))}
            </View>
          )}
        </View>

        {/* Resumen del servicio seleccionado */}
        {selectedServiceData && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <Card variant="elevated" padding="medium">
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Servicio:</Text>
                <Text style={styles.summaryValue}>{selectedServiceData.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duración:</Text>
                <Text style={styles.summaryValue}>{selectedServiceData.duration_minutes || selectedServiceData.duration || 0} minutos</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Precio:</Text>
                <Text style={[styles.summaryValue, styles.priceText]}>
                  ${selectedServiceData.price_amount || selectedServiceData.price || 0}
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Botón de continuar */}
      <View style={styles.bottomSection}>
        <Button
          title="Seleccionar Horario"
          onPress={handleContinue}
          variant="wellness"
          size="large"
          fullWidth
          elevated
          disabled={!selectedService || !selectedEmployee}
          icon={<IconSymbol name="calendar" size={18} color="#ffffff" />}
        />
        {(!selectedService || !selectedEmployee) && (
          <Text style={styles.requirementText}>
            {!selectedService ? 'Selecciona un servicio' : 'Selecciona un empleado'}
          </Text>
        )}
      </View>
    </View>
  );
}

// Platform-specific constants
const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 60 : 44;
const BOTTOM_PADDING = Platform.OS === 'ios' ? 40 : 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: HEADER_PADDING_TOP,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerContent: {
    marginBottom: 16,
  },
  providerName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  providerSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  stepIndicator: {
    alignItems: 'flex-end',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  servicesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    marginBottom: 16,
    borderRadius: 20,
  },
  selectedServiceCard: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    transform: [{ scale: 1.02 }],
  },
  unselectedServiceCard: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  popularBadge: {
    backgroundColor: Colors.light.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    fontWeight: '500',
  },
  servicePricing: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.success,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
    marginLeft: 8,
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.success,
  },
  bottomSection: {
    padding: 20,
    paddingBottom: BOTTOM_PADDING,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },
});
