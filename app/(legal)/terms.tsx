import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabSafeAreaView } from '@/components/ui/SafeAreaView';
import { Colors, DesignTokens } from '@/constants/Colors';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
    return (
        <TabSafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="arrow.left" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <ThemedText type="title" style={styles.title}>Términos y Condiciones</ThemedText>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <ThemedText style={styles.lastUpdated}>Última actualización: 4 de Diciembre, 2025</ThemedText>

                <Section title="1. Introducción">
                    Bienvenido a MiCita. Al utilizar nuestra aplicación, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no deberás utilizar nuestra aplicación.
                </Section>

                <Section title="2. Uso del Servicio">
                    MiCita es una plataforma que conecta a usuarios con proveedores de servicios locales en Venezuela. No somos responsables directos de los servicios prestados por los proveedores, pero facilitamos la conexión y gestión de citas.
                </Section>

                <Section title="3. Pagos y Tarifas">
                    Los pagos se realizan directamente entre el cliente y el proveedor ("Pago en sitio" o "Pago Móvil"). MiCita no procesa pagos directamente ni retiene comisiones de las transacciones en esta versión.
                </Section>

                <Section title="4. Cancelaciones">
                    Las cancelaciones deben realizarse con al menos 24 horas de antelación. Los proveedores se reservan el derecho de aplicar políticas de "No Show" si el cliente no asiste a la cita confirmada.
                </Section>

                <Section title="5. Privacidad de Datos">
                    Respetamos tu privacidad. Tus datos personales se utilizan únicamente para gestionar tus citas y mejorar tu experiencia en la app. Cumplimos con las normativas locales de protección de datos.
                </Section>

                <Section title="6. Responsabilidad">
                    MiCita no se hace responsable por daños, pérdidas o insatisfacción con los servicios recibidos. Cualquier reclamo debe ser dirigido al proveedor del servicio.
                </Section>

                <Section title="7. Contacto">
                    Para cualquier duda o soporte, puedes contactarnos a través de soporte@micita.dev o vía WhatsApp al número oficial de soporte +1 652522076.
                </Section>

                <View style={styles.footer}>
                    <ThemedText style={styles.footerText}>© 2025 MiCita. Hecho con ❤️ en Venezuela.</ThemedText>
                </View>
            </ScrollView>
        </TabSafeAreaView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
            <ThemedText style={styles.sectionText}>{children}</ThemedText>
        </View>
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
        padding: DesignTokens.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
    },
    backButton: {
        marginRight: DesignTokens.spacing.md,
        padding: 4,
    },
    title: {
        fontSize: DesignTokens.typography.fontSizes.xl,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: DesignTokens.spacing.xl,
        paddingBottom: DesignTokens.spacing['4xl'],
    },
    lastUpdated: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textSecondary,
        marginBottom: DesignTokens.spacing.xl,
    },
    section: {
        marginBottom: DesignTokens.spacing.xl,
    },
    sectionTitle: {
        fontSize: DesignTokens.typography.fontSizes.lg,
        fontWeight: '600',
        marginBottom: DesignTokens.spacing.sm,
        color: Colors.light.text,
    },
    sectionText: {
        fontSize: DesignTokens.typography.fontSizes.base,
        lineHeight: 24,
        color: Colors.light.textSecondary,
    },
    footer: {
        marginTop: DesignTokens.spacing.xl,
        alignItems: 'center',
        paddingTop: DesignTokens.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderLight,
    },
    footerText: {
        fontSize: DesignTokens.typography.fontSizes.sm,
        color: Colors.light.textTertiary,
    },
});
