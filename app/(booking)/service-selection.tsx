import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { BookingService } from '@/lib/booking-service';
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
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar servicios del proveedor
  useEffect(() => {
    if (providerId) {
      loadServices();
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadServices().finally(() => {
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
          servicePrice: service.price.toString(),
          serviceDuration: service.duration.toString(),
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.providerName}>{providerName}</Text>
          <Text style={styles.stepText}>Paso 1 de 3</Text>
        </View>

        {/* Instrucciones */}
        <View style={styles.instructionCard}>
          <IconSymbol name="info.circle" size={20} color={Colors.light.info} />
          <Text style={styles.instructionText}>
            Selecciona el servicio que deseas reservar
          </Text>
        </View>

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
                variant={selectedService === service.id ? "elevated" : "default"}
                padding="medium"
                style={[
                  styles.serviceCard,
                  selectedService === service.id ? styles.selectedServiceCard : null,
                ]}
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
                    <Text style={styles.servicePrice}>${service.price}</Text>
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
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
                <Text style={styles.summaryValue}>{selectedServiceData.duration} minutos</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Precio:</Text>
                <Text style={[styles.summaryValue, styles.priceText]}>
                  ${selectedServiceData.price}
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Botón de continuar */}
      <View style={styles.bottomSection}>
        <Button
          title="Continuar"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          disabled={!selectedService}
          icon={<IconSymbol name="arrow.right" size={16} color="#ffffff" />}
        />
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.light.background,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  stepText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.info + '10',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.info,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
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
    marginBottom: 0,
  },
  selectedServiceCard: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
});
