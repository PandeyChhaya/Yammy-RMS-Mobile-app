import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    AlertCircle,
    CheckCircle,
    Edit,
    Plus,
    Search,
    Shield,
    Trash2,
    User,
    UserCheck,
    UserX,
} from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import userService, { User as UserType } from './usersService'

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
  warning:    '#F59E0B',
  warningBg:  '#1C1500',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const ROLES = ['Admin', 'Cashier', 'Waiter', 'Kitchen Staff']

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Admin':         { bg: C.orangeTint, border: C.orangeDim, text: C.orange },
  'Cashier':       { bg: '#0C1A2E',    border: '#1A3A5C',   text: '#3B82F6' },
  'Waiter':        { bg: C.successBg,  border: '#1A4A2A',   text: C.success },
  'Kitchen Staff': { bg: C.warningBg,  border: '#3A2500',   text: C.warning },
  'Customer':      { bg: C.graphite,   border: C.steel,     text: C.dim },
  'Super Admin':   { bg: '#1A0A2E',    border: '#3A1A5C',   text: '#A855F7' },
}

interface CreateUserForm {
  user_name:     string
  user_email:    string
  user_password: string
  user_role:     string
}

const DEFAULT_FORM: CreateUserForm = {
  user_name:     '',
  user_email:    '',
  user_password: '',
  user_role:     'Waiter',
}

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8,                          label: '8+ characters' },
  { test: (p: string) => /[A-Z]/.test(p),                        label: 'Uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p),                        label: 'Number' },
  { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), label: 'Special character' },
]

export default function Users() {
  const queryClient = useQueryClient()

  const [search,        setSearch]        = useState('')
  const [filterRole,    setFilterRole]    = useState<string>('all')
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser,   setEditingUser]   = useState<UserType | null>(null)
  const [form,          setForm]          = useState<CreateUserForm>(DEFAULT_FORM)
  const [editRole,      setEditRole]      = useState('')
  const [editActive,    setEditActive]    = useState(true)
  const [showPassword,  setShowPassword]  = useState(false)
  const [successMsg,    setSuccessMsg]    = useState<string | null>(null)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)

  const { data: users = [], isLoading, error } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn:  userService.getUser,
    retry: 3,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateUserForm) => userService.postUser({
      user_name:     data.user_name,
      user_email:    data.user_email,
      user_role:     data.user_role,
      is_active:     true,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowAddModal(false)
      setForm(DEFAULT_FORM)
      flash('success', 'Staff account created successfully')
    },
    onError: (err: any) => flash('error', err.message || 'Failed to create user'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<UserType> }) =>
      userService.putUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowEditModal(false)
      setEditingUser(null)
      flash('success', 'User updated successfully')
    },
    onError: (err: any) => flash('error', err.message || 'Failed to update user'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      flash('success', 'User deleted')
    },
    onError: (err: any) => flash('error', err.message || 'Failed to delete user'),
  })

  const flash = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    }
  }

  const handleAddSubmit = () => {
    if (!form.user_name.trim())  return flash('error', 'Name is required')
    if (!form.user_email.trim()) return flash('error', 'Email is required')
    if (!form.user_password)     return flash('error', 'Password is required')
    const passOk = PASSWORD_RULES.every(r => r.test(form.user_password))
    if (!passOk) return flash('error', 'Password does not meet requirements')
    createMutation.mutate(form)
  }

  const handleEdit = (user: UserType) => {
    setEditingUser(user)
    setEditRole(user.user_role)
    setEditActive(user.is_active)
    setShowEditModal(true)
  }

  const handleEditSubmit = () => {
    if (!editingUser) return
    updateMutation.mutate({
      id: editingUser.user_id,
      updates: { user_role: editRole, is_active: editActive },
    })
  }

  const handleDelete = (user: UserType) => {
    Alert.alert(
      'Delete User',
      `Delete "${user.user_name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(user.user_id) },
      ],
    )
  }

  const handleToggleActive = (user: UserType) => {
    updateMutation.mutate({
      id: user.user_id,
      updates: { is_active: !user.is_active },
    })
  }

  const filtered = users.filter(u => {
    const matchRole   = filterRole === 'all' || u.user_role === filterRole
    const matchSearch = !search ||
      u.user_name.toLowerCase().includes(search.toLowerCase()) ||
      u.user_email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const passValid = PASSWORD_RULES.every(r => r.test(form.user_password))

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.orange} />
        <Text style={styles.loadingText}>Loading users…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={C.error} />
        <Text style={styles.errorTitle}>Failed to load users</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  const allRoles = ['all', ...ROLES, 'Customer']

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Staff & Users</Text>
          <Text style={styles.subtitle}>{users.length} total accounts</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => { setForm(DEFAULT_FORM); setShowAddModal(true) }} activeOpacity={0.85}>
          <Plus size={16} color={C.white} />
          <Text style={styles.addButtonText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {successMsg && (
          <View style={styles.successBanner}>
            <CheckCircle size={15} color={C.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={15} color={C.error} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.searchRow}>
          <Search size={15} color={C.orange} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterScroll}>
          <View style={styles.roleFilterRow}>
            {allRoles.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.rolePill, filterRole === r && styles.rolePillActive]}
                onPress={() => setFilterRole(r)}
              >
                <Text style={[styles.rolePillText, filterRole === r && styles.rolePillTextActive]}>
                  {r === 'all' ? 'All' : r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.statsRow}>
          {[
            { label: 'Active',   count: users.filter(u => u.is_active).length,   color: C.success },
            { label: 'Inactive', count: users.filter(u => !u.is_active).length,  color: C.error },
            { label: 'Staff',    count: users.filter(u => u.user_role !== 'Customer').length, color: C.orange },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statNumber, { color: s.color }]}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={40} color={C.steel} />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
          </View>
        ) : (
          filtered.map(user => {
            const roleColor = ROLE_COLORS[user.user_role] ?? ROLE_COLORS['Customer']
            return (
              <View key={user.user_id} style={[styles.card, !user.is_active && styles.cardInactive]}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>{user.user_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{user.user_name}</Text>
                    <Text style={styles.cardEmail}>{user.user_email}</Text>
                    <View style={[styles.roleTag, { backgroundColor: roleColor.bg, borderColor: roleColor.border }]}>
                      <Shield size={10} color={roleColor.text} />
                      <Text style={[styles.roleTagText, { color: roleColor.text }]}>{user.user_role}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(user)} activeOpacity={0.8}>
                      <Edit size={14} color={C.orange} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(user)} activeOpacity={0.8}>
                      <Trash2 size={14} color={C.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={[styles.statusBadge, user.is_active ? styles.statusActive : styles.statusInactive]}>
                    {user.is_active
                      ? <UserCheck size={11} color={C.success} />
                      : <UserX    size={11} color={C.error}   />}
                    <Text style={[styles.statusText, { color: user.is_active ? C.success : C.error }]}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <Switch
                    value={user.is_active}
                    onValueChange={() => handleToggleActive(user)}
                    trackColor={{ false: C.graphite, true: C.orangeTint }}
                    thumbColor={user.is_active ? C.orange : C.steel}
                  />
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Staff Account</Text>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Staff member's name"
                placeholderTextColor={C.muted}
                value={form.user_name}
                onChangeText={t => setForm({ ...form, user_name: t })}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="staff@yammy.com"
                placeholderTextColor={C.muted}
                value={form.user_email}
                onChangeText={t => setForm({ ...form, user_email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Temporary Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 8 chars, uppercase, number, special"
                placeholderTextColor={C.muted}
                value={form.user_password}
                onChangeText={t => setForm({ ...form, user_password: t })}
                secureTextEntry={!showPassword}
              />
              {form.user_password.length > 0 && (
                <View style={styles.rulesBox}>
                  {PASSWORD_RULES.map((r, i) => {
                    const ok = r.test(form.user_password)
                    return (
                      <View key={i} style={styles.ruleRow}>
                        <View style={[styles.ruleDot, ok ? styles.ruleDotOk : styles.ruleDotFail]} />
                        <Text style={[styles.ruleTxt, { color: ok ? C.success : C.muted }]}>{r.label}</Text>
                      </View>
                    )
                  })}
                </View>
              )}

              <Text style={styles.label}>Role</Text>
              <View style={styles.rolePillsRow}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePill, form.user_role === r && styles.rolePillActive]}
                    onPress={() => setForm({ ...form, user_role: r })}
                  >
                    <Text style={[styles.rolePillText, form.user_role === r && styles.rolePillTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.noteText}>
                ⚠️ Staff will be prompted to change their password on first login.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, (!passValid || createMutation.isPending) && { opacity: 0.5 }]}
                  onPress={handleAddSubmit}
                  disabled={!passValid || createMutation.isPending}
                >
                  <Text style={styles.submitButtonText}>
                    {createMutation.isPending ? 'Creating...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit {editingUser?.user_name}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.label}>Role</Text>
              <View style={styles.rolePillsRow}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePill, editRole === r && styles.rolePillActive]}
                    onPress={() => setEditRole(r)}
                  >
                    <Text style={[styles.rolePillText, editRole === r && styles.rolePillTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.activeRow}>
                <View>
                  <Text style={styles.label}>Account Status</Text>
                  <Text style={styles.activeSubText}>
                    {editActive ? 'User can log in' : 'User cannot log in'}
                  </Text>
                </View>
                <Switch
                  value={editActive}
                  onValueChange={setEditActive}
                  trackColor={{ false: C.graphite, true: C.orangeTint }}
                  thumbColor={editActive ? C.orange : C.steel}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowEditModal(false); setEditingUser(null) }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, updateMutation.isPending && { opacity: 0.5 }]}
                  onPress={handleEditSubmit}
                  disabled={updateMutation.isPending}
                >
                  <Text style={styles.submitButtonText}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: C.charcoal,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title:         { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: 0.3 },
  subtitle:      { fontSize: 13, color: C.muted, marginTop: 3 },
  addButton:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.orange, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  addButtonText: { color: C.white, fontWeight: '700', fontSize: 13 },

  content: { padding: 20, paddingBottom: 48, gap: 14 },

  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.black },
  loadingText: { fontSize: 14, color: C.muted },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: C.error },
  errorSub:    { fontSize: 13, color: C.dim },

  successBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successBg, borderWidth: 1, borderColor: C.success, borderRadius: radius.md, padding: 12, gap: 8 },
  successText:     { color: C.success, fontSize: 13, fontWeight: '600' },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.error, borderRadius: radius.md, padding: 12, gap: 8 },
  errorBannerText: { color: C.error, fontSize: 13, fontWeight: '600' },

  searchRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: C.white },

  roleFilterScroll: { flexGrow: 0 },
  roleFilterRow:    { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  rolePill:         { backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  rolePillActive:   { backgroundColor: C.orange, borderColor: C.orange },
  rolePillText:     { fontSize: 12, fontWeight: '600', color: C.dim },
  rolePillTextActive:{ color: C.white, fontWeight: '700' },
  rolePillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 22, fontWeight: '900' },
  statLabel:  { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },

  emptyState:    { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: '800', color: C.offWhite },
  emptySubtitle: { fontSize: 13, color: C.muted },

  card: {
    backgroundColor: C.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.border, padding: 14, gap: 12,
  },
  cardInactive: { opacity: 0.6 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarWrap:   { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:   { fontSize: 18, fontWeight: '900', color: C.white },
  cardInfo:     { flex: 1, gap: 4 },
  cardName:     { fontSize: 15, fontWeight: '800', color: C.white },
  cardEmail:    { fontSize: 12, color: C.muted },
  roleTag:      { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  roleTagText:  { fontSize: 10, fontWeight: '700' },
  cardActions:  { flexDirection: 'row', gap: 6 },
  editBtn:      { padding: 8, borderRadius: 10, backgroundColor: C.orangeTint, borderWidth: 1, borderColor: C.orangeDim },
  deleteBtn:    { padding: 8, borderRadius: 10, backgroundColor: C.errorBg, borderWidth: 1, borderColor: '#7A1010' },

  cardFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  statusActive:   { backgroundColor: C.successBg, borderColor: '#1A4A2A' },
  statusInactive: { backgroundColor: C.errorBg,   borderColor: '#7A1010' },
  statusText:     { fontSize: 11, fontWeight: '700' },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: C.charcoal, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: C.border, padding: 24, maxHeight: '90%' },
  modalTitle:     { fontSize: 18, fontWeight: '900', color: C.white, marginBottom: 20, letterSpacing: 0.3 },

  label:        { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8, marginTop: 16 },
  input:        { backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, paddingHorizontal: 16, height: 52, fontSize: 15, color: C.white },

  rulesBox:    { backgroundColor: C.graphite, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, padding: 12, marginTop: 8, gap: 6 },
  ruleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot:     { width: 6, height: 6, borderRadius: 3 },
  ruleDotOk:   { backgroundColor: C.success },
  ruleDotFail: { backgroundColor: C.steel },
  ruleTxt:     { fontSize: 11 },

  noteText: { fontSize: 12, color: C.warning, backgroundColor: C.warningBg, borderRadius: radius.sm, padding: 10, marginTop: 16, borderWidth: 1, borderColor: '#3A2500' },

  activeRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  activeSubText: { fontSize: 11, color: C.muted, marginTop: 2 },

  modalButtons:         { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton:         { flex: 1, backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText:     { fontSize: 14, color: C.offWhite, fontWeight: '600' },
  submitButton:         { flex: 1, backgroundColor: C.orange, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center' },
  submitButtonText:     { fontSize: 14, color: C.white, fontWeight: '800' },
})