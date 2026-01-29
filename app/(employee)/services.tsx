// Employee Services Screen
// Allows employees to view provider services and set their own custom prices/durations

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { ScrollableInputView } from '@/components/ui/ScrollableInputView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { BookingService, Service, ServiceEmployeePricing } from '@/lib/booking-service';
import { LogCategory, useLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function EmployeeServicesScreen() {
    const { user, employeeProfile } = useAuth();
    const log = useLogger();
    const { showAlert } = useAlert();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [customPrices, setCustomPrices] = useState<Record<string, ServiceEmployeePricing>>({});
    const [editedPrices, setEditedPrices] = useState<Record<string, string>>({}); // serviceId -> price string
    const [myTeamMemberId, setMyTeamMemberId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, [user, employeeProfile]);

    const loadData = async () => {
        if (!user || !employeeProfile?.provider_id) return;

        try {
            setLoading(true);
            log.info(LogCategory.SERVICE, 'Loading employee services data');

            // 1. Ensure Team Member Profile Exists (Auto-Provisioning)
            // This RPC finds the existing member OR creates one if missing.
            log.info(LogCategory.SERVICE, 'Resolving team member profile...');

            const { data: memberJson, error: rpcError } = await supabase.rpc('ensure_team_member_profile');
            let foundMemberId = null;

            if (rpcError) {
                console.error('❌ [SERVICES] Error ensuring team profile:', rpcError);
            }

            if (memberJson) {
                // Determine structure (it returns jsonb, might be directly the object)
                const member = memberJson as any;
                console.log('✅ [SERVICES] Resolved Team Member ID:', member.id);
                foundMemberId = member.id;
                setMyTeamMemberId(member.id);
            } else {
                console.warn('⚠️ [SERVICES] Could not resolve team member profile. User might not be an active employee.');
            }

            // 2. Get All Provider Services
            const providerServices = await BookingService.getAllProviderServices(employeeProfile.provider_id);
            setServices(providerServices.filter(s => s.is_active)); // Only show active services

            // 3. Get My Custom Prices
            const pricingPromises = providerServices.map(s =>
                BookingService.getServiceEmployeePrices(s.id)
            );

            const allPricings = await Promise.all(pricingPromises);

            const myPrices: Record<string, ServiceEmployeePricing> = {};
            const myPriceValues: Record<string, string> = {};

            allPricings.flat().forEach(p => {
                // Prioritize matching myTeamMemberId, fallback to legacy employee_id check if needed
                if ((foundMemberId && p.employee_id === foundMemberId) || p.employee_id === employeeProfile.id) {
                    myPrices[p.service_id] = p;
                    myPriceValues[p.service_id] = p.price.toString();
                    if (p.price_max) {
                        myPriceValues[`${p.service_id}_max`] = p.price_max.toString();
                    }
                }
            });

            setCustomPrices(myPrices);
            setEditedPrices(myPriceValues);

        } catch (error) {
            console.error(error);
            showAlert('Error', 'No se pudieron cargar los servicios');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleSavePrice = async (serviceId: string, hasMaxPrice: boolean) => {
        if (!user || !employeeProfile) return;

        if (!myTeamMemberId) {
            showAlert('Error', 'Tu usuario no está vinculado a un perfil público del equipo. Contacta al administrador.');
            return;
        }

        const priceStr = editedPrices[serviceId];
        if (!priceStr) return; // Nothing to save (or cleared)

        const price = parseFloat(priceStr);

        let priceMax: number | undefined = undefined;
        if (hasMaxPrice) {
            const priceMaxStr = editedPrices[`${serviceId}_max`];
            if (priceMaxStr) {
                priceMax = parseFloat(priceMaxStr);
                if (isNaN(priceMax) || priceMax < price) {
                    showAlert('Error', 'El precio máximo debe ser mayor al mínimo');
                    return;
                }
            }
        }

        // If empty or invalid, maybe allow clearing? For now require number.
        if (isNaN(price) || price < 0) {
            showAlert('Error', 'Precio inválido');
            return;
        }

        try {
            setSaving(true);
            // Use myTeamMemberId (which corresponds to provider_team_members.id)
            await BookingService.upsertServiceEmployeePrice(
                serviceId,
                myTeamMemberId,
                price,
                priceMax
            );
            showAlert('Éxito', 'Tu precio personalizado ha sido guardado');

            // Refresh local state to match "saved" state
            setCustomPrices(prev => ({
                ...prev,
                [serviceId]: {
                    id: 'temp', // ID doesn't matter for display
                    service_id: serviceId,
                    employee_id: myTeamMemberId!,
                    price: price,
                    price_max: priceMax,
                    is_active: true
                }
            }));

        } catch (error) {
            console.error(error);
            showAlert('Error', 'No se pudo guardar el precio');
        } finally {
            setSaving(false);
        }
    };

    const handleClearPrice = async (serviceId: string) => {
        if (!user || !employeeProfile) return;
        if (!myTeamMemberId) return;

        try {
            setSaving(true);
            // Use myTeamMemberId
            await BookingService.removeServiceEmployeePrice(serviceId, myTeamMemberId);

            // Clear local state
            const newEdited = { ...editedPrices };
            delete newEdited[serviceId];
            delete newEdited[`${serviceId}_max`];
            setEditedPrices(newEdited);

            const newCustom = { ...customPrices };
            delete newCustom[serviceId];
            setCustomPrices(newCustom);

            showAlert('Éxito', 'Se usará el precio base del servicio');
        } catch (error) {
            console.error(error);
            showAlert('Error', 'No se pudo restablecer el precio');
        } finally {
            setSaving(false);
        }
    };

    return (
        <TabSafeAreaView style={styles.container}>
            <ScrollableInputView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />
                }
            >
                <ThemedView style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="arrow.left" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.title}>Mis Servicios</ThemedText>
                    <View style={{ width: 40 }} />
                </ThemedView>

                <ThemedText style={styles.subtitle}>
                    Define tus tarifas personalizadas. Si no configuras un precio, se usará el precio base del negocio.
                </ThemedText>

                <View style={styles.list}>
                    {services.map(service => {
                        const hasCustomPrice = !!customPrices[service.id];
                        const currentPriceValue = editedPrices[service.id] || '';

                        // Handle max price for ranges
                        const currentMaxPriceValue = editedPrices[`${service.id}_max`] || '';
                        const hasMaxPrice = service.input_type === 'range';

                        const isDirty = hasCustomPrice
                            ? (parseFloat(currentPriceValue) !== customPrices[service.id].price ||
                                (hasMaxPrice && parseFloat(currentMaxPriceValue) !== customPrices[service.id].price_max))
                            : currentPriceValue !== '' || (hasMaxPrice && currentMaxPriceValue !== '');

                        return (
                            <Card key={service.id} variant="elevated" style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.serviceInfo}>
                                        <ThemedText type="subtitle" style={styles.serviceName}>{service.name}</ThemedText>
                                        <View style={styles.basePriceContainer}>
                                            <IconSymbol name="tag" size={14} color={Colors.light.textSecondary} />
                                            <ThemedText style={styles.serviceBasePrice}>
                                                Base: ${service.price_amount}
                                                {service.input_type === 'range' && service.price_max ? ` - $${service.price_max}` : ''}
                                                {service.input_type === 'starting_at' ? '+' : ''}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    {hasCustomPrice && (
                                        <View style={styles.activeBadge}>
                                            <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.light.primary} />
                                            <ThemedText style={styles.activeBadgeText}>Personalizado</ThemedText>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={styles.inputLabel}>
                                            {hasMaxPrice ? 'Precio Mín' : 'Mi Precio'}
                                        </ThemedText>
                                        <View style={styles.inputWrapper}>
                                            <ThemedText style={styles.currencySymbol}>$</ThemedText>
                                            <TextInput
                                                style={styles.priceInput}
                                                value={currentPriceValue}
                                                onChangeText={(text) => setEditedPrices(prev => ({ ...prev, [service.id]: text }))}
                                                placeholder={service.price_amount.toString()}
                                                placeholderTextColor={Colors.light.textTertiary}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    {hasMaxPrice && (
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={styles.inputLabel}>Precio Máx</ThemedText>
                                            <View style={styles.inputWrapper}>
                                                <ThemedText style={styles.currencySymbol}>$</ThemedText>
                                                <TextInput
                                                    style={styles.priceInput}
                                                    value={currentMaxPriceValue}
                                                    onChangeText={(text) => setEditedPrices(prev => ({ ...prev, [`${service.id}_max`]: text }))}
                                                    placeholder={service.price_max?.toString() || '0'}
                                                    placeholderTextColor={Colors.light.textTertiary}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.actionButtons}>
                                    {isDirty && (
                                        <Button
                                            title="Guardar"
                                            size="small"
                                            onPress={() => handleSavePrice(service.id, hasMaxPrice)}
                                            loading={saving && isDirty}
                                            style={styles.saveButton}
                                        />
                                    )}
                                    {hasCustomPrice && (
                                        <TouchableOpacity
                                            onPress={() => handleClearPrice(service.id)}
                                            style={[styles.clearButton, isDirty && { marginTop: 8 }]}
                                            disabled={saving}
                                        >
                                            <ThemedText style={styles.clearButtonText}>Restablecer</ThemedText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Card>
                        );
                    })}
                </View>

                {services.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <IconSymbol name="doc.text.magnifyingglass" size={48} color={Colors.light.textSecondary} />
                        <ThemedText style={styles.emptyStateText}>No hay servicios activos asignados a tu proveedor.</ThemedText>
                    </View>
                )}

            </ScrollableInputView>
        </TabSafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        paddingBottom: DesignTokens.spacing['4xl'],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DesignTokens.spacing['xl'],
        paddingVertical: DesignTokens.spacing.lg,
    },
    backButton: {
        padding: DesignTokens.spacing.xs,
        marginLeft: -DesignTokens.spacing.xs,
    },
    title: {
        fontSize: DesignTokens.typography.fontSizes['xl'],
        fontWeight: 'bold',
    },
    subtitle: {
        paddingHorizontal: DesignTokens.spacing['2xl'],
        color: Colors.light.textSecondary,
        fontSize: DesignTokens.typography.fontSizes.sm,
        marginBottom: DesignTokens.spacing.lg,
        lineHeight: 20,
    },
    list: {
        paddingHorizontal: DesignTokens.spacing.lg,
        gap: DesignTokens.spacing.lg,
    },
    card: {
        padding: DesignTokens.spacing.lg,
        borderRadius: DesignTokens.radius.xl,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        backgroundColor: Colors.light.surface,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: DesignTokens.spacing.lg,
    },
    serviceInfo: {
        flex: 1,
        marginRight: DesignTokens.spacing.md,
    },
    serviceName: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        fontWeight: '600',
        marginBottom: DesignTokens.spacing.xs,
        color: Colors.light.text,
    },
    basePriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    serviceBasePrice: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.light.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeBadgeText: {
        fontSize: 11,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignTokens.spacing.md,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: DesignTokens.radius.lg,
        borderWidth: 1,
        borderColor: Colors.light.border,
        paddingHorizontal: DesignTokens.spacing.md,
        height: 48,
    },
    currencySymbol: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        color: Colors.light.textTertiary,
        marginRight: DesignTokens.spacing.xs,
        fontWeight: '500',
    },
    priceInput: {
        flex: 1,
        fontSize: DesignTokens.typography.fontSizes.lg,
        color: Colors.light.text,
        fontWeight: '600',
        height: '100%',
    },
    actionButtons: {
        minWidth: 80,
        alignItems: 'flex-end',
    },
    saveButton: {
        paddingHorizontal: DesignTokens.spacing.lg,
    },
    clearButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    clearButtonText: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    emptyState: {
        padding: DesignTokens.spacing['4xl'],
        alignItems: 'center',
        gap: DesignTokens.spacing.md,
    },
    emptyStateText: {
        color: Colors.light.textSecondary,
        fontSize: DesignTokens.typography.fontSizes.md,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    }
});
