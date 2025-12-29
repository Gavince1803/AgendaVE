import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { TimeSlots } from '@/components/ui/TimeSlots';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { BookingService, Service } from '@/lib/booking-service';
import { useLogger } from '@/lib/logger';

type BookingSource = 'app' | 'whatsapp' | 'instagram' | 'phone' | 'walk_in' | 'other';

export default function ManualBookingScreen() {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const log = useLogger();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [providerId, setProviderId] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);

    // Selection
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedSource, setSelectedSource] = useState<BookingSource>('whatsapp');

    // Define local type to match TimeSlots component expectation since it's not exported
    type TimeSlotItem = { time: string; isAvailable: boolean; isBooked?: boolean; isSelected?: boolean; };
    const [availableSlots, setAvailableSlots] = useState<TimeSlotItem[]>([]);

    // Calendar Availability
    const [availableDates, setAvailableDates] = useState<({ date: string; slots: number } | string)[]>([]);

    const [loadingSlots, setLoadingSlots] = useState(false);

    // Form
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [clientId, setClientId] = useState<string | null>(null);

    // Lookup
    const [isLookingUp, setIsLookingUp] = useState(false);

    useEffect(() => {
        loadProviderData();
    }, [user]);

    // Load available dates for the month when service/provider is ready
    useEffect(() => {
        if (providerId && selectedService) {
            loadAvailableDates();
        }
    }, [providerId, selectedService]);

    // Load slots for specific day
    useEffect(() => {
        if (selectedService && selectedDate && providerId) {
            loadTimeSlots();
        }
    }, [selectedService, selectedDate, providerId]);

    const loadProviderData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            // 1. Get Provider ID from User ID
            const provider = await BookingService.getProviderById(user.id);

            if (!provider) {
                showAlert('Error', 'No se encontró el perfil de proveedor');
                return;
            }

            setProviderId(provider.id);

            // 2. Load Services using Provider ID
            const allServices = await BookingService.getAllProviderServices(provider.id);
            const activeServices = allServices.filter(s => s.is_active);
            setServices(activeServices);

            // Auto-select first service if available
            if (activeServices.length > 0) {
                setSelectedService(activeServices[0]);
            }
        } catch (error) {
            console.error('Error loading provider data:', error);
            showAlert('Error', 'No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableDates = async () => {
        if (!providerId || !selectedService) return;
        try {
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + 45); // Check next 45 days

            const dates = await BookingService.getDaysWithAvailability(
                providerId,
                today.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                selectedService.id
            );

            setAvailableDates(dates);
        } catch (error) {
            console.error('Error loading available dates:', error);
            // Non-blocking error
        }
    };

    const loadTimeSlots = async () => {
        if (!providerId || !selectedService) return;
        try {
            setLoadingSlots(true);

            // Get availability for the provider
            const slots = await BookingService.getAvailableSlots(
                providerId,
                selectedDate,
                selectedService.id
            );

            // Map strings to TimeSlot objects
            const timeSlotObjects: TimeSlotItem[] = slots.map(time => ({
                time,
                isAvailable: true,
                isBooked: false
            }));

            setAvailableSlots(timeSlotObjects);

            // Reset selected time if it's no longer valid
            if (selectedTime && !slots.includes(selectedTime)) {
                setSelectedTime(null);
            }
        } catch (error) {
            console.error('Error loading slots:', error);
            showAlert('Error', 'No se pudieron cargar los horarios disponibles');
        } finally {
            setLoadingSlots(false);
        }
    };

    const handlePhoneBlur = async () => {
        if (!clientPhone || clientPhone.length < 6) return;

        try {
            setIsLookingUp(true);
            const found = await BookingService.lookupClientByPhone(clientPhone);
            if (found) {
                if (!clientName) {
                    setClientName(found.full_name);
                }
                setClientId(found.id || null);
            }
        } catch (error) {
            console.warn('Lookup failed');
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleCreateBooking = async () => {
        if (!providerId || !selectedService || !selectedTime) {
            showAlert('Error', 'Por favor completa todos los campos requeridos');
            return;
        }

        try {
            setSubmitting(true);

            await BookingService.createManualAppointment(
                providerId,
                selectedService.id,
                selectedDate,
                selectedTime,
                undefined, // Employee ID 
                clientName || 'Cliente Externo',
                notes,
                clientPhone,
                clientId,
                selectedSource
            );

            log.userAction('Created manual appointment', {
                service: selectedService.name,
                date: selectedDate,
                time: selectedTime,
                source: selectedSource
            });

            if (Platform.OS === 'web') {
                showAlert('Cita Registrada Exitosamente.');
                router.back();
            } else {
                showAlert(
                    '✅ Cita Registrada',
                    `Se ha guardado la cita proveniente de ${getSourceLabel(selectedSource)}.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                );
            }

        } catch (error) {
            console.error('Error creating manual booking:', error);
            showAlert('Error', 'No se pudo crear la reserva manual. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const getSourceLabel = (source: BookingSource) => {
        switch (source) {
            case 'whatsapp': return 'WhatsApp';
            case 'instagram': return 'Instagram';
            case 'phone': return 'Teléfono';
            case 'walk_in': return 'Presencial';
            default: return 'Otro';
        }
    };

    const getSourceIcon = (source: BookingSource): any => {
        switch (source) {
            case 'whatsapp': return 'text.bubble.fill';
            case 'instagram': return 'camera';
            case 'phone': return 'phone';
            case 'walk_in': return 'person.fill';
            default: return 'square.and.arrow.down';
        }
    };

    return (
        <TabSafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <ThemedText type="subtitle" style={styles.title}>Registrar Cita Externa</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                    <ThemedText style={styles.description}>
                        Registra manualmente citas que recibas por WhatsApp, Instagram o teléfono para mantener tu agenda bloqueada.
                    </ThemedText>

                    {/* 1. Select Source */}
                    <View style={styles.cleanSection}>
                        <View style={styles.cleanSectionHeader}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                1. Origen de la Cita
                            </ThemedText>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceScroll}>
                            {(['whatsapp', 'instagram', 'phone', 'walk_in'] as BookingSource[]).map((src) => (
                                <TouchableOpacity
                                    key={src}
                                    style={[
                                        styles.sourceChip,
                                        selectedSource === src && styles.sourceChipSelected
                                    ]}
                                    onPress={() => setSelectedSource(src)}
                                >
                                    <IconSymbol
                                        name={getSourceIcon(src)}
                                        size={20}
                                        color={selectedSource === src ? '#fff' : Colors.light.primary}
                                    />
                                    <ThemedText style={[
                                        styles.sourceChipText,
                                        selectedSource === src && styles.sourceChipTextSelected
                                    ]}>
                                        {getSourceLabel(src)}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 2. Select Service */}
                    <View style={styles.cleanSection}>
                        <View style={styles.cleanSectionHeader}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                2. Servicio
                            </ThemedText>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.servicesScroll}
                            style={styles.servicesRow}
                        >
                            {services.map(service => (
                                <TouchableOpacity
                                    key={service.id}
                                    style={[
                                        styles.serviceChip,
                                        selectedService?.id === service.id && styles.serviceChipSelected
                                    ]}
                                    onPress={() => setSelectedService(service)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.serviceChipText,
                                            selectedService?.id === service.id && styles.serviceChipTextSelected
                                        ]}
                                    >
                                        {service.name}
                                    </ThemedText>
                                    <ThemedText style={[
                                        styles.serviceDuration,
                                        selectedService?.id === service.id && styles.serviceDurationSelected
                                    ]}>
                                        {service.duration_minutes} min
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 3. Select Date */}
                    <View style={styles.cleanSection}>
                        <View style={styles.cleanSectionHeader}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                3. Fecha
                            </ThemedText>
                        </View>
                        <Calendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            minDate={new Date()}
                            availableDates={availableDates}
                        />
                    </View>

                    {/* 4. Select Time */}
                    <View style={styles.cleanSection}>
                        <View style={styles.cleanSectionHeader}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                4. Hora ({availableSlots.length} disponibles)
                            </ThemedText>
                        </View>

                        {loadingSlots ? (
                            <ThemedText style={styles.loadingText}>Cargando horarios...</ThemedText>
                        ) : availableSlots.length > 0 ? (
                            <TimeSlots
                                slots={availableSlots.map(slot => ({
                                    ...slot,
                                    isSelected: slot.time === selectedTime
                                }))}
                                selectedTime={selectedTime || undefined}
                                onTimeSelect={setSelectedTime}
                                variant="horizontal"
                                slotDuration={selectedService?.duration_minutes || 30}
                            />
                        ) : (
                            <View style={styles.emptySlots}>
                                <IconSymbol name="exclamationmark.triangle" size={32} color={Colors.light.textSecondary} />
                                <ThemedText style={styles.emptyText}>No hay horarios disponibles para esta fecha.</ThemedText>
                            </View>
                        )}
                    </View>

                    {/* 5. Client Info */}
                    <Card variant="elevated" style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                            5. Datos del Cliente
                        </ThemedText>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Teléfono (Búsqueda automática)</Text>
                            <View style={styles.phoneInputContainer}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Ej. 04121234567"
                                    value={clientPhone}
                                    onChangeText={setClientPhone}
                                    onBlur={handlePhoneBlur}
                                    keyboardType="phone-pad"
                                    placeholderTextColor={Colors.light.textSecondary}
                                />
                                {isLookingUp && (
                                    <View style={styles.lookupIndicator}>
                                        <ActivityIndicator size="small" color={Colors.light.primary} />
                                    </View>
                                )}
                            </View>
                            <Text style={styles.helperText}>Ingresa el número para buscar clientes frecuentes</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre del Cliente</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del cliente"
                                value={clientName}
                                onChangeText={setClientName}
                                placeholderTextColor={Colors.light.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Notas</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Detalles de la cita..."
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                placeholderTextColor={Colors.light.textSecondary}
                            />
                        </View>
                    </Card>

                    <View style={styles.footerSpacing} />
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title={submitting ? "Guardando..." : "Registrar Cita"}
                        onPress={handleCreateBooking}
                        loading={submitting}
                        disabled={!selectedService || !selectedTime || submitting}
                        variant="primary"
                        style={styles.submitButton}
                    />
                </View>
            </KeyboardAvoidingView>
        </TabSafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    description: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 16,
        padding: 16,
    },
    cleanSection: {
        marginBottom: 24,
    },
    cleanSectionHeader: {
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
    },
    sourceScroll: {
        flexDirection: 'row',
    },
    sourceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.light.surfaceVariant,
        borderRadius: 20,
        marginRight: 8,
        gap: 8,
    },
    sourceChipSelected: {
        backgroundColor: Colors.light.primary,
    },
    sourceChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    sourceChipTextSelected: {
        color: '#fff',
    },
    servicesScroll: {
        paddingHorizontal: 4,
    },
    servicesRow: {
        flexDirection: 'row',
    },
    serviceChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.light.surfaceVariant,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    serviceChipSelected: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    serviceChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    serviceChipTextSelected: {
        color: '#fff',
    },
    serviceDuration: {
        fontSize: 11,
        marginTop: 2,
        color: Colors.light.textSecondary,
    },
    serviceDurationSelected: {
        color: 'rgba(255,255,255,0.8)',
    },
    loadingText: {
        textAlign: 'center',
        color: Colors.light.textSecondary,
        marginVertical: 10,
    },
    emptySlots: {
        alignItems: 'center',
        padding: 20,
        gap: 8,
        backgroundColor: Colors.light.surfaceVariant + '40',
        borderRadius: 12,
    },
    emptyText: {
        color: Colors.light.textSecondary,
        fontSize: 14,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.text,
        marginBottom: 6,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lookupIndicator: {
        position: 'absolute',
        right: 12,
    },
    helperText: {
        fontSize: 11,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    input: {
        backgroundColor: Colors.light.surfaceVariant,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: Colors.light.text,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        backgroundColor: Colors.light.surface,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    footerSpacing: {
        height: 60,
    },
    submitButton: {
        width: '100%',
    },
});
