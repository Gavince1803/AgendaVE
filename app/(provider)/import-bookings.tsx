import { router } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/GlobalAlertContext';
import { BookingService } from '@/lib/booking-service';
import { ExcelService, ImportedBooking } from '@/lib/excel-service';

export default function ImportBookingsScreen() {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [importedRows, setImportedRows] = useState<ImportedBooking[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [validateSchedule, setValidateSchedule] = useState(true);

    // Stats
    const validCount = importedRows.filter(r => r.isValid).length;
    const errorCount = importedRows.length - validCount;

    const handlePickFile = async () => {
        try {
            setLoading(true);
            const rows = await ExcelService.pickAndParseExcel();

            if (rows.length === 0) {
                setLoading(false);
                return;
            }

            setImportedRows(rows);
            setStep('preview');
        } catch (error) {
            console.error(error);
            showAlert('Error', 'No se pudo leer el archivo. Asegúrate que sea un Excel válido.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const provider = await BookingService.getProviderById(user.id);
            if (!provider) throw new Error('Proveedor no encontrado');

            const services = await BookingService.getAllProviderServices(provider.id);
            const defaultService = services.find(s => s.name.toLowerCase().includes('general')) || services[0];

            if (!defaultService) {
                showAlert('Error', 'Debes tener al menos un servicio para importar.');
                return;
            }

            // Create a copy to update state
            let rowsToProcess = [...importedRows];
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < rowsToProcess.length; i++) {
                const row = rowsToProcess[i];
                if (!row.isValid) continue;
                if (row.importStatus === 'success') continue;

                const matchedService = services.find(s =>
                    s.name.toLowerCase() === row.serviceName.toLowerCase()
                ) || defaultService;

                try {
                    await BookingService.createManualAppointment(
                        provider.id,
                        matchedService.id,
                        row.date,
                        row.time,
                        undefined,
                        row.clientName,
                        `${row.serviceName} - ${row.notes || ''}`,
                        row.clientPhone,
                        undefined, // clientId
                        'whatsapp',
                        row.status,
                        !validateSchedule // skipAvailabilityCheck
                    );

                    rowsToProcess[i] = { ...row, importStatus: 'success', importError: undefined };
                    successCount++;
                } catch (e: any) {
                    console.error('Failed row', row, e);
                    rowsToProcess[i] = { ...row, importStatus: 'error', importError: e.message };
                    failCount++;
                }
            }

            setImportedRows(rowsToProcess);

            showAlert(
                'Importación Finalizada',
                `Se importaron ${successCount} citas exitosamente.\nFallaron: ${failCount}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)/provider-calendar');
                            }
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Import error:', error);
            showAlert('Error', 'Ocurrió un error en la importación.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TabSafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/provider-calendar')}
                    style={{ position: 'absolute', left: 16, zIndex: 10 }}
                >
                    <IconSymbol name="chevron.left" size={24} color={Colors.light.primary} />
                </TouchableOpacity>
                <ThemedText type="subtitle">Importar Excel</ThemedText>
            </View>

            <View style={styles.content}>
                {step === 'upload' ? (
                    <View style={styles.uploadContainer}>
                        <IconSymbol name="doc.text" size={64} color={Colors.light.primary} />
                        <ThemedText style={styles.uploadTitle}>Sube tu archivo de Excel</ThemedText>
                        <ThemedText style={styles.uploadDesc}>
                            Columnas: Fecha, Hora, Cliente, Telefono, Servicio, Estado.
                        </ThemedText>

                        <Button
                            title="Seleccionar Archivo"
                            onPress={handlePickFile}
                            loading={loading}
                            variant="primary"
                            style={styles.uploadBtn}
                        />
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <ThemedText type="defaultSemiBold" style={{ color: Colors.light.primary }}>
                                    {validCount}
                                </ThemedText>
                                <ThemedText style={styles.statLabel}>Válidos</ThemedText>
                            </View>
                            <View style={styles.statItem}>
                                <ThemedText type="defaultSemiBold" style={{ color: Colors.light.error }}>
                                    {errorCount}
                                </ThemedText>
                                <ThemedText style={styles.statLabel}>Errores</ThemedText>
                            </View>
                        </View>

                        <ThemedText style={styles.previewTitle}>Vista Previa ({importedRows.length} filas)</ThemedText>

                        <ScrollView style={styles.list}>
                            {importedRows.map((row, idx) => (
                                <Card key={idx} variant="outlined" style={[
                                    styles.rowCard,
                                    !row.isValid && styles.rowError,
                                    row.importStatus === 'error' && styles.rowImportError,
                                    row.importStatus === 'success' && styles.rowImportSuccess
                                ]}>
                                    <View style={styles.rowHeader}>
                                        <ThemedText type="defaultSemiBold">
                                            {row.date} {row.time}
                                        </ThemedText>
                                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                            {row.importStatus === 'success' && (
                                                <View style={styles.badgeSuccess}>
                                                    <IconSymbol name="checkmark" size={12} color="white" />
                                                    <ThemedText style={styles.badgeText}>Importado</ThemedText>
                                                </View>
                                            )}
                                            <ThemedText style={{ fontSize: 12, color: row.status === 'confirmed' ? Colors.light.success : Colors.light.warning }}>
                                                {row.status === 'confirmed' ? 'CONFIRMADA' : row.status === 'pending' ? 'PENDIENTE' : 'CANCELADA'}
                                            </ThemedText>
                                            {!row.isValid && (
                                                <IconSymbol name="exclamationmark.triangle.fill" size={16} color={Colors.light.error} />
                                            )}
                                        </View>
                                    </View>
                                    <ThemedText>{row.clientName}</ThemedText>
                                    <ThemedText style={styles.metaText}>{row.serviceName}</ThemedText>

                                    {/* Validation Errors */}
                                    {!row.isValid && (
                                        <ThemedText style={styles.errorText}>
                                            {row.errors.join(', ')}
                                        </ThemedText>
                                    )}

                                    {/* Import Action Errors */}
                                    {row.importStatus === 'error' && (
                                        <ThemedText style={styles.errorText}>
                                            Error: {row.importError}
                                        </ThemedText>
                                    )}
                                </Card>
                            ))}
                        </ScrollView>

                        <View style={styles.footer}>
                            <View style={styles.footerOptions}>
                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => setValidateSchedule(!validateSchedule)}
                                >
                                    <IconSymbol
                                        name={validateSchedule ? "checkmark.square.fill" : "square"}
                                        size={24}
                                        color={Colors.light.primary}
                                    />
                                    <ThemedText style={styles.checkboxLabel}>Validar horario</ThemedText>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.footerButtons}>
                                <Button
                                    title="Cancelar"
                                    onPress={() => setStep('upload')}
                                    variant="outline"
                                    style={{ flex: 1, marginRight: 8 }}
                                />
                                <Button
                                    title={`Importar ${validCount} citas`}
                                    onPress={handleConfirmImport}
                                    loading={loading || validCount === 0}
                                    disabled={validCount === 0 || loading}
                                    variant="primary"
                                    style={{ flex: 2 }}
                                />
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </TabSafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    uploadContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 32,
    },
    uploadTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    uploadDesc: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    uploadBtn: {
        width: '100%',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        padding: 16,
        backgroundColor: Colors.light.surfaceVariant,
        borderRadius: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    previewTitle: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        flex: 1,
    },
    rowCard: {
        marginBottom: 8,
        padding: 12,
    },
    rowError: {
        borderColor: Colors.light.error,
        backgroundColor: '#FFF0F0',
    },
    rowImportError: {
        borderColor: Colors.light.error,
        borderLeftWidth: 4,
    },
    rowImportSuccess: {
        borderColor: Colors.light.success,
        borderLeftWidth: 4,
    },
    badgeSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metaText: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    errorText: {
        fontSize: 12,
        color: Colors.light.error,
        marginTop: 4,
    },
    footer: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        gap: 16,
    },
    footerOptions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    footerButtons: {
        flexDirection: 'row',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkboxLabel: {
        fontSize: 14,
        color: Colors.light.text,
    }
});
