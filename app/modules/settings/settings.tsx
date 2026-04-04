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
  espresso:    '#1C1008',
  roast:       '#3D2010',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

export default function Settings() {
  const router = useRouter()

  const [restaurantName, setRestaurantName] = useState('Yammy Fresh')
  const [phone, setPhone]                   = useState('+977 98...')
  const [address, setAddress]               = useState('Kathmandu, Nepal')
  const [notifications, setNotifications]   = useState(true)
  const [soundEffects, setSoundEffects]     = useState(true)
  const [darkMode, setDarkMode]             = useState(false)

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

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.brand}>
            <View style={s.logoBadge}>
              <Utensils size={18} color={C.cream} />
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
              <Building2 size={16} color={C.brass} />
            </View>
            <Text style={s.sectionTitle}>Restaurant Information</Text>
          </View>

          <Text style={s.label}>Restaurant Name</Text>
          <TextInput
            style={s.input}
            value={restaurantName}
            onChangeText={setRestaurantName}
            placeholderTextColor={C.latte}
          />

          <Text style={s.label}>Phone Number</Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={C.latte}
          />

          <Text style={s.label}>Address</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            placeholderTextColor={C.latte}
          />
        </View>

        {/* User Profile */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <User size={16} color={C.brass} />
            </View>
            <Text style={s.sectionTitle}>User Profile</Text>
          </View>

          <TouchableOpacity style={s.settingRow}>
            <Text style={s.settingLabel}>Edit Profile</Text>
            <ChevronRight size={18} color={C.latte} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.settingRow, s.settingRowLast]}>
            <Text style={s.settingLabel}>Change Password</Text>
            <ChevronRight size={18} color={C.latte} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <Bell size={16} color={C.brass} />
            </View>
            <Text style={s.sectionTitle}>Preferences</Text>
          </View>

          <View style={s.settingRow}>
            <Text style={s.settingLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: C.vellum, true: C.brass }}
              thumbColor={C.cream}
            />
          </View>

          <View style={s.settingRow}>
            <Text style={s.settingLabel}>Sound Effects</Text>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: C.vellum, true: C.brass }}
              thumbColor={C.cream}
            />
          </View>

          <View style={[s.settingRow, s.settingRowLast]}>
            <Text style={s.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: C.vellum, true: C.brass }}
              thumbColor={C.cream}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconWrap}>
              <Palette size={16} color={C.brass} />
            </View>
            <Text style={s.sectionTitle}>Appearance</Text>
          </View>

          <TouchableOpacity style={s.settingRow}>
            <Text style={s.settingLabel}>Theme Color</Text>
            <View style={[s.colorDot, { backgroundColor: C.brass }]} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.settingRow, s.settingRowLast]}>
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
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color={C.terracotta} />
          <Text style={s.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Yammy Fresh POS</Text>
          <Text style={s.footerSub}>Restaurant Management System</Text>
        </View>

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  header: {
    backgroundColor: C.espresso,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: C.brass,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  brandName: { fontSize: 18, fontWeight: '900', color: C.cream, letterSpacing: 0.4 },
  brandSub:  { fontSize: 10, color: C.latte, fontWeight: '500', letterSpacing: 1, marginTop: 1 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48, gap: 16 },

  section: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1.5,
    borderColor: C.vellum,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: radius.xs,
    backgroundColor: C.brassLight,
    borderWidth: 1, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.espresso, letterSpacing: 0.2 },

  label: { fontSize: 12, fontWeight: '600', color: C.clay, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: C.brassBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: C.espresso,
    backgroundColor: C.brassLight,
  },
  textArea: { height: 72, textAlignVertical: 'top' },

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.vellum,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel:   { fontSize: 14, color: C.espresso, fontWeight: '500' },
  settingValue:   { fontSize: 13, color: C.latte },

  colorDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.brassBorder },

  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: C.clay },
  infoValue: { fontSize: 13, fontWeight: '700', color: C.espresso },

  saveBtn: {
    backgroundColor: C.brass,
    padding: 16, borderRadius: radius.md,
    alignItems: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: C.cream, letterSpacing: 0.3 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.tcLight,
    padding: 16, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: C.tcBorder,
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: C.terracotta },

  footer:    { alignItems: 'center', paddingTop: 16, gap: 4 },
  footerText: { fontSize: 14, fontWeight: '700', color: C.clay },
  footerSub:  { fontSize: 11, color: C.latte },
})
