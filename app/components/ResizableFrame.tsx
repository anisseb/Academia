import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ImageCropOverlay } from './ImageCropOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_FRAME_SIZE = 100;

interface ResizableFrameProps {
  onFrameChange: (frame: { x: number; y: number; width: number; height: number }) => void;
  initialFrame?: { x: number; y: number; width: number; height: number };
}

export const ResizableFrame: React.FC<ResizableFrameProps> = ({ onFrameChange, initialFrame }) => {
  const [frame, setFrame] = useState(initialFrame || {
    x: (SCREEN_WIDTH - 300) / 2,
    y: (SCREEN_HEIGHT - 300) / 2,
    width: 300,
    height: 300,
  });

  const handleLayoutChange = (top: number, left: number, width: number, height: number) => {
    const newFrame = {
      x: left,
      y: top,
      width,
      height,
    };
    setFrame(newFrame);
    onFrameChange(newFrame);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Masques */}
      <View style={[styles.mask, { height: frame.y }]} />
      <View style={[styles.mask, { 
        position: 'absolute',
        top: frame.y,
        left: 0,
        width: frame.x,
        height: frame.height,
      }]} />
      <View style={[styles.mask, { 
        position: 'absolute',
        top: frame.y,
        left: frame.x + frame.width,
        width: SCREEN_WIDTH - (frame.x + frame.width),
        height: frame.height,
      }]} />
      <View style={[styles.mask, { 
        position: 'absolute',
        top: frame.y + frame.height,
        left: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT - (frame.y + frame.height),
      }]} />
      
      <ImageCropOverlay
        initialTop={frame.y}
        initialLeft={frame.x}
        initialWidth={frame.width}
        initialHeight={frame.height}
        minWidth={MIN_FRAME_SIZE}
        minHeight={MIN_FRAME_SIZE}
        borderColor="white"
        onLayoutChanged={handleLayoutChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mask: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
}); 