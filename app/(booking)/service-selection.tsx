import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmployeeSelector } from '@/components/ui/EmployeeSelector';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ServiceListSkeleton } from '@/components/ui/LoadingStates';
import { Colors, DesignTokens } from '@/constants/Colors';
import { BookingService, Employee, Service, ServiceEmployeePricing } from '@/lib/booking-service';
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

  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Map: ServiceID -> EmployeeID -> Pricing
  const [customPriceMap, setCustomPriceMap] = useState<Record<string, Record<string, ServiceEmployeePricing>>>({});

  // Smooth auto-scroll handling
  const scrollRef = useRef<ScrollView | null>(null);
  const servicesSectionYRef = useRef<number>(0);
  const bottomSectionYRef = useRef<number>(0);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const providerServices = await BookingService.getProviderServices(providerId as string);
      setServices(providerServices as ExtendedService[]);

      // Fetch custom prices for these services
      const ids = providerServices.map(s => s.id);
      if (ids.length > 0) {
        const prices = await BookingService.getEmployeePricesForServices(ids);
        const map: Record<string, Record<string, ServiceEmployeePricing>> = {};

        prices.forEach(p => {
          if (!map[p.service_id]) map[p.service_id] = {};
          map[p.service_id][p.employee_id] = p;
        });
        setCustomPriceMap(map);
        console.log('🔴 [SERVICE SELECTION] Custom prices loaded:', prices.length);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  type ExtendedEmployee = Employee & {
    teamMemberId?: string;
  };

  const [employees, setEmployees] = useState<ExtendedEmployee[]>([]);
  // ...

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    console.log('🔴 [SERVICE SELECTION] Loading employees for provider:', providerId);
    try {
      // Parallel fetch: Employees (for booking/avail) AND Team (for pricing/public profile)
      const [providerEmployees, teamMembers] = await Promise.all([
        BookingService.getProviderEmployees(providerId as string),
        BookingService.getProviderTeam(providerId as string)
      ]);

      console.log('🔴 [SERVICE SELECTION] Loaded:', {
        employees: providerEmployees.length,
        teamMembers: teamMembers.length
      });

      // Merge: Attach teamMemberId to Employee based on profile_id match
      const mergedEmployees: ExtendedEmployee[] = providerEmployees.map(emp => {
        // Find matching team member by profile_id
        const tm = teamMembers.find(t => t.profile_id === emp.profile_id);
        // If found, use its ID. If not, log warning (pricing might fail)
        if (!tm) console.warn('⚠️ Employee has no TeamMember link:', emp.name);
        return {
          ...emp,
          teamMemberId: tm?.id
        };
      });

      setEmployees(mergedEmployees);

      // Auto-select the first employee (usually the owner)
      if (mergedEmployees.length > 0) {
        setSelectedEmployee(mergedEmployees[0]);
        console.log('🔴 [SERVICE SELECTION] Auto-selected employee:', mergedEmployees[0].name);
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

    // Helper to get final price/duration based on selected employee
    const getFinalServiceDetails = (service: Service) => {
      let price = service.price_amount;
      let duration = service.duration_minutes;

      const currentEmp = selectedEmployee as ExtendedEmployee | null;
      if (currentEmp) {
        // Use teamMemberId if available (for precise pricing), otherwise fallback to employee id (legacy)
        const targetId = currentEmp.teamMemberId || currentEmp.id;
        const custom = customPriceMap[service.id]?.[targetId];
        if (custom) {
          console.log(`💰 Using custom price for ${currentEmp.name}: $${custom.price}`);
          price = custom.price;
          if (custom.duration_minutes) duration = custom.duration_minutes;
        }
      }
      return { price, duration };
    };

    console.log('🔴 [SERVICE SELECTION] handleContinue called', {
      selectedService,
      preselectedServiceId,
      selectedEmployee,
      servicesCount: services.length
    });

    const currentEmp = selectedEmployee as ExtendedEmployee | null;
    const baseParams: any = {
      providerId,
      providerName,
      serviceId: '',
      serviceName: '',
      servicePrice: '0',
      serviceDuration: '0',
      employeeId: currentEmp?.id || '',
      teamMemberId: currentEmp?.teamMemberId || '', // Pass Team Member ID!
      employeeName: currentEmp?.name || '',
    };

    // Internal helper to push router
    const pushRouter = (s: ExtendedService) => {
      const { price, duration } = getFinalServiceDetails(s);
      router.push({
        pathname: '/(booking)/time-selection',
        params: {
          ...baseParams,
          serviceId: s.id,
          serviceName: s.name,
          servicePrice: price.toString(),
          serviceDuration: duration.toString(),
        }
      });
    };

    // If service is preselected AND we have all details
    if (preselectedServiceId && preselectedServiceName && preselectedServicePrice) {
      console.log('🔴 [SERVICE SELECTION] Using preselected service params');
      // Even if preselected, we should look for overrides if employee is selected?
      // But typically preselection implies user already made choices.
      // We'll stick to basic router push for preselection but add employee details.
      router.push({
        pathname: '/(booking)/time-selection',
        params: {
          ...baseParams,
          serviceId: preselectedServiceId as string,
          serviceName: preselectedServiceName as string,
          servicePrice: preselectedServicePrice as string,
          serviceDuration: preselectedServiceDuration as string,
        },
      });
    } else if (preselectedServiceId && services.length > 0) {
      // Fallback: Service ID is preselected but details missing
      const service = services.find(s => s.id === preselectedServiceId);
      if (service) pushRouter(service);
      else console.error('🔴 [SERVICE SELECTION] Preselected service ID not found in list');
    } else {
      // Otherwise, find the service from the loaded services array
      const service = services.find(s => s.id === selectedService);
      if (service) pushRouter(service);
      else console.log('🔴 [SERVICE SELECTION] Service not found in services array');
    }
  };

  const selectedServiceData = selectedService
    ? services.find((s) => s.id === selectedService)
    : null;

  const getDisplayPrice = (service: ExtendedService) => {
    let price = service.price_amount ?? 0;
    let priceMax = service.price_max;
    let duration = service.duration_minutes ?? 0;

    const currentEmp = selectedEmployee as ExtendedEmployee | null;
    if (currentEmp) {
      const targetId = currentEmp.teamMemberId || currentEmp.id;
      const custom = customPriceMap[service.id]?.[targetId];
      if (custom) {
        price = custom.price;
        priceMax = custom.price_max; // Use custom max if available (undefined otherwise)
        if (custom.duration_minutes) duration = custom.duration_minutes;
      }
    }
    return { price, priceMax, duration };
  };

  const selectedServiceDisplay = selectedServiceData ? {
    name: selectedServiceData.name,
    ...getDisplayPrice(selectedServiceData)
  } : null;

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
          selectedService={selectedServiceDisplay}
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
                {services.map((service) => {
                  const { price, priceMax, duration } = getDisplayPrice(service);
                  const isCustomized = !!(selectedEmployee && customPriceMap[service.id]?.[(selectedEmployee as ExtendedEmployee).teamMemberId || selectedEmployee.id]);

                  return (
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
                          <Text style={styles.servicePrice}>
                            {service.input_type === 'range' && priceMax
                              ? `$${price} - $${priceMax}`
                              : service.input_type === 'starting_at'
                                ? `Desde $${price}`
                                : `$${price}`
                            }
                          </Text>
                          <Text style={styles.serviceDuration}>{duration} min</Text>
                          {isCustomized && (
                            <Text style={{ fontSize: 10, color: Colors.light.primary, marginTop: 2 }}>
                              Por {selectedEmployee?.name?.split(' ')[0]}
                            </Text>
                          )}
                        </View>
                      </View>

                      {selectedService === service.id && (
                        <View style={styles.selectedIndicator}>
                          <IconSymbol name="checkmark.circle" size={20} color={Colors.light.success} />
                          <Text style={styles.selectedText}>Seleccionado</Text>
                        </View>
                      )}
                    </Card>
                  );
                })}
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
