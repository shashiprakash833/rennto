import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, ActivityIndicator, PanResponder, Animated, Alert } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CROP_SIZE = width * 0.8;

export default function CustomCropper({ visible, imageAsset, onCancel, onSave }) {
  const [loading, setLoading] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, actualWidth: 0, actualHeight: 0 });
  const pan = useRef(new Animated.ValueXY()).current;
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (visible && imageAsset && imageAsset.uri) {
        const w = imageAsset.width || width;
        const h = imageAsset.height || width;

        let displayWidth = width;
        let displayHeight = (h / w) * width;
        
        // Ensure image fills crop area
        if (displayWidth < CROP_SIZE) {
            const ratio = CROP_SIZE / displayWidth;
            displayWidth *= ratio;
            displayHeight *= ratio;
        }
        if (displayHeight < CROP_SIZE) {
            const ratio = CROP_SIZE / displayHeight;
            displayWidth *= ratio;
            displayHeight *= ratio;
        }

        setImageLayout({ width: displayWidth, height: displayHeight, actualWidth: w, actualHeight: h });
        pan.setValue({ x: 0, y: 0 });
        setLastPan({ x: 0, y: 0 });
    }
  }, [visible, imageAsset]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        setLastPan((prev) => ({
          x: prev.x + gestureState.dx,
          y: prev.y + gestureState.dy
        }));
        pan.extractOffset();
      }
    })
  ).current;

  const handleSave = async () => {
    if (!imageLayout.actualWidth) return;
    setLoading(true);
    try {
      const imgX = lastPan.x - (imageLayout.width / 2);
      const imgY = lastPan.y - (imageLayout.height / 2);
      
      const cropX = - (CROP_SIZE / 2);
      const cropY = - (CROP_SIZE / 2);
      
      let cropStartX = cropX - imgX;
      let cropStartY = cropY - imgY;
      
      const scaleFactor = imageLayout.actualWidth / imageLayout.width;
      
      let originX = cropStartX * scaleFactor;
      let originY = cropStartY * scaleFactor;
      let cropWidth = CROP_SIZE * scaleFactor;
      let cropHeight = CROP_SIZE * scaleFactor;

      originX = Math.max(0, Math.min(originX, imageLayout.actualWidth - cropWidth));
      originY = Math.max(0, Math.min(originY, imageLayout.actualHeight - cropHeight));
      
      cropWidth = Math.min(cropWidth, imageLayout.actualWidth - originX);
      cropHeight = Math.min(cropHeight, imageLayout.actualHeight - originY);

      const manipResult = await ImageManipulator.manipulateAsync(
        imageAsset.uri,
        [
          { crop: { originX, originY, width: cropWidth, height: cropHeight } }
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Pass both uri and dimensions if possible, but asset requires uri at least
      onSave({
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        mimeType: 'image/jpeg',
        fileSize: 100000 // dummy size
      });
    } catch (e) {
      console.log("Crop Error:", e);
      console.log("Crop Error", String(e));
      onSave(imageAsset);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}></Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>SAVE</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.cropContainer}>
          {imageLayout.width > 0 && (
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.imageWrapper,
                { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
              ]}
            >
              <Image source={{ uri: imageAsset.uri }} style={{ width: imageLayout.width, height: imageLayout.height }} resizeMode="contain" />
            </Animated.View>
          )}
          
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.cropBox} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFF',
  },
  headerBtn: { padding: 5 },
  headerTitle: { color: '#1E293B', fontSize: 18, fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cropBox: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: 'transparent',
  }
});
