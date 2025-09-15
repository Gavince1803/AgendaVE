import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
// import { ReviewService } from '@/lib/review-service';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function RateAppointmentScreen() {
  const { user } = useAuth();
  const { appointmentId } = useLocalSearchParams();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAppointment, setLoadingAppointment] = useState(true);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoadingAppointment(true);
      const appointments = await BookingService.getClientAppointments();
      const apt = appointments.find(a => a.id === appointmentId);
      setAppointment(apt);
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la cita');
    } finally {
      setLoadingAppointment(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (!appointment || !user) {
      Alert.alert('Error', 'Información de cita o usuario no disponible');
      return;
    }

    setLoading(true);
    
    try {
      await BookingService.createReview(
        appointment.id,
        rating,
        comment.trim() || undefined
      );

      Alert.alert(
        '¡Calificación Enviada!',
        'Gracias por tu calificación. Tu opinión es muy importante para nosotros.',
        [
          {
            text: 'Ver Mis Citas',
            onPress: () => router.push('/(tabs)/bookings'),
          },
          {
            text: 'Volver al Inicio',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo enviar la calificación. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            title=""
            onPress={() => setRating(star)}
            variant="ghost"
            style={styles.starButton}
          >
            <MaterialIcons
              name={star <= rating ? 'star' : 'star-border'}
              size={40}
              color={star <= rating ? Colors.light.warning : Colors.light.border}
            />
          </Button>
        ))}
      </View>
    );
  };

  if (loadingAppointment) {
    return (
      <TabSafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando información de la cita...</Text>
        </View>
      </TabSafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <TabSafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró la información de la cita</Text>
          <Button
            title="Volver"
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </TabSafeAreaView>
    );
  }

  return (
    <TabSafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Califica tu Experiencia</Text>
          <Text style={styles.subtitle}>Tu opinión nos ayuda a mejorar</Text>
        </View>

        {/* Información de la cita */}
        <Card variant="elevated" padding="medium" style={styles.appointmentCard}>
          <Text style={styles.cardTitle}>Detalles de la Cita</Text>
          
          <View style={styles.appointmentInfo}>
            <View style={styles.infoRow}>
              <MaterialIcons name="business" size={20} color={Colors.light.primary} />
              <Text style={styles.infoText}>{appointment.provider?.business_name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="content-cut" size={20} color={Colors.light.primary} />
              <Text style={styles.infoText}>{appointment.service?.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.light.primary} />
              <Text style={styles.infoText}>
                {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="access-time" size={20} color={Colors.light.primary} />
              <Text style={styles.infoText}>{appointment.appointment_time}</Text>
            </View>
          </View>
        </Card>

        {/* Calificación */}
        <Card variant="elevated" padding="medium" style={styles.ratingCard}>
          <Text style={styles.cardTitle}>¿Cómo calificarías tu experiencia?</Text>
          {renderStars()}
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Muy malo'}
              {rating === 2 && 'Malo'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bueno'}
              {rating === 5 && 'Excelente'}
            </Text>
          )}
        </Card>

        {/* Comentario */}
        <Card variant="elevated" padding="medium" style={styles.commentCard}>
          <Text style={styles.cardTitle}>Comentario (Opcional)</Text>
          <Text style={styles.commentSubtitle}>
            Comparte tu experiencia para ayudar a otros clientes
          </Text>
          
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Ej: Excelente atención, muy profesional, ambiente agradable..."
            placeholderTextColor={Colors.light.textTertiary}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          
          <Text style={styles.characterCount}>
            {comment.length}/500 caracteres
          </Text>
        </Card>

        {/* Términos */}
        <Card variant="elevated" padding="medium" style={styles.termsCard}>
          <View style={styles.termsContainer}>
            <MaterialIcons name="info" size={20} color={Colors.light.info} />
            <View style={styles.termsContent}>
              <Text style={styles.termsTitle}>Importante</Text>
              <Text style={styles.termsText}>
                • Tu calificación será visible públicamente{'\n'}
                • Los comentarios ayudan a otros clientes{'\n'}
                • Puedes editar tu calificación más tarde{'\n'}
                • Mantén un tono respetuoso y constructivo
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonRow}>
          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="outline"
            size="large"
            style={styles.cancelButton}
          />
          <Button
            title="Enviar Calificación"
            onPress={handleSubmitRating}
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading || rating === 0}
            style={styles.submitButton}
            icon={<MaterialIcons name="star" size={16} color="#ffffff" />}
          />
        </View>
      </View>
    </TabSafeAreaView>
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
  scrollContent: {
    paddingBottom: DesignTokens.spacing['6xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.error,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  backButton: {
    marginTop: DesignTokens.spacing.md,
  },
  header: {
    padding: DesignTokens.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.textSecondary,
  },
  appointmentCard: {
    margin: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.md,
  },
  ratingCard: {
    margin: DesignTokens.spacing.lg,
    marginTop: 0,
    alignItems: 'center',
  },
  commentCard: {
    margin: DesignTokens.spacing.lg,
    marginTop: 0,
  },
  termsCard: {
    margin: DesignTokens.spacing.lg,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.md,
  },
  appointmentInfo: {
    gap: DesignTokens.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  infoText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.md,
  },
  starButton: {
    padding: DesignTokens.spacing.xs,
  },
  ratingText: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: '600',
    color: Colors.light.primary,
    textAlign: 'center',
  },
  commentSubtitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: DesignTokens.spacing.md,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textTertiary,
    textAlign: 'right',
    marginTop: DesignTokens.spacing.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termsContent: {
    marginLeft: DesignTokens.spacing.sm,
    flex: 1,
  },
  termsTitle: {
    fontSize: DesignTokens.typography.fontSizes.base,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  termsText: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  bottomSection: {
    padding: DesignTokens.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : DesignTokens.spacing.lg,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
