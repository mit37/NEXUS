import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const ScanlineOverlay = () => (
  <View pointerEvents="none" style={styles.scanlineOverlay}>
    {Array.from({ length: 100 }).map((_, i) => (
      <View key={i} style={styles.scanline} />
    ))}
  </View>
);

import { NODES } from '../data/targetNodes';

const nodesDataJson = JSON.stringify(
  NODES.map(n => ({
    lat: n.lat,
    lng: n.lng,
    type: n.mode === 'adversary' ? 'hostile' : 'ally'
  }))
);

const getHtmlContent = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { margin: 0; background: transparent; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script>
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Create a textured globe
    const geometry = new THREE.SphereGeometry(12, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "";
    const texture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    
    // Add texture material, make it visible to show continents clearly
    const material = new THREE.MeshBasicMaterial({ 
      map: texture, 
      color: 0xffffff,
      transparent: true, 
      opacity: 0.5 
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add wireframe globe for additional cyber aesthetics
    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff41, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.15 
    });
    const wireframeGlobe = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(wireframeGlobe);

    // Add nodes
    const nodeGroup = new THREE.Group();
    const nodeData = ${nodesDataJson};
    const nodes = [];
    
    for(let i=0; i<nodeData.length; i++) {
        const data = nodeData[i];
        const isHostile = data.type === 'hostile';
        const nodeGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const nodeMat = new THREE.MeshBasicMaterial({ color: isHostile ? 0xff003c : 0x00ffff });
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        
        // Convert lat/lng to 3D sphere coordinates
        const phi = (90 - data.lat) * (Math.PI / 180);
        const theta = (data.lng + 180) * (Math.PI / 180);
        const radius = 12.2;

        node.position.set(
            -(radius * Math.sin(phi) * Math.cos(theta)),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
        
        node.userData = { type: data.type };
        nodeGroup.add(node);
        nodes.push(node);
    }
    scene.add(nodeGroup);

    camera.position.z = 25;

    function animate() {
      requestAnimationFrame(animate);
      controls.update(); // required if controls.enableDamping or controls.autoRotate are set
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Expose filter function to React Native
    window.filterNodes = function(filterType) {
      nodes.forEach(n => {
        if (filterType === 'all') {
          n.visible = true;
        } else {
          n.visible = (n.userData.type === filterType);
        }
      });
    };
  </script>
</body>
</html>
`;

export default function GlobeScreen() {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handleFilter = (type: 'all' | 'hostile' | 'ally') => {
    webviewRef.current?.injectJavaScript(`window.filterNodes('${type}'); true;`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(0,255,65,0.05)', 'rgba(0,0,0,1)']} style={StyleSheet.absoluteFill} />

      <View style={styles.webviewContainer}>
        <WebView
          ref={webviewRef}
          source={{ html: getHtmlContent() }}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ScanlineOverlay />

      {/* HUD Overlays */}
      <View style={styles.hudTop}>
        <Text style={styles.hudTitle}>GLOBAL THEATER</Text>
        <View style={styles.statusRow}>
          <Animated.View style={[styles.statusDot, { opacity: blinkAnim }]} />
          <Text style={styles.statusText}>LIVE TRACKING ACTIVE</Text>
        </View>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => handleFilter('all')}>
          <Text style={styles.filterBtnText}>ALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, { borderColor: '#00FFFF' }]} onPress={() => handleFilter('ally')}>
          <Text style={[styles.filterBtnText, { color: '#00FFFF' }]}>ALLIES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, { borderColor: '#FF003C' }]} onPress={() => handleFilter('hostile')}>
          <Text style={[styles.filterBtnText, { color: '#FF003C' }]}>HOSTILES</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>GLOBAL ASSETS</Text>
          <Text style={styles.statValue}>1,402,394</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ACTIVE THREATS</Text>
          <Text style={[styles.statValue, { color: '#FF003C' }]}>87</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>COUNCIL STATUS</Text>
          <Text style={[styles.statValue, { color: '#00FFFF' }]}>ONLINE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scanlineOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.05, overflow: 'hidden', zIndex: 10 },
  scanline: { height: 2, backgroundColor: '#000', marginBottom: 2 },
  webviewContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  webview: { backgroundColor: 'transparent' },
  hudTop: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 20,
  },
  hudTitle: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,255,65,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF003C',
    marginRight: 8,
    shadowColor: '#FF003C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  statusText: {
    color: '#FF003C',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 2,
  },
  filterContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    zIndex: 20,
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: '#00FF41',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterBtnText: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,65,0.3)',
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    color: 'rgba(0,255,65,0.6)',
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: '#00FF41',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
