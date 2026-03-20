import { Bell, Building2, ChevronRight, LogOut, Palette, User } from 'lucide-react-native'
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

const Colors = {
  bg: '#FEF1A8',
  card: '#FFFFFF',
  brand: '#C41E1E',
  text: '#1A1A1A',
  textSub: '#5C5436',
  border: '#E8D88A',
}

export default function Settings() {
  const [restaurantName, setRestaurantName] = useState('Yammy Fresh')
  const [phone, setPhone] = useState('+977 98...')
  const [address, setAddress] = useState('Kathmandu, Nepal')
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const handleSave = () => {
    Alert.alert('Success', 'Settings saved successfully!')
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
        Alert.alert('Logged out', 'You have been logged out')
      }}
    ])
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your restaurant</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Restaurant Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={Colors.brand} />
            <Text style={styles.sectionTitle}>Restaurant Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Name</Text>
            <TextInput
              style={styles.input}
              value={restaurantName}
              onChangeText={setRestaurantName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* User Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={Colors.brand} />
            <Text style={styles.sectionTitle}>User Profile</Text>
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Change Password</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.brand} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E8D88A', true: Colors.brand }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: '#E8D88A', true: Colors.brand }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E8D88A', true: Colors.brand }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={Colors.brand} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Theme Color</Text>
            <View style={[styles.colorDot, { backgroundColor: Colors.brand }]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingValue}>English</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>2025.03.20</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={Colors.brand} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Yammy Fresh POS</Text>
          <Text style={styles.footerSubtext}>Restaurant Management System</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.brand, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#FFF', opacity: 0.9, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  section: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#FFFDF0' },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  settingLabel: { fontSize: 14, color: Colors.text },
  settingValue: { fontSize: 14, color: '#999' },
  
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0' },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: Colors.textSub },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  
  saveBtn: { backgroundColor: Colors.brand, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  logoutBtnText: { fontSize: 15, fontWeight: '600', color: Colors.brand },
  
  footer: { alignItems: 'center', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  footerSubtext: { fontSize: 12, color: Colors.textSub, marginTop: 4 },
})