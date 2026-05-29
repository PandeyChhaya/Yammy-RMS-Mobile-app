import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  Bell,
  Building2,
  ChevronRight,
  LogOut,
  Palette,
  User,
  Utensils,
} from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { authService } from '../auth/services/auth.service'

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  steel:      '#3D3D3D',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  card:       '#1E1E1E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim:  '#7A3010',
  white:      '#FFFFFF',
  offWhite:   '#F0F0F0',
  dim:        '#A0A0A0',
  success:    '#22C55E',
  successBg:  '#0D2818',
  error:      '#EF4444',
  errorBg:    '#2A0A0A',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

export default function Settings() {
  const router = useRouter()

  const [restaurantName, setRestaurantName] = useState('Yammy Fresh')
  const [phone,          setPhone]          = useState('+977 98...')
  const [address,        setAddress]        = useState('Kathmandu, Nepal')
  const [notifications,  setNotifications]  = useState(true)
  const [soundEffects,   setSoundEffects]   = useState(true)
  const [darkMode,       setDarkMode]       = useState(false)
  const [focusedInput,   setFocusedInput]   = useState<string | null>(null)

  const handleSave = () => {
    Alert.alert('Success', 'Settings saved successfully!')
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout()
          await AsyncStorage.removeItem('@userName')
          await AsyncStorage.removeItem('@userRole')
          await AsyncStorage.removeItem('@userId')
          router.replace('/modules/auth/login')
        },
      },
    ])
  }

  const inputStyle = (key: string) => [
    s.input,
    focusedInput === key && s.inputFocused,
  ]

  return (
    <View style={s.root}>
      {/* Background blobs */}
      <View style={s.blob1} />
      <View style={s.blob2} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.brand}>
            <View style={s.logoBadge}>
              <Utensils size={18} color={C.white} />
            </View>
            <View>
              <Text style={s.brandName}>Yammy Fresh</Text>
              <Text style={s.brandSub}>Settings</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Restaurant Info */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <Building2 size={16} color={C.orange} />
            </View>
            <Text style={s.sectionTitle}>Restaurant Information</Text>
          </View>

          <Text style={s.label}>Restaurant Name</Text>
          <TextInput
            style={inputStyle('rname')}
            value={restaurantName}
            onChangeText={setRestaurantName}
            placeholderTextColor={C.muted}
            onFocus={() => setFocusedInput('rname')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={s.label}>Phone Number</Text>
          <TextInput
            style={inputStyle('phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={C.muted}
            onFocus={() => setFocusedInput('phone')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={s.label}>Address</Text>
          <TextInput
            style={[inputStyle('address'), s.textArea]}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            placeholderTextColor={C.muted}
            onFocus={() => setFocusedInput('address')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        {/* User Profile */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <User size={16} color={C.orange} />
            </View>
            <Text style={s.sectionTitle}>User Profile</Text>
          </View>

          <TouchableOpacity style={s.settingRow} activeOpacity={0.7}>
            <Text style={s.settingLabel}>Edit Profile</Text>
            <ChevronRight size={18} color={C.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.settingRow, s.settingRowLast]} activeOpacity={0.7}>
            <Text style={s.settingLabel}>Change Password</Text>
            <ChevronRight size={18} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <Bell size={16} color={C.orange} />
            </View>
            <Text style={s.sectionTitle}>Preferences</Text>
          </View>

          <View style={s.settingRow}>
            <Text style={s.settingLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: C.steel, true: C.orange }}
              thumbColor={C.white}
            />
          </View>

          <View style={s.settingRow}>
            <Text style={s.settingLabel}>Sound Effects</Text>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: C.steel, true: C.orange }}
              thumbColor={C.white}
            />
          </View>

          <View style={[s.settingRow, s.settingRowLast]}>
            <Text style={s.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: C.steel, true: C.orange }}
              thumbColor={C.white}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <Palette size={16} color={C.orange} />
            </View>
            <Text style={s.sectionTitle}>Appearance</Text>
          </View>

          <TouchableOpacity style={s.settingRow} activeOpacity={0.7}>
            <Text style={s.settingLabel}>Theme Color</Text>
            <View style={[s.colorDot, { backgroundColor: C.orange, borderColor: C.orangeDim }]} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.settingRow, s.settingRowLast]} activeOpacity={0.7}>
            <Text style={s.settingLabel}>Language</Text>
            <Text style={s.settingValue}>English</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={s.section}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Version</Text>
            <Text style={s.infoValue}>1.0.0</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Build</Text>
            <Text style={s.infoValue}>2025.03.20</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>Save Changes →</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color={C.error} />
          <Text style={s.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerDots}>
            <View style={s.footerDot} /><View style={s.footerDot} /><View style={s.footerDot} />
          </View>
          <Text style={s.footerText}>Yammy Fresh POS</Text>
          <Text style={s.footerSub}>Restaurant Management System</Text>
        </View>

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.black },
  blob1: { position: 'absolute', top: -80, left: '20%', width: 260, height: 260, borderRadius: 130, backgroundColor: C.orange, opacity: 0.10 },
  blob2: { position: 'absolute', top: -40, left: '45%', width: 180, height: 180, borderRadius: 90,  backgroundColor: C.orange, opacity: 0.16 },

  header: {
    backgroundColor: C.charcoal,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: C.orangeTint,
    borderWidth: 1.5, borderColor: C.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: 0.4 },
  brandSub:  { fontSize: 10, color: C.muted, fontWeight: '500', letterSpacing: 1, marginTop: 1, textTransform: 'uppercase' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48, gap: 16 },

  section: {
    backgroundColor: C.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: radius.xs,
    backgroundColor: C.orangeTint,
    borderWidth: 1, borderColor: C.orangeDim,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.offWhite, letterSpacing: 0.2 },

  label: { fontSize: 11, fontWeight: '700', color: C.muted, marginBottom: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1.1 },
  input: {
    backgroundColor: C.graphite,
    borderWidth: 1, borderColor: C.border,
    borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 15, color: C.white,
    height: 52,
  },
  inputFocused: { borderColor: C.orange, backgroundColor: C.steel },
  textArea:     { height: 72, textAlignVertical: 'top' },

  settingRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel:   { fontSize: 14, color: C.offWhite, fontWeight: '600' },
  settingValue:   { fontSize: 13, color: C.dim },

  colorDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValue: { fontSize: 13, fontWeight: '700', color: C.offWhite },

  saveBtn:     { backgroundColor: C.orange, height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

  logoutBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.errorBg, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: '#7A1010' },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: C.error },

  footer:     { alignItems: 'center', paddingTop: 16, gap: 4 },
  footerDots: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  footerDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.steel },
  footerText: { fontSize: 14, fontWeight: '700', color: C.steel },
  footerSub:  { fontSize: 11, color: C.steel },
})