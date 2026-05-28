import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { AlertCircle, CheckCircle, Clock, Film, Plus, Trash2, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import minisService from './services/minis';
import { Mini } from './types/minis';

const C = {
  espresso:    '#0A0A0A',
  roast:       '#1A1A1A',
  clay:        '#2C2C2C',
  latte:       '#6B6B6B',
  cream:       '#FFFFFF',
  parchment:   '#1E1E1E',
  vellum:      '#2E2E2E',
  brass:       '#FF6B2C',
  brassLight:  '#2A1A10',
  brassBorder: '#FF6B2C66',
  sage:        '#22C55E',
  sageLight:   '#0F2A1A',
  sageBorder:  '#22C55E44',
  terracotta:  '#EF4444',
  tcLight:     '#2A0F0F',
  tcBorder:    '#EF444433',
  onDark:      '#FFFFFF',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

export default function Minis() {
    const [token, setToken] = useState<string | null>(null);

useEffect(() => {
  AsyncStorage.getItem('@accessToken').then(setToken);
}, []);
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };
  const showError   = (msg: string) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(null),   5000); };

  const { data: minis, isLoading, error } = useQuery({
    queryKey: ['my-minis'],
    queryFn: () => minisService.getMyMinis(),
  });

  const uploadMutation = useMutation({
    mutationFn: () => minisService.uploadMini(title, description, selectedVideo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-minis'] });
      setShowAddModal(false);
      setTitle(''); setDescription(''); setSelectedVideo(null);
      showSuccess('Mini uploaded! Pending super admin approval.');
    },
    onError: (err: any) => showError('Upload failed: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (mini_id: number) => minisService.deleteMini(mini_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-minis'] });
      showSuccess('Mini deleted successfully.');
    },
    onError: (err: any) => showError('Delete failed: ' + err.message),
  });

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setSelectedVideo(result.assets[0]);
  };

  const handleUpload = () => {
    if (!title.trim()) { showError('Title is required'); return; }
    if (!selectedVideo)  { showError('Please select a video'); return; }
    uploadMutation.mutate();
  };

  const handleDelete = (mini_id: number, title: string) => {
    Alert.alert('Delete Mini', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(mini_id) },
    ]);
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return { bg: C.sageLight, border: C.sageBorder, text: C.sage };
    if (status === 'rejected') return { bg: C.tcLight,   border: C.tcBorder,   text: C.terracotta };
    return { bg: C.brassLight, border: C.brassBorder, text: C.brass };
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle size={12} color={C.sage} />;
    if (status === 'rejected') return <XCircle size={12} color={C.terracotta} />;
    return <Clock size={12} color={C.brass} />;
  };

  if (isLoading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={C.brass} />
      <Text style={styles.loadingText}>Loading Minis…</Text>
    </View>
  );

  if (error) return (
    <View style={styles.centered}>
      <AlertCircle size={48} color={C.terracotta} />
      <Text style={styles.errorTitle}>Error loading minis</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Minis</Text>
            <Text style={styles.subtitle}>Short videos of your food</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Plus size={16} color={C.cream} />
            <Text style={styles.addButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {successMsg && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={C.sage} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={C.terracotta} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {minis?.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Film size={32} color={C.brass} />
            </View>
            <Text style={styles.emptyTitle}>No minis yet</Text>
            <Text style={styles.emptySubtitle}>Upload your first food video</Text>
          </View>
        )}

        {minis?.map((mini: Mini) => {
          const sc = statusColor(mini.status);
          return (
            <View key={mini.mini_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={styles.videoIcon}>
                    <Film size={20} color={C.brass} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{mini.title}</Text>
                    {mini.description && <Text style={styles.cardDesc}>{mini.description}</Text>}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(mini.mini_id, mini.title)}
                >
                  <Trash2 size={15} color={C.terracotta} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardFooter}>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  {statusIcon(mini.status)}
                  <Text style={[styles.statusText, { color: sc.text }]}>
                    {mini.status.charAt(0).toUpperCase() + mini.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.viewCount}>👁 {mini.view_count} views</Text>
              </View>

              {mini.status === 'rejected' && mini.rejection_reason && (
                <View style={styles.rejectionBox}>
                  <Text style={styles.rejectionText}>Reason: {mini.rejection_reason}</Text>
                </View>
              )}
            </View>
          );
        })}

      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Upload Mini</Text>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Crispy Chicken Wings"
              placeholderTextColor={C.latte}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Short description..."
              placeholderTextColor={C.latte}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Video *</Text>
            <TouchableOpacity style={styles.videoPicker} onPress={pickVideo}>
              <Film size={20} color={C.brass} />
              <Text style={styles.videoPickerText}>
                {selectedVideo ? selectedVideo.fileName || 'Video selected ✓' : 'Pick a video'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setShowAddModal(false); setTitle(''); setDescription(''); setSelectedVideo(null); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, uploadMutation.isPending && { opacity: 0.5 }]}
                onPress={handleUpload}
                disabled={uploadMutation.isPending}
              >
                <Text style={styles.submitText}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0A0A0A' },
  content:     { padding: 16, paddingTop: 52, paddingBottom: 32 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0A0A0A' },
  loadingText: { fontSize: 14, color: '#6B6B6B', fontWeight: '600' },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: '#EF4444' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:  { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#6B6B6B', marginTop: 3 },

  addButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B2C',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, gap: 6,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F2A1A',
    borderWidth: 1, borderColor: '#22C55E44', borderRadius: 14, padding: 12, marginBottom: 16, gap: 8,
  },
  successText: { color: '#22C55E', fontSize: 13, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A0F0F',
    borderWidth: 1, borderColor: '#EF444433', borderRadius: 14, padding: 12, marginBottom: 16, gap: 8,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  emptyState:   { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyIcon:    { width: 72, height: 72, borderRadius: 18, backgroundColor: '#2A1A10', borderWidth: 1.5, borderColor: '#FF6B2C66', alignItems: 'center', justifyContent: 'center' },
  emptyTitle:   { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  emptySubtitle:{ fontSize: 13, color: '#6B6B6B' },

  card: {
    backgroundColor: '#1E1E1E', borderRadius: 14, borderWidth: 1.5, borderColor: '#2E2E2E',
    padding: 14, marginBottom: 12,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  videoIcon:   { width: 40, height: 40, borderRadius: 10, backgroundColor: '#2C2C2C', borderWidth: 1, borderColor: '#3D3D3D', alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cardDesc:    { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  deleteBtn:   { padding: 7, borderRadius: 6, backgroundColor: '#2A1A10', borderWidth: 1, borderColor: '#FF6B2C44' },

  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  viewCount:   { fontSize: 11, color: '#6B6B6B', fontWeight: '600' },

  rejectionBox: { marginTop: 10, backgroundColor: '#2A0F0F', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#EF444433' },
  rejectionText:{ fontSize: 12, color: '#EF4444', fontWeight: '600' },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContainer:  { backgroundColor: '#1E1E1E', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1.5, borderColor: '#2E2E2E', padding: 24 },
  modalTitle:      { fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginBottom: 20 },
  label:           { fontSize: 11, fontWeight: '800', color: '#6B6B6B', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 1.2 },
  input:           { borderWidth: 1.5, borderColor: '#2E2E2E', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#FFFFFF', backgroundColor: '#2C2C2C' },
  textArea:        { height: 80, textAlignVertical: 'top' },
  videoPicker:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#FF6B2C66', borderRadius: 14, padding: 14, backgroundColor: '#2A1A10' },
  videoPickerText: { fontSize: 14, color: '#F0F0F0', fontWeight: '600' },

  modalButtons:  { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton:  { flex: 1, borderWidth: 1.5, borderColor: '#2E2E2E', borderRadius: 100, paddingVertical: 12, alignItems: 'center', backgroundColor: '#1E1E1E' },
  cancelText:    { fontSize: 14, color: '#A0A0A0', fontWeight: '700' },
  submitButton:  { flex: 1, backgroundColor: '#FF6B2C', borderRadius: 100, paddingVertical: 12, alignItems: 'center' },
  submitText:    { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
});
