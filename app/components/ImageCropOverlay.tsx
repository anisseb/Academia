import React, { useState } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';

interface ImageCropOverlayProps {
  initialTop: number;
  initialLeft: number;
  initialWidth: number;
  initialHeight: number;
  minWidth: number;
  minHeight: number;
  borderColor: string;
  onLayoutChanged: (top: number, left: number, width: number, height: number) => void;
  ratio?: { width: number | null; height: number | null };
}

interface ImageCropState {
  dragging: {
    tl: boolean;
    tm: boolean;
    tr: boolean;
    ml: boolean;
    mm: boolean;
    mr: boolean;
    bl: boolean;
    bm: boolean;
    br: boolean;
  };
  top: number;
  left: number;
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
}

export const ImageCropOverlay: React.FC<ImageCropOverlayProps> = ({
  initialTop,
  initialLeft,
  initialWidth,
  initialHeight,
  minWidth,
  minHeight,
  borderColor,
  onLayoutChanged,
  ratio,
}) => {
  const [state, setState] = useState<ImageCropState>({
    dragging: {
      tl: false,
      tm: false,
      tr: false,
      ml: false,
      mm: false,
      mr: false,
      bl: false,
      bm: false,
      br: false,
    },
    top: initialTop,
    left: initialLeft,
    width: initialWidth,
    height: initialHeight,
    offsetTop: 0,
    offsetLeft: 0,
  });

  const [initialTouch, setInitialTouch] = useState({ x: 0, y: 0 });

  const getTappedItem = (pageX: number, pageY: number) => {
    const { top, left, width, height } = state;
    
    // Convertir les coordonnées de la page en coordonnées relatives à l'overlay
    const relativeX = pageX - left;
    const relativeY = pageY - top;
    
    // Définir la taille des zones de détection (40% de la taille totale)
    const zoneSize = Math.min(width, height) * 0.4;
    
    // Vérifier les coins avec une zone de détection plus grande
    if (relativeX <= zoneSize && relativeY <= zoneSize) return 'tl';
    if (relativeX >= width - zoneSize && relativeY <= zoneSize) return 'tr';
    if (relativeX <= zoneSize && relativeY >= height - zoneSize) return 'bl';
    if (relativeX >= width - zoneSize && relativeY >= height - zoneSize) return 'br';
    
    // Vérifier les bords avec une zone de détection plus grande
    if (relativeX <= zoneSize) return 'ml';
    if (relativeX >= width - zoneSize) return 'mr';
    if (relativeY <= zoneSize) return 'tm';
    if (relativeY >= height - zoneSize) return 'bm';
    
    // Si aucune zone de bord n'est touchée, c'est le centre
    return 'mm';
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const selectedItem = getTappedItem(event.nativeEvent.pageX, event.nativeEvent.pageY);
      if (selectedItem) {
        setInitialTouch({
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY
        });
        setState(prevState => ({
          ...prevState,
          dragging: {
            ...prevState.dragging,
            [selectedItem]: true
          }
        }));
      }
    },
    onPanResponderMove: (event, gestureState) => {
      const { pageX, pageY } = event.nativeEvent;
      const { dx, dy } = gestureState;
      
      let newWidth = state.width;
      let newHeight = state.height;
      let newLeft = state.left;
      let newTop = state.top;

      // Gestion du redimensionnement avec des contraintes plus strictes
      if (state.dragging.tl) {
        // Coin supérieur gauche
        const deltaX = pageX - initialTouch.x;
        const deltaY = pageY - initialTouch.y;
        
        newWidth = Math.max(minWidth, state.width - deltaX);
        newHeight = Math.max(minHeight, state.height - deltaY);
        newLeft = state.left + deltaX;
        newTop = state.top + deltaY;
        
        setInitialTouch({ x: pageX, y: pageY });
      } else if (state.dragging.tr) {
        // Coin supérieur droit
        const deltaX = pageX - initialTouch.x;
        const deltaY = pageY - initialTouch.y;
        
        newWidth = Math.max(minWidth, state.width + deltaX);
        newHeight = Math.max(minHeight, state.height - deltaY);
        newTop = state.top + deltaY;
        
        setInitialTouch({ x: pageX, y: pageY });
      } else if (state.dragging.bl) {
        newWidth = Math.max(minWidth, state.width - dx);
        newHeight = Math.max(minHeight, state.height + dy);
        newLeft = state.left + dx;
      } else if (state.dragging.br) {
        newWidth = Math.max(minWidth, state.width + dx);
        newHeight = Math.max(minHeight, state.height + dy);
      } else if (state.dragging.tm) {
        newHeight = Math.max(minHeight, state.height - dy);
        newTop = state.top + dy;
      } else if (state.dragging.bm) {
        newHeight = Math.max(minHeight, state.height + dy);
      } else if (state.dragging.ml) {
        newWidth = Math.max(minWidth, state.width - dx);
        newLeft = state.left + dx;
      } else if (state.dragging.mr) {
        newWidth = Math.max(minWidth, state.width + dx);
      } else if (state.dragging.mm) {
        newLeft = state.left + dx;
        newTop = state.top + dy;
      }

      // Appliquer le ratio si spécifié
      if (ratio && ratio.width && ratio.height) {
        const targetRatio = ratio.width / ratio.height;
        if (newWidth / newHeight > targetRatio) {
          newWidth = newHeight * targetRatio;
        } else {
          newHeight = newWidth / targetRatio;
        }
      }

      setState(prevState => ({
        ...prevState,
        top: newTop,
        left: newLeft,
        width: newWidth,
        height: newHeight,
      }));

      onLayoutChanged(newTop, newLeft, newWidth, newHeight);
    },
    onPanResponderRelease: () => {
      setState(prevState => ({
        ...prevState,
        dragging: {
          tl: false,
          tm: false,
          tr: false,
          ml: false,
          mm: false,
          mr: false,
          bl: false,
          bm: false,
          br: false,
        }
      }));
    },
  });

  const style = {
    top: state.top,
    left: state.left,
    width: state.width,
    height: state.height,
  };

  return (
    <View {...panResponder.panHandlers} style={[styles.container, style, { borderColor }]}>
      <View style={styles.gridContainer}>
        {/* Grille 3x3 */}
        <View style={styles.row}>
          <View style={[styles.gridBox, styles.borderRight, styles.borderBottom]}>
            <View style={[styles.corner, styles.topLeftCorner]} />
          </View>
          <View style={[styles.gridBox, styles.borderRight, styles.borderBottom]} />
          <View style={[styles.gridBox, styles.borderBottom]}>
            <View style={[styles.corner, styles.topRightCorner]} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.gridBox, styles.borderRight, styles.borderBottom]} />
          <View style={[styles.gridBox, styles.borderRight, styles.borderBottom]} />
          <View style={[styles.gridBox, styles.borderBottom]} />
        </View>
        <View style={styles.row}>
          <View style={[styles.gridBox, styles.borderRight]}>
            <View style={[styles.corner, styles.bottomLeftCorner]} />
          </View>
          <View style={[styles.gridBox, styles.borderRight]} />
          <View style={styles.gridBox}>
            <View style={[styles.corner, styles.bottomRightCorner]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gridContainer: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  gridBox: {
    flex: 1,
    position: 'relative',
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#c9c9c9',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#c9c9c9',
  },
  corner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderColor: '#f4f4f4',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: 5,
    left: 5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: 5,
    right: 5,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: 5,
    left: 5,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: 5,
    right: 5,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
}); 