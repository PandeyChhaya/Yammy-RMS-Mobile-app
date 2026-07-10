import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle, CheckCircle, Edit, Plus, Search,
  Shield, Trash2, User, Users,
} from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import userService, { User as UserType } from './usersService'

const C = {
  black:'#0A0A0A',charcoal:'#1A1A1A',graphite:'#2C2C2C',steel:'#3D3D3D',
  muted:'#6B6B6B',border:'#2E2E2E',card:'#1E1E1E',orange:'#FF6B2C',
  orangeTint:'#2A1A10',orangeDim:'#7A3010',white:'#FFFFFF',offWhite:'#F0F0F0',
  dim:'#A0A0A0',success:'#22C55E',successBg:'#0D2818',error:'#EF4444',
  errorBg:'#2A0A0A',warning:'#F59E0B',warningBg:'#1C1500',info:'#3B82F6',infoBg:'#0C1A2E',
}
const radius = { xs:6, sm:10, md:14, lg:18, pill:100 }

const ROLES = ['Admin','Cashier','Waiter','Kitchen Staff']

const ROLE_COLORS: Record<string,{bg:string;text:string;border:string}> = {
  'Admin':        {bg:C.orangeTint, text:C.orange,   border:C.orangeDim},
  'Cashier':      {bg:C.infoBg,     text:C.info,     border:'#1A3A6A'},
  'Waiter':       {bg:C.successBg,  text:C.success,  border:'#1A4A2A'},
  'Kitchen Staff':{bg:C.warningBg,  text:C.warning,  border:'#3A2A00'},
  'Customer':     {bg:C.graphite,   text:C.dim,      border:C.steel},
  'Super Admin':  {bg:C.errorBg,    text:C.error,    border:'#7A1010'},
}

interface UserFormData {
  user_name:string; user_email:string; user_role:string; user_password?:string
}
const DEFAULT_FORM:UserFormData = {user_name:'',user_email:'',user_role:'Waiter',user_password:''}

export default function UsersScreen() {
  const queryClient = useQueryClient()
  const [search,setSearch]=useState('')
  const [filterRole,setFilterRole]=useState('all')
  const [showAddModal,setShowAddModal]=useState(false)
  const [showEditModal,setShowEditModal]=useState(false)
  const [editingUser,setEditingUser]=useState<UserType|null>(null)
  const [addForm,setAddForm]=useState<UserFormData>(DEFAULT_FORM)
  const [editForm,setEditForm]=useState<UserFormData>(DEFAULT_FORM)
  const [successMsg,setSuccessMsg]=useState<string|null>(null)
  const [errorMsg,setErrorMsg]=useState<string|null>(null)
  const [focusedInput,setFocusedInput]=useState<string|null>(null)

  const {data:users=[],isLoading,error}=useQuery<UserType[]>({
    queryKey:['users'],queryFn:userService.getUser,retry:3,
  })

  const createMutation=useMutation({
     mutationFn: (form: UserFormData) => userService.postUser({
    user_name: form.user_name,
    user_email: form.user_email,
    user_role: form.user_role,
    user_password: form.user_password,
    is_active: true,
  } as any),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['users']})
      setShowAddModal(false);setAddForm(DEFAULT_FORM)
      flash('success','Staff account created!')
    },
    onError:(err:any)=>flash('error',err.message||'Failed to create user'),
  })

  const updateMutation=useMutation({
    mutationFn:({id,updates}:{id:number;updates:Partial<UserType>})=>userService.putUser(id,updates),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['users']})
      setShowEditModal(false);setEditingUser(null)
      flash('success','User updated!')
    },
    onError:(err:any)=>flash('error',err.message||'Failed to update'),
  })

  const deleteMutation=useMutation({
    mutationFn:(id:number)=>userService.deleteUser(id),
    onSuccess:()=>{queryClient.invalidateQueries({queryKey:['users']});flash('success','User deleted.')},
    onError:(err:any)=>flash('error',err.message||'Failed to delete'),
  })

  const flash=(type:'success'|'error',msg:string)=>{
    if(type==='success'){setSuccessMsg(msg);setTimeout(()=>setSuccessMsg(null),3000)}
    else{setErrorMsg(msg);setTimeout(()=>setErrorMsg(null),5000)}
  }

  const handleEdit=(user:UserType)=>{
    setEditingUser(user)
    setEditForm({user_name:user.user_name,user_email:user.user_email,user_role:user.user_role})
    setShowEditModal(true)
  }

  const handleDelete=(id:number,name:string)=>{
    Alert.alert('Delete User',`Delete "${name}"?`,[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:()=>deleteMutation.mutate(id)},
    ])
  }

  const handleToggleActive=(user:UserType)=>{
    updateMutation.mutate({id:user.user_id,updates:{is_active:!user.is_active}})
  }

  const handleAddSubmit=()=>{
    if(!addForm.user_name.trim()){flash('error','Name is required');return}
    if(!addForm.user_email.trim()){flash('error','Email is required');return}
    if(!addForm.user_password?.trim()){flash('error','Password is required');return}
    createMutation.mutate(addForm)
  }

  const handleEditSubmit=()=>{
    if(!editingUser)return
    updateMutation.mutate({id:editingUser.user_id,updates:{
      user_name:editForm.user_name,user_email:editForm.user_email,user_role:editForm.user_role,
    }})
  }

  const inputStyle=(key:string)=>[styles.input,focusedInput===key&&styles.inputFocused]

  const filtered=users.filter(u=>{
    const matchesSearch=u.user_name.toLowerCase().includes(search.toLowerCase())||
      u.user_email.toLowerCase().includes(search.toLowerCase())
    const matchesRole=filterRole==='all'||u.user_role===filterRole
    return matchesSearch&&matchesRole
  })

  const staffUsers=filtered.filter(u=>u.user_role!=='Customer')
  const customerUsers=filtered.filter(u=>u.user_role==='Customer')

  if(isLoading)return(
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={C.orange}/>
      <Text style={styles.loadingText}>Loading users…</Text>
    </View>
  )

  if(error)return(
    <View style={styles.centered}>
      <AlertCircle size={48} color={C.error}/>
      <Text style={styles.errorTitle}>Failed to load users</Text>
    </View>
  )

  const renderUserCard=(user:UserType)=>{
    const rc=ROLE_COLORS[user.user_role]??ROLE_COLORS['Customer']
    return(
      <View key={user.user_id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{user.user_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{user.user_name}</Text>
            <Text style={styles.cardEmail}>{user.user_email}</Text>
            <View style={[styles.roleBadge,{backgroundColor:rc.bg,borderColor:rc.border}]}>
              <Text style={[styles.roleText,{color:rc.text}]}>{user.user_role}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            {user.user_role!=='Customer'&&(
              <TouchableOpacity style={styles.editBtn} onPress={()=>handleEdit(user)} activeOpacity={0.8}>
                <Edit size={14} color={C.orange}/>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteBtn} onPress={()=>handleDelete(user.user_id,user.user_name)} activeOpacity={0.8}>
              <Trash2 size={14} color={C.error}/>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.activeRow}>
            <View style={[styles.activeDot,{backgroundColor:user.is_active?C.success:C.muted}]}/>
            <Text style={[styles.activeText,{color:user.is_active?C.success:C.muted}]}>
              {user.is_active?'Active':'Inactive'}
            </Text>
          </View>
          <Switch
            value={user.is_active}
            onValueChange={()=>handleToggleActive(user)}
            trackColor={{false:C.graphite,true:C.orangeTint}}
            thumbColor={user.is_active?C.orange:C.steel}
          />
        </View>
      </View>
    )
  }

  return(
    <View style={styles.container}>
      <View style={styles.blob1}/><View style={styles.blob2}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Users</Text>
            <Text style={styles.subtitle}>{users.length} total · {users.filter(u=>u.is_active).length} active</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={()=>{setAddForm(DEFAULT_FORM);setShowAddModal(true)}} activeOpacity={0.85}>
            <Plus size={16} color={C.white}/>
            <Text style={styles.addButtonText}>Add Staff</Text>
          </TouchableOpacity>
        </View>

        {successMsg&&<View style={styles.successBanner}><CheckCircle size={16} color={C.success}/><Text style={styles.successText}>{successMsg}</Text></View>}
        {errorMsg&&<View style={styles.errorBanner}><AlertCircle size={16} color={C.error}/><Text style={styles.errorBannerText}>{errorMsg}</Text></View>}

        <View style={styles.statsRow}>
          {[
            {label:'Staff',count:users.filter(u=>u.user_role!=='Customer').length,color:C.orange},
            {label:'Customers',count:users.filter(u=>u.user_role==='Customer').length,color:C.info},
            {label:'Inactive',count:users.filter(u=>!u.is_active).length,color:C.error},
          ].map(s=>(
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statNumber,{color:s.color}]}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.searchRow}>
          <Search size={16} color={C.orange}/>
          <TextInput style={styles.searchInput} placeholder="Search by name or email…"
            placeholderTextColor={C.muted} value={search} onChangeText={setSearch}/>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {(['all',...ROLES,'Customer']).map(role=>(
              <TouchableOpacity key={role}
                style={[styles.filterPill,filterRole===role&&styles.filterPillActive]}
                onPress={()=>setFilterRole(role)} activeOpacity={0.8}>
                <Text style={[styles.filterPillText,filterRole===role&&styles.filterPillTextActive]}>
                  {role==='all'?'All':role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {staffUsers.length>0&&(
          <>
            <View style={styles.sectionHeader}>
              <Shield size={14} color={C.orange}/>
              <Text style={styles.sectionTitle}>Staff ({staffUsers.length})</Text>
            </View>
            {staffUsers.map(renderUserCard)}
          </>
        )}

        {customerUsers.length>0&&(
          <>
            <View style={[styles.sectionHeader,{marginTop:16}]}>
              <Users size={14} color={C.info}/>
              <Text style={[styles.sectionTitle,{color:C.info}]}>Customers ({customerUsers.length})</Text>
            </View>
            {customerUsers.map(renderUserCard)}
          </>
        )}

        {filtered.length===0&&(
          <View style={styles.emptyState}>
            <User size={48} color={C.steel}/>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Staff Account</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={inputStyle('add_name')} placeholder="John Smith"
                placeholderTextColor={C.muted} value={addForm.user_name}
                onChangeText={v=>setAddForm({...addForm,user_name:v})}
                onFocus={()=>setFocusedInput('add_name')} onBlur={()=>setFocusedInput(null)}/>
              <Text style={styles.label}>Email</Text>
              <TextInput style={inputStyle('add_email')} placeholder="john@restaurant.com"
                placeholderTextColor={C.muted} value={addForm.user_email}
                onChangeText={v=>setAddForm({...addForm,user_email:v})}
                keyboardType="email-address" autoCapitalize="none"
                onFocus={()=>setFocusedInput('add_email')} onBlur={()=>setFocusedInput(null)}/>
              <Text style={styles.label}>Temporary Password</Text>
              <TextInput style={inputStyle('add_pass')} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                placeholderTextColor={C.muted} value={addForm.user_password}
                onChangeText={v=>setAddForm({...addForm,user_password:v})} secureTextEntry
                onFocus={()=>setFocusedInput('add_pass')} onBlur={()=>setFocusedInput(null)}/>
              <Text style={styles.label}>Role</Text>
              <View style={styles.pillRow}>
                {ROLES.map(role=>(
                  <TouchableOpacity key={role}
                    style={[styles.pill,addForm.user_role===role&&styles.pillActive]}
                    onPress={()=>setAddForm({...addForm,user_role:role})} activeOpacity={0.8}>
                    <Text style={[styles.pillText,addForm.user_role===role&&styles.pillTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={()=>setShowAddModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton,createMutation.isPending&&{opacity:0.5}]}
                  onPress={handleAddSubmit} disabled={createMutation.isPending} activeOpacity={0.85}>
                  {createMutation.isPending
                    ?<ActivityIndicator size="small" color={C.white}/>
                    :<Text style={styles.submitButtonText}>Create Account →</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={inputStyle('edit_name')} placeholder="Full name"
                placeholderTextColor={C.muted} value={editForm.user_name}
                onChangeText={v=>setEditForm({...editForm,user_name:v})}
                onFocus={()=>setFocusedInput('edit_name')} onBlur={()=>setFocusedInput(null)}/>
              <Text style={styles.label}>Email</Text>
              <TextInput style={inputStyle('edit_email')} placeholder="Email"
                placeholderTextColor={C.muted} value={editForm.user_email}
                onChangeText={v=>setEditForm({...editForm,user_email:v})}
                keyboardType="email-address" autoCapitalize="none"
                onFocus={()=>setFocusedInput('edit_email')} onBlur={()=>setFocusedInput(null)}/>
              <Text style={styles.label}>Role</Text>
              <View style={styles.pillRow}>
                {ROLES.map(role=>(
                  <TouchableOpacity key={role}
                    style={[styles.pill,editForm.user_role===role&&styles.pillActive]}
                    onPress={()=>setEditForm({...editForm,user_role:role})} activeOpacity={0.8}>
                    <Text style={[styles.pillText,editForm.user_role===role&&styles.pillTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={()=>{setShowEditModal(false);setEditingUser(null)}}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton,updateMutation.isPending&&{opacity:0.5}]}
                  onPress={handleEditSubmit} disabled={updateMutation.isPending} activeOpacity={0.85}>
                  {updateMutation.isPending
                    ?<ActivityIndicator size="small" color={C.white}/>
                    :<Text style={styles.submitButtonText}>Save Changes →</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:C.black},
  content:{padding:20,paddingTop:56,paddingBottom:40},
  centered:{flex:1,alignItems:'center',justifyContent:'center',gap:12,backgroundColor:C.black},
  loadingText:{fontSize:14,color:C.muted},
  errorTitle:{fontSize:16,fontWeight:'700',color:C.error},
  blob1:{position:'absolute',top:-80,left:'20%',width:260,height:260,borderRadius:130,backgroundColor:C.orange,opacity:0.08},
  blob2:{position:'absolute',top:-40,left:'45%',width:180,height:180,borderRadius:90,backgroundColor:C.orange,opacity:0.12},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},
  title:{fontSize:22,fontWeight:'900',color:C.white,letterSpacing:0.3},
  subtitle:{fontSize:13,color:C.muted,marginTop:3},
  addButton:{flexDirection:'row',alignItems:'center',backgroundColor:C.orange,borderRadius:radius.pill,paddingHorizontal:14,paddingVertical:9,gap:6},
  addButtonText:{color:C.white,fontWeight:'700',fontSize:13},
  successBanner:{flexDirection:'row',alignItems:'center',backgroundColor:C.successBg,borderWidth:1,borderColor:C.success,borderRadius:radius.md,padding:12,marginBottom:12,gap:8},
  successText:{color:C.success,fontSize:13,fontWeight:'600'},
  errorBanner:{flexDirection:'row',alignItems:'center',backgroundColor:C.errorBg,borderWidth:1,borderColor:C.error,borderRadius:radius.md,padding:12,marginBottom:12,gap:8},
  errorBannerText:{color:C.error,fontSize:13,fontWeight:'600'},
  statsRow:{flexDirection:'row',gap:10,marginBottom:16},
  statCard:{flex:1,backgroundColor:C.card,borderRadius:radius.md,borderWidth:1,borderColor:C.border,padding:12,alignItems:'center',gap:4},
  statNumber:{fontSize:22,fontWeight:'900'},
  statLabel:{fontSize:10,fontWeight:'700',color:C.muted,textTransform:'uppercase',letterSpacing:0.8},
  searchRow:{flexDirection:'row',alignItems:'center',backgroundColor:C.graphite,borderWidth:1,borderColor:C.border,borderRadius:radius.md,paddingHorizontal:14,paddingVertical:10,marginBottom:12,gap:10},
  searchInput:{flex:1,fontSize:14,color:C.white},
  filterScroll:{marginBottom:20},
  filterRow:{flexDirection:'row',gap:8,paddingBottom:2},
  filterPill:{backgroundColor:C.graphite,borderWidth:1,borderColor:C.border,borderRadius:radius.pill,paddingHorizontal:14,paddingVertical:7},
  filterPillActive:{backgroundColor:C.orange,borderColor:C.orange},
  filterPillText:{fontSize:12,fontWeight:'600',color:C.dim},
  filterPillTextActive:{color:C.white,fontWeight:'700'},
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},
  sectionTitle:{fontSize:11,fontWeight:'800',color:C.orange,textTransform:'uppercase',letterSpacing:1.2},
  card:{backgroundColor:C.card,borderRadius:radius.lg,borderWidth:1,borderColor:C.border,padding:14,marginBottom:10},
  cardHeader:{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:12},
  avatarWrap:{width:44,height:44,borderRadius:radius.sm,backgroundColor:C.orange,alignItems:'center',justifyContent:'center',flexShrink:0},
  avatarText:{fontSize:18,fontWeight:'900',color:C.white},
  cardInfo:{flex:1,gap:4},
  cardName:{fontSize:14,fontWeight:'800',color:C.white},
  cardEmail:{fontSize:12,color:C.muted},
  roleBadge:{alignSelf:'flex-start',borderRadius:radius.pill,borderWidth:1,paddingHorizontal:8,paddingVertical:3,marginTop:2},
  roleText:{fontSize:10,fontWeight:'700'},
  cardActions:{flexDirection:'row',gap:6},
  editBtn:{padding:8,borderRadius:radius.xs,backgroundColor:C.orangeTint,borderWidth:1,borderColor:C.orangeDim},
  deleteBtn:{padding:8,borderRadius:radius.xs,backgroundColor:C.errorBg,borderWidth:1,borderColor:'#7A1010'},
  cardFooter:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:C.border,paddingTop:10},
  activeRow:{flexDirection:'row',alignItems:'center',gap:6},
  activeDot:{width:6,height:6,borderRadius:3},
  activeText:{fontSize:12,fontWeight:'600'},
  emptyState:{alignItems:'center',paddingVertical:56,gap:12},
  emptyTitle:{fontSize:17,fontWeight:'800',color:C.offWhite},
  emptySubtitle:{fontSize:13,color:C.muted},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'flex-end'},
  modalContainer:{backgroundColor:C.charcoal,borderTopLeftRadius:28,borderTopRightRadius:28,borderTopWidth:1,borderColor:C.border,padding:24,maxHeight:'90%'},
  modalTitle:{fontSize:18,fontWeight:'900',color:C.white,marginBottom:20,letterSpacing:0.3},
  label:{fontSize:11,fontWeight:'700',color:C.muted,textTransform:'uppercase',letterSpacing:1.1,marginBottom:8,marginTop:16},
  input:{backgroundColor:C.graphite,borderWidth:1,borderColor:C.border,borderRadius:radius.md,paddingHorizontal:16,height:52,fontSize:15,color:C.white},
  inputFocused:{borderColor:C.orange},
  pillRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:4},
  pill:{backgroundColor:C.graphite,borderWidth:1,borderColor:C.border,borderRadius:radius.pill,paddingHorizontal:14,paddingVertical:8},
  pillActive:{backgroundColor:C.orange,borderColor:C.orange},
  pillText:{fontSize:12,fontWeight:'600',color:C.dim},
  pillTextActive:{color:C.white,fontWeight:'700'},
  modalButtons:{flexDirection:'row',gap:12,marginTop:28,marginBottom:8},
  cancelButton:{flex:1,backgroundColor:C.graphite,borderWidth:1,borderColor:C.border,borderRadius:radius.md,height:52,alignItems:'center',justifyContent:'center'},
  cancelButtonText:{fontSize:14,color:C.offWhite,fontWeight:'600'},
  submitButton:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:C.orange,borderRadius:radius.md,height:54},
  submitButtonText:{fontSize:15,color:C.white,fontWeight:'800'},
})