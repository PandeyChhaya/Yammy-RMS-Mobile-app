import * as ExpoImagePicker from 'expo-image-picker'
import { Image as ImageIcon, Link2, Search, Upload, X } from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import imageService, { UnsplashResult } from './services/imageService'

const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  cardAlt: '#2C2C2C',
  brand: '#FF6B2C',
  brandBg: '#3D1C00',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
  red: '#EF4444',
}

const corner = { xs: 6, sm: 10, md: 14, lg: 20, pill: 100 }

type PickerTab = 'search' | 'gallery' | 'link'

interface ImagePickerModalProps {
  visible: boolean
  onClose: () => void
  onImageSelected: (cloudinaryUrl: string) => void
  uploadFolder?: string
  initialQuery?: string
}

export default function ImagePickerModal(props: ImagePickerModalProps) {
  const { visible, onClose, onImageSelected, uploadFolder, initialQuery = '' } = props

  const [activeTab, setActiveTab] = useState<PickerTab>('search')
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<UnsplashResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [pastedUrl, setPastedUrl] = useState('')

  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function runSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      const data = await imageService.searchUnsplash(query.trim())
      setResults(data)
    } catch (err: any) {
      setSearchError(err.message ?? 'Search failed')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function pickUnsplashPhoto(photo: UnsplashResult) {
    setUploadingId(photo.id)
    setUploadError(null)
    try {
      const cloudinaryUrl = await imageService.uploadFromUrl(photo.full_url, uploadFolder)
      onImageSelected(cloudinaryUrl)
      closeAndReset()
    } catch (err: any) {
      setUploadError(err.message ?? 'Could not save that image')
    } finally {
      setUploadingId(null)
    }
  }

  async function pickFromGallery() {
    const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setUploadError('Photo library permission is needed to pick an image')
      return
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })

    if (result.canceled || !result.assets?.length) return

    setUploadingId('gallery')
    setUploadError(null)
    try {
      const cloudinaryUrl = await imageService.uploadFromFile(result.assets[0].uri, uploadFolder)
      onImageSelected(cloudinaryUrl)
      closeAndReset()
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed')
    } finally {
      setUploadingId(null)
    }
  }

  async function submitPastedUrl() {
    if (!pastedUrl.trim()) return

    setUploadingId('link')
    setUploadError(null)
    try {
      const cloudinaryUrl = await imageService.uploadFromUrl(pastedUrl.trim(), uploadFolder)
      onImageSelected(cloudinaryUrl)
      closeAndReset()
    } catch (err: any) {
      setUploadError(err.message ?? 'Could not load that URL')
    } finally {
      setUploadingId(null)
    }
  }

  function closeAndReset() {
    setQuery('')
    setResults([])
    setPastedUrl('')
    setUploadError(null)
    setSearchError(null)
    setActiveTab('search')
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeAndReset}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose a Photo</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeAndReset}>
              <X size={18} color={palette.textDim} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.tabActive]}
              onPress={() => setActiveTab('search')}
            >
              <Search size={13} color={activeTab === 'search' ? palette.brand : palette.textDim} />
              <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'gallery' && styles.tabActive]}
              onPress={() => setActiveTab('gallery')}
            >
              <ImageIcon size={13} color={activeTab === 'gallery' ? palette.brand : palette.textDim} />
              <Text style={[styles.tabText, activeTab === 'gallery' && styles.tabTextActive]}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'link' && styles.tabActive]}
              onPress={() => setActiveTab('link')}
            >
              <Link2 size={13} color={activeTab === 'link' ? palette.brand : palette.textDim} />
              <Text style={[styles.tabText, activeTab === 'link' && styles.tabTextActive]}>Paste URL</Text>
            </TouchableOpacity>
          </View>

          {uploadError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{uploadError}</Text>
            </View>
          ) : null}

          {activeTab === 'search' ? (
            <View style={styles.searchPane}>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g. dinner, juice, pasta"
                  placeholderTextColor={palette.textDim}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={runSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={runSearch} disabled={searching}>
                  {searching ? <ActivityIndicator size="small" color={palette.text} /> : <Search size={15} color={palette.text} />}
                </TouchableOpacity>
              </View>

              {searchError ? <Text style={styles.searchErrorText}>{searchError}</Text> : null}

              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={styles.resultsRow}
                contentContainerStyle={styles.resultsGrid}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  !searching ? (
                    <Text style={styles.emptyHint}>
                      {query ? 'No results yet — try searching' : 'Type a keyword above to find photos'}
                    </Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultTile}
                    onPress={() => pickUnsplashPhoto(item)}
                    disabled={uploadingId !== null}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.thumb_url }} style={styles.resultImage} />
                    {uploadingId === item.id ? (
                      <View style={styles.resultOverlay}>
                        <ActivityIndicator size="small" color={palette.text} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : null}

          {activeTab === 'gallery' ? (
            <View style={styles.simplePane}>
              <View style={styles.galleryIconCircle}>
                <Upload size={26} color={palette.brand} />
              </View>
              <Text style={styles.simplePaneTitle}>Upload from your device</Text>
              <Text style={styles.simplePaneSub}>Pick a photo from your gallery to use for this category</Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={pickFromGallery} disabled={uploadingId !== null}>
                {uploadingId === 'gallery' ? (
                  <ActivityIndicator size="small" color={palette.text} />
                ) : (
                  <Text style={styles.primaryBtnText}>Choose Photo</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {activeTab === 'link' ? (
            <View style={styles.simplePane}>
              <Text style={styles.fieldLabel}>Image URL</Text>
              <TextInput
                style={styles.urlInput}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor={palette.textDim}
                value={pastedUrl}
                onChangeText={setPastedUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, !pastedUrl.trim() && styles.disabled]}
                onPress={submitPastedUrl}
                disabled={!pastedUrl.trim() || uploadingId !== null}
              >
                {uploadingId === 'link' ? (
                  <ActivityIndicator size="small" color={palette.text} />
                ) : (
                  <Text style={styles.primaryBtnText}>Use This Image</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: corner.lg,
    borderTopRightRadius: corner.lg,
    borderWidth: 1.5,
    borderColor: palette.border,
    maxHeight: '88%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: corner.xs,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: corner.pill,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  tabActive: {
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textDim,
  },
  tabTextActive: {
    color: palette.brand,
  },
  errorBanner: {
    marginHorizontal: 18,
    marginTop: 12,
    backgroundColor: '#2A0A0A',
    borderWidth: 1,
    borderColor: palette.red,
    borderRadius: corner.sm,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: palette.red,
    fontWeight: '600',
  },
  searchPane: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: corner.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: palette.text,
    backgroundColor: palette.bg,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: corner.pill,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchErrorText: {
    fontSize: 12,
    color: palette.red,
    marginTop: 8,
  },
  resultsGrid: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  resultsRow: {
    gap: 8,
  },
  resultTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: corner.sm,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: palette.cardAlt,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: {
    fontSize: 12,
    color: palette.textDim,
    textAlign: 'center',
    marginTop: 40,
  },
  simplePane: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  galleryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: corner.lg,
    backgroundColor: palette.brandBg,
    borderWidth: 1.5,
    borderColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  simplePaneTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 4,
  },
  simplePaneSub: {
    fontSize: 12,
    color: palette.textDim,
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  urlInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: corner.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: palette.text,
    backgroundColor: palette.bg,
    marginBottom: 16,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: palette.brand,
    borderRadius: corner.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  disabled: {
    opacity: 0.45,
  },
})