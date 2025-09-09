import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProviderDetailScreen() {
  const { providerId } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);

  // Datos mock del proveedor
  const provider = {
    id: providerId || '1',
    name: 'Salón Bella Vista',
    category: 'Peluquería',
    rating: 4.8,
    reviewCount: 127,
    distance: '0.5 km',
    address: 'Av. Francisco de Miranda, Caracas',
    phone: '+58 212 555-0123',
    email: 'info@bellavista.com',
    description: 'Salón de belleza profesional con más de 10 años de experiencia. Ofrecemos servicios de peluquería, estética y tratamientos faciales con productos de alta calidad.',
    isOpen: true,
    nextAvailable: '10:30 AM',
    image: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Salon+Bella+Vista',
    services: [
      { id: 1, name: 'Corte de Cabello', price: 15, duration: 30 },
      { id: 2, name: 'Peinado', price: 25, duration: 45 },
      { id: 3, name: 'Tinte', price: 35, duration: 60 },
      { id: 4, name: 'Tratamiento Capilar', price: 20, duration: 40 },
    ],
    reviews: [
      {
        id: 1,
        userName: 'María González',
        rating: 5,
        comment: 'Excelente servicio, muy profesionales y el resultado superó mis expectativas.',
        date: '2024-01-15',
      },
      {
        id: 2,
        userName: 'Carlos Pérez',
        rating: 4,
        comment: 'Buen servicio, aunque la espera fue un poco larga.',
        date: '2024-01-10',
      },
    ],
    workingHours: {
      monday: '9:00 AM - 7:00 PM',
      tuesday: '9:00 AM - 7:00 PM',
      wednesday: '9:00 AM - 7:00 PM',
      thursday: '9:00 AM - 7:00 PM',
      friday: '9:00 AM - 8:00 PM',
      saturday: '9:00 AM - 6:00 PM',
      sunday: '10:00 AM - 4:00 PM',
    },
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleBookNow = () => {
    router.push({
      pathname: '/(booking)/service-selection',
      params: { providerId: provider.id, providerName: provider.name },
    });
  };

  const handleCall = () => {
    Alert.alert('Llamar', `¿Deseas llamar a ${provider.phone}?`);
  };

  const handleEmail = () => {
    Alert.alert('Enviar Email', `¿Deseas enviar un email a ${provider.email}?`);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Imagen del proveedor */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: provider.image }} style={styles.providerImage} />
        <View style={styles.statusBadge}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: provider.isOpen ? Colors.light.success : Colors.light.error }
          ]} />
          <Text style={styles.statusText}>
            {provider.isOpen ? 'Abierto' : 'Cerrado'}
          </Text>
        </View>
      </View>

      {/* Información principal */}
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.category}>{provider.category}</Text>
          </View>
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={16} color={Colors.light.warning} />
            <Text style={styles.rating}>{provider.rating}</Text>
            <Text style={styles.reviewCount}>({provider.reviewCount})</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <IconSymbol name="location" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>{provider.distance} • {provider.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <IconSymbol name="clock" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>
            {provider.isOpen ? `Próximo disponible: ${provider.nextAvailable}` : 'Cerrado'}
          </Text>
        </View>
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{provider.description}</Text>
      </View>

      {/* Servicios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicios</Text>
        <View style={styles.servicesList}>
          {provider.services.map((service) => (
            <Card key={service.id} variant="elevated" padding="medium" style={styles.serviceCard}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceDetails}>
                  <Text style={styles.servicePrice}>${service.price}</Text>
                  <Text style={styles.serviceDuration}>{service.duration} min</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>

      {/* Horarios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horarios de Atención</Text>
        <Card variant="elevated" padding="medium">
          {Object.entries(provider.workingHours).map(([day, hours]) => (
            <View key={day} style={styles.scheduleRow}>
              <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <Text style={styles.hours}>{hours}</Text>
            </View>
          ))}
        </Card>
      </View>

      {/* Reseñas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reseñas Recientes</Text>
        <View style={styles.reviewsList}>
          {provider.reviews.map((review) => (
            <Card key={review.id} variant="elevated" padding="medium" style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <View style={styles.reviewRating}>
                  {[...Array(5)].map((_, i) => (
                    <IconSymbol
                      key={i}
                      name={i < review.rating ? "star.fill" : "star"}
                      size={12}
                      color={Colors.light.warning}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionSection}>
        <View style={styles.contactButtons}>
          <Button
            title="Llamar"
            onPress={handleCall}
            variant="outline"
            size="medium"
            icon={<IconSymbol name="phone" size={16} color={Colors.light.primary} />}
            style={styles.contactButton}
          />
          <Button
            title="Email"
            onPress={handleEmail}
            variant="outline"
            size="medium"
            icon={<IconSymbol name="envelope" size={16} color={Colors.light.primary} />}
            style={styles.contactButton}
          />
        </View>
        
        <Button
          title="Reservar Ahora"
          onPress={handleBookNow}
          variant="primary"
          size="large"
          fullWidth
          disabled={!provider.isOpen}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  providerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    marginBottom: 0,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.success,
  },
  serviceDuration: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  hours: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    marginBottom: 0,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  actionSection: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactButton: {
    flex: 1,
  },
});
