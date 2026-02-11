import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Trash2, User, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import GradientBackground from '@/components/GradientBackground';
import { spacing, borderRadius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { trpc } from '@/lib/trpc';

let useUser: any = null;
let useAuth: any = null;
try {
  const clerk = require("@clerk/clerk-expo");
  useUser = clerk.useUser;
  useAuth = clerk.useAuth;
} catch {}

export default function ProfileEditScreen() {
  const router = useRouter();
  const userHook = useUser?.();
  const authHook = useAuth?.();
  const user = userHook?.user;
  const signOut = authHook?.signOut;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'User';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const avatarUrl = user?.imageUrl;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (user) {
        await user.update({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        });
      }

      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('[Profile] Save failed:', err);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsPickingImage(true);
        try {
          if (user) {
            const result = await user.setProfileImage({ file });
            if (result?.publicUrl) {
              await updateProfileMutation.mutateAsync({ avatarUrl: result.publicUrl });
            }
          }
        } catch (err) {
          console.error('[Profile] Image upload failed:', err);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setIsPickingImage(false);
        }
      };
      input.click();
    } else {
      try {
        const ImagePicker = require('expo-image-picker');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets[0]) {
          setIsPickingImage(true);
          const asset = result.assets[0];
          if (user && asset.uri) {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            await user.setProfileImage({ file: blob });
          }
          setIsPickingImage(false);
        }
      } catch (err) {
        console.error('[Profile] Image picker failed:', err);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
        setIsPickingImage(false);
      }
    }
  };

  const handleRemoveImage = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await user.setProfileImage({ file: null });
              }
            } catch (err) {
              console.error('[Profile] Remove image failed:', err);
              Alert.alert('Error', 'Failed to remove image.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your portfolio data, connected accounts, and settings will be permanently removed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: confirmDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountMutation.mutateAsync();

      if (user) {
        try {
          await user.delete();
        } catch {}
      }

      if (signOut) {
        await signOut();
      }

      router.replace('/(auth)/sign-in' as any);
    } catch (err) {
      console.error('[Profile] Delete account failed:', err);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const hasChanges = (firstName.trim() !== (user?.firstName || '')) ||
    (lastName.trim() !== (user?.lastName || ''));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <Save size={22} color={hasChanges ? Colors.accent : Colors.text.tertiary} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} activeOpacity={0.8}>
            {isPickingImage ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="large" color={Colors.accent} />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Camera size={16} color="#FFFFFF" strokeWidth={2} />
            </View>
          </TouchableOpacity>
          <View style={styles.avatarActions}>
            <TouchableOpacity style={styles.avatarActionButton} onPress={handlePickImage}>
              <Text style={styles.avatarActionText}>Change Photo</Text>
            </TouchableOpacity>
            {avatarUrl && (
              <TouchableOpacity style={styles.avatarActionButton} onPress={handleRemoveImage}>
                <Text style={[styles.avatarActionText, styles.avatarActionTextDestructive]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={Colors.text.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={Colors.text.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText}>{email}</Text>
            </View>
            <Text style={styles.inputHint}>Email is managed by your authentication provider</Text>
          </View>
        </View>

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Trash2 size={20} color={Colors.error} strokeWidth={2} />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.deleteHint}>
            Permanently delete your account and all associated data
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headline,
    color: Colors.text.primary,
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: Colors.card,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardSoft,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.accent,
  },
  avatarLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  avatarActionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  avatarActionText: {
    ...typography.callout,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  avatarActionTextDestructive: {
    color: Colors.error,
  },
  formSection: {
    gap: spacing.lg,
    marginBottom: spacing.xl + spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.subhead,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
    paddingHorizontal: spacing.xs,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...typography.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
  },
  inputDisabledText: {
    ...typography.body,
    color: Colors.text.secondary,
    fontSize: 16,
  },
  inputHint: {
    ...typography.caption,
    color: Colors.text.tertiary,
    paddingHorizontal: spacing.xs,
  },
  dangerSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dangerTitle: {
    ...typography.subhead,
    color: Colors.error,
    fontWeight: '600' as const,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  deleteButtonText: {
    ...typography.callout,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  deleteHint: {
    ...typography.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
