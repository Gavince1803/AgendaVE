import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmployeeSelector } from '@/components/ui/EmployeeSelector';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ServiceListSkeleton } from '@/components/ui/LoadingStates';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, Employee, Service } from '@/lib/booking-service';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ExtendedService = Service & {
  category_label?: string;
  isPopular?: boolean;
};

export default function ServiceSelectionScreen() {
  const { providerId, providerName, preselectedServiceId, preselectedServiceName, preselectedServicePrice, preselectedServiceDuration } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [services, setServices] = useState<ExtendedService[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Smooth auto-scroll handling
  const scrollRef = useRef<ScrollView | null>(null);
  const servicesSectionYRef = useRef<number>(0);
  const bottomSectionYRef = useRef<number>(0);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const providerServices = await BookingService.getProviderServices(providerId as string);
      setServices(providerServices as ExtendedService[]);
    } catch (error) {
      console.error('Error loading services:', error);
      const now = new Date().toISOString();
      const mockProviderId = (providerId as string) || 'mock-provider';
      setServices([
        {
          id: 'mock-1',
          provider_id: mockProviderId,
          name: 'Corte de Cabello',
          description: 'Corte profesional para damas y caballeros con lavado incluido',
          price_amount: 15,
          price_currency: 'USD',
          duration_minutes: 30,
          is_active: true,
          created_at: now,
          updated_at: now,
          category_label: 'Peluquería',
          isPopular: true,
        },
        {
          id: 'mock-2',
          provider_id: mockProviderId,
          name: 'Peinado',
          description: 'Peinado para ocasiones especiales con productos profesionales',
          price_amount: 25,
          price_currency: 'USD',
          duration_minutes: 45,
          is_active: true,
          created_at: now,
          updated_at: now,
          category_label: 'Peluquería',
          isPopular: false,
        },
        {
          id: 'mock-3',
          provider_id: mockProviderId,
          name: 'Tinte',
          description: 'Tinte profesional con productos de alta calidad y cuidado capilar',
          price_amount: 35,
          price_currency: 'USD',
          duration_minutes: 60,
          is_active: true,
          created_at: now,
          updated_at: now,
          category_label: 'Coloración',
          isPopular: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const loadEmployees = useCallback(async () => {
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
  }, [providerId]);

  useEffect(() => {
    if (providerId) {
      loadServices();
      loadEmployees();
    }
  }, [providerId, loadServices, loadEmployees]);

  useEffect(() => {
    if (preselectedServiceId && services.length > 0) {
      setSelectedService(preselectedServiceId as string);
    }
  }, [preselectedServiceId, services]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadServices(), loadEmployees()]).finally(() => {
      setRefreshing(false);
    });
  }, [loadServices, loadEmployees]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    // Smooth scroll to bottom section (continue button) once a service is selected
    setTimeout(() => {
      if (scrollRef.current && bottomSectionYRef.current > 0) {
        scrollRef.current.scrollTo({ y: bottomSectionYRef.current - 12, animated: true });
      }
    }, 120);
  };

  const handleContinue = () => {
    if (!selectedService) {
      console.log('🔴 [SERVICE SELECTION] No service selected');
      return;
    }

    console.log('🔴 [SERVICE SELECTION] handleContinue called', {
      selectedService,
      preselectedServiceId,
      selectedEmployee,
      servicesCount: services.length
    });

    // If service is preselected, use the preselected params directly
    if (preselectedServiceId) {
      console.log('🔴 [SERVICE SELECTION] Using preselected service params');
      router.push({
        pathname: '/(booking)/time-selection',
        params: {
          providerId,
          providerName,
          serviceId: preselectedServiceId as string,
          serviceName: preselectedServiceName as string,
          servicePrice: preselectedServicePrice as string,
          serviceDuration: preselectedServiceDuration as string,
          employeeId: selectedEmployee?.id || '',
          employeeName: selectedEmployee?.name || '',
        },
      });
    } else {
      // Otherwise, find the service from the loaded services array
      const service = services.find(s => s.id === selectedService);
      if (service) {
        console.log('🔴 [SERVICE SELECTION] Using selected service from list');
        const servicePriceValue = service.price_amount ?? 0;
        const serviceDurationValue = service.duration_minutes ?? 30;
        router.push({
          pathname: '/(booking)/time-selection',
          params: {
            providerId,
            providerName,
            serviceId: service.id,
            serviceName: service.name,
            servicePrice: servicePriceValue.toString(),
            serviceDuration: serviceDurationValue.toString(),
            employeeId: selectedEmployee?.id || '',
            employeeName: selectedEmployee?.name || '',
          },
        });
      } else {
        console.log('🔴 [SERVICE SELECTION] Service not found in services array');
      }
    }
  };

  const selectedServiceData = selectedService
    ? services.find((s) => s.id === selectedService)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
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
            <Text style={styles.stepText}>{preselectedServiceId ? 'Paso 2 de 3 • Empleado' : 'Paso 1 de 3 • Selección'}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, preselectedServiceId ? styles.progressTwoThirds : styles.progressOneThird]} />
            </View>
            <View style={styles.progressSteps}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={[styles.progressDot, preselectedServiceId && styles.progressDotActive]} />
              <View style={styles.progressDot} />
            </View>
          </View>
        </View>

        {/* Welcome Section */}
        {/* <View style={styles.welcomeSection}>
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
        </View> */}

        {/* Employee selection */}
        <EmployeeSelector
          employees={employees}
          selectedEmployee={selectedEmployee}
          onEmployeeSelect={(emp) => {
            setSelectedEmployee(emp);
            // Auto scroll to bottom when employee is selected and service is preselected
            if (preselectedServiceId) {
              setTimeout(() => {
                if (scrollRef.current && bottomSectionYRef.current > 0) {
                  scrollRef.current.scrollTo({ y: bottomSectionYRef.current - 12, animated: true });
                }
              }, 120);
            } else {
              // Smooth scroll to services list after choosing employee
              setTimeout(() => {
                if (scrollRef.current && servicesSectionYRef.current > 0) {
                  scrollRef.current.scrollTo({ y: servicesSectionYRef.current - 12, animated: true });
                }
              }, 120);
            }
          }}
          loading={employeesLoading}
          selectedService={
            selectedServiceData
              ? {
                name: selectedServiceData.name,
                price: selectedServiceData.price_amount ?? 0,
                duration: selectedServiceData.duration_minutes ?? 0,
              }
              : null
          }
        />

        {/* Lista de servicios - only show if no service is preselected */}
        {!preselectedServiceId && (
          <View
            style={styles.servicesSection}
            onLayout={(e) => {
              servicesSectionYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>Servicios Disponibles</Text>
            {loading ? (
              <ServiceListSkeleton />
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
                        <Text style={styles.serviceCategory}>{service.category_label || 'Servicio'}</Text>
                      </View>

                      <View style={styles.servicePricing}>
                        <Text style={styles.servicePrice}>${service.price_amount ?? 0}</Text>
                        <Text style={styles.serviceDuration}>{service.duration_minutes ?? 0} min</Text>
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
        )}

      </ScrollView>

      {/* Botón de continuar */}
      <View
        style={styles.bottomSection}
        onLayout={(e) => {
          bottomSectionYRef.current = e.nativeEvent.layout.y;
        }}
      >
        <Button
          title="Seleccionar Horario"
          onPress={handleContinue}
          variant="wellness"
          size="large"
          fullWidth
          elevated
          disabled={!selectedService || !selectedEmployee}
          icon={<IconSymbol name="calendar" size={18} color={Colors.light.textOnPrimary} />}
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
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: DesignTokens.spacing['2xl'],
    paddingTop: HEADER_PADDING_TOP,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerContent: {
    marginBottom: DesignTokens.spacing.lg,
  },
  providerName: {
    fontSize: DesignTokens.typography.fontSizes['3xl'],
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  providerSubtitle: {
    fontSize: DesignTokens.typography.fontSizes.md,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.xs,
  },
  stepIndicator: {
    alignItems: 'flex-end',
  },
  stepText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
    letterSpacing: 0.5,
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: Colors.light.borderLight,
    borderRadius: DesignTokens.radius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: DesignTokens.radius.xs,
  },
  progressOneThird: {
    width: '33%',
  },
  progressTwoThirds: {
    width: '66%',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
    marginTop: DesignTokens.spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: DesignTokens.radius.xs,
    backgroundColor: Colors.light.borderLight,
  },
  progressDotActive: {
    backgroundColor: Colors.light.primary,
  },
  welcomeSection: {
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: DesignTokens.radius['3xl'],
    backgroundColor: Colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.lg,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: DesignTokens.typography.fontSizes.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  welcomeText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  servicesSection: {
    paddingHorizontal: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.lg,
  },
  servicesList: {
    gap: DesignTokens.spacing.md,
  },
  serviceCard: {
    marginBottom: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius['2xl'],
  },
  selectedServiceCard: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '05',
    transform: [{ scale: 1.02 }],
    ...DesignTokens.elevation.md,
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
    marginRight: DesignTokens.spacing.lg,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  serviceName: {
    fontSize: DesignTokens.typography.fontSizes.md,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  popularBadge: {
    backgroundColor: Colors.light.warning,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: DesignTokens.radius.lg,
    marginLeft: DesignTokens.spacing.sm,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textOnPrimary,
  },
  serviceDescription: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: DesignTokens.spacing.xs,
  },
  serviceCategory: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textTertiary,
    fontWeight: '500',
  },
  servicePricing: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: 'bold',
    color: Colors.light.success,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.md,
    paddingTop: DesignTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  selectedText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.light.success,
    marginLeft: DesignTokens.spacing.sm,
  },
  bottomSection: {
    padding: DesignTokens.spacing.xl,
    paddingBottom: BOTTOM_PADDING,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    ...DesignTokens.elevation.lg,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    elevation: 20,
    zIndex: 100,
  },
  loadingContainer: {
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
  },
  requirementText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.md,
    opacity: 0.8,
  },
});
