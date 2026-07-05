import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  AlertCircle, CheckCircle, Clock, Edit,
  Film,
  LogOut,
  Plus, Search, Shield, Trash2, Users,
  XCircle,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { authService } from '../modules/auth/services/auth.service'
import minisService from '../modules/minis/services/minis'
import { Mini } from '../modules/minis/types/minis'
const BASE_URL = 'http://192.168.1.71:5000/api/users'

const C = {
  black:'#0A0A0A', charcoal:'#1A1A1A', graphite:'#2C2C2C', steel:'#3D3D3D',
  muted:'#6B6B6B', border:'#2E2E2E', card:'#1E1E1E', orange:'#FF6B2C',
  orangeTint:'#2A1A10', orangeDim:'#7A3010', white:'#FFFFFF', offWhite:'#F0F0F0',
  dim:'#A0A0A0', success:'#22C55E', successBg:'#0D2818', error:'#EF4444',
  errorBg:'#2A0A0A', warning:'#F59E0B', info:'#3B82F6',
}
const radius = { xs:6, sm:10, md:14, lg:18, pill:100 }

interface AdminUser {
  user_id: number
  user_name: string
  user_email: string
  user_role: string
  is_active: boolean
}

interface AdminFormData {
  user_name: string
  user_email: string
  user_password: string
}

const DEFAULT_FORM: AdminFormData = { user_name:'', user_email:'', user_password:'' }

export default function SuperAdmin() {
  const router = useRouter()

  const [superName,     setSuperName]     = useState('')
  const [admins,        setAdmins]        = useState<AdminUser[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAdmin,  setEditingAdmin]  = useState<AdminUser | null>(null)
  const [addForm,       setAddForm]       = useState<AdminFormData>(DEFAULT_FORM)
  const [editForm,      setEditForm]      = useState<AdminFormData>(DEFAULT_FORM)
  const [successMsg,    setSuccessMsg]    = useState<string | null>(null)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)
  const [focusedInput,  setFocusedInput]  = useState<string | null>(null)
  const [minis, setMinis] = useState<Mini[]>([])

  useEffect(() => {
    AsyncStorage.getItem('@userName').then(n => { if (n) setSuperName(n) })
    fetchAdmins()
    fetchMinis()
  }, [])

  const getHeaders = async () => {
    const token = await authService.getToken()
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL, { headers: await getHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setAdmins(data.filter((u: AdminUser) => u.user_role === 'Admin'))
    } catch (err: any) {
      flash('error', err.message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  const fetchMinis = async () => {
    try {
      const data = await minisService.getAllMinis()
      setMinis(data.filter((m: Mini) => m.status === 'pending'))
    } catch (err: any) {
      flash('error', err.message || 'Failed to load minis')
    }
  }

  const handleMiniStatus = async (mini_id: number, status: 'approved' | 'rejected') => {
    try {
      await minisService.updateStatus(mini_id, status)
      flash('success', `Mini ${status}!`)
      fetchMinis()
    } catch (err: any) {
      flash('error', err.message || 'Failed to update mini')
    }
  }

  const handleCreate = async () => {
    if (!addForm.user_name.trim())     { flash('error', 'Name is required'); return }
    if (!addForm.user_email.trim())    { flash('error', 'Email is required'); return }
    if (!addForm.user_password.trim()) { flash('error', 'Password is required'); return }
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ ...addForm, user_role: 'Admin', is_active: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      flash('success', 'Admin created!')
      setShowAddModal(false)
      setAddForm(DEFAULT_FORM)
      fetchAdmins()
    } catch (err: any) {
      flash('error', err.message || 'Failed to create admin')
    }
  }

  const handleUpdate = async () => {
    if (!editingAdmin) return
    try {
      const res = await fetch(`${BASE_URL}/${editingAdmin.user_id}`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ user_name: editForm.user_name, user_email: editForm.user_email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      flash('success', 'Admin updated!')
      setShowEditModal(false)
      setEditingAdmin(null)
      fetchAdmins()
    } catch (err: any) {
      flash('error', err.message || 'Failed to update admin')
    }
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remove Admin', `Remove "${name}" as admin?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', headers: await getHeaders() })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            flash('success', 'Admin removed.')
            fetchAdmins()
          } catch (err: any) {
            flash('error', err.message || 'Failed to delete')
          }
        },
      },
    ])
  }

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      const res = await fetch(`${BASE_URL}/${admin.user_id}`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ is_active: !admin.is_active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      fetchAdmins()
    } catch (err: any) {
      flash('error', err.message)
    }
  }

  const handleApproveAdmin = async (admin: AdminUser) => {
    try {
      const res = await fetch(`${BASE_URL}/${admin.user_id}`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ is_active: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      flash('success', `${admin.user_name} approved as Admin!`)
      fetchAdmins()
    } catch (err: any) {
      flash('error', err.message || 'Failed to approve admin')
    }
  }

  const handleRejectAdmin = (admin: AdminUser) => {
    Alert.alert('Reject Admin', `Reject and remove "${admin.user_name}"'s signup?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/${admin.user_id}`, { method: 'DELETE', headers: await getHeaders() })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            flash('success', 'Admin signup rejected.')
            fetchAdmins()
          } catch (err: any) {
            flash('error', err.message || 'Failed to reject')
          }
        },
      },
    ])
  }

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await authService.logout()
          router.replace('/modules/auth/login')
        },
      },
    ])
  }

  const flash = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000) }
    else { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 5000) }
  }

  const inputStyle = (key: string) => [s.input, focusedInput === key && s.inputFocused]

  const filtered = admins.filter(a =>
    a.user_name.toLowerCase().includes(search.toLowerCase()) ||
    a.user_email.toLowerCase().includes(search.toLowerCase())
  )

  const pendingAdmins = filtered.filter(a => !a.is_active)
  const activeAdmins  = filtered.filter(a => a.is_active)

  const activeCount   = admins.filter(a => a.is_active).length
  const inactiveCount = admins.filter(a => !a.is_active).length

  return (
    <View style={s.container}>
      <View style={s.blob1} /><View style={s.blob2} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.brandRow}>
              <View style={s.logoBox}>
                <Shield size={20} color={C.white} />
              </View>
              <View>
                <Text style={s.brandName}>Super Admin</Text>
                <Text style={s.brandSub}>YAMMY · Global Control</Text>
              </View>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color={C.dim} />
            </TouchableOpacity>
          </View>

          <View style={s.welcomeCard}>
            <View style={s.avatarWrap}>
              <Text style={s.avatarText}>{superName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.welcomeInfo}>
              <Text style={s.welcomeName}>{superName}</Text>
              <View style={s.superBadge}>
                <Text style={s.superBadgeText}>SUPER ADMIN</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Total Admins', value: admins.length,   color: C.orange },
            { label: 'Active',       value: activeCount,     color: C.success },
            { label: 'Pending',      value: inactiveCount,   color: C.warning },
          ].map(stat => (
            <View key={stat.label} style={s.statCard}>
              <Text style={[s.statNumber, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Banners */}
        {successMsg && (
          <View style={s.successBanner}>
            <CheckCircle size={16} color={C.success} />
            <Text style={s.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={s.errorBanner}>
            <AlertCircle size={16} color={C.error} />
            <Text style={s.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {/* Search */}
        <View style={s.searchRow}>
          <Search size={15} color={C.orange} />
          <TextInput
            style={s.searchInput}
            placeholder="Search admins…"
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Pending Admins section */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <Clock size={15} color={C.warning} />
            <Text style={[s.sectionTitle, { color: C.warning }]}>Pending Admins ({pendingAdmins.length})</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator size="small" color={C.orange} />
          </View>
        ) : pendingAdmins.length === 0 ? (
          <View style={[s.emptyState, { paddingVertical: 24 }]}>
            <Text style={s.emptySubtitle}>No admins awaiting approval</Text>
          </View>
        ) : (
          pendingAdmins.map(admin => (
            <View key={admin.user_id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.cardAvatar}>
                  <Text style={s.cardAvatarText}>{admin.user_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{admin.user_name}</Text>
                  <Text style={s.cardEmail}>{admin.user_email}</Text>
                </View>
              </View>
              <View style={[s.modalButtons, { marginTop: 0, marginBottom: 0 }]}>
                <TouchableOpacity style={s.cancelButton} onPress={() => handleRejectAdmin(admin)}>
                  <Text style={s.cancelButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.submitButton} onPress={() => handleApproveAdmin(admin)}>
                  <Text style={s.submitButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Active Admins section */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <Users size={15} color={C.orange} />
            <Text style={s.sectionTitle}>Admins ({activeAdmins.length})</Text>
          </View>
          <TouchableOpacity style={s.addButton} onPress={() => { setAddForm(DEFAULT_FORM); setShowAddModal(true) }} activeOpacity={0.85}>
            <Plus size={15} color={C.white} />
            <Text style={s.addButtonText}>Add Admin</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={C.orange} />
          </View>
        ) : activeAdmins.length === 0 ? (
          <View style={s.emptyState}>
            <Shield size={48} color={C.steel} />
            <Text style={s.emptyTitle}>No active admins</Text>
            <Text style={s.emptySubtitle}>Approve a pending admin or create one</Text>
          </View>
        ) : (
          activeAdmins.map(admin => (
            <View key={admin.user_id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.cardAvatar}>
                  <Text style={s.cardAvatarText}>{admin.user_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{admin.user_name}</Text>
                  <Text style={s.cardEmail}>{admin.user_email}</Text>
                  <View style={s.adminBadge}>
                    <Text style={s.adminBadgeText}>Admin</Text>
                  </View>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity
                    style={s.editBtn}
                    onPress={() => {
                      setEditingAdmin(admin)
                      setEditForm({ user_name: admin.user_name, user_email: admin.user_email, user_password: '' })
                      setShowEditModal(true)
                    }}
                    activeOpacity={0.8}
                  >
                    <Edit size={14} color={C.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleDelete(admin.user_id, admin.user_name)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={14} color={C.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.cardFooter}>
                <View style={s.activeRow}>
                  <View style={[s.activeDot, { backgroundColor: admin.is_active ? C.success : C.muted }]} />
                  <Text style={[s.activeText, { color: admin.is_active ? C.success : C.muted }]}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Switch
                  value={admin.is_active}
                  onValueChange={() => handleToggleActive(admin)}
                  trackColor={{ false: C.graphite, true: C.orangeTint }}
                  thumbColor={admin.is_active ? C.orange : C.steel}
                />
              </View>
            </View>
          ))
        )}

        {/* Pending Minis section */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <Film size={15} color={C.orange} />
            <Text style={s.sectionTitle}>Pending Minis ({minis.length})</Text>
          </View>
        </View>

        {minis.length === 0 ? (
          <View style={[s.emptyState, { paddingVertical: 24 }]}>
            <Text style={s.emptySubtitle}>No minis awaiting approval</Text>
          </View>
        ) : (
          minis.map(mini => (
            <View key={mini.mini_id} style={s.card}>
              <Text style={s.cardName}>{mini.title}</Text>
              {mini.description && <Text style={s.cardEmail}>{mini.description}</Text>}
              <View style={[s.modalButtons, { marginTop: 12, marginBottom: 0 }]}>
                <TouchableOpacity style={s.cancelButton} onPress={() => handleMiniStatus(mini.mini_id, 'rejected')}>
                  <XCircle size={14} color={C.error} />
                </TouchableOpacity>
                <TouchableOpacity style={s.submitButton} onPress={() => handleMiniStatus(mini.mini_id, 'approved')}>
                  <Text style={s.submitButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>New Admin Account</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>Full Name</Text>
              <TextInput
                style={inputStyle('add_name')}
                placeholder="Admin name"
                placeholderTextColor={C.muted}
                value={addForm.user_name}
                onChangeText={v => setAddForm({ ...addForm, user_name: v })}
                onFocus={() => setFocusedInput('add_name')}
                onBlur={() => setFocusedInput(null)}
              />
              <Text style={s.label}>Email</Text>
              <TextInput
                style={inputStyle('add_email')}
                placeholder="admin@restaurant.com"
                placeholderTextColor={C.muted}
                value={addForm.user_email}
                onChangeText={v => setAddForm({ ...addForm, user_email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('add_email')}
                onBlur={() => setFocusedInput(null)}
              />
              <Text style={s.label}>Temporary Password</Text>
              <TextInput
                style={inputStyle('add_pass')}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                placeholderTextColor={C.muted}
                value={addForm.user_password}
                onChangeText={v => setAddForm({ ...addForm, user_password: v })}
                secureTextEntry
                onFocus={() => setFocusedInput('add_pass')}
                onBlur={() => setFocusedInput(null)}
              />
              <View style={s.modalButtons}>
                <TouchableOpacity style={s.cancelButton} onPress={() => setShowAddModal(false)}>
                  <Text style={s.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.submitButton} onPress={handleCreate} activeOpacity={0.85}>
                  <Text style={s.submitButtonText}>Create Admin →</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Edit Admin</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>Full Name</Text>
              <TextInput
                style={inputStyle('edit_name')}
                placeholder="Full name"
                placeholderTextColor={C.muted}
                value={editForm.user_name}
                onChangeText={v => setEditForm({ ...editForm, user_name: v })}
                onFocus={() => setFocusedInput('edit_name')}
                onBlur={() => setFocusedInput(null)}
              />
              <Text style={s.label}>Email</Text>
              <TextInput
                style={inputStyle('edit_email')}
                placeholder="Email"
                placeholderTextColor={C.muted}
                value={editForm.user_email}
                onChangeText={v => setEditForm({ ...editForm, user_email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('edit_email')}
                onBlur={() => setFocusedInput(null)}
              />
              <View style={s.modalButtons}>
                <TouchableOpacity style={s.cancelButton} onPress={() => { setShowEditModal(false); setEditingAdmin(null) }}>
                  <Text style={s.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.submitButton} onPress={handleUpdate} activeOpacity={0.85}>
                  <Text style={s.submitButtonText}>Save Changes →</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:C.black },
  content:   { padding:20, paddingTop:56, paddingBottom:48 },
  blob1: { position:'absolute', top:-80, left:'20%', width:260, height:260, borderRadius:130, backgroundColor:C.orange, opacity:0.08 },
  blob2: { position:'absolute', top:-40, left:'45%', width:180, height:180, borderRadius:90,  backgroundColor:C.orange, opacity:0.12 },

  header:    { backgroundColor:C.charcoal, margin:-20, marginTop:-56, padding:20, paddingTop:56, paddingBottom:20, marginBottom:20, borderBottomWidth:1, borderBottomColor:C.border },
  headerTop: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  brandRow:  { flexDirection:'row', alignItems:'center', gap:12 },
  logoBox:   { width:44, height:44, borderRadius:radius.sm, backgroundColor:C.orange, alignItems:'center', justifyContent:'center' },
  brandName: { fontSize:18, fontWeight:'900', color:C.white, letterSpacing:0.4 },
  brandSub:  { fontSize:10, color:C.muted, marginTop:1 },
  logoutBtn: { width:38, height:38, borderRadius:radius.sm, backgroundColor:C.graphite, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.border },

  welcomeCard: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'rgba(255,107,44,0.08)', borderRadius:radius.md, padding:14, borderWidth:1, borderColor:C.orangeDim },
  avatarWrap:  { width:46, height:46, borderRadius:radius.sm, backgroundColor:C.orange, alignItems:'center', justifyContent:'center' },
  avatarText:  { fontSize:20, fontWeight:'900', color:C.white },
  welcomeInfo: { flex:1, gap:6 },
  welcomeName: { fontSize:15, fontWeight:'800', color:C.white },
  superBadge:  { alignSelf:'flex-start', backgroundColor:C.orangeTint, borderRadius:radius.pill, paddingHorizontal:10, paddingVertical:3, borderWidth:1, borderColor:C.orangeDim },
  superBadgeText: { fontSize:9, fontWeight:'900', color:C.orange, letterSpacing:1.5 },

  statsRow: { flexDirection:'row', gap:10, marginBottom:16 },
  statCard: { flex:1, backgroundColor:C.card, borderRadius:radius.md, borderWidth:1, borderColor:C.border, padding:12, alignItems:'center', gap:4 },
  statNumber: { fontSize:22, fontWeight:'900' },
  statLabel:  { fontSize:10, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:0.8 },

  successBanner: { flexDirection:'row', alignItems:'center', backgroundColor:C.successBg, borderWidth:1, borderColor:C.success, borderRadius:radius.md, padding:12, marginBottom:12, gap:8 },
  successText:   { color:C.success, fontSize:13, fontWeight:'600' },
  errorBanner:   { flexDirection:'row', alignItems:'center', backgroundColor:C.errorBg, borderWidth:1, borderColor:C.error, borderRadius:radius.md, padding:12, marginBottom:12, gap:8 },
  errorBannerText: { color:C.error, fontSize:13, fontWeight:'600' },

  sectionHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12, marginTop: 8 },
  sectionLeft:   { flexDirection:'row', alignItems:'center', gap:8 },
  sectionTitle:  { fontSize:13, fontWeight:'800', color:C.orange },
  addButton:     { flexDirection:'row', alignItems:'center', backgroundColor:C.orange, borderRadius:radius.pill, paddingHorizontal:14, paddingVertical:8, gap:6 },
  addButtonText: { color:C.white, fontWeight:'700', fontSize:13 },

  searchRow:   { flexDirection:'row', alignItems:'center', backgroundColor:C.graphite, borderWidth:1, borderColor:C.border, borderRadius:radius.md, paddingHorizontal:14, paddingVertical:10, marginBottom:16, gap:10 },
  searchInput: { flex:1, fontSize:14, color:C.white },

  emptyState:    { alignItems:'center', paddingVertical:56, gap:12 },
  emptyTitle:    { fontSize:17, fontWeight:'800', color:C.offWhite },
  emptySubtitle: { fontSize:13, color:C.muted },

  card:       { backgroundColor:C.card, borderRadius:radius.lg, borderWidth:1, borderColor:C.border, padding:14, marginBottom:10 },
  cardHeader: { flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:12 },
  cardAvatar: { width:44, height:44, borderRadius:radius.sm, backgroundColor:C.orange, alignItems:'center', justifyContent:'center', flexShrink:0 },
  cardAvatarText: { fontSize:18, fontWeight:'900', color:C.white },
  cardInfo:   { flex:1, gap:4 },
  cardName:   { fontSize:14, fontWeight:'800', color:C.white },
  cardEmail:  { fontSize:12, color:C.muted },
  adminBadge: { alignSelf:'flex-start', backgroundColor:C.orangeTint, borderRadius:radius.pill, borderWidth:1, borderColor:C.orangeDim, paddingHorizontal:8, paddingVertical:3, marginTop:2 },
  adminBadgeText: { fontSize:10, fontWeight:'700', color:C.orange },
  cardActions: { flexDirection:'row', gap:6 },
  editBtn:     { padding:8, borderRadius:radius.xs, backgroundColor:C.orangeTint, borderWidth:1, borderColor:C.orangeDim },
  deleteBtn:   { padding:8, borderRadius:radius.xs, backgroundColor:C.errorBg, borderWidth:1, borderColor:'#7A1010' },

  cardFooter: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderTopWidth:1, borderTopColor:C.border, paddingTop:10 },
  activeRow:  { flexDirection:'row', alignItems:'center', gap:6 },
  activeDot:  { width:6, height:6, borderRadius:3 },
  activeText: { fontSize:12, fontWeight:'600' },

  modalOverlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  modalContainer: { backgroundColor:C.charcoal, borderTopLeftRadius:28, borderTopRightRadius:28, borderTopWidth:1, borderColor:C.border, padding:24, maxHeight:'85%' },
  modalTitle:     { fontSize:18, fontWeight:'900', color:C.white, marginBottom:20, letterSpacing:0.3 },

  label:        { fontSize:11, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:1.1, marginBottom:8, marginTop:16 },
  input:        { backgroundColor:C.graphite, borderWidth:1, borderColor:C.border, borderRadius:radius.md, paddingHorizontal:16, height:52, fontSize:15, color:C.white },
  inputFocused: { borderColor:C.orange },

  modalButtons:     { flexDirection:'row', gap:12, marginTop:28, marginBottom:8 },
  cancelButton:     { flex:1, backgroundColor:C.graphite, borderWidth:1, borderColor:C.border, borderRadius:radius.md, height:52, alignItems:'center', justifyContent:'center' },
  cancelButtonText: { fontSize:14, color:C.offWhite, fontWeight:'600' },
  submitButton:     { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:C.orange, borderRadius:radius.md, height:54 },
  submitButtonText: { fontSize:15, color:C.white, fontWeight:'800' },
})