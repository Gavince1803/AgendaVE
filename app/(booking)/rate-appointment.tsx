import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/booking-service';
import { supabase } from '@/lib/supabase';
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
    TouchableOpacity,
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
  const [existingReview, setExistingReview] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoadingAppointment(true);
      const appointments = await BookingService.getClientAppointments();
      const apt = appointments.find(a => a.id === appointmentId);
      setAppointment(apt);
      
      // Check if there's already a review for this appointment
      if (apt) {
        const review = await BookingService.getExistingReview(apt.id);
        if (review) {
          setExistingReview(review);
          setIsUpdating(true);
          setRating(review.rating);
          setComment(review.comment || '');
        }
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la cita');
    } finally {
      setLoadingAppointment(false);
    }
  };

  const handleSubmitRating = async () => {
    console.log('🔴 [RATE APPOINTMENT] Button pressed!', { rating, isUpdating, existingReview });
    
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (!appointment || !user) {
      console.log('🔴 [RATE APPOINTMENT] Missing data:', { appointment: !!appointment, user: !!user });
      Alert.alert('Error', 'Información de cita o usuario no disponible');
      return;
    }

    console.log('🔴 [RATE APPOINTMENT] Starting submission...');
    setLoading(true);
    
    try {
      if (isUpdating && existingReview) {
        console.log('🔴 [RATE APPOINTMENT] Updating existing review...', { existingReview });
        
        // Use a direct approach to update the review without the problematic updateReview function
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Usuario no autenticado');

        console.log('🔴 [RATE APPOINTMENT] Performing direct update...');
        
        // Direct update using supabase client
        const { error: updateError } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: comment.trim() || null
          })
          .eq('id', existingReview.id)
          .eq('client_id', authUser.id);

        console.log('🔴 [RATE APPOINTMENT] Update result:', { error: updateError });
        
        if (updateError) throw updateError;
        
        console.log('🔴 [RATE APPOINTMENT] Update successful, proceeding to provider rating update...');

        // Update provider rating after successful review update
        try {
          if (appointment?.providers?.id || appointment?.provider_id) {
            const providerId = appointment.providers?.id || appointment.provider_id;
            await BookingService.updateProviderRating(providerId);
          }
        } catch (ratingError) {
          console.error('Error updating provider rating:', ratingError);
        }
        
        console.log('🔴 [RATE APPOINTMENT] About to show success alert...');
        
        // For web compatibility, use console log and direct navigation
        console.log('🎉 [SUCCESS] ¡Calificación Actualizada! Tu calificación ha sido actualizada exitosamente.');
        
        try {
          Alert.alert(
            '¡Calificación Actualizada!',
            'Tu calificación ha sido actualizada exitosamente.',
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
        } catch (alertError) {
          console.error('Alert failed, navigating directly:', alertError);
          // Fallback: navigate directly to bookings after a short delay
          setTimeout(() => {
            router.push('/(tabs)/bookings');
          }, 1000);
        }
      } else {
        console.log('🔴 [RATE APPOINTMENT] Creating new review...');
        
        // Create new review
        await BookingService.createReview(
          appointment.id,
          rating,
          comment.trim() || undefined
        );
        
        console.log('🔴 [RATE APPOINTMENT] New review created successfully');
        console.log('🎉 [SUCCESS] ¡Calificación Enviada! Gracias por tu calificación.');

        try {
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
        } catch (alertError) {
          console.error('Alert failed, navigating directly:', alertError);
          // Fallback: navigate directly to bookings after a short delay
          setTimeout(() => {
            router.push('/(tabs)/bookings');
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      
      // Handle the specific duplicate constraint error
      if (error instanceof Error && error.message.includes('unique_review_per_appointment')) {
        Alert.alert(
          'Calificación ya Existe',
          'Ya has calificado esta cita anteriormente. Si deseas cambiar tu calificación, por favor recarga la pantalla.',
          [
            { 
              text: 'Recargar', 
              onPress: () => loadAppointment() 
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'No se pudo enviar la calificación. Inténtalo de nuevo.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={star <= rating ? 'star' : 'star-border'}
              size={40}
              color={star <= rating ? '#FFD700' : '#D1D5DB'}
            />
          </TouchableOpacity>
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
          <Text style={styles.title}>
            {isUpdating ? 'Actualiza tu Calificación' : 'Califica tu Experiencia'}
          </Text>
          <Text style={styles.subtitle}>
            {isUpdating 
              ? 'Puedes cambiar tu calificación anterior' 
              : 'Tu opinión nos ayuda a mejorar'
            }
          </Text>
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
            {isUpdating 
              ? 'Actualiza tu comentario si lo deseas' 
              : 'Comparte tu experiencia para ayudar a otros clientes'
            }
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
                {isUpdating 
                  ? '• Esto actualizará tu calificación anterior\n' 
                  : '• Puedes editar tu calificación más tarde\n'
                }
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
            title={isUpdating ? "Actualizar Calificación" : "Enviar Calificación"}
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
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
