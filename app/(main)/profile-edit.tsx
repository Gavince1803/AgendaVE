import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SafeAreaView } from '@/components/ui/SafeAreaView';
import { Toast } from '@/components/ui/Toast';
import { Colors, DesignTokens } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileEditScreen() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    phone: '',
    avatar_url: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        full_name: user.profile.full_name || '',
        display_name: user.profile.display_name || '',
        phone: user.profile.phone || '',
        avatar_url: user.profile.avatar_url || '',
      });
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.base64) {
          await uploadAvatar(asset.base64, asset.uri.split('.').pop()?.toLowerCase() || 'jpg');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const uploadAvatar = async (base64Data: string, fileExt: string) => {
    try {
      setUploading(true);
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64Data), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      setToastMessage('Imagen subida correctamente');
      setToastType('success');
      setShowToast(true);

    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user profile via AuthContext (which calls AuthService and updates local state)
      await updateProfile({
        full_name: formData.full_name,
        display_name: formData.display_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
      });

      setToastMessage('Perfil actualizado exitosamente');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        router.back();
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setToastMessage('Error al actualizar el perfil');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Editar Perfil
          </ThemedText>
          <View style={styles.headerSpacer} />
        </ThemedView>

        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View style={styles.avatarWrapper}>
              <Image
                source={formData.avatar_url || 'https://via.placeholder.com/150'}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.editIconContainer}>
                <IconSymbol name="camera.fill" size={20} color="#fff" />
              </View>
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <Text style={styles.uploadingText}>...</Text>
                </View>
              )}
            </View>
            <Text style={styles.changePhotoText}>Cambiar foto</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <Card variant="elevated" style={styles.formCard}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre Completo</Text>
              <TextInput
                style={styles.textInput}
                value={formData.full_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                placeholder="Ingresa tu nombre completo"
                placeholderTextColor={Colors.light.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre de Usuario</Text>
              <TextInput
                style={styles.textInput}
                value={formData.display_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, display_name: text }))}
                placeholder="Cómo quieres que te llamen"
                placeholderTextColor={Colors.light.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Teléfono</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="+58 XXX XXX XXXX"
                placeholderTextColor={Colors.light.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información de Cuenta</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={user?.email}
                editable={false}
                placeholderTextColor={Colors.light.textSecondary}
              />
              <Text style={styles.fieldHint}>
                El email no se puede cambiar desde aquí. Contacta soporte si necesitas actualizarlo.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Tipo de Usuario</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={user?.profile?.role === 'client' ? 'Cliente' :
                  user?.profile?.role === 'provider' ? 'Proveedor' : 'Usuario'}
                editable={false}
                placeholderTextColor={Colors.light.textSecondary}
              />
            </View>
          </View>
        </Card>

        {/* Information Card */}
        <Card variant="elevated" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <IconSymbol name="info.circle" size={20} color={Colors.light.info} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Información Importante</Text>
              <Text style={styles.infoDescription}>
                • Los cambios se guardarán inmediatamente{'\n'}
                • Tu información es privada y segura{'\n'}
                • Algunos campos como email requieren verificación adicional
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonRow}>
          <Button
            title="Cancelar"
            onPress={handleCancel}
            variant="outline"
            size="large"
            style={styles.cancelButton}
          />
          <Button
            title="Guardar Cambios"
            onPress={handleSave}
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            icon={<IconSymbol name="checkmark" size={16} color="#ffffff" />}
          />
        </View>
      </View>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
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
    paddingBottom: DesignTokens.spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignTokens.spacing['2xl'],
    paddingTop: DesignTokens.spacing.lg,
  },
  backButton: {
    padding: DesignTokens.spacing.sm,
  },
  title: {
    fontSize: DesignTokens.typography.fontSizes['2xl'],
    fontWeight: DesignTokens.typography.fontWeights.bold as any,
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  formCard: {
    marginHorizontal: DesignTokens.spacing['2xl'],
    marginBottom: DesignTokens.spacing['2xl'],
  },
  formSection: {
    paddingVertical: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSizes.lg,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.lg,
  },
  fieldGroup: {
    marginBottom: DesignTokens.spacing.lg,
  },
  fieldLabel: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.medium as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSizes.base,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
  },
  disabledInput: {
    backgroundColor: Colors.light.surfaceVariant,
    color: Colors.light.textSecondary,
  },
  fieldHint: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: DesignTokens.spacing.xs,
    fontStyle: 'italic',
  },
  infoCard: {
    marginHorizontal: DesignTokens.spacing['2xl'],
    backgroundColor: Colors.light.info + '10',
    borderColor: Colors.light.info + '30',
    borderWidth: 1,
  },
  infoContent: {
    flexDirection: 'row',
    padding: DesignTokens.spacing.lg,
  },
  infoText: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  infoTitle: {
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: DesignTokens.typography.fontWeights.semibold as any,
    color: Colors.light.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  infoDescription: {
    fontSize: DesignTokens.typography.fontSizes.xs,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  bottomSection: {
    padding: DesignTokens.spacing['2xl'],
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
  saveButton: {
    flex: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing['2xl'],
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: DesignTokens.spacing.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.surfaceVariant,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.surface,
  },
  changePhotoText: {
    textAlign: 'center',
    color: Colors.light.primary,
    fontSize: DesignTokens.typography.fontSizes.sm,
    fontWeight: '600',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});