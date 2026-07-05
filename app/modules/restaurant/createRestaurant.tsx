import { useRouter } from 'expo-router'
import { Building2, MapPin, Phone } from 'lucide-react-native'
import { useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { authService } from '../auth/services/auth.service'
import { corner, palette } from '../shared/theme'
import restaurantService from './services/restaurantService'

export default function CreateRestaurant() {
  const router = useRouter()

  const [restaurantName, setRestaurantName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!restaurantName.trim()) {
      setNameError('Restaurant name is required')
      return
    }
    setNameError(null)
    setLoading(true)

    try {
      const result = await restaurantService.postRestaurant({
        restaurant_name: restaurantName.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      await authService.setRestaurantId(result.restaurant_id)
      router.replace('/modules/Dashboard')
    } catch (err: any) {
      Alert.alert('Could not create restaurant', err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function inputStyle(key: string) {
    return [styles.input, focusedInput === key && styles.inputFocused]
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerIcon}>
          <Building2 size={28} color={palette.orange} />
        </View>
        <Text style={styles.title}>Set Up Your Restaurant</Text>
        <Text style={styles.subtitle}>
          Tell us about your restaurant before you get started. You can edit these details later.
        </Text>

        <Text style={styles.label}>Restaurant Name *</Text>
        <TextInput
          style={[inputStyle('name'), nameError && styles.inputError]}
          placeholder="e.g. Yammy Fresh"
          placeholderTextColor={palette.muted}
          value={restaurantName}
          onChangeText={setRestaurantName}
          onFocus={() => setFocusedInput('name')}
          onBlur={() => setFocusedInput(null)}
        />
        {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[inputStyle('desc'), styles.textArea]}
          placeholder="Short description of your restaurant (optional)"
          placeholderTextColor={palette.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          onFocus={() => setFocusedInput('desc')}
          onBlur={() => setFocusedInput(null)}
        />

        <Text style={styles.label}>Address</Text>
        <View style={[styles.inputWithIcon, focusedInput === 'address' && styles.inputFocused]}>
          <MapPin size={15} color={palette.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.inputInline}
            placeholder="Street, city (optional)"
            placeholderTextColor={palette.muted}
            value={address}
            onChangeText={setAddress}
            onFocus={() => setFocusedInput('address')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <Text style={styles.label}>Phone</Text>
        <View style={[styles.inputWithIcon, focusedInput === 'phone' && styles.inputFocused]}>
          <Phone size={15} color={palette.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.inputInline}
            placeholder="Contact number (optional)"
            placeholderTextColor={palette.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            onFocus={() => setFocusedInput('phone')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Creating…' : 'Create Restaurant'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.black },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48 },

  headerIcon: {
    width: 64, height: 64, borderRadius: corner.lg,
    backgroundColor: palette.orangeTint, borderWidth: 1.5, borderColor: palette.orangeDim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', color: palette.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: palette.muted, textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 8 },

  label: { fontSize: 10, fontWeight: '800', color: palette.muted, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1.4 },
  input: { borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: palette.white, backgroundColor: palette.card },
  inputFocused: { borderColor: palette.orange },
  inputError: { borderColor: palette.error },
  textArea: { height: 80, textAlignVertical: 'top' },
  fieldError: { fontSize: 11, color: palette.error, marginTop: 4, fontWeight: '600' },

  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.md,
    paddingHorizontal: 14, backgroundColor: palette.card,
  },
  inputInline: { flex: 1, paddingVertical: 12, fontSize: 14, color: palette.white },

  submitButton: { backgroundColor: palette.orange, borderRadius: corner.pill, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  submitButtonText: { fontSize: 14, color: palette.white, fontWeight: '800', letterSpacing: 0.3 },
  disabled: { opacity: 0.5 },
})